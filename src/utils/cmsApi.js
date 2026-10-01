/*
API: /api/generic.php?action=get&table=richtexts&id=1
Input: token (Bearer), table, id
Output: { success, row }

API: /api/generic.php?action=edit&table=richtexts&id=1
Input: token (Bearer), table, id, POST body = { ...fields }
Output: { success, message }

API: /api/generic.php?action=meta&table=richtexts
Input: token (Bearer), table
Output: { success, fields: [ { name, type, required, show_form, ... } ], primary_key, table_label }

API: /api/generic.php?action=list&table=xxx&page=1&limit=20
Output: { success, rows, total, limit, page, primary_key }

API: /api/generic.php?action=insert&table=xxx  POST body={...fields}
Output: { success, insert_id }

API: /api/generic.php?action=delete&table=xxx&id=1  POST
Output: { success, affected_rows }
*/

// API base: override by setting window.__API_BASE__ before app boot if needed
// Default to empty string so calls use same-origin relative paths (e.g. `/api/...`).
const API_BASE = (typeof window !== 'undefined' && window.__API_BASE__) ? window.__API_BASE__ : '';
const _h = (token) => ({ 'Authorization': 'Bearer ' + token });
const _jh = (token) => ({ 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token });

// Example usage for frontend dev
export const CMS_API = {
    get:     (table, id, token)       => fetch(`${API_BASE}/api/generic.php?action=get&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, { headers: _h(token) }).then(r=>r.json()),
    edit:    (table, id, data, token) => fetch(`${API_BASE}/api/generic.php?action=edit&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, { method: 'POST', headers: _jh(token), body: JSON.stringify(data) }).then(r=>r.json()),
    meta:    (table, token)           => fetch(`${API_BASE}/api/generic.php?action=meta&table=${encodeURIComponent(table)}`, { headers: _h(token) }).then(r=>r.json()),
    list:    (table, page, limit, token) => fetch(`${API_BASE}/api/generic.php?action=list&table=${encodeURIComponent(table)}&page=${page}&limit=${limit}`, { headers: _h(token) }).then(r=>r.json()),
    insert:  (table, data, token)     => fetch(`${API_BASE}/api/generic.php?action=insert&table=${encodeURIComponent(table)}`, { method: 'POST', headers: _jh(token), body: JSON.stringify(data) }).then(r=>r.json()),
    delete:  (table, id, token)       => fetch(`${API_BASE}/api/generic.php?action=delete&table=${encodeURIComponent(table)}&id=${encodeURIComponent(id)}`, { method: 'POST', headers: _h(token) }).then(r=>r.json()),
    options: (query, token)           => fetch(`${API_BASE}/api/generic.php?action=options`, { method: 'POST', headers: _jh(token), body: JSON.stringify({ query }) }).then(r=>r.json()),
};
