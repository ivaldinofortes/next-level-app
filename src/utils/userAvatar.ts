/** Avatares de utilizador (localStorage `nl_user_avatares`) */

export type UserAvatarMap = Record<string, string>;

export type UserAvatarRef = {
  id?: number | string | null;
  name?: string | null;
  email?: string | null;
};

const keyName = (name?: string | null) => (name ? `name:${String(name).trim().toLowerCase()}` : '');
const keyEmail = (email?: string | null) => (email ? `email:${String(email).trim().toLowerCase()}` : '');
const keyId = (id?: number | string | null) => (id != null && id !== '' ? `id:${String(id)}` : '');

/** Resolve foto de um utilizador por id, nome ou email */
export function getUserAvatar(avatars: UserAvatarMap | undefined | null, user?: UserAvatarRef | null): string | null {
  if (!avatars || !user) return null;
  const keys = [keyId(user.id), keyName(user.name), keyEmail(user.email)].filter(Boolean);
  // Legado: só id numérico
  if (user.id != null) keys.push(String(user.id));
  if (user.name) keys.push(String(user.name).toLowerCase());
  for (const k of keys) {
    if (k && avatars[k]) return avatars[k];
  }
  return null;
}

/** Grava avatar com várias chaves para funcionar no login (por nome) e no header (por id) */
export function setUserAvatar(
  avatars: UserAvatarMap,
  user: UserAvatarRef,
  dataUrl: string,
): UserAvatarMap {
  const next = { ...avatars };
  const keys = [keyId(user.id), keyName(user.name), keyEmail(user.email)].filter(Boolean);
  if (user.id != null) keys.push(String(user.id)); // legado
  for (const k of keys) next[k] = dataUrl;
  return next;
}

export function removeUserAvatar(avatars: UserAvatarMap, user: UserAvatarRef): UserAvatarMap {
  const next = { ...avatars };
  const keys = [keyId(user.id), keyName(user.name), keyEmail(user.email), user.id != null ? String(user.id) : ''].filter(Boolean);
  for (const k of keys) delete next[k];
  return next;
}

export function persistUserAvatars(avatars: UserAvatarMap) {
  try {
    localStorage.setItem('nl_user_avatares', JSON.stringify(avatars));
  } catch (e) {
    console.warn('Não foi possível gravar avatares:', e);
  }
}

export function userInitials(name?: string | null) {
  const n = String(name || 'U').trim();
  const parts = n.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return n.slice(0, 2).toUpperCase();
}
