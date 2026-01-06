import Layout from '../components/Layout';
import Dashboard from '../components/Dashboard';
import { useSession } from 'next-auth/react';

export default function Home() {
  const { status } = useSession();
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true';

  return (
    <Layout title="Bau‑AI Portal" subtitle="Alles in einer Plattform: OneDrive · Kalender · Chat">
      {!demo && status !== 'authenticated' ? (
        <div className="panel">
          <h2>Login erforderlich</h2>
          <p className="sub">
            Bitte mit Microsoft anmelden, damit OneDrive/Outlook gelesen werden können.
            (Chat funktioniert in REAL MODE nur, wenn OpenAI API Key gesetzt ist.)
          </p>
        </div>
      ) : (
        <Dashboard />
      )}
    </Layout>
  );
}
