import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../lib/api";
import { setUser } from "../lib/store";

export function AuthPage({ onAuth }: { onAuth: () => void }) {
  const [mode, setMode] = useState<"login" | "register">("login");

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-blue-600 mb-2">カジマッチ</h1>
        <p className="text-center text-gray-500 mb-8">家族のお手伝い管理アプリ</p>

        {mode === "login" ? (
          <LoginForm onAuth={onAuth} onSwitch={() => setMode("register")} />
        ) : (
          <RegisterForm onAuth={onAuth} onSwitch={() => setMode("login")} />
        )}
      </div>
    </div>
  );
}

function LoginForm({ onAuth, onSwitch }: { onAuth: () => void; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) return;

    setLoading(true);
    setError("");
    try {
      const { user } = await api.login(username, password);
      setUser(user);
      onAuth();
      navigate("/groups");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">ログイン</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーネーム</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? "ログイン中..." : "ログイン"}
      </button>
      <p className="text-center text-sm text-gray-500">
        アカウントがない方は{" "}
        <button type="button" onClick={onSwitch} className="text-blue-600 hover:underline">
          新規登録
        </button>
      </p>
    </form>
  );
}

function RegisterForm({ onAuth, onSwitch }: { onAuth: () => void; onSwitch: () => void }) {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password || !nickname.trim()) return;

    setLoading(true);
    setError("");
    try {
      const { user } = await api.register(username, password, nickname);
      setUser(user);
      onAuth();
      navigate("/groups");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      <h2 className="text-xl font-bold text-gray-800">新規登録</h2>
      {error && <p className="text-red-500 text-sm">{error}</p>}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ユーザーネーム</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="英数字（ログインに使います）"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">ニックネーム</label>
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="表示名（例: たろう）"
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">パスワード</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full border rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>
      <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white rounded-lg py-2.5 font-medium hover:bg-blue-700 disabled:opacity-50">
        {loading ? "登録中..." : "登録する"}
      </button>
      <p className="text-center text-sm text-gray-500">
        アカウントをお持ちの方は{" "}
        <button type="button" onClick={onSwitch} className="text-blue-600 hover:underline">
          ログイン
        </button>
      </p>
    </form>
  );
}
