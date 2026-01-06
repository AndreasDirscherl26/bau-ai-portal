# Bau-AI Portal (MVP)

Dieses Projekt ist ein **sofort startbares** Web-Portal, das (in der REAL-Version) Folgendes bündelt:

- Microsoft Login (Entra ID) via NextAuth
- OneDrive (Graph) Dateien listen
- Outlook Kalender (Graph) Termine anzeigen
- Chat (OpenAI API) als "Kopf"

## 1) Sofort starten (DEMO MODE – keine Keys nötig)

1. Node.js installieren (>= 18)
2. Projekt entpacken
3. `.env.example` nach `.env` kopieren
4. `DEMO_MODE=true` lassen
5. Start:

```bash
npm install
npm run dev
```

Dann öffnen: http://localhost:3000

> Demo Mode zeigt Beispiel-Dateien/Termine und eine lokale Chat-Simulation (ohne OpenAI).

## 2) REAL MODE (Microsoft + OneDrive + Outlook + OpenAI)

### 2.1 Microsoft Entra App registrieren
Azure Portal: App registrations → New registration

- Redirect URI (Web): `http://localhost:3000/api/auth/callback/azure-ad`
- Permissions (delegated):
  - `User.Read`
  - `Files.Read` (oder `Files.Read.All` wenn nötig)
  - `Calendars.Read`
  - plus `openid`, `profile`, `email`, `offline_access` (kommt über OAuth scope)

Dann **Client Secret** erstellen.

### 2.2 .env setzen
- `DEMO_MODE=false`
- `AZURE_AD_*` setzen
- `OPENAI_API_KEY` setzen
- `NEXTAUTH_SECRET` (mind. 32+ Zeichen zufällig)

### 2.3 Start
```bash
npm install
npm run dev
```

## 3) Deployment (echtes "Link klicken")
Ich kann hier keinen öffentlichen Link hosten oder deployen.
Wenn du es als klickbaren Link willst, deploye z.B. auf Vercel/Render/Azure Web App und setze dort die ENV Variablen.


Hinweis: setze zusätzlich `NEXT_PUBLIC_DEMO_MODE=true/false` (gleich wie DEMO_MODE), damit die UI korrekt anzeigt.
