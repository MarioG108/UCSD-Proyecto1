import { useCallback, useEffect, useState } from "react";

export type Role = "admin" | "user";
export type Session = { username: string; role: Role };

// Login de demostración (MVP): credenciales fijas del lado del cliente.
const USERS: Record<string, { password: string; role: Role }> = {
  admin: { password: "admin", role: "admin" },
  user: { password: "user", role: "user" },
};

const KEY = "ls_session";

export function checkLogin(username: string, password: string): Session | null {
  const u = USERS[username.trim().toLowerCase()];
  if (!u || u.password !== password) return null;
  return { username: username.trim().toLowerCase(), role: u.role };
}

export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setSession(JSON.parse(raw) as Session);
    } catch {
      /* sin almacenamiento */
    }
    setReady(true);
  }, []);

  const login = useCallback((s: Session) => {
    setSession(s);
    try {
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {
      /* noop */
    }
  }, []);

  const logout = useCallback(() => {
    setSession(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* noop */
    }
  }, []);

  return { session, ready, login, logout };
}
