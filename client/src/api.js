const token = () => localStorage.getItem('mg_token');
export async function api(path, { method = 'GET', body } = {}) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', ...(token() ? { Authorization: 'Bearer ' + token() } : {}) },
    body: body ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Algo salió mal. Probá de nuevo.');
  return data;
}
export const saveSession = (t) => localStorage.setItem('mg_token', t);
export const clearSession = () => localStorage.removeItem('mg_token');
export const hasSession = () => !!token();
