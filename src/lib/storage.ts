import type { Room, AudioItem, AudioKind } from "./types";
import { getFirebaseDb, useFirestore } from "./firebase";
import { supabase, isSupabaseConfigured } from "./supabase";
import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy,
} from "firebase/firestore";

const ROOMS_KEY = "audio_rooms_rooms";
const AUDIOS_KEY = "audio_rooms_audios";

/** Returns the Supabase session user id or null (demo / not logged in). */
async function getSupabaseUserId(): Promise<string | null> {
  if (typeof window === "undefined" || !supabase || !isSupabaseConfigured)
    return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.id ?? null;
}

function useSupabaseStorage(): boolean {
  return (
    typeof window !== "undefined" &&
    isSupabaseConfigured &&
    !useFirestore()
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// ——— localStorage ———
function getLocalRooms(userId: string): Room[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    const all: Room[] = raw ? JSON.parse(raw) : [];
    return all
      .filter((r) => r.userId === userId)
      .sort((a, b) => {
        const aVal = a.order !== undefined ? a.order : -a.createdAt;
        const bVal = b.order !== undefined ? b.order : -b.createdAt;
        return aVal - bVal;
      });
  } catch {
    return [];
  }
}

function getLocalRoom(roomId: string): Room | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    const all: Room[] = raw ? JSON.parse(raw) : [];
    return all.find((r) => r.id === roomId) ?? null;
  } catch {
    return null;
  }
}

function setLocalRoom(room: Room): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    const all: Room[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((r) => r.id === room.id);
    if (idx >= 0) all[idx] = room;
    else all.push(room);
    localStorage.setItem(ROOMS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function deleteLocalRoom(roomId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(ROOMS_KEY);
    const all: Room[] = raw ? JSON.parse(raw) : [];
    const next = all.filter((r) => r.id !== roomId);
    localStorage.setItem(ROOMS_KEY, JSON.stringify(next));
    const audiosRaw = localStorage.getItem(AUDIOS_KEY);
    const audios: AudioItem[] = audiosRaw ? JSON.parse(audiosRaw) : [];
    const audiosNext = audios.filter((a) => a.roomId !== roomId);
    localStorage.setItem(AUDIOS_KEY, JSON.stringify(audiosNext));
  } catch {
    // ignore
  }
}

function getLocalAudios(roomId: string): AudioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIOS_KEY);
    const all: AudioItem[] = raw ? JSON.parse(raw) : [];
    return all
      .filter((a) => a.roomId === roomId)
      .sort((a, b) => {
        const aOrder = a.order ?? a.createdAt;
        const bOrder = b.order ?? b.createdAt;
        return aOrder !== bOrder ? aOrder - bOrder : a.createdAt - b.createdAt;
      });
  } catch {
    return [];
  }
}

function setLocalAudio(audio: AudioItem): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(AUDIOS_KEY);
    const all: AudioItem[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((a) => a.id === audio.id);
    if (idx >= 0) all[idx] = audio;
    else all.push(audio);
    localStorage.setItem(AUDIOS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function deleteLocalAudio(audioId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(AUDIOS_KEY);
    const all: AudioItem[] = raw ? JSON.parse(raw) : [];
    localStorage.setItem(
      AUDIOS_KEY,
      JSON.stringify(all.filter((a) => a.id !== audioId)),
    );
  } catch {
    // ignore
  }
}

// ——— Supabase ———
function roomFromRow(row: {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  labels: unknown;
  created_at: string;
  order: number | null;
}): Room {
  const labels = Array.isArray(row.labels)
    ? (row.labels as Room["labels"])
    : [];
  return {
    id: row.id,
    userId: row.user_id,
    title: row.title,
    description: row.description ?? "",
    labels,
    createdAt: new Date(row.created_at).getTime(),
    order: row.order ?? undefined,
  };
}

function audioFromRow(row: {
  id: string;
  room_id: string;
  name: string;
  source_url: string;
  kind: string | null;
  created_at: string;
  order: number | null;
}): AudioItem {
  return {
    id: row.id,
    roomId: row.room_id,
    name: row.name,
    sourceUrl: row.source_url,
    kind: (row.kind as AudioItem["kind"]) ?? "file",
    createdAt: new Date(row.created_at).getTime(),
    order: row.order ?? undefined,
  };
}

async function getSupabaseRooms(userId: string): Promise<Room[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("user_id", userId)
    .order("order", { ascending: true, nullsFirst: false });
  if (error) throw error;
  const list = (data ?? []).map(roomFromRow);
  return list.sort((a, b) => {
    const aVal = a.order !== undefined ? a.order : -a.createdAt;
    const bVal = b.order !== undefined ? b.order : -b.createdAt;
    return aVal - bVal;
  });
}

async function getSupabaseRoom(roomId: string): Promise<Room | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("rooms")
    .select("*")
    .eq("id", roomId)
    .single();
  if (error || !data) return null;
  return roomFromRow(data);
}

async function setSupabaseRoom(room: Room): Promise<void> {
  if (!supabase) return;
  const payload = {
    id: room.id,
    user_id: room.userId,
    title: room.title,
    description: room.description ?? "",
    labels: room.labels ?? [],
    created_at: new Date(room.createdAt ?? Date.now()).toISOString(),
    order: room.order ?? null,
  };
  const { error } = await supabase.from("rooms").upsert(payload, {
    onConflict: "id",
  });
  if (error)
    throw new Error(error.message || "Failed to save room");
}

async function deleteSupabaseRoom(roomId: string): Promise<void> {
  if (!supabase) return;
  // Delete room audios first (the migration also has on delete cascade as a safeguard)
  const { error: audiosError } = await supabase
    .from("audios")
    .delete()
    .eq("room_id", roomId);
  if (audiosError) throw audiosError;
  const { error } = await supabase.from("rooms").delete().eq("id", roomId);
  if (error) throw error;
}

async function getSupabaseAudios(roomId: string): Promise<AudioItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("audios")
    .select("*")
    .eq("room_id", roomId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  const list = (data ?? []).map(audioFromRow);
  return list.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt;
    const bOrder = b.order ?? b.createdAt;
    return aOrder !== bOrder ? aOrder - bOrder : a.createdAt - b.createdAt;
  });
}

async function setSupabaseAudio(audio: AudioItem): Promise<void> {
  if (!supabase) return;
  const payload = {
    id: audio.id,
    room_id: audio.roomId,
    name: audio.name,
    source_url: audio.sourceUrl,
    kind: audio.kind ?? "file",
    created_at: new Date(audio.createdAt ?? Date.now()).toISOString(),
    order: audio.order ?? null,
  };
  const { error } = await supabase.from("audios").upsert(payload, {
    onConflict: "id",
  });
  if (error) throw error;
}

async function deleteSupabaseAudio(audioId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from("audios").delete().eq("id", audioId);
  if (error) throw error;
}

// ——— Firestore ———
async function getFirestoreRooms(userId: string): Promise<Room[]> {
  const database = getFirebaseDb();
  if (!database) return getLocalRooms(userId);
  const q = query(collection(database, "rooms"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
    const order = data.order;
    return { id: d.id, ...data, createdAt, order } as Room;
  });
  return list.sort((a, b) => {
    const aVal = a.order !== undefined ? a.order : -a.createdAt;
    const bVal = b.order !== undefined ? b.order : -b.createdAt;
    return aVal - bVal;
  });
}

async function getFirestoreRoom(roomId: string): Promise<Room | null> {
  const database = getFirebaseDb();
  if (!database) return getLocalRoom(roomId);
  const d = await getDoc(doc(database, "rooms", roomId));
  if (!d.exists()) return null;
  const data = d.data();
  const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
  return { id: d.id, ...data, createdAt } as Room;
}

async function setFirestoreRoom(room: Room): Promise<void> {
  const database = getFirebaseDb();
  if (!database) {
    setLocalRoom(room);
    return;
  }
  const { id, ...data } = room;
  const payload: Record<string, unknown> = {
    ...data,
    createdAt: data.createdAt ?? Date.now(),
  };
  if (data.order !== undefined) payload.order = data.order;
  await setDoc(doc(database, "rooms", id), payload);
}

async function deleteFirestoreRoom(roomId: string): Promise<void> {
  const database = getFirebaseDb();
  if (!database) {
    deleteLocalRoom(roomId);
    return;
  }
  await deleteDoc(doc(database, "rooms", roomId));
  const audiosSnap = await getDocs(
    query(collection(database, "audios"), where("roomId", "==", roomId)),
  );
  for (const d of audiosSnap.docs) {
    await deleteDoc(d.ref);
  }
}

async function getFirestoreAudios(roomId: string): Promise<AudioItem[]> {
  const database = getFirebaseDb();
  if (!database) return getLocalAudios(roomId);
  const q = query(
    collection(database, "audios"),
    where("roomId", "==", roomId),
    orderBy("createdAt", "asc"),
  );
  const snap = await getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
    return { id: d.id, ...data, createdAt } as AudioItem;
  });
  return list.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt;
    const bOrder = b.order ?? b.createdAt;
    return aOrder !== bOrder ? aOrder - bOrder : a.createdAt - b.createdAt;
  });
}

async function setFirestoreAudio(audio: AudioItem): Promise<void> {
  const database = getFirebaseDb();
  if (!database) {
    setLocalAudio(audio);
    return;
  }
  const { id, ...data } = audio;
  const payload: Record<string, unknown> = {
    ...data,
    createdAt: data.createdAt ?? Date.now(),
  };
  if (data.order !== undefined) payload.order = data.order;
  await setDoc(doc(database, "audios", id), payload);
}

async function deleteFirestoreAudio(audioId: string): Promise<void> {
  const database = getFirebaseDb();
  if (!database) {
    deleteLocalAudio(audioId);
    return;
  }
  await deleteDoc(doc(database, "audios", audioId));
}

// ——— Public API ———
export async function getRooms(userId: string): Promise<Room[]> {
  if (useFirestore()) return getFirestoreRooms(userId);
  if (useSupabaseStorage()) {
    const uid = await getSupabaseUserId();
    if (uid) return getSupabaseRooms(uid);
  }
  return Promise.resolve(getLocalRooms(userId));
}

export async function getRoom(roomId: string): Promise<Room | null> {
  if (useFirestore()) return getFirestoreRoom(roomId);
  if (useSupabaseStorage()) {
    const uid = await getSupabaseUserId();
    if (uid) return getSupabaseRoom(roomId);
  }
  return Promise.resolve(getLocalRoom(roomId));
}

export async function createRoom(
  userId: string,
  data: { title: string; description: string; labels: Room["labels"] },
): Promise<Room> {
  const id = generateId();
  let effectiveUserId = userId;
  if (useSupabaseStorage()) {
    const sessionUserId = await getSupabaseUserId();
    if (sessionUserId) effectiveUserId = sessionUserId;
  }
  const existing = await getRooms(effectiveUserId);
  const room: Room = {
    id,
    title: data.title,
    description: data.description,
    labels: data.labels,
    userId: effectiveUserId,
    createdAt: Date.now(),
    order: existing.length,
  };
  if (useFirestore()) {
    await setFirestoreRoom(room);
  } else if (useSupabaseStorage() && (await getSupabaseUserId())) {
    await setSupabaseRoom(room);
  } else {
    setLocalRoom(room);
  }
  return room;
}

export async function updateRoom(room: Room): Promise<void> {
  if (useFirestore()) {
    await setFirestoreRoom(room);
  } else if (useSupabaseStorage() && (await getSupabaseUserId())) {
    await setSupabaseRoom(room);
  } else {
    setLocalRoom(room);
  }
}

export async function deleteRoom(roomId: string): Promise<void> {
  if (useFirestore()) {
    await deleteFirestoreRoom(roomId);
  } else if (useSupabaseStorage() && (await getSupabaseUserId())) {
    await deleteSupabaseRoom(roomId);
  } else {
    deleteLocalRoom(roomId);
  }
}

export async function getAudios(roomId: string): Promise<AudioItem[]> {
  if (useFirestore()) return getFirestoreAudios(roomId);
  if (useSupabaseStorage()) {
    const uid = await getSupabaseUserId();
    if (uid) return getSupabaseAudios(roomId);
  }
  return Promise.resolve(getLocalAudios(roomId));
}

export async function addAudio(
  roomId: string,
  data: { name: string; sourceUrl: string; kind?: AudioKind },
): Promise<AudioItem> {
  const id = generateId();
  const existing = await getAudios(roomId);
  const order = existing.length;
  const audio: AudioItem = {
    id,
    roomId,
    name: data.name,
    sourceUrl: data.sourceUrl,
    createdAt: Date.now(),
    order,
    kind: data.kind ?? "file",
  };
  if (useFirestore()) {
    await setFirestoreAudio(audio);
    const after = await getFirestoreAudios(roomId);
    if (!after.some((a) => a.id === id)) {
      throw new Error("Audio was not saved to the database. Please try again.");
    }
  } else if (useSupabaseStorage() && (await getSupabaseUserId())) {
    await setSupabaseAudio(audio);
    const after = await getSupabaseAudios(roomId);
    if (!after.some((a) => a.id === id)) {
      throw new Error("Audio was not saved to the database. Please try again.");
    }
  } else {
    setLocalAudio(audio);
  }
  return audio;
}

export async function updateAudio(audio: AudioItem): Promise<void> {
  if (useFirestore()) {
    await setFirestoreAudio(audio);
  } else if (useSupabaseStorage() && (await getSupabaseUserId())) {
    await setSupabaseAudio(audio);
  } else {
    setLocalAudio(audio);
  }
}

export async function removeAudio(audioId: string): Promise<void> {
  if (useFirestore()) {
    await deleteFirestoreAudio(audioId);
  } else if (useSupabaseStorage() && (await getSupabaseUserId())) {
    await deleteSupabaseAudio(audioId);
  } else {
    deleteLocalAudio(audioId);
  }
}

export async function reorderAudios(
  roomId: string,
  orderedIds: string[],
): Promise<void> {
  const list = await getAudios(roomId);
  const byId = new Map(list.map((a) => [a.id, a]));
  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    const audio = byId.get(id);
    if (!audio || audio.order === index) continue;
    await updateAudio({ ...audio, order: index });
  }
}

export async function reorderRooms(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  const list = await getRooms(userId);
  const byId = new Map(list.map((r) => [r.id, r]));
  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    const room = byId.get(id);
    if (!room || room.order === index) continue;
    await updateRoom({ ...room, order: index });
  }
}
