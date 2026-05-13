import { getFirebaseApp } from "@/lib/db/firebase/firebase";

type FirestoreMod = typeof import("firebase/firestore");

let firestoreLoad: Promise<{
  db: import("firebase/firestore").Firestore;
  mod: FirestoreMod;
}> | null = null;

export async function getFirestoreBundle(): Promise<{
  db: import("firebase/firestore").Firestore;
  mod: FirestoreMod;
} | null> {
  if (typeof window === "undefined") return null;
  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;
  if (!firestoreLoad) {
    firestoreLoad = import("firebase/firestore").then((mod) => ({
      db: mod.getFirestore(firebaseApp),
      mod,
    }));
  }
  return firestoreLoad;
}
