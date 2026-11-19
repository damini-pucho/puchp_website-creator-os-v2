#!/bin/sh
# Website Creator OS V2 — start-up hook, run by the stock nginx image entrypoint
# (/docker-entrypoint.d/40-wco-data-api.sh) before nginx starts on port 80.
#
# 1. Writes /etc/nginx/wco-flows.conf from the container environment: the flow endpoints
#    (POST /api/flow/<name> → the flow's Pucho Studio webhook, with X-Inbound-Token and X-App-Url
#    added here, never in the browser) and the write-back door for the flows
#    (/api/inbound/<table>, Authorization: Bearer INBOUND_TOKEN → the data API).
# 2. Starts PostgREST (the data API) on 127.0.0.1:3001 in the background and restarts it whenever
#    it stops.
# It returns at once and never fails the container start: without a database or a flow setting the
# app and /health are still served, the affected endpoints answer 503, and the reason is shown at
# /health/api (database host, user, password and the inbound token masked).
set -u

LOG=/tmp/wco-data-api.log
: > "$LOG"

# Replace the database host, user, password and the inbound token with placeholders (literal match)
mask() {
  awk -v h="${PGHOST:-${DB_HOST:-}}" -v u="${PGUSER:-${DB_USER:-}}" -v p="${PGPASSWORD:-${DB_PASSWORD:-}}" -v t="${INBOUND_TOKEN:-}" '
    function rep(s, t, r,   i, o) { o = ""; if (t == "") return s
      while ((i = index(s, t)) > 0) { o = o substr(s, 1, i - 1) r; s = substr(s, i + length(t)) }
      return o s }
    { print rep(rep(rep(rep($0, t, "<inbound-token>"), p, "<db-password>"), h, "<db-host>"), u, "<db-user>") }'
}

# Status lines go to the status file and to stderr (the container log) — never to stdout, which is
# redirected into the generated nginx configuration while it is written
status() {
  line="$(date -u '+%Y-%m-%dT%H:%M:%SZ') $*"
  printf '%s\n' "$line" | mask >> "$LOG"
  printf 'wco-data-api: %s\n' "$*" | mask >&2
}

# Database connection for PostgREST, first match wins:
#  1. PGRST_DB_URI, else DATABASE_URL (Dokploy / docker run): logs in as wco_authenticator and
#     runs requests as wco_web. A value still holding the CHANGE_ME placeholder is ignored.
#  2. DB_HOST / DB_PORT / DB_NAME / DB_USER / DB_PASSWORD / DB_SCHEMA, injected by CP Portal for
#     "Pucho DB (managed)". Handed to libpq as PG* variables (no URL-encoding of the password).
#     The managed restore cannot create the wco_* roles, so requests run as DB_USER on DB_SCHEMA
#     unless PGRST_DB_ANON_ROLE / PGRST_DB_SCHEMAS say otherwise.
SOURCE="DATABASE_URL"
PGRST_DB_URI="${PGRST_DB_URI:-${DATABASE_URL:-}}"
case "$PGRST_DB_URI" in *CHANGE_ME*) PGRST_DB_URI="" ;; esac
if [ -z "$PGRST_DB_URI" ] && [ -n "${DB_HOST:-}" ]; then
  SOURCE="DB_* variables"
  export PGHOST="$DB_HOST"
  export PGPORT="${DB_PORT:-5432}"
  export PGDATABASE="${DB_NAME:-}"
  export PGUSER="${DB_USER:-}"
  export PGPASSWORD="${DB_PASSWORD:-}"
  export PGSSLMODE="${DB_SSLMODE:-${PGSSLMODE:-prefer}}"
  PGRST_DB_URI="postgresql://"
  PGRST_DB_ANON_ROLE="${PGRST_DB_ANON_ROLE:-${DB_USER:-}}"
  PGRST_DB_SCHEMAS="${PGRST_DB_SCHEMAS:-${DB_SCHEMA:-public}}"
fi

# A platform PORT other than 80 is answered by nginx as well (absent file = port 80 only)
case "${PORT:-80}" in
  ''|*[!0-9]*|80|3001) rm -f /etc/nginx/wco-listen.conf ;;
  *) echo "listen ${PORT};" > /etc/nginx/wco-listen.conf ;;
esac

# ── Flow endpoints and the inbound write-back door ────────────────────────────────────────────────
# Environment (all optional; the webhook URLs default to the flows this app was built with):
#   PLANNING_WORKFLOW_WEBHOOK_URL  Planning & Proposal flow webhook (called without /sync: the flow
#                                  waits for the client's approval, its results arrive by write-back)
#   BUILD_WORKFLOW_WEBHOOK_URL     Build / live-site audit flow webhook (called on /sync: the app waits
#                                  for its Return Response, which is the audit report)
#   INBOUND_TOKEN                  shared secret: sent to the flows as X-Inbound-Token, required from
#                                  them as "Authorization: Bearer <token>" on /api/inbound/*
#   APP_URL                        this app's public URL, sent to the flows as X-App-Url
#                                  (default: https://<the request's host>/)
# The VITE_* names of the same settings are accepted too.
FLOWS_CONF=/etc/nginx/wco-flows.conf
rm -f "$FLOWS_CONF"

valid_url() { printf '%s' "$1" | grep -Eq '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/[A-Za-z0-9._~/-]*)?$'; }
url_host() { printf '%s' "$1" | sed -E 's#^https://([^/:]+).*#\1#'; }
short_url() { printf '%s' "$1" | sed -E 's#^(https://[^/]+)/.*(.{4})$#\1/...\2#'; }
base_webhook() { printf '%s' "$1" | sed -E 's#/+$##; s#/(sync|test)$##'; }

PLANNING_URL="$(base_webhook "${PLANNING_WORKFLOW_WEBHOOK_URL:-${VITE_PLANNING_WORKFLOW_WEBHOOK_URL:-https://studio.pucho.ai/api/v1/webhooks/o185Ecx1ixFYx4WULp16A}}")"
BUILD_URL="$(base_webhook "${BUILD_WORKFLOW_WEBHOOK_URL:-${VITE_BUILD_WORKFLOW_WEBHOOK_URL:-https://studio.pucho.ai/api/v1/webhooks/i4NwllV8JM5R9CSGk64Gb}}")"
TOKEN="${INBOUND_TOKEN:-}"
APPURL="${APP_URL:-${VITE_APP_URL:-}}"

if [ -n "$TOKEN" ] && ! printf '%s' "$TOKEN" | grep -Eq '^[A-Za-z0-9._~+/=-]{16,256}$'; then
  status "INBOUND_TOKEN ignored: use 16-256 characters from A-Z a-z 0-9 . _ ~ + / = -"
  TOKEN=""
fi
if [ -n "$APPURL" ]; then
  case "$APPURL" in */) ;; *) APPURL="$APPURL/" ;; esac
  if ! valid_url "$APPURL"; then status "APP_URL ignored (not an https URL): $APPURL"; APPURL=""; fi
fi
if [ -n "$APPURL" ]; then APP_URL_HEADER="\"$APPURL\""; else APP_URL_HEADER='"$wco_forwarded_proto://$host/"'; fi

# Verify the Studio certificate (the request carries the inbound token) when the CA bundle is present
CA_BUNDLE=/etc/ssl/certs/ca-certificates.crt
if [ -s "$CA_BUNDLE" ]; then
  SSL_VERIFY="    proxy_ssl_verify on;
    proxy_ssl_verify_depth 4;
    proxy_ssl_trusted_certificate $CA_BUNDLE;"
else
  SSL_VERIFY="    # no CA bundle at $CA_BUNDLE: the webhook certificate is not verified"
  status "WARNING: $CA_BUNDLE missing - the flow webhook certificate is not verified"
fi

RESOLVER="$(awk '$1 == "nameserver" { print $2; exit }' /etc/resolv.conf 2>/dev/null)"
case "$RESOLVER" in
  '') RESOLVER=127.0.0.11 ;;
  *:*) RESOLVER="[$RESOLVER]" ;;
esac

flow_location() {   # name, target URL, mode
  if ! valid_url "$2"; then status "flow $1 NOT configured: webhook URL is not an https URL"; return; fi
  status "flow $1 -> $(short_url "$2") ($3)"
  cat <<EOF

location = /api/flow/$1 {
    limit_except POST { deny all; }
    set \$wco_flow_target "$2";
    proxy_pass \$wco_flow_target;
    proxy_http_version 1.1;
    proxy_ssl_server_name on;
$SSL_VERIFY
    proxy_set_header Host $(url_host "$2");
    proxy_set_header Connection "";
    proxy_set_header Cookie "";
    proxy_set_header Authorization "";
    proxy_set_header Content-Type "application/json";
    proxy_set_header X-App-Url $APP_URL_HEADER;
EOF
  [ -n "$TOKEN" ] && printf '    proxy_set_header X-Inbound-Token "%s";\n' "$TOKEN"
  cat <<'EOF'
    proxy_hide_header Access-Control-Allow-Origin;
    proxy_hide_header Access-Control-Expose-Headers;
    proxy_hide_header Set-Cookie;
    proxy_connect_timeout 15s;
    proxy_send_timeout 120s;
    proxy_read_timeout 300s;
    error_page 502 504 = @wco_flow_down;
}
EOF
}

{
  echo "# generated at start-up by /docker-entrypoint.d/40-wco-data-api.sh — do not edit"
  echo "resolver $RESOLVER valid=300s ipv6=off;"
  echo "resolver_timeout 10s;"
  flow_location planning "$PLANNING_URL" "async: answers when the run is accepted"
  flow_location planning-test "$PLANNING_URL/test" "Studio test URL: sample data for the flow editor"
  flow_location build "$BUILD_URL/sync" "sync: answers with the flow's Return Response"
  if [ -n "$TOKEN" ]; then
    cat <<EOF

# Write-back door for the flows: Authorization: Bearer INBOUND_TOKEN, then the data API
location ~* ^/api/inbound/+app_settings {
    default_type application/json;
    return 404 '{"message":"Not found"}';
}

location ~ ^/api/inbound/(?<wco_inbound_path>.*)\$ {
    default_type application/json;
    if (\$http_authorization != "Bearer $TOKEN") {
        return 401 '{"message":"Missing or wrong inbound token (Authorization: Bearer <INBOUND_TOKEN>)"}';
    }
    proxy_pass http://127.0.0.1:3001/\$wco_inbound_path\$is_args\$args;
    proxy_http_version 1.1;
    proxy_set_header Host \$host;
    proxy_set_header Authorization "";
    proxy_set_header Cookie "";
    proxy_read_timeout 60s;
    error_page 502 504 = @wco_api_down;
}
EOF
  fi
} > "$FLOWS_CONF"

if [ -n "$TOKEN" ]; then status "inbound write-back /api/inbound/* open with the inbound token"
else status "inbound write-back /api/inbound/* CLOSED (503): INBOUND_TOKEN is not set"; fi
if [ -n "$APPURL" ]; then status "app URL sent to flows: $APPURL"; else status "app URL sent to flows: https://<request host>/ (APP_URL not set)"; fi

if ! nginx -t -q 2>/tmp/wco-nginx-test.txt; then
  status "flow endpoints DISABLED - nginx refused the generated configuration: $(tr '\n' ' ' < /tmp/wco-nginx-test.txt)"
  mv -f "$FLOWS_CONF" /tmp/wco-flows.conf.rejected
fi

if [ -z "$PGRST_DB_URI" ]; then
  status "NOT STARTED: no database configured - set DB_HOST/DB_PORT/DB_NAME/DB_USER/DB_PASSWORD (CP Portal) or DATABASE_URL"
  exit 0
fi

export PGRST_DB_URI
export PGRST_DB_SCHEMAS="${PGRST_DB_SCHEMAS:-public}"
export PGRST_DB_ANON_ROLE="${PGRST_DB_ANON_ROLE:-wco_web}"
export PGRST_DB_POOL="${PGRST_DB_POOL:-5}"
export PGRST_OPENAPI_MODE="${PGRST_OPENAPI_MODE:-disabled}"
export PGRST_SERVER_HOST=127.0.0.1
export PGRST_SERVER_PORT=3001

supervise() {
  n=0
  while :; do
    n=$((n + 1))
    status "starting PostgREST (attempt $n) - database from $SOURCE, schema $PGRST_DB_SCHEMAS, API role $PGRST_DB_ANON_ROLE, sslmode ${PGSSLMODE:-from URL}"
    postgrest 2>&1 | while IFS= read -r line; do status "postgrest: $line"; done
    status "PostgREST stopped - restarting in 5 seconds"
    tail -n 200 "$LOG" > "$LOG.tmp" 2>/dev/null && mv "$LOG.tmp" "$LOG"
    sleep 5
  done
}

supervise < /dev/null &
exit 0
