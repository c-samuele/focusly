# Focusly

Focusly è una Single Page Application per pianificare lo studio: permette di gestire task, gruppi tematici, milestone e statistiche. I dati sono associati all'account Google e salvati su Firebase.

## Avvio locale

Prerequisiti: [Node.js](https://nodejs.org/) 20 o successivo e un progetto Firebase con Authentication (Google) e Firestore abilitati.

```bash
git clone <url-del-repository>
cd focusly
npm --prefix frontend install
cp frontend/.env.example frontend/.env.local
```

Inserire in `frontend/.env.local` i parametri della propria Web App Firebase, quindi avviare:

```bash
npm run dev:frontend
```

Aprire nel browser l'indirizzo mostrato da Vite (in genere `http://localhost:5173`). Per il login Google, `localhost` deve essere incluso tra i domini autorizzati di Firebase Authentication.

## Documentazione

- Configurazione completa di Firebase: [`docs/notes/firebase-setup.md`](docs/notes/firebase-setup.md)
- Relazione di progetto: [`docs/Relazione/relazione-progetto.pdf`](docs/Relazione/relazione-progetto.pdf)
