const KEY = 'ykb.identity';

function makeId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) return crypto.randomUUID();
  return 'guest-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function loadIdentity() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.name) return parsed;
    return null;
  } catch {
    return null;
  }
}

export function saveIdentity({ name }) {
  const existing = loadIdentity();
  const identity = { id: existing?.id ?? makeId(), name: name.trim() };
  localStorage.setItem(KEY, JSON.stringify(identity));
  return identity;
}

export function clearIdentity() {
  localStorage.removeItem(KEY);
}
