// Data API client: the app's PostgreSQL / AWS RDS database, served by PostgREST at /api/db
// (nginx in the deployed container; `npm run dev` proxies it to localhost:3001 — vite.config.js).
// VITE_DB_API_URL overrides the base URL.
//
// Same call style the pages use:
//   await db.from('clients').select('*').order('created_at', { ascending: false })
//   await db.from('clients').upsert([row], { onConflict: 'id' })
//   await db.from('clients').update({ status }).eq('id', id)
//   await db.from('clients').delete().eq('id', id)
//   await db.from('clients').select('id, name').eq('id', id).maybeSingle()
// Every call resolves to { data, error }; error carries PostgREST's code and message.

const configuredUrl = import.meta.env.VITE_DB_API_URL || '/api/db';
const apiBase = new URL(configuredUrl, window.location.origin).toString().replace(/\/$/, '');

class Query {
  constructor(table) {
    this.table = table;
    this.method = 'GET';
    this.params = new URLSearchParams();
    this.prefer = [];
    this.body = undefined;
    this.single = false;
  }

  select(columns = '*') {
    this.params.set('select', columns);
    if (this.method !== 'GET') this.prefer.push('return=representation');
    return this;
  }

  insert(rows) {
    this.method = 'POST';
    this.body = rows;
    return this;
  }

  upsert(rows, { onConflict } = {}) {
    this.method = 'POST';
    this.body = rows;
    this.prefer.push('resolution=merge-duplicates');
    if (onConflict) this.params.set('on_conflict', onConflict);
    return this;
  }

  update(values) {
    this.method = 'PATCH';
    this.body = values;
    return this;
  }

  delete() {
    this.method = 'DELETE';
    return this;
  }

  eq(column, value) {
    this.params.append(column, `eq.${value}`);
    return this;
  }

  order(column, { ascending = true } = {}) {
    this.params.append('order', `${column}.${ascending ? 'asc' : 'desc'}`);
    return this;
  }

  limit(count) {
    this.params.set('limit', String(count));
    return this;
  }

  // First matching row, or null when there is none
  maybeSingle() {
    this.single = true;
    return this;
  }

  async run() {
    const headers = { Accept: 'application/json' };
    if (this.body !== undefined) headers['Content-Type'] = 'application/json';
    if (this.prefer.length) headers.Prefer = this.prefer.join(',');
    const query = this.params.toString();

    try {
      const res = await fetch(`${apiBase}/${this.table}${query ? `?${query}` : ''}`, {
        method: this.method,
        headers,
        body: this.body === undefined ? undefined : JSON.stringify(this.body)
      });
      const text = await res.text();
      let json = null;
      try { json = text ? JSON.parse(text) : null; } catch { json = null; }

      if (!res.ok) {
        return {
          data: null,
          status: res.status,
          error: { code: json?.code || String(res.status), message: json?.message || res.statusText || 'Request failed', details: json?.details, hint: json?.hint }
        };
      }
      const data = this.single ? (Array.isArray(json) ? (json[0] ?? null) : json) : json;
      return { data, status: res.status, error: null };
    } catch (err) {
      return { data: null, status: 0, error: { code: 'NETWORK_ERROR', message: err.message } };
    }
  }

  // Awaiting a query sends it
  then(resolve, reject) {
    return this.run().then(resolve, reject);
  }
}

export const db = {
  from: (table) => new Query(table)
};

export default db;
