// Bootstrap unico dell'SDK Firebase lato browser.
//
// Questo file non contiene logica di business: ha una sola responsabilita,
// cioe inizializzare i client condivisi che il frontend userà per parlare
// con i servizi Firebase.
//
// In questo progetto i servizi realmente usati sono:
// - Firebase Auth, per login Google e stato sessione
// - Cloud Firestore, per leggere e scrivere il workspace utente
//
// Nota importante:
// qui non si vedono chiamate HTTP o WebSocket manuali. Il trasporto reale
// e gestito internamente dal Firebase Web SDK a partire dagli oggetti creati
// in questo modulo (`auth` e `db`).
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Legge una variabile Vite obbligatoria e fallisce subito se manca.
// Questo rende esplicito che il bootstrap Firebase non puo partire
// con una configurazione parziale o incoerente.
const readRequiredEnv = (key) => {
  const value = import.meta.env[key];

  if (!value) {
    throw new Error(`Missing Firebase environment variable: ${key}`);
  }

  return value;
};

// Configurazione pubblica del progetto Firebase.
// Questi valori identificano l'app Firebase da usare dal browser.
// Non sono segreti applicativi: servono al client per sapere verso quale
// progetto autenticarsi e a quale Firestore collegarsi.
const firebaseConfig = {
  apiKey: readRequiredEnv('VITE_FIREBASE_API_KEY'),
  authDomain: readRequiredEnv('VITE_FIREBASE_AUTH_DOMAIN'),
  projectId: readRequiredEnv('VITE_FIREBASE_PROJECT_ID'),
  storageBucket: readRequiredEnv('VITE_FIREBASE_STORAGE_BUCKET'),
  messagingSenderId: readRequiredEnv('VITE_FIREBASE_MESSAGING_SENDER_ID'),
  appId: readRequiredEnv('VITE_FIREBASE_APP_ID'),
};

// Istanza principale dell'app Firebase.
// Tutti gli altri client vengono creati a partire da qui.
const firebaseApp = initializeApp(firebaseConfig);

// Client Auth condiviso da tutto il frontend.
// Viene usato da authService per login, logout e listener di sessione.
const auth = getAuth(firebaseApp);

// Client Firestore condiviso da tutto il frontend.
// Viene usato da firestoreService per tutte le operazioni CRUD remote.
const db = getFirestore(firebaseApp);

// Provider Google per il login popup.
// E incapsulato qui per mantenere centralizzata la configurazione auth.
const googleProvider = new GoogleAuthProvider();

// Forza l'interfaccia auth in italiano dove supportato da Firebase.
auth.languageCode = 'it';

// Chiede esplicitamente la scelta dell'account ad ogni login popup.
// Questo evita accessi "silenziosi" sull'ultimo account Google usato.
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// Esportiamo solo le istanze condivise:
// - `firebaseApp` se in futuro serviranno altri servizi Firebase
// - `auth` per autenticazione
// - `db` per Firestore
// - `googleProvider` per il flusso popup Google
export { auth, db, firebaseApp, googleProvider };
