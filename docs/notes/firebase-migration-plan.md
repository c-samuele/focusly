# Piano di migrazione a Firebase

## Obiettivo

Migrare l'app Focusly da persistenza locale tramite localStorage a:

* Firebase Authentication (Google Sign-In)
* Cloud Firestore

Senza backend dedicato nella V1.

---

# Configurazione Firebase

## Project

* Project Name: configurato localmente
* Project ID: configurato localmente

## Web App

* Nome: configurato localmente

La configurazione Firebase risiede esclusivamente in `frontend/.env.local` e non va
inserita nella documentazione versionata.

## Authentication

Provider attivo:

* Google Sign-In

Domini autorizzati:

* localhost
* dominio Firebase Hosting del progetto, se usato

## Firestore

* Regione: eur3
* Modalità attuale: Test

Le regole dovranno essere sostituite.

---

# Architettura V1

Nessun backend.

Architettura:

```text
React
  ↓
Firebase Authentication
  ↓
Cloud Firestore
```

---

# Modello dati

## Utente

```text
users/{uid}
```

Campi:

```text
displayName
email
photoURL
createdAt
lastLoginAt

migration.localStorageImported
migration.importedAt
migration.source
```

---

## Task

```text
users/{uid}/tasks/{taskId}
```

Utilizzare gli ID esistenti presenti nel localStorage.

---

## Gruppi

```text
users/{uid}/groups/{groupId}
```

Utilizzare gli ID esistenti presenti nel localStorage.

---

## Milestone

```text
users/{uid}/groups/{groupId}/milestones/{milestoneId}
```

Utilizzare gli ID esistenti presenti nel localStorage.

---

# Sicurezza

Obiettivo:

Un utente autenticato può accedere esclusivamente ai dati contenuti nel proprio:

```text
users/{uid}
```

Condizione logica:

```text
request.auth != null
request.auth.uid == uid
```

---

# Gestione date

Convertire tutte le date a Firestore Timestamp.

Esempi:

```text
createdAt
completedAt
scheduledDate
updatedAt
```

Se un campo è null deve restare null.

Non mantenere stringhe ISO salvo necessità tecniche specifiche.

---

# Migrazione localStorage → Firestore

## Dataset attuale

Chiave localStorage:

```text
studyPlannerData
```

Contiene:

```text
193 tasks
8 groups
169 milestones
```

---

## Primo login

Alla prima autenticazione Google:

1. verificare esistenza documento utente
2. verificare stato migrazione
3. leggere studyPlannerData
4. importare gruppi
5. importare milestone
6. importare task
7. salvare stato migrazione

Condizione:

```text
migration.localStorageImported !== true
```

---

## Stato migrazione

Dopo import completato:

```text
migration.localStorageImported = true
migration.importedAt = Timestamp
migration.source = "localStorage"
```

---

# Reimport

Consentire reimport manuale.

Non eseguire reimport automatici.

Posizione suggerita:

```text
Impostazioni
→ Reimporta dati locali
```

Richiedere conferma esplicita utente.

---

## Modalità reimport

Merge per ID.

Regole:

* ID esistente → aggiorna
* ID nuovo → crea
* ID assente → non cancellare

---

# Gestione localStorage

Dopo import:

NON eliminare localStorage.

Mantenerlo come backup.

---

# Query previste

## Task per gruppo

```text
groupId
```

## Task per intervallo arbitrario

```text
scheduledDate >= startDate
scheduledDate <= endDate
```

## Analytics

Visualizzazioni:

* Giorno
* Settimana
* Mese
* Anno
* Intervallo arbitrario selezionato dall'utente

---

# Indici Firestore

Strategia:

Creazione on demand.

Se Firestore richiede un indice:

1. utilizzare il link proposto da Firestore
2. creare l'indice
3. non precreare indici inutilizzati

---

# Comportamento multi-account

Ogni account Google deve avere dati completamente separati.

Esempio:

```text
utenteA@gmail.com
→ users/{uidA}

utenteB@gmail.com
→ users/{uidB}
```

Nessuna associazione tramite email.

Nessuna migrazione tra account differenti.
