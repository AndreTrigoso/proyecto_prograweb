export function readJSON(storage, key, fallback = null) {
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export function writeJSON(storage, key, value) {
  try {
    storage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage bloqueado o lleno: se ignora */
  }
}

export function remove(storage, key) {
  try {
    storage.removeItem(key);
  } catch {
    /* noop */
  }
}
