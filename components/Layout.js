import Link from 'next/link';
import { useSession, signIn, signOut } from 'next-auth/react';

export default function Layout({ title, subtitle, children }) {
  const { data: session, status } = useSession();
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  return (
    <div className="container">
      <div className="header">
        <div className="brand">
          <div className="logo" />
          <div>
            <p className="h1">{title || 'Bau‑AI Portal'}</p>
            <p className="sub">{subtitle || 'OneDrive + Outlook Kalender + Chat (MVP)'}</p>
          </div>
        </div>

        <div className="kv">
          <span className="badge">{demo ? 'DEMO MODE' : 'REAL MODE'}</span>
          {demo ? (
            <span className="badge">kein Login nötig</span>
          ) : status === 'authenticated' ? (
            <>
              <span className="badge">{session?.user?.email || session?.user?.name}</span>
              <button className="button danger" onClick={() => signOut()}>Abmelden</button>
            </>
          ) : (
            <button className="button primary" onClick={() => signIn('azure-ad')}>Mit Microsoft anmelden</button>
          )}
        </div>
      </div>

      {children}

      <div className="footer">
        Tipp: In REAL MODE werden OneDrive & Kalender über Microsoft Graph gelesen; Chat über OpenAI API (serverseitig).
      </div>
    </div>
  );
}
