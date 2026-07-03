// Facciata minimale per Firebase Auth.
//
// Questo service isola il resto dell'app dalle API raw dello SDK Firebase:
// lo store e i componenti consumano metodi semplificati e leggibili,
// mentre i dettagli del provider e dell'istanza auth restano centralizzati.
//
// Canali client <-> server coinvolti:
// - login Google via popup browser
// - listener dello stato di autenticazione
// - logout della sessione corrente
import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

// Avvia il login Google tramite popup.
// Firebase gestisce internamente lo scambio con il provider di identita;
// al frontend ritorna l'utente autenticato risolto dallo SDK.
const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

// Chiude la sessione Firebase corrente nel browser.
const signOutUser = () => signOut(auth);

// Espone il listener nativo di Firebase Auth che notifica:
// - login completato
// - logout
// - ripristino sessione gia presente al reload dell'app
//
// Questo e l'unico punto realtime certo del progetto attuale:
// non e un socket custom, ma una subscription gestita dallo SDK Auth.
const subscribeToAuthChanges = (callback) => onAuthStateChanged(auth, callback);

// Interfaccia pubblica del service.
export const authService = {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
};
