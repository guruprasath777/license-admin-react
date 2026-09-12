import { useEffect, useState } from "react";
import { emailCodes } from "../lib/emailjs";
import { normalizeCode } from "../lib/utils";

export default function SendToClient({ prefill }) {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [duration, setDuration] = useState("");
  const [codesText, setCodesText] = useState("");
  const [message, setMessage] = useState("");
  const [msg, setMsg] = useState({ text: "", kind: "info" });
  const [busy, setBusy] = useState(false);

  // Prefill the section so the admin only has to add the client's email and hit Send.
  useEffect(() => {
    if (!prefill) return;
    setClientName(prefill.clientName);
    setCodesText(prefill.codes.join("\n"));
    setDuration(prefill.duration);
    setMsg({ text: "", kind: "info" });
  }, [prefill]);

  const send = async () => {
    const codes = codesText.split(/[\n,]+/).map(normalizeCode).filter(Boolean);

    if (!clientEmail.trim()) {
      setMsg({ text: "Enter the client's email address.", kind: "err" });
      return;
    }
    if (!codes.length) {
      setMsg({
        text: "Enter at least one valid code — letters, numbers, hyphens and underscores, 4 to 48 characters.",
        kind: "err",
      });
      return;
    }

    setBusy(true);
    setMsg({ text: "Sending...", kind: "info" });
    try {
      await emailCodes(clientEmail.trim(), clientName.trim(), codes, duration.trim(), message.trim());
      setMsg({ text: `Sent to ${clientEmail.trim()}.`, kind: "ok" });
    } catch (e) {
      setMsg({ text: e.message, kind: "err" });
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="card">
      <h2>Send to client</h2>
      <div className="row">
        <div>
          <label htmlFor="sendClientName">CLIENT NAME</label>
          <input id="sendClientName" type="text" placeholder="Acme Corp" value={clientName}
            onChange={(e) => setClientName(e.target.value)} />
        </div>
        <div style={{ flex: "2 1 260px" }}>
          <label htmlFor="sendClientEmail">CLIENT EMAIL</label>
          <input id="sendClientEmail" type="email" placeholder="client@example.com" value={clientEmail}
            onChange={(e) => setClientEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="sendDuration">DURATION (SHOWN IN EMAIL)</label>
          <input id="sendDuration" type="text" placeholder="30 minutes" value={duration}
            onChange={(e) => setDuration(e.target.value)} />
        </div>
      </div>
      <div style={{ marginTop: 14 }}>
        <label htmlFor="sendCodes">CODE(S)</label>
        <textarea id="sendCodes" rows={3}
          placeholder="One code per line — filled in automatically after Generate, or paste your own"
          className="textarea-field mono" value={codesText}
          onChange={(e) => setCodesText(e.target.value)} />
      </div>
      <div style={{ marginTop: 14 }}>
        <label htmlFor="sendMessage">EXTRA MESSAGE (OPTIONAL)</label>
        <textarea id="sendMessage" rows={3} placeholder="Anything you'd like to add for the client"
          className="textarea-field" value={message}
          onChange={(e) => setMessage(e.target.value)} />
      </div>
      <button style={{ marginTop: 14 }} onClick={send} disabled={busy}>SEND</button>
      <p className={`msg ${msg.kind}`}>{msg.text}</p>
    </section>
  );
}
