import { useEffect, useState } from "react";
import { collection, doc, getDocs, deleteDoc } from "firebase/firestore";
import { db, LICENSES } from "../lib/firebase";
import { describeError } from "../lib/utils";

export default function LicensesSection() {
  const [rows, setRows] = useState([]);
  const [status, setStatus] = useState(null);
  const [busyUid, setBusyUid] = useState(null);

  const load = async () => {
    setStatus({ text: "Loading...", kind: "info" });
    try {
      const snapshot = await getDocs(collection(db, LICENSES));
      const now = Date.now();
      const list = [];

      snapshot.forEach((d) => {
        const data = d.data();
        const expires = data.expiresAt ? data.expiresAt.toDate() : null;
        list.push({
          uid: d.id,
          username: data.username || "",
          deviceUid: data.deviceUid || "",
          licenseCode: data.licenseCode || "",
          expires,
          live: expires ? expires.getTime() > now : false,
        });
      });

      list.sort((a, b) => Number(b.live) - Number(a.live) || a.username.localeCompare(b.username));

      setRows(list);
      setStatus(null);
    } catch (e) {
      setRows([]);
      setStatus({ text: describeError(e), kind: "err" });
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const revoke = async (row) => {
    const who = row.username || row.uid;
    if (!confirm(`Revoke the license for ${who}?\n\nThey will need a new code the next time they sign in.`)) {
      return;
    }

    setBusyUid(row.uid);
    try {
      await deleteDoc(doc(db, LICENSES, row.uid));
      await load();
    } catch (e) {
      setStatus({ text: describeError(e), kind: "err" });
    } finally {
      setBusyUid(null);
    }
  };

  const derived = rows.length
    ? `${rows.length} license(s), ${rows.filter((r) => r.live).length} currently active.`
    : "No licenses issued yet.";
  const msg = status || { text: derived, kind: "info" };

  return (
    <section className="card">
      <div className="bar" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Active licenses</h2>
        <button className="ghost" onClick={load}>Refresh</button>
      </div>
      <div className="scroll">
        <table>
          <thead><tr><th>User</th><th>Device</th><th>From code</th><th>Expires</th><th>State</th><th></th></tr></thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.uid}>
                <td>{row.username || row.uid}</td>
                <td><code>{row.deviceUid.slice(0, 12).toUpperCase()}</code></td>
                <td><code>{row.licenseCode}</code></td>
                <td>{row.expires ? row.expires.toLocaleString() : "-"}</td>
                <td><span className={`tag ${row.live ? "unused" : "expired"}`}>{row.live ? "active" : "expired"}</span></td>
                <td style={{ textAlign: "right" }}>
                  <button className="ghost danger" disabled={busyUid === row.uid} onClick={() => revoke(row)}>
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className={`msg ${msg.kind}`}>{msg.text}</p>
      <p className="hint">Revoking sends that user back to the code screen the next time they sign in. It does not interrupt a session already running.</p>
    </section>
  );
}
