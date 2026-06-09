import { onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';

const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
};

const signOutUser = () => signOut(auth);

const subscribeToAuthChanges = (callback) => onAuthStateChanged(auth, callback);

export const authService = {
  signInWithGoogle,
  signOutUser,
  subscribeToAuthChanges,
};
