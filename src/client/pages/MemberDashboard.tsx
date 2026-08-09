import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { clearActiveGroup, type StoredUser, type ActiveGroup } from "../lib/store";

type Task = { id: string; title: string; description: string; points: number; status: string; createdBy: string; createdAt: string };
type Claim = { id: string; taskId: string; comment: string; points: number; status: string; claimedAt: string; task?: { title: string; points: number } };

export function MemberDashboard({ user, group, onBack }: { user: StoredUser; group: ActiveGroup; onBack: () => void }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"available" | "history">("available");
  const [tasks, setTasks] = useState<Task[]>([]);
  const [claims, setClaims] = useState<Claim[]>([]);
  const [userPoints, setUserPoints] = useState(0);
  const [claimingTask, setClaimingTask] = useState<string | null>(null);
  const [comment, setComment] = useState("");

  const refresh = useCallback(async () => {
    const [tasksRes, claimsRes, pointsRes] = await Promise.all([
      api.getTasks(group.id, "open"),
      api.getUserClaims(user.id),
      api.getUserPoints(user.id, group.id),
    ]);
    setTasks(tasksRes.tasks);
    setClaims(claimsRes.claims);
    setUserPoints(pointsRes.points);
  }, [group.id, user.id]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleClaim = async (taskId: string) => {
    await api.claimTask(taskId, user.id, comment);
    setClaimingTask(null);
    setComment("");
    refresh();
  };

  const handleBack = () => {
    clearActiveGroup();
    onBack();
    navigate("/groups");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-green-600 text-white p-4 shadow">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">{group.name}</h1>
            <p className="text-green-100 text-sm">{user.nickname}</p>
          </div>
          <div className="text-right">
            <p className="text-xs text-green-200">保有ポイント</p>
            <p className="text-2xl font-bold">{userPoints} pt</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <div className="flex gap-2 mb-4">
          <TabButton active={tab === "available"} onClick={() => setTab("available")}>
            募集中タスク
          </TabButton>
          <TabButton active={tab === "history"} onClick={() => setTab("history")}>
            履歴
          </TabButton>
        </div>

        {tab === "available" && (
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="bg-white rounded-lg shadow p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{task.title}</p>
                    {task.description && <p className="text-sm text-gray-500 mt-1">{task.description}</p>}
                    <p className="text-sm font-bold text-green-600 mt-1">{task.points} pt</p>
                  </div>
                  <button
                    onClick={() => setClaimingTask(claimingTask === task.id ? null : task.id)}
                    className="bg-green-500 text-white text-sm px-3 py-1.5 rounded-lg hover:bg-green-600 whitespace-nowrap"
                  >
                    やった！
                  </button>
                </div>
                {claimingTask === task.id && (
                  <div className="mt-3 pt-3 border-t">
                    <input
                      type="text"
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="コメント（任意）"
                      className="w-full border rounded-lg px-3 py-2 text-sm mb-2"
                    />
                    <button onClick={() => handleClaim(task.id)} className="w-full bg-green-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-700">
                      申請する
                    </button>
                  </div>
                )}
              </div>
            ))}
            {tasks.length === 0 && <p className="text-center text-gray-400 py-8">募集中のタスクはありません</p>}
          </div>
        )}

        {tab === "history" && (
          <div className="space-y-3">
            {claims.map((claim) => {
              const statusLabel = { pending: "承認待ち", approved: "承認済み", rejected: "却下" }[claim.status] || claim.status;
              const statusColor = { pending: "text-yellow-600", approved: "text-green-600", rejected: "text-red-600" }[claim.status] || "";
              return (
                <div key={claim.id} className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{claim.task?.title}</p>
                    {claim.comment && <p className="text-sm text-gray-600">「{claim.comment}」</p>}
                    <p className="text-xs text-gray-400">{new Date(claim.claimedAt).toLocaleDateString("ja-JP")} ・ {claim.points}pt</p>
                  </div>
                  <span className={`text-sm font-medium ${statusColor}`}>{statusLabel}</span>
                </div>
              );
            })}
            {claims.length === 0 && <p className="text-center text-gray-400 py-8">履歴はありません</p>}
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
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
    >
      {children}
    </button>
  );
}
