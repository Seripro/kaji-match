const BASE = "/api";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Unknown error" }));
    throw new Error((err as { error: string }).error || `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

export type User = { id: string; username: string; nickname: string };
export type Group = { id: string; name: string; inviteCode: string; role: string };

export const api = {
  register: (username: string, password: string, nickname: string) =>
    request<{ user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ username, password, nickname }),
    }),

  login: (username: string, password: string) =>
    request<{ user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ username, password }),
    }),

  createGroup: (name: string, userId: string) =>
    request<{ group: { id: string; name: string; inviteCode: string } }>("/groups", {
      method: "POST",
      body: JSON.stringify({ name, userId }),
    }),

  joinGroup: (inviteCode: string, userId: string) =>
    request<{ group: { id: string; name: string }; status: string }>("/groups/join", {
      method: "POST",
      body: JSON.stringify({ inviteCode, userId }),
    }),

  getMyGroups: (userId: string) =>
    request<{ groups: Group[] }>(`/groups/my/${userId}`),

  getGroup: (id: string) =>
    request<{ group: { id: string; name: string; inviteCode: string }; members: Array<{ id: string; nickname: string; username: string; role: string }> }>(`/groups/${id}`),

  getPendingMembers: (groupId: string) =>
    request<{ pending: Array<{ membershipId: string; userId: string; nickname: string; username: string; createdAt: string }> }>(`/groups/${groupId}/pending`),

  approveMember: (groupId: string, membershipId: string, adminId: string) =>
    request<{ success: boolean }>(`/groups/${groupId}/approve`, {
      method: "POST",
      body: JSON.stringify({ membershipId, adminId }),
    }),

  rejectMember: (groupId: string, membershipId: string, adminId: string) =>
    request<{ success: boolean }>(`/groups/${groupId}/reject`, {
      method: "POST",
      body: JSON.stringify({ membershipId, adminId }),
    }),

  getUserPoints: (userId: string, groupId: string) =>
    request<{ points: number }>(`/users/${userId}/points/${groupId}`),

  resetPassword: (targetUserId: string, adminId: string, groupId: string, newPassword: string) =>
    request<{ success: boolean }>(`/users/${targetUserId}/reset-password`, {
      method: "POST",
      body: JSON.stringify({ adminId, groupId, newPassword }),
    }),

  createTask: (data: { groupId: string; title: string; description: string; points: number; createdBy: string }) =>
    request<{ task: { id: string } }>("/tasks", { method: "POST", body: JSON.stringify(data) }),

  getTasks: (groupId: string, status?: string) =>
    request<{ tasks: Array<{ id: string; title: string; description: string; points: number; status: string; createdBy: string; createdAt: string }> }>(
      `/tasks/group/${groupId}${status ? `?status=${status}` : ""}`
    ),

  claimTask: (taskId: string, userId: string, comment: string) =>
    request<{ claim: { id: string } }>("/claims", { method: "POST", body: JSON.stringify({ taskId, userId, comment }) }),

  getClaims: (groupId: string, status?: string) =>
    request<{ claims: Array<{ id: string; taskId: string; userId: string; comment: string; points: number; status: string; claimedAt: string; task?: { title: string; points: number }; user?: { id: string; nickname: string } }> }>(
      `/claims/group/${groupId}${status ? `?status=${status}` : ""}`
    ),

  getUserClaims: (userId: string) =>
    request<{ claims: Array<{ id: string; taskId: string; comment: string; points: number; status: string; claimedAt: string; task?: { title: string; points: number } }> }>(`/claims/user/${userId}`),

  approveClaim: (claimId: string) =>
    request<{ success: boolean; pointsAwarded: number }>(`/claims/${claimId}/approve`, { method: "POST" }),

  rejectClaim: (claimId: string) =>
    request<{ success: boolean }>(`/claims/${claimId}/reject`, { method: "POST" }),
};
