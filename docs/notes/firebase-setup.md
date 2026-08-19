# Setup Firebase

## 1. Variabili ambiente

Creare `frontend/.env.local` partendo da `frontend/.env.example` e valorizzare:

```text
VITE_FIREBASE_API_KEY=<valore-locale>
VITE_FIREBASE_AUTH_DOMAIN=<valore-locale>
VITE_FIREBASE_PROJECT_ID=<valore-locale>
VITE_FIREBASE_STORAGE_BUCKET=<valore-locale>
VITE_FIREBASE_MESSAGING_SENDER_ID=<valore-locale>
VITE_FIREBASE_APP_ID=<valore-locale>
```

I valori vanno recuperati dalla Firebase Console della Web App associata al progetto.
`frontend/.env.local` non deve essere versionato.

## 1.b Web App

Verificare in Firebase Console:

* Project settings -> General -> Your apps
* esiste una Web App configurata per il progetto
* la configurazione web coincide con i valori nel file locale `.env.local`

## 2. Authentication

Verificare in Firebase Console:

* Authentication -> Sign-in method -> Google -> Enabled
* Authentication -> Settings -> Authorized domains:
  * `localhost`
  * il dominio Firebase Hosting del progetto, se usato

## 3. Firestore Database

Verificare:

* database creata nella regione scelta per il progetto
* modalità attuale `Test` da sostituire con le regole del repo prima dell'uso reale

## 4. Regole Firestore

Regole versionate nel repo:

* [firestore.rules](../../frontend/firestore.rules)

Da pubblicare in uno di questi due modi:

### Console Firebase

* Firestore Database -> Rules
* sostituire il contenuto con il file `firestore.rules`
* Publish

### Firebase CLI

Esempio:

```bash
npm install -g firebase-tools
firebase login
firebase use <project-id>
firebase deploy --only firestore:rules,firestore:indexes
```

## 5. Indici

File versionato:

* [firestore.indexes.json](../../frontend/firestore.indexes.json)

Strategia adottata: creare indici composti solo on demand quando Firestore lo richiede.

Se Firestore mostra un errore con link per creare un indice:

1. aprire il link proposto
2. creare l'indice
3. se vuoi, riportarlo poi anche in `firestore.indexes.json`

## 6. Modello dati V1

```text
users/{uid}
users/{uid}/tasks/{taskId}
users/{uid}/groups/{groupId}
users/{uid}/groups/{groupId}/milestones/{milestoneId}
```

## 7. Migrazione

Al primo login Google:

1. viene creato/aggiornato `users/{uid}`
2. viene controllato `migration.localStorageImported`
3. viene letto `studyPlannerData` dal browser
4. task, gruppi e milestone vengono importati su Firestore
5. `localStorage` non viene cancellato
6. il backup locale viene tenuto associato all'account Google che lo ha importato

## 8. Reimport manuale

Disponibile dalla UI con conferma esplicita utente.

Comportamento:

* merge per ID
* se l'ID esiste viene aggiornato
* se l'ID è nuovo viene creato
* se un documento remoto non è presente nel local export non viene cancellato

## 9. Cose da verificare subito dopo il primo login

* esiste `users/{uid}`
* esistono `users/{uid}/tasks`
* esistono `users/{uid}/groups`
* esistono `users/{uid}/groups/{groupId}/milestones`
* `migration.localStorageImported == true`
* `migration.source == "localStorage"`
