import { useEffect, useState } from "react";
import { signOut, onAuthStateChanged } from "firebase/auth";
import { auth, firebaseProjectId } from "./lib/firebase";
import { describeMinutes } from "./lib/utils";
import SignIn from "./components/SignIn.jsx";
import IssueCodes from "./components/IssueCodes.jsx";
import SendToClient from "./components/SendToClient.jsx";
import CodesSection from "./components/CodesSection.jsx";
import LicensesSection from "./components/LicensesSection.jsx";
import DevicesSection from "./components/DevicesSection.jsx";

export default function App() {
  // undefined while Firebase resolves the session, null once we know it's signed out.
  const [user, setUser] = useState(undefined);

  useEffect(() => onAuthStateChanged(auth, setUser), []);

  if (user === undefined) return null;
  return user ? <Admin user={user} /> : <SignIn />;
}

function Admin({ user }) {
  const [codesVersion, setCodesVersion] = useState(0);
  const [prefill, setPrefill] = useState(null);

  const handleIssued = (codes, minutes, clientName) => {
    setCodesVersion((v) => v + 1);
    setPrefill({ clientName, codes, duration: describeMinutes(minutes) });
  };

  return (
    <div id="app">
      <div className="bar">
        <div>
          <h1>LICENSE ADMIN</h1>
          <p className="sub" style={{ margin: 0 }}>{firebaseProjectId}</p>
        </div>
        <div className="who">
          <span>{user.email || user.uid}</span>
          <button className="ghost" style={{ marginLeft: 10 }} onClick={() => signOut(auth)}>
            Sign out
          </button>
        </div>
      </div>

      <IssueCodes onIssued={handleIssued} />
      <SendToClient prefill={prefill} />
      <CodesSection reloadToken={codesVersion} />
      <LicensesSection />
      <DevicesSection />
    </div>
  );
}
