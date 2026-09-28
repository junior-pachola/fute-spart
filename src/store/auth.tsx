import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  type User,
} from "firebase/auth";
import { auth, isFirebaseConfigured } from "../lib/firebase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  login: (email: string, senha: string) => Promise<void>;
  logout: () => Promise<void>;
  trocarSenha: (nova: string) => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: false,
  login: async () => {},
  logout: async () => {},
  trocarSenha: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  async function login(email: string, senha: string) {
    if (!auth) throw new Error("auth-off");
    await signInWithEmailAndPassword(auth, email.trim(), senha);
  }

  async function logout() {
    if (!auth) return;
    await signOut(auth);
  }

  async function trocarSenha(nova: string) {
    if (!auth?.currentUser) throw new Error("no-user");
    await updatePassword(auth.currentUser, nova);
  }

  return <Ctx.Provider value={{ user, loading, login, logout, trocarSenha }}>{children}</Ctx.Provider>;
}

export function useAuth(): AuthCtx {
  return useContext(Ctx);
}

export function authErroPt(code: string): string {
  if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential"))
    return "E-mail ou senha inválidos.";
  if (code.includes("invalid-email")) return "E-mail inválido.";
  if (code.includes("too-many-requests")) return "Muitas tentativas. Aguarde e tente de novo.";
  if (code.includes("network")) return "Sem conexão. Verifique a internet.";
  return "Não foi possível entrar. Tente de novo.";
}
