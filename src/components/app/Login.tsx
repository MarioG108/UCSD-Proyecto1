import { useState } from "react";
import { checkLogin, type Session } from "@/lib/auth";
import { Icon, LOGO, btnPrimary, inputCls } from "./shared";

export function Login({ onLogin }: { onLogin: (s: Session) => void }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const s = checkLogin(username, password);
    if (!s) return setError("Usuario o contraseña incorrectos.");
    onLogin(s);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-card"
      >
        <div className="mb-5 flex items-center gap-3">
          <img
            src={LOGO}
            alt=""
            onError={(e) => (e.currentTarget.style.display = "none")}
            className="h-10 w-auto rounded object-contain"
          />
          <div>
            <div className="text-lg font-semibold text-primary-strong">La Sirena</div>
            <div className="label-caps text-muted-foreground">Control de Despachos</div>
          </div>
        </div>
        <label className="mb-3 flex flex-col gap-1">
          <span className="label-caps text-muted-foreground">Usuario</span>
          <input
            className={inputCls}
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError("");
            }}
            autoFocus
            autoComplete="username"
          />
        </label>
        <label className="mb-3 flex flex-col gap-1">
          <span className="label-caps text-muted-foreground">Contraseña</span>
          <input
            type="password"
            className={inputCls}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            autoComplete="current-password"
          />
        </label>
        {error && (
          <p role="alert" className="mb-3 text-[13px] text-warning-ink">
            {error}
          </p>
        )}
        <button type="submit" className={`${btnPrimary} w-full`}>
          <Icon name="login" className="text-[16px]" />
          Iniciar sesión
        </button>
        <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground">
          Demo: admin / admin · user / user
        </p>
      </form>
    </div>
  );
}
