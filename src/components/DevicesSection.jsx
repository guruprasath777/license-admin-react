import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, DEVICES } from "../lib/firebase";
import { asDate, matchesDevice, describeError } from "../lib/utils";
import DeviceRow from "./DeviceRow.jsx";

export default function DevicesSection() {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState("");
  const [status, setStatus] = useState(null);

  const load = async () => {
    setStatus({ text: "Loading...", kind: "info" });
    try {
      const snapshot = await getDocs(collection(db, DEVICES));
      const list = [];

      snapshot.forEach((d) => {
        const data = d.data();
        list.push({ uid: d.id, data, lastLogin: asDate(data.lastLoginAt) });
      });

      // Most recently seen first - the order support questions arrive in.
      list.sort((a, b) =>
        (b.lastLogin ? b.lastLogin.getTime() : 0) - (a.lastLogin ? a.lastLogin.getTime() : 0));

      setRows(list);
      setStatus(null);
    } catch (e) {
      setRows([]);
      setStatus({
        text: e && e.code === "permission-denied"
          ? "Permission denied reading the device registry. The published rules are older than " +
            "this page - republish firestore.rules, which lets an admin list authorizedDevices."
          : describeError(e),
        kind: "err",
      });
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const needle = filter.trim().toLowerCase();
  const shown = needle ? rows.filter((row) => matchesDevice(row, needle)) : rows;

  const derived = !rows.length
    ? "No devices registered yet."
    : shown.length === rows.length
    ? `${rows.length} device(s) registered.`
    : `${shown.length} of ${rows.length} device(s) match.`;
  const msg = status || { text: derived, kind: "info" };

  return (
    <section className="card">
      <div className="bar" style={{ marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Devices connected</h2>
        <div>
          <input type="text" placeholder="Filter by user, model, id..."
            style={{ width: "auto", display: "inline-block", marginRight: 8, padding: "7px 11px", fontSize: 13 }}
            value={filter} onChange={(e) => setFilter(e.target.value)} />
          <button className="ghost" onClick={load}>Refresh</button>
        </div>
      </div>
      <div className="scroll">
        <table>
          <thead><tr>
            <th>User</th><th>Device ID</th><th>Model</th><th>Platform</th>
            <th>App</th><th>Last login</th><th>Logins</th><th></th>
          </tr></thead>
          <tbody>
            {shown.map((row) => (
              <DeviceRow key={row.uid} row={row} onError={(text) => setStatus({ text, kind: "err" })} />
            ))}
          </tbody>
        </table>
      </div>
      <p className={`msg ${msg.kind}`}>{msg.text}</p>
      <p className="hint">One record per account, written by the app on first login and keyed by
        Firebase UID. The device id is the lock &mdash; that account only runs on the machine
        listed here. Click a device id to copy it in full; open Details for everything the app
        recorded about the machine.</p>
    </section>
  );
}
