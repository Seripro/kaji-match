export type StoredUser = {
  id: string;
  username: string;
  nickname: string;
};

const USER_KEY = "kaji-match-user";
const GROUP_KEY = "kaji-match-active-group";

export function getUser(): StoredUser | null {
  const raw = localStorage.getItem(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setUser(user: StoredUser): void {
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(GROUP_KEY);
}

export type ActiveGroup = {
  id: string;
  name: string;
  inviteCode: string;
  role: string;
};

export function getActiveGroup(): ActiveGroup | null {
  const raw = localStorage.getItem(GROUP_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function setActiveGroup(group: ActiveGroup): void {
  localStorage.setItem(GROUP_KEY, JSON.stringify(group));
}

export function clearActiveGroup(): void {
  localStorage.removeItem(GROUP_KEY);
}
