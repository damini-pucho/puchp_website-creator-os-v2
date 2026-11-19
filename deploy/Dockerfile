# ==============================================================================
# Website Creator OS V2 — image from the PREBUILT bundle in ./dist (no rebuild).
# nginx listens on port 80: it serves the app and forwards /api/db/* to PostgREST
# (the data API over the PostgreSQL / RDS database) on 127.0.0.1:3001 inside the container.
#
# Same shape as the plain nginx image that already runs on the portal: one base image, no
# second image to pull, no extra packages, the stock nginx entrypoint and CMD, no HEALTHCHECK.
#   bin/postgrest          PostgREST 12.2.3, linux/amd64, static — taken from the official image
#                          postgrest/postgrest:v12.2.3 (layer sha256:2512fbf9…1b8990)
#   docker-entrypoint.sh   installed as /docker-entrypoint.d/40-wco-data-api.sh: starts PostgREST
#                          in the background (restarting it if it stops) and returns, so nginx always
#                          serves the app, /health and /health/api (the data API's status).
#
#   docker build -t website-creator-os-v2 .
#   docker run -d -p 80:80 --env-file /secure/website-creator-os.env website-creator-os-v2
# ==============================================================================
FROM nginx:alpine

COPY bin/postgrest /usr/local/bin/postgrest
COPY dist/ /usr/share/nginx/html/
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY docker-entrypoint.sh /docker-entrypoint.d/40-wco-data-api.sh

# CRLF from a Windows copy would break the shell script; never ship an env file;
# fail the build only on a bad nginx config (a PostgREST problem shows at /health/api instead).
RUN sed -i 's/\r$//' /etc/nginx/conf.d/default.conf /docker-entrypoint.d/40-wco-data-api.sh \
  && chmod 755 /usr/local/bin/postgrest /docker-entrypoint.d/40-wco-data-api.sh \
  && rm -f /usr/share/nginx/html/.env* \
  && nginx -t

EXPOSE 80
