import { useState } from "react";
import { describePlatform, formatDeviceValue, DEVICE_FIELDS } from "../lib/utils";

export default function DeviceRow({ row, onError }) {
  const [expandedDetail, setExpandedDetail] = useState(false);
  const [copied, setCopied] = useState(false);

  const d = row.data;
  const fullId = String(d.deviceUid || "");
  // The same short form the app shows the trainee, so the two can be read against each
  // other over the phone.
  const shortId = fullId.slice(0, 12).toUpperCase();
  const platform = describePlatform(d);
  const model = d.deviceModel || d.deviceName || "";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1200);
    } catch (e) {
      // Clipboard blocked, usually an insecure origin. The full id is in Details anyway.
      onError("Could not reach the clipboard - the full id is under Details.");
    }
  };

  return (
    <>
      <tr className={expandedDetail ? "expanded" : ""}>
        <td>{d.username || row.uid}</td>
        <td>
          {fullId ? (
            <code className="copyable" title="Click to copy the full id" onClick={copy}>
              {copied ? "COPIED" : shortId || "-"}
            </code>
          ) : (
            <code>-</code>
          )}
        </td>
        <td className="ellipsis" title={model}>{model || "-"}</td>
        <td className="ellipsis" title={platform}>{platform}</td>
        <td>{d.appVersion || "-"}</td>
        <td>{row.lastLogin ? row.lastLogin.toLocaleString() : "-"}</td>
        <td>{d.loginCount === undefined ? "-" : String(d.loginCount)}</td>
        <td style={{ textAlign: "right" }}>
          <button className="ghost" onClick={() => setExpandedDetail((v) => !v)}>
            {expandedDetail ? "Hide" : "Details"}
          </button>
        </td>
      </tr>
      <tr className="detail" hidden={!expandedDetail}>
        <td colSpan={8}>{expandedDetail && <DeviceDetails data={d} />}</td>
      </tr>
    </>
  );
}

/** The panel behind the Details button: every field on the document, nothing dropped. */
function DeviceDetails({ data }) {
  const known = new Set(DEVICE_FIELDS.map(([key]) => key));

  const cells = DEVICE_FIELDS.map(([key, label]) => (
    <div key={key}>
      <span className="k">{label}</span>
      <span className={`v${key === "deviceUid" || key === "firebaseUid" ? " id" : ""}`}>
        {formatDeviceValue(key, data[key])}
      </span>
    </div>
  ));

  // Anything written by a newer build of the app than this page knows about.
  for (const key of Object.keys(data)) {
    if (!known.has(key)) {
      cells.push(
        <div key={key}>
          <span className="k">{key}</span>
          <span className="v">{formatDeviceValue(key, data[key])}</span>
        </div>
      );
    }
  }

  return <div className="kv">{cells}</div>;
}
