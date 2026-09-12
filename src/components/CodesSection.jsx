import { useEffect, useState } from "react";
import { collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db, CODES } from "../lib/firebase";
import { describeMinutes, describeError, CODE_STATE_ORDER } from "../lib/utils";

const CODES_PAGE_SIZE = 15;

export default function CodesSection({ reloadToken }) {
  const [rows, setRows] = useState([]);
  const [unusedOnly, setUnusedOnly] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [status, setStatus] = useState(null);
  const [revoking, setRevoking] = useState(new Set());

  const load = async () => {
    setStatus({ text: "Loading...", kind: "info" });
    try {
      const snapshot = await getDocs(collection(db, CODES));
      const list = [];

      snapshot.forEach((d) => {
        const data = d.data();
        const state = data.active === false ? "revoked" : data.redeemed ? "used" : "unused";
        if (unusedOnly && state !== "unused") return;
        list.push({ code: d.id, state, ...data });
      });

      list.sort((a, b) =>
        CODE_STATE_ORDER[a.state] - CODE_STATE_ORDER[b.state] || a.code.localeCompare(b.code));

      setRows(list);
      setExpanded(false);
      setRevoking(new Set());
      setStatus(null);
    } catch (e) {
      setRows([]);
      setStatus({ text: describeError(e), kind: "err" });
    }
  };

  // Loads on mount, whenever Generate issues new codes (reloadToken), and whenever the
  // "unused only" filter changes.
  useEffect(() => { load(); }, [reloadToken, unusedOnly]); // eslint-disable-line react-hooks/exhaustive-deps

  const revoke = async (code) => {
    setRevoking((s) => new Set(s).add(code));
    try {
      await updateDoc(doc(db, CODES, code), { active: false });
      await load();
    } catch (e) {
      setStatus({ text: describeError(e), kind: "err" });
      setRevoking((s) => {
        const next = new Set(s);
        next.delete(code);
        return next;
      });
    }
  };

  // Long lists (thousands of issued codes) are unreadable dumped all at once, so only a
  // page is rendered until the admin asks for the rest.
  const shown = expanded ? rows : rows.slice(0, CODES_PAGE_SIZE);
  const unused = rows.filter((r) => r.state === "unused").length;
  const derived = rows.length
    ? `${shown.length} of ${rows.length} shown, ${unused} still spendable.`
    : "No codes yet.";
  const msg = status || { text: derived, kind: "info" };

  return (
    <section className="card">
      <div className="bar" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Codes</h2>
        <div>
          <label style={{ display: "inline", marginRight: 8 }}>
            <input type="checkbox" style={{ width: "auto", marginRight: 5 }}
              checked={unusedOnly} onChange={(e) => setUnusedOnly(e.target.checked)} />
            unused only
          </label>
          <button className="ghost" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th>Code</th><th>Worth</th><th>State</th><th>Client</th><th>Redeemed by</th><th></th></tr></thead>
          <tbody>
            {shown.map((row) => (
              <tr key={row.code}>
                <td><code>{row.code}</code></td>
                <td>{describeMinutes(row.durationMinutes)}</td>
                <td><span className={`tag ${row.state}`}>{row.state}</span></td>
                <td>{row.issuedTo || ""}</td>
                <td>{row.redeemedBy || ""}</td>
                <td style={{ textAlign: "right" }}>
                  {row.state === "unused" && (
                    <button className="ghost danger" disabled={revoking.has(row.code)}
                      onClick={() => revoke(row.code)}>
                      Revoke
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`msg ${msg.kind}`}>{msg.text}</p>
      {!expanded && rows.length > shown.length && (
        <button className="ghost" onClick={() => setExpanded(true)}>Show all ({rows.length})</button>
      )}
      {expanded && rows.length > CODES_PAGE_SIZE && (
        <button className="ghost" onClick={() => setExpanded(false)}>Show less</button>
      )}
    </section>
  );
}
