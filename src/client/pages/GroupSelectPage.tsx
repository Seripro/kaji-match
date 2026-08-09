import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api, type Group } from "../lib/api";
import { clearUser, setActiveGroup, type StoredUser } from "../lib/store";

export function GroupSelectPage({ user, onSelect, onLogout }: { user: StoredUser; onSelect: () => void; onLogout: () => void }) {
  const navigate = useNavigate();
  const [groups, setGroups] = useState<Group[]>([]);
  const [mode, setMode] = useState<"list" | "create" | "join">("list");
  const [message, setMessage] = useState("");

  const refresh = async () => {
    const res = await api.getMyGroups(user.id);
    setGroups(res.groups);
  };

  useEffect(() => {
    refresh();
  }, []);

  const handleSelectGroup = (group: Group) => {
    setActiveGroup({ id: group.id, name: group.name, inviteCode: group.inviteCode, role: group.role });
    onSelect();
    navigate(group.role === "admin" ? "/admin" : "/member");
  };

  const handleLogout = () => {
    clearUser();
    onLogout();
    navigate("/auth");
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-blue-600 text-white p-4 shadow">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <h1 className="text-lg font-bold">カジマッチ</h1>
          <div className="text-right">
            <p className="text-sm text-blue-100">{user.nickname}</p>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        {message && <p className="text-green-600 text-sm bg-green-50 rounded-lg p-3 mb-4">{message}</p>}

        {mode === "list" && (
          <>
            <div className="flex gap-2 mb-4">
              <button onClick={() => setMode("create")} className="flex-1 bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700">
                グループを作成
              </button>
              <button onClick={() => setMode("join")} className="flex-1 bg-green-600 text-white rounded-lg py-2.5 font-medium hover:bg-green-700">
                グループに参加
              </button>
            </div>

            <h2 className="text-sm font-medium text-gray-500 mb-2">参加中のグループ</h2>
            <div className="space-y-3">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group)}
                  className="w-full bg-white rounded-lg shadow p-4 text-left hover:bg-gray-50 transition"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-gray-800">{group.name}</p>
                      <p className="text-sm text-gray-500">{group.role === "admin" ? "管理者" : "メンバー"}</p>
                    </div>
                    <span className="text-gray-400">&rarr;</span>
                  </div>
                </button>
              ))}
              {groups.length === 0 && (
                <p className="text-center text-gray-400 py-8">参加しているグループはありません</p>
              )}
            </div>
          </>
        )}

        {mode === "create" && (
          <CreateGroupForm
            userId={user.id}
            onCreated={() => { setMode("list"); refresh(); }}
            onCancel={() => setMode("list")}
          />
        )}

        {mode === "join" && (
          <JoinGroupForm
            userId={user.id}
            onJoined={() => { setMode("list"); setMessage("参加申請を送信しました。管理者の承認をお待ちください。"); refresh(); }}
            onCancel={() => setMode("list")}
          />
        )}

        <button onClick={handleLogout} className="w-full mt-8 text-gray-400 text-sm hover:text-gray-600">
          ログアウト
        </button>
      </div>
    </div>
  );
}

function CreateGroupForm({ userId, onCreated, onCancel }: { userId: string; onCreated: () => void; onCancel: () => void }) {
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inviteCode: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setLoading(true);
    setError("");
    try {
      const res = await api.createGroup(name, userId);
      setResult({ inviteCode: res.group.inviteCode });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
        <h2 className="text-xl font-bold text-gray-800">グループを作成しました</h2>
        <div className="bg-blue-50 rounded-lg p-4 text-center">
          <p className="text-sm text-gray-600 mb-1">招待コード</p>
          <p className="text-3xl font-mono font-bold text-blue-600">{result.inviteCode}</p>
          <p className="text-xs text-gray-500 mt-2">このコードを家族に共有してください</p>
        </div>
        <button onClick={onCreated} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700">
          OK
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">グループを作成</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">グループ名</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="例: 山田家"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? "作成中..." : "作成する"}
      </button>
      <button type="button" onClick={onCancel} className="w-full text-gray-500 text-sm hover:text-gray-700">
        戻る
      </button>
    </form>
  );
}

function JoinGroupForm({ userId, onJoined, onCancel }: { userId: string; onJoined: () => void; onCancel: () => void }) {
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim()) return;

    setLoading(true);
    setError("");
    try {
      await api.joinGroup(inviteCode, userId);
      onJoined();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">グループに参加</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">招待コード</label>
        <input
          type="text"
          value={inviteCode}
          onChange={(e) => setInviteCode(e.target.value)}
          placeholder="例: ABC123"
          className="w-full border rounded-lg px-3 py-2 uppercase focus:ring-2 focus:ring-green-500 focus:border-transparent"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-green-600 text-white rounded-lg py-2.5 font-medium hover:bg-green-700 disabled:opacity-50">
        {loading ? "申請中..." : "参加申請する"}
      </button>
      <button type="button" onClick={onCancel} className="w-full text-gray-500 text-sm hover:text-gray-700">
        戻る
      </button>
    </form>
  );
}
