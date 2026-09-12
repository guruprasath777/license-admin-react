import { useState } from "react";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, CODES } from "../lib/firebase";
import { generateCode, describeMinutes, describeError } from "../lib/utils";

export default function IssueCodes({ onIssued }) {
  const [count, setCount] = useState(10);
  const [amount, setAmount] = useState(30);
  const [unit, setUnit] = useState("1");
  const [issuedTo, setIssuedTo] = useState("");
  const [msg, setMsg] = useState({ text: "", kind: "info" });
  const [busy, setBusy] = useState(false);
  const [fresh, setFresh] = useState(null);
  const [copyLabel, setCopyLabel] = useState("Copy all");

  const generate = async () => {
    const c = Math.min(Math.max(parseInt(count, 10) || 0, 1), 200);
    const minutes = (parseInt(amount, 10) || 0) * parseInt(unit, 10);
    const clientName = issuedTo.trim();

    if (minutes <= 0) {
      setMsg({ text: "Give the codes a duration greater than zero.", kind: "err" });
      return;
    }

    setBusy(true);
    setMsg({ text: `Creating ${c} code(s)...`, kind: "info" });
    setFresh(null);

    const made = [];
    try {
      for (let i = 0; i < c; i++) {
        let attempts = 0;
        for (;;) {
          const code = generateCode();
          try {
            await setDoc(doc(db, CODES, code), {
              durationMinutes: minutes,
              active: true,
              redeemed: false,
              redeemedBy: "",
              redeemedDevice: "",
              redeemedAt: null,
              issuedTo: clientName,
              notes: "",
              createdAt: serverTimestamp(),
            });
            made.push(code);
            break;
          } catch (e) {
            // A collision lands here as a rules rejection, since overwriting is not allowed.
            if (++attempts > 3) throw e;
          }
        }
      }

      setMsg({ text: `${made.length} code(s) created, ${describeMinutes(minutes)} each.`, kind: "ok" });
      setFresh({ title: `${made.length} new code(s), ${describeMinutes(minutes)} each`, codes: made });
      onIssued(made, minutes, clientName);
    } catch (e) {
      setMsg({ text: describeError(e, made.length), kind: "err" });
      if (made.length) {
        setFresh({ title: `${made.length} new code(s), ${describeMinutes(minutes)} each`, codes: made });
      }
    } finally {
      setBusy(false);
    }
  };

  const copyAll = async () => {
    if (!fresh) return;
    await navigator.clipboard.writeText(fresh.codes.join("\n"));
    setCopyLabel("Copied");
    setTimeout(() => setCopyLabel("Copy all"), 1500);
  };

  return (
    <section className="card">
      <h2>Issue codes</h2>
      <div className="row">
        <div>
          <label htmlFor="count">HOW MANY</label>
          <input id="count" type="number" min="1" max="200" value={count}
            onChange={(e) => setCount(e.target.value)} />
        </div>
        <div>
          <label htmlFor="amount">DURATION</label>
          <input id="amount" type="number" min="1" value={amount}
            onChange={(e) => setAmount(e.target.value)} />
        </div>
        <div>
          <label htmlFor="unit">UNIT</label>
          <select id="unit" value={unit} onChange={(e) => setUnit(e.target.value)}>
            <option value="1">minutes</option>
            <option value="60">hours</option>
            <option value="1440">days</option>
            <option value="43200">months</option>
          </select>
        </div>
        <div>
          <label htmlFor="issuedTo">CLIENT NAME</label>
          <input id="issuedTo" type="text" placeholder="Acme Corp" value={issuedTo}
            onChange={(e) => setIssuedTo(e.target.value)} />
        </div>
        <button onClick={generate} disabled={busy}>GENERATE</button>
      </div>
      <p className={`msg ${msg.kind}`}>{msg.text}</p>
      {fresh && (
        <div className="fresh">
          <strong>{fresh.title}</strong>
          <div className="codes">
            {fresh.codes.map((code) => <code key={code}>{code}</code>)}
          </div>
          <p className="hint">Copy these now — they are listed below too, but you can also email them to a client below.</p>
          <button className="ghost" style={{ marginTop: 12 }} onClick={copyAll}>{copyLabel}</button>
        </div>
      )}
    </section>
  );
}
