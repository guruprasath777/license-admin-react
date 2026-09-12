import { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../lib/firebase";
import { describeSignInError } from "../lib/utils";

export default function SignIn() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState({ text: "", kind: "info" });
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!email || !password) {
      setMsg({ text: "Enter your email and password.", kind: "err" });
      return;
    }

    setBusy(true);
    setMsg({ text: "Signing in...", kind: "info" });

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e) {
      setMsg({ text: describeSignInError(e), kind: "err" });
    } finally {
      setBusy(false);
      setPassword("");
    }
  };

  return (
    <section id="signin" className="card">
      <h1>LICENSE ADMIN</h1>
      <p className="sub">Sign in with an administrator account.</p>

      <div style={{ marginBottom: 14 }}>
        <label htmlFor="email">EMAIL</label>
        <input
          id="email"
          type="email"
          autoComplete="username"
          placeholder="admin@ltvr.local"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div style={{ marginBottom: 18 }}>
        <label htmlFor="password">PASSWORD</label>
        <input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>
      <button style={{ width: "100%" }} onClick={submit} disabled={busy}>
        SIGN IN
      </button>
      <p className={`msg ${msg.kind}`}>{msg.text}</p>
    </section>
  );
}
