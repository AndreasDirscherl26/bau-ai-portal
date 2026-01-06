import { useEffect, useMemo, useState } from 'react';

function prettyBytes(num) {
  if (!num && num !== 0) return '';
  const units = ['B','KB','MB','GB','TB'];
  let i = 0;
  let n = num;
  while (n >= 1024 && i < units.length - 1) { n /= 1024; i++; }
  return `${n.toFixed(n >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export default function Dashboard() {
  const [tab, setTab] = useState('files'); // files | calendar | chat
  const [files, setFiles] = useState([]);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);

  const [chatInput, setChatInput] = useState('');
  const [messages, setMessages] = useState([
  {
    role: 'ai',
    text: 'Hi! Ich bin deine Bau-KI. Stelle Fragen zu Plänen, Protokollen, LV, Normenlogik usw.\n\nHinweis: Im DEMO-MODUS sind Daten & Antworten Beispielwerte.'
  }
]);

  async function loadFiles() {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/files');
      const data = await res.json();
      setFiles(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  async function loadEvents() {
    setLoading(true);
    try {
      const res = await fetch('/api/graph/events');
      const data = await res.json();
      setEvents(data.items || []);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (tab === 'files') loadFiles();
    if (tab === 'calendar') loadEvents();
  }, [tab]);

  async function sendChat(e) {
    e.preventDefault();
    const text = chatInput.trim();
    if (!text) return;
    setChatInput('');
    setMessages(m => [...m, { role: 'user', text }]);

    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: text })
    });

    const data = await res.json();
    setMessages(m => [...m, { role: 'ai', text: data.answer || 'Keine Antwort.' }]);
  }

  return (
    <div className="row">
      <div className="col">
        <div className="panel">
          <div className="tabs">
            <button className={`tab ${tab==='files'?'active':''}`} onClick={() => setTab('files')}>Dateien</button>
            <button className={`tab ${tab==='calendar'?'active':''}`} onClick={() => setTab('calendar')}>Kalender</button>
            <button className={`tab ${tab==='chat'?'active':''}`} onClick={() => setTab('chat')}>Chat</button>
          </div>

          {tab === 'files' && (
            <>
              <h2>OneDrive / SharePoint</h2>
              {loading ? <p className="sub">Lade…</p> : null}
              <div className="list">
                {files.map((f) => (
                  <div className="item" key={f.id}>
                    <div>
                      <strong>{f.name}</strong>
                      <small>{f.type}{f.lastModifiedDateTime ? ` · geändert: ${new Date(f.lastModifiedDateTime).toLocaleString()}` : ''}</small>
                    </div>
                    <div className="meta">
                      {f.size != null ? prettyBytes(f.size) : ''}
                      {f.webUrl ? (<div><a href={f.webUrl} target="_blank" rel="noreferrer">öffnen</a></div>) : null}
                    </div>
                  </div>
                ))}
                {(!loading && files.length === 0) ? <p className="sub">Keine Dateien gefunden (oder keine Berechtigung).</p> : null}
              </div>
            </>
          )}

          {tab === 'calendar' && (
            <>
              <h2>Outlook Kalender (nächste 7 Tage)</h2>
              {loading ? <p className="sub">Lade…</p> : null}
              <div className="list">
                {events.map((ev) => (
                  <div className="item" key={ev.id}>
                    <div>
                      <strong>{ev.subject || '(ohne Titel)'}</strong>
                      <small>
                        {ev.start?.dateTime ? new Date(ev.start.dateTime).toLocaleString() : ''} → {ev.end?.dateTime ? new Date(ev.end.dateTime).toLocaleString() : ''}
                        {ev.location?.displayName ? ` · ${ev.location.displayName}` : ''}
                      </small>
                    </div>
                    <div className="meta">
                      {ev.webLink ? (<a href={ev.webLink} target="_blank" rel="noreferrer">Outlook</a>) : null}
                    </div>
                  </div>
                ))}
                {(!loading && events.length === 0) ? <p className="sub">Keine Termine gefunden (oder keine Berechtigung).</p> : null}
              </div>
            </>
          )}

          {tab === 'chat' && (
            <>
              <h2>Bau‑KI Chat</h2>
              <div className="chatbox">
                {messages.map((m, i) => (
                  <div key={i} className={`msg ${m.role === 'user' ? 'user' : 'ai'}`}>
                    <div className="role">{m.role === 'user' ? 'Du' : 'Bau‑KI'}</div>
                    <div className="text">{m.text}</div>
                  </div>
                ))}
              </div>

              <form onSubmit={sendChat}>
                <div className="inputRow">
                  <input
                    className="input"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Frage stellen (z.B. 'Welche Infos brauche ich für die Abnahme?')"
                  />
                  <button className="button primary" type="submit">Senden</button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      <div className="col">
        <div className="panel">
          <h2>Kontext & Regeln (MVP)</h2>
          <div className="list">
            <div className="item">
              <div>
                <strong>Quellenpflicht</strong>
                <small>Für belastbare Antworten: immer Planblatt/Index/Protokollstelle nennen. In DEMO MODE nur Beispiel.</small>
              </div>
            </div>
            <div className="item">
              <div>
                <strong>Projektgedächtnis</strong>
                <small>In der echten Plattform würden wir Fakten (z.B. Türanforderungen) mit Quelle & Revision speichern.</small>
              </div>
            </div>
            <div className="item">
              <div>
                <strong>Normenlogik</strong>
                <small>Empfehlung: Regelbasis + Anwendbarkeit statt Volltext-DIN (Lizenz/Urheberrecht beachten).</small>
              </div>
            </div>
          </div>
        </div>

        <div className="panel" style={{ marginTop: 16 }}>
          <h2>Status</h2>
          <p className="sub">
            Wenn REAL MODE aktiv ist, müssen Microsoft Entra (Azure AD) und OpenAI Keys gesetzt sein.
            Sonst läuft alles in DEMO MODE.
          </p>
        </div>
      </div>
    </div>
  );
}
