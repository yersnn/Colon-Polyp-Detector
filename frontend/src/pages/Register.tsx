import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { authApi } from "../api/client";
import ColonIcon from "../components/ColonIcon";
import { useAuth } from "../contexts/AuthContext";
import { useLang } from "../contexts/LangContext";
import { useTheme } from "../contexts/ThemeContext";
import type { Lang } from "../i18n/translations";

const LANGS: Lang[] = ["en", "ru", "kz"];

export default function Register() {
  const [email, setEmail]     = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError]     = useState("");
  const [loading, setLoading] = useState(false);
  const { login }   = useAuth();
  const navigate    = useNavigate();
  const { t, lang, setLang } = useLang();
  const { theme, toggle } = useTheme();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) { setError("Passwords do not match"); return; }
    if (password.length < 6)  { setError("Password must be at least 6 characters"); return; }
    setLoading(true);
    try {
      const { data } = await authApi.register(email, password);
      await login(data.access_token);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.response?.data?.detail || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-page flex items-center justify-center p-4">
      {/* Top-right controls */}
      <div className="fixed top-4 right-4 flex items-center gap-2">
        <div className="flex items-center rounded-lg overflow-hidden border" style={{ borderColor: "var(--line)" }}>
          {LANGS.map((l) => (
            <button key={l} onClick={() => setLang(l)}
              className="px-2.5 py-1 text-xs font-semibold uppercase transition-all duration-150"
              style={{ backgroundColor: lang === l ? "var(--fg)" : "var(--surface)", color: lang === l ? "var(--surface)" : "var(--fg3)" }}>
              {l}
            </button>
          ))}
        </div>
        <button onClick={toggle}
          className="w-8 h-8 rounded-lg flex items-center justify-center border transition-colors duration-150"
          style={{ borderColor: "var(--line)", color: "var(--fg3)", backgroundColor: "var(--surface)" }}>
          {theme === "dark" ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 7a5 5 0 100 10A5 5 0 0012 7z" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center">
            <ColonIcon size={56} />
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight">{t.appName}</h1>
          <p className="text-sm text-fg3 mt-1">{t.register.subtitle}</p>
        </div>

        <div className="card shadow-xl" style={{ boxShadow: "0 20px 60px rgba(0,0,0,0.12)" }}>
          <h2 className="text-lg font-bold text-fg mb-6">{t.register.title}</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-fg3">
                {t.register.email}
              </label>
              <input type="email" className="input-field" placeholder={t.login.ph_email}
                value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-fg3">
                {t.register.password}
              </label>
              <input type="password" className="input-field" placeholder={t.register.ph_password}
                value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5 text-fg3">
                {t.register.confirm}
              </label>
              <input type="password" className="input-field" placeholder={t.register.ph_confirm}
                value={confirm} onChange={(e) => setConfirm(e.target.value)} required />
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 rounded-xl text-sm"
                   style={{ backgroundColor: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444" }}>
                <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}

            <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
              {loading
                ? <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 rounded-full animate-spin"
                          style={{ borderColor: "rgba(255,255,255,0.3)", borderTopColor: "var(--btn-fg)" }} />
                    {t.register.submitting}
                  </span>
                : t.register.submit}
            </button>
          </form>

          <p className="mt-5 text-center text-sm text-fg3">
            {t.register.haveAccount}{" "}
            <Link to="/login" className="font-semibold text-fg hover:underline">
              {t.register.signIn}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
