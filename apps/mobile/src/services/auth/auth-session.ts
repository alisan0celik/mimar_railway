type SessionExpiredListener = () => void;

const listeners = new Set<SessionExpiredListener>();

export function onAuthSessionExpired(listener: SessionExpiredListener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function emitAuthSessionExpired(): void {
  listeners.forEach((listener) => listener());
}
