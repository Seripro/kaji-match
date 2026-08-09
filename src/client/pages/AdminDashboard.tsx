import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearActiveGroup, type StoredUser, type ActiveGroup } from "../lib/store";

type Task = { id: string; title: string; description: string; points: number; status: string; createdBy: string; createdAt: string };
type Claim = { id: string; taskId: string; userId: string; comment: string; points: number; status: string; claimedAt: string; task?: { title: string; points: number }; user?: { id: string; nickname: string } };
type Member = { id: string; nickname: string; username: string; role: string };
type PendingMember = { membershipId: string; userId: string; nickname: string; username: string; createdAt: string };

export function AdminDashboard({ user, group, onBack }: { user: StoredUser; group: ActiveGroup; onBack: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"tasks" | "claims" | "members" | "join-requests">("tasks");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [pendingClaims, setPendingClaims] = useState<Claim[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [pendingMembers, setPendingMembers] = useState<PendingMember[]>([]);
  const [showCreateForm, setShowCreateForm] = useState(false);

  const refresh = useCallback(async () => {
    const [tasksRes, claimsRes, groupRes, pendingRes] = await Promise.all([
      api.getTasks(group.id),
      api.getClaims(group.id, "pending"),
      api.getGroup(group.id),
      api.getPendingMembers(group.id),
    ]);
    setTasks(tasksRes.tasks);
    setPendingClaims(claimsRes.claims);
    setMembers(groupRes.members);
    setPendingMembers(pendingRes.pending);
  }, [group.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleBack = () => {
    clearActiveGroup();
    onBack();
    navigate("/groups");
  };

  const handleApproveClaim = async (claimId: string) => {
    await api.approveClaim(claimId);
    refresh();
  };

  const handleRejectClaim = async (claimId: string) => {
    await api.rejectClaim(claimId);
    refresh();
  };

  const handleApproveMember = async (membershipId: string) => {
    await api.approveMember(group.id, membershipId, user.id);
    refresh();
  };

  const handleRejectMember = async (membershipId: string) => {
    await api.rejectMember(group.id, membershipId, user.id);
    refresh();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{group.name}</h1>
            <p className="text-blue-100 text-sm">管理者: {user.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-blue-200">招待コード</p>
            <p className="font-mono font-bold">{group.inviteCode}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="flex gap-1 mb-4 flex-wrap">
          <TabButton active={tab === "tasks"} onClick={() => setTab("tasks")}>タスク</TabButton>
          <TabButton active={tab === "claims"} onClick={() => setTab("claims")}>
            承認待ち {pendingClaims.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 ml-1">{pendingClaims.length}</span>}
          </TabButton>
          <TabButton active={tab === "join-requests"} onClick={() => setTab("join-requests")}>
            参加申請 {pendingMembers.length > 0 && <span className="bg-red-500 text-white text-xs rounded-full px-1.5 ml-1">{pendingMembers.length}</span>}
          </TabButton>
          <TabButton active={tab === "members"} onClick={() => setTab("members")}>メンバー</TabButton>
        </div>

        {tab === "tasks" && (
          <div>
            <button
              onClick={() => setShowCreateForm(true)}
              className="w-full bg-blue-600 text-white rounded-lg py-2.5 mb-4 font-medium hover:bg-blue-700"
            >
              + タスクを作成
            </button>
            {showCreateForm && <CreateTaskForm user={user} group={group} onCreated={() => { setShowCreateForm(false); refresh(); }} onCancel={() => setShowCreateForm(false)} />}
            <div className="space-y-3">
              {tasks.map((task) => (
                <TaskCard key={task.id} task={task} />
              ))}
              {tasks.length === 0 && <p className="text-center text-gray-400 py-8">タスクはまだありません</p>}
            </div>
          </div>
        )}

        {tab === "claims" && (
          <div className="space-y-3">
            {pendingClaims.map((claim) => (
              <div key={claim.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{claim.task?.title}</p>
                    <p className="text-sm text-gray-500">申請者: {claim.user?.nickname || "不明"}</p>
                    {claim.comment && <p className="text-sm text-gray-600 mt-1">「{claim.comment}」</p>}
                    <p className="text-xs text-gray-400 mt-1">{claim.points}ポイント</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveClaim(claim.id)} className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-600">
                      承認
                    </button>
                    <button onClick={() => handleRejectClaim(claim.id)} className="bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-600">
                      却下
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingClaims.length === 0 && <p className="text-center text-gray-400 py-8">承認待ちの申請はありません</p>}
          </div>
        )}

        {tab === "join-requests" && (
          <div className="space-y-3">
            {pendingMembers.map((pm) => (
              <div key={pm.membershipId} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{pm.nickname}</p>
                    <p className="text-sm text-gray-500">@{pm.username}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleApproveMember(pm.membershipId)} className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-600">
                      承認
                    </button>
                    <button onClick={() => handleRejectMember(pm.membershipId)} className="bg-red-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-red-600">
                      却下
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {pendingMembers.length === 0 && <p className="text-center text-gray-400 py-8">参加申請はありません</p>}
          </div>
        )}

        {tab === "members" && (
          <div className="space-y-3">
            {members.map((member) => (
              <MemberCard key={member.id} member={member} user={user} group={group} />
            ))}
          </div>
        )}

        <button onClick={handleBack} className="w-full mt-8 text-gray-400 text-sm hover:text-gray-600">
          グループ一覧に戻る
        </button>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}

function TaskCard({ task }: { task: Task }) {
  const statusLabel = { open: "募集中", pending: "申請中", completed: "完了" }[task.status] || task.status;
  const statusColor = { open: "bg-green-100 text-green-700", pending: "bg-yellow-100 text-yellow-700", completed: "bg-gray-100 text-gray-500" }[task.status] || "";

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-bold text-gray-800">{task.title}</p>
          {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
        </div>
        <div className="text-right">
          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor}`}>{statusLabel}</span>
          <p className="text-sm font-bold text-blue-600 mt-1">{task.points} pt</p>
        </div>
      </div>
    </div>
  );
}

function MemberCard({ member, user, group }: { member: Member; user: StoredUser; group: ActiveGroup }) {
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleReset = async () => {
    if (!newPassword) return;
    try {
      await api.resetPassword(member.id, user.id, group.id, newPassword);
      setMessage("パスワードをリセットしました");
      setNewPassword("");
      setTimeout(() => { setShowReset(false); setMessage(""); }, 2000);
    } catch (err: any) {
      setMessage(err.message);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="font-bold text-gray-800">{member.nickname}</p>
          <p className="text-sm text-gray-500">@{member.username} ・ {member.role === "admin" ? "管理者" : "メンバー"}</p>
        </div>
        {member.id !== user.id && (
          <button onClick={() => setShowReset(!showReset)} className="text-xs text-gray-400 hover:text-gray-600">
            PW変更
          </button>
        )}
      </div>
      {showReset && (
        <div className="mt-3 pt-3 border-t">
          {message && <p className="text-sm text-green-600 mb-2">{message}</p>}
          <div className="flex gap-2">
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="新しいパスワード"
              className="flex-1 border rounded-lg px-3 py-1.5 text-sm"
            />
            <button onClick={handleReset} className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-blue-700">
              変更
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CreateTaskForm({ user, group, onCreated, onCancel }: { user: StoredUser; group: ActiveGroup; onCreated: () => void; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [points, setPoints] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !points) return;

    setLoading(true);
    await api.createTask({
      groupId: group.id,
      title,
      description,
      points: parseInt(points, 10),
      createdBy: user.id,
    });
    setLoading(false);
    onCreated();
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-4 mb-4 space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">タスク名</label>
        <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="例: お風呂掃除" className="w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">詳細（任意）</label>
        <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例: 浴槽もしっかり磨く" className="w-full border rounded-lg px-3 py-2" />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">報酬ポイント</label>
        <input type="number" value={points} onChange={(e) => setPoints(e.target.value)} placeholder="例: 10" min="1" className="w-full border rounded-lg px-3 py-2" />
      </div>
      <div className="flex gap-2">
        <button type="submit" disabled={loading} className="flex-1 bg-blue-600 text-white rounded-lg py-2 font-medium hover:bg-blue-700 disabled:opacity-50">
          {loading ? "作成中..." : "作成"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-500 hover:text-gray-700">
          キャンセル
        </button>
      </div>
    </form>
  );
}
