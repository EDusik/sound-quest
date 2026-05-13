/**
 * Storage abstraction layer:
 * - Anonymous users: data is persisted in localStorage with `userId === ANONYMOUS_UID`.
 *   With Supabase, cloud-backed rows are mirrored locally with the real account `userId`.
 * - Authenticated users: data is persisted via `/api/scenes` and `/api/audios` when Supabase is configured (and Firestore is not used).
 * - Firebase/Firestore: when enabled, takes precedence over Supabase for persistence.
 * Callers use getScenes(userId), createScene(userId, ...), etc.; the layer chooses the backend
 * based on auth (getSupabaseUserId()) and configuration.
 */
import axios from "axios";
import {
  ApiError,
  createAudioApi,
  createSceneApi,
  deleteAudioApi,
  deleteSceneApi,
  fetchAudiosApi,
  fetchSceneApi,
  fetchScenesApi,
  reorderAudiosApi,
  reorderScenesApi,
  updateAudioApi,
  updateSceneApi,
} from "@/lib/api/api-client";
import type { Scene, AudioItem, AudioKind } from "@/lib/utils/types";
import { slugify, ensureUniqueSlug } from "@/lib/utils/slug";
import { isFirestoreEnabled } from "@/lib/db/firebase/firebase";
import { getFirestoreBundle } from "@/lib/db/firebase/firebase-firestore";
import { supabase, isSupabaseConfigured } from "@/lib/db/supabase/supabase";
import { ANONYMOUS_UID } from "@/lib/auth/authConstants";

const SCENES_KEY = "audio_scenes_scenes";
const AUDIOS_KEY = "audio_scenes_audios";

/** Bump if migration logic changes and must run again for the same user. */
const SUPABASE_LOCAL_MIGRATE_VERSION = "v2";

function supabaseLocalMigrateDoneKey(userId: string) {
  return `soundquest_supabase_local_migrate_${SUPABASE_LOCAL_MIGRATE_VERSION}:${userId}`;
}

const migrateLocalToSupabaseInFlight = new Map<string, Promise<void>>();

/** POST races or retries can surface as 409 or 500 + Postgres duplicate-key text. */
function isLikelyIdempotentConflict(e: unknown): boolean {
  if (!(e instanceof ApiError)) return false;
  const m = (e.message ?? "").toLowerCase();
  return (
    e.status === 409 ||
    (e.status === 500 &&
      (m.includes("duplicate key") ||
        m.includes("unique constraint") ||
        m.includes("23505")))
  );
}

/** After a swallowed scene conflict, audio create can 404 if the scene id never belonged to this user. */
function isRecoverableAudioMigrateError(e: unknown): boolean {
  if (isLikelyIdempotentConflict(e)) return true;
  return e instanceof ApiError && e.status === 404;
}

const SUPABASE_UID_CACHE_MS = 5000;
let supabaseUidCache: { userId: string | null; expires: number } | null = null;

/** Returns the Supabase session user id or null (demo / not logged in). Cached briefly; prefers local session over network getUser. */
async function getSupabaseUserId(): Promise<string | null> {
  if (typeof window === "undefined" || !supabase || !isSupabaseConfigured)
    return null;
  const now = Date.now();
  if (supabaseUidCache != null && now < supabaseUidCache.expires)
    return supabaseUidCache.userId;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  let userId = session?.user?.id ?? null;
  if (!userId) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    userId = user?.id ?? null;
  }
  supabaseUidCache = {
    userId,
    expires: now + SUPABASE_UID_CACHE_MS,
  };
  return userId;
}

/** Call on sign out to avoid serving stale user id from cache. */
export function clearSupabaseUserIdCache(): void {
  supabaseUidCache = null;
}

/** True when Supabase storage is used (not Firebase); not a React hook. */
function isSupabaseStorageEnabled(): boolean {
  return (
    typeof window !== "undefined" &&
    isSupabaseConfigured &&
    !isFirestoreEnabled()
  );
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Max size for audio uploads (25 MB). */
export const AUDIO_UPLOAD_MAX_BYTES = 25 * 1024 * 1024;

/** Allowed audio extensions (mp3 preferred, plus wav and ogg). */
export const ALLOWED_AUDIO_EXTENSIONS = [".mp3", ".wav", ".ogg"] as const;

const EXT_TO_MIME: Record<string, string> = {
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".ogg": "audio/ogg",
};

function getExtensionFromFileName(name: string): string | null {
  const lower = name.toLowerCase();
  for (const ext of ALLOWED_AUDIO_EXTENSIONS) {
    if (lower.endsWith(ext)) return ext;
  }
  return null;
}

/**
 * Returns true if the URL path (or filename) ends with an allowed audio extension.
 */
export function isAllowedAudioUrl(url: string): boolean {
  try {
    const pathname = new URL(url).pathname;
    const lower = pathname.toLowerCase();
    return ALLOWED_AUDIO_EXTENSIONS.some((ext) => lower.endsWith(ext));
  } catch {
    return false;
  }
}

/**
 * Returns the file extension if the file is allowed, otherwise null.
 */
export function getAllowedAudioExtension(file: File): string | null {
  return getExtensionFromFileName(file.name);
}

/**
 * Uploads an audio file (MP3, WAV or OGG) to Supabase Storage and returns the public URL.
 * Requires Supabase and authenticated user. File must be <= AUDIO_UPLOAD_MAX_BYTES.
 */
export async function uploadAudioFile(
  sceneId: string,
  file: File,
): Promise<string> {
  if (!supabase || !isSupabaseConfigured) {
    throw new Error("Upload is not available. Sign in with Supabase to upload files.");
  }
  const userId = await getSupabaseUserId();
  if (!userId) {
    throw new Error("You must be signed in to upload files.");
  }
  const ext = getAllowedAudioExtension(file);
  if (!ext) {
    throw new Error(
      `Invalid file type. Allowed formats: ${ALLOWED_AUDIO_EXTENSIONS.join(", ")}`,
    );
  }
  if (file.size > AUDIO_UPLOAD_MAX_BYTES) {
    throw new Error(
      `File is too large. Maximum size is ${AUDIO_UPLOAD_MAX_BYTES / 1024 / 1024} MB.`,
    );
  }
  const path = `${userId}/${sceneId}/${generateId()}${ext}`;
  const contentType = EXT_TO_MIME[ext] ?? "audio/mpeg";
  const client = supabase;

  const doUpload = () =>
    client!.storage
      .from("audios")
      .upload(path, file, { contentType, upsert: false });

  let result = await doUpload();
  if (result.error) {
    const msg = result.error.message?.toLowerCase() ?? "";
    const isBucketMissing =
      msg.includes("bucket") &&
      (msg.includes("not found") || msg.includes("does not exist"));
    if (isBucketMissing) {
      const {
        data: { session },
      } = await client!.auth.getSession();
      try {
        await axios.post("/api/ensure-audios-bucket", undefined, {
          headers:
            session?.access_token != null
              ? { Authorization: `Bearer ${session.access_token}` }
              : undefined,
        });
        result = await doUpload();
        if (!result.error) {
          const {
            data: { publicUrl },
          } = client!.storage.from("audios").getPublicUrl(path);
          return publicUrl;
        }
      } catch (err) {
        if (axios.isAxiosError(err) && err.response?.status === 401) {
          throw new Error(
            "Sessão expirada. Faça login novamente e tente o upload.",
          );
        }
      }
    }
    if (result.error) {
      if (isBucketMissing) {
        throw new Error(
          "Bucket 'audios' not found. Add NEXT_SUPABASE_SERVICE_ROLE_KEY to .env (Supabase Dashboard → Settings → API) and try again so the app can create the bucket.",
        );
      }
      throw result.error;
    }
  }
  const {
    data: { publicUrl },
  } = client!.storage.from("audios").getPublicUrl(path);
  return publicUrl;
}

function getLocalScenes(userId: string): Scene[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(SCENES_KEY);
    const all: Scene[] = raw ? JSON.parse(raw) : [];
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

function getLocalScene(sceneId: string, userId?: string): Scene | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(SCENES_KEY);
    const all: Scene[] = raw ? JSON.parse(raw) : [];
    const byId = all.find((r) => r.id === sceneId);
    if (byId) {
      if (!userId || byId.userId === userId) return byId;
    }
    if (userId) {
      const bySlug = all.find(
        (r) => r.userId === userId && r.slug === sceneId,
      );
      if (bySlug) return bySlug;
    }
    return null;
  } catch {
    return null;
  }
}

function setLocalScene(scene: Scene): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SCENES_KEY);
    const all: Scene[] = raw ? JSON.parse(raw) : [];
    const idx = all.findIndex((r) => r.id === scene.id);
    if (idx >= 0) all[idx] = scene;
    else all.push(scene);
    localStorage.setItem(SCENES_KEY, JSON.stringify(all));
  } catch {
    void 0;
  }
}

function deleteLocalScene(sceneId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SCENES_KEY);
    const all: Scene[] = raw ? JSON.parse(raw) : [];
    const next = all.filter((r) => r.id !== sceneId);
    localStorage.setItem(SCENES_KEY, JSON.stringify(next));
    const audiosRaw = localStorage.getItem(AUDIOS_KEY);
    const audios: AudioItem[] = audiosRaw ? JSON.parse(audiosRaw) : [];
    const audiosNext = audios.filter((a) => a.sceneId !== sceneId);
    localStorage.setItem(AUDIOS_KEY, JSON.stringify(audiosNext));
  } catch {
    void 0;
  }
}

function getLocalAudios(sceneId: string): AudioItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(AUDIOS_KEY);
    const all: AudioItem[] = raw ? JSON.parse(raw) : [];
    return all
      .filter((a) => a.sceneId === sceneId)
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
    void 0;
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
    void 0;
  }
}

/** Offline cache for Supabase-backed scenes: keep real `userId` so another login does not inherit this data. */
function mirrorSceneToLocal(scene: Scene): void {
  setLocalScene(scene);
}

function mirrorAudioToLocal(audio: AudioItem): void {
  setLocalAudio(audio);
}

/** Drop scenes/audios in localStorage that belong to another Supabase user (stale cache after account switch). */
function purgeLocalCachesForSupabaseSession(currentUserId: string): void {
  if (typeof window === "undefined") return;
  try {
    const scenesRaw = localStorage.getItem(SCENES_KEY);
    const allScenes: Scene[] = scenesRaw ? JSON.parse(scenesRaw) : [];
    const keptScenes = allScenes.filter(
      (s) => s.userId === ANONYMOUS_UID || s.userId === currentUserId,
    );
    const keptSceneIds = new Set(keptScenes.map((s) => s.id));
    const audiosRaw = localStorage.getItem(AUDIOS_KEY);
    const allAudios: AudioItem[] = audiosRaw ? JSON.parse(audiosRaw) : [];
    const keptAudios = allAudios.filter((a) => keptSceneIds.has(a.sceneId));
    if (
      keptScenes.length !== allScenes.length ||
      keptAudios.length !== allAudios.length
    ) {
      localStorage.setItem(SCENES_KEY, JSON.stringify(keptScenes));
      localStorage.setItem(AUDIOS_KEY, JSON.stringify(keptAudios));
    }
  } catch {
    void 0;
  }
}

function relabelAnonymousScenesInLocalStorage(toUserId: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SCENES_KEY);
    const all: Scene[] = raw ? JSON.parse(raw) : [];
    if (!all.some((s) => s.userId === ANONYMOUS_UID)) return;
    const next = all.map((s) =>
      s.userId === ANONYMOUS_UID ? { ...s, userId: toUserId } : s,
    );
    localStorage.setItem(SCENES_KEY, JSON.stringify(next));
  } catch {
    void 0;
  }
}

async function getFirestoreScenes(userId: string): Promise<Scene[]> {
  const bundle = await getFirestoreBundle();
  if (!bundle) return getLocalScenes(userId);
  const { db, mod } = bundle;
  const q = mod.query(
    mod.collection(db, "scenes"),
    mod.where("userId", "==", userId),
  );
  const snap = await mod.getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
    const order = data.order;
    return { id: d.id, ...data, createdAt, order } as Scene;
  });
  return list.sort((a, b) => {
    const aVal = a.order !== undefined ? a.order : -a.createdAt;
    const bVal = b.order !== undefined ? b.order : -b.createdAt;
    return aVal - bVal;
  });
}

async function getFirestoreScene(
  sceneId: string,
  userId?: string,
): Promise<Scene | null> {
  const bundle = await getFirestoreBundle();
  if (!bundle) return getLocalScene(sceneId, userId);
  const { db, mod } = bundle;
  const d = await mod.getDoc(mod.doc(db, "scenes", sceneId));
  if (d.exists()) {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
    return { id: d.id, ...data, createdAt } as Scene;
  }
  if (userId) {
    const list = await getFirestoreScenes(userId);
    const bySlug = list.find((s) => s.slug === sceneId);
    if (bySlug) return bySlug;
  }
  return null;
}

async function setFirestoreScene(scene: Scene): Promise<void> {
  const bundle = await getFirestoreBundle();
  if (!bundle) {
    setLocalScene(scene);
    return;
  }
  const { db, mod } = bundle;
  const { id, ...data } = scene;
  const payload: Record<string, unknown> = {
    ...data,
    createdAt: data.createdAt ?? Date.now(),
  };
  if (data.order !== undefined) payload.order = data.order;
  await mod.setDoc(mod.doc(db, "scenes", id), payload);
}

async function deleteFirestoreScene(sceneId: string): Promise<void> {
  const bundle = await getFirestoreBundle();
  if (!bundle) {
    deleteLocalScene(sceneId);
    return;
  }
  const { db, mod } = bundle;
  const audiosSnap = await mod.getDocs(
    mod.query(
      mod.collection(db, "audios"),
      mod.where("sceneId", "==", sceneId),
    ),
  );
  const batch = mod.writeBatch(db);
  for (const d of audiosSnap.docs) {
    batch.delete(d.ref);
  }
  batch.delete(mod.doc(db, "scenes", sceneId));
  await batch.commit();
}

async function getFirestoreAudios(sceneId: string): Promise<AudioItem[]> {
  const bundle = await getFirestoreBundle();
  if (!bundle) return getLocalAudios(sceneId);
  const { db, mod } = bundle;
  const q = mod.query(
    mod.collection(db, "audios"),
    mod.where("sceneId", "==", sceneId),
    mod.orderBy("createdAt", "asc"),
  );
  const snap = await mod.getDocs(q);
  const list = snap.docs.map((d) => {
    const data = d.data();
    const createdAt = data.createdAt?.toMillis?.() ?? data.createdAt ?? 0;
    const sid = data.sceneId;
    return { id: d.id, ...data, createdAt, sceneId: sid } as AudioItem;
  });
  return list.sort((a, b) => {
    const aOrder = a.order ?? a.createdAt;
    const bOrder = b.order ?? b.createdAt;
    return aOrder !== bOrder ? aOrder - bOrder : a.createdAt - b.createdAt;
  });
}

async function setFirestoreAudio(audio: AudioItem): Promise<void> {
  const bundle = await getFirestoreBundle();
  if (!bundle) {
    setLocalAudio(audio);
    return;
  }
  const { db, mod } = bundle;
  const { id, ...data } = audio;
  const payload: Record<string, unknown> = {
    ...data,
    sceneId: audio.sceneId,
    createdAt: data.createdAt ?? Date.now(),
  };
  if (data.order !== undefined) payload.order = data.order;
  await mod.setDoc(mod.doc(db, "audios", id), payload);
}

async function deleteFirestoreAudio(audioId: string): Promise<void> {
  const bundle = await getFirestoreBundle();
  if (!bundle) {
    deleteLocalAudio(audioId);
    return;
  }
  const { db, mod } = bundle;
  await mod.deleteDoc(mod.doc(db, "audios", audioId));
}

export async function getScenes(userId: string): Promise<Scene[]> {
  if (isFirestoreEnabled()) return getFirestoreScenes(userId);
  if (isSupabaseStorageEnabled()) {
    const uid = await getSupabaseUserId();
    if (uid) return fetchScenesApi();
  }
  return Promise.resolve(getLocalScenes(userId));
}

export async function getScene(
  sceneId: string,
  userId?: string,
): Promise<Scene | null> {
  // Logical user id used for local/Firestore lookups (can be anonymous/demo).
  const logicalUserId =
    userId ??
    (isSupabaseStorageEnabled() ? await getSupabaseUserId() : null) ??
    undefined;

  if (isFirestoreEnabled()) {
    return getFirestoreScene(sceneId, logicalUserId);
  }

  // For Supabase, always rely on the authenticated Supabase user id.
  // Never use the logical user id here, as it may be an anonymous/demo id
  // (e.g. "demo-user-local") which is not a valid UUID and would break
  // queries against uuid-typed columns.
  if (isSupabaseStorageEnabled()) {
    const supabaseUid = await getSupabaseUserId();
    if (supabaseUid) return fetchSceneApi(sceneId);
  }

  return Promise.resolve(getLocalScene(sceneId, logicalUserId));
}

export async function createScene(
  userId: string,
  data: { title: string; description: string; labels: Scene["labels"] },
): Promise<Scene> {
  const id = generateId();
  let effectiveUserId = userId;
  if (isSupabaseStorageEnabled()) {
    const sessionUserId = await getSupabaseUserId();
    if (sessionUserId) effectiveUserId = sessionUserId;
  }
  const existing = await getScenes(effectiveUserId);
  const existingSlugs = existing
    .map((s) => s.slug)
    .filter((x): x is string => !!x);
  const slug = ensureUniqueSlug(slugify(data.title), existingSlugs);
  const scene: Scene = {
    id,
    slug,
    title: data.title,
    description: data.description,
    labels: data.labels,
    userId: effectiveUserId,
    createdAt: Date.now(),
    order: existing.length,
  };
  if (isFirestoreEnabled()) {
    await setFirestoreScene(scene);
  } else if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    const created = await createSceneApi({
      title: data.title,
      description: data.description,
      labels: data.labels,
    });
    mirrorSceneToLocal(created);
    return created;
  } else {
    setLocalScene(scene);
  }
  return scene;
}

export async function updateScene(scene: Scene): Promise<void> {
  const existing = await getScenes(scene.userId);
  const existingSlugs = existing
    .map((s) => s.slug)
    .filter((x): x is string => !!x);
  const newSlug = ensureUniqueSlug(
    slugify(scene.title),
    existingSlugs,
    scene.slug,
  );
  const sceneWithSlug: Scene = { ...scene, slug: newSlug };
  if (isFirestoreEnabled()) {
    await setFirestoreScene(sceneWithSlug);
  } else if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    await updateSceneApi(sceneWithSlug.id, {
      title: sceneWithSlug.title,
      description: sceneWithSlug.description,
      labels: sceneWithSlug.labels,
      order: sceneWithSlug.order,
      slug: sceneWithSlug.slug,
    });
    mirrorSceneToLocal(sceneWithSlug);
  } else {
    setLocalScene(sceneWithSlug);
  }
}

export async function deleteScene(sceneId: string): Promise<void> {
  if (isFirestoreEnabled()) {
    await deleteFirestoreScene(sceneId);
  } else if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    await deleteSceneApi(sceneId);
    deleteLocalScene(sceneId);
  } else {
    deleteLocalScene(sceneId);
  }
}

export async function getAudios(sceneId: string): Promise<AudioItem[]> {
  if (isFirestoreEnabled()) return getFirestoreAudios(sceneId);
  if (isSupabaseStorageEnabled()) {
    const uid = await getSupabaseUserId();
    if (uid) return fetchAudiosApi(sceneId);
  }
  return Promise.resolve(getLocalAudios(sceneId));
}

export async function addAudio(
  sceneId: string,
  data: { name: string; sourceUrl: string; kind?: AudioKind },
): Promise<AudioItem> {
  const id = generateId();
  const existing = await getAudios(sceneId);
  const order = existing.length;
  const audio: AudioItem = {
    id,
    sceneId,
    name: data.name,
    sourceUrl: data.sourceUrl,
    createdAt: Date.now(),
    order,
    kind: data.kind ?? "file",
  };
  if (isFirestoreEnabled()) {
    await setFirestoreAudio(audio);
    const after = await getFirestoreAudios(sceneId);
    if (!after.some((a) => a.id === id)) {
      throw new Error("Audio was not saved to the database. Please try again.");
    }
  } else if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    const created = await createAudioApi(sceneId, {
      name: data.name,
      sourceUrl: data.sourceUrl,
      kind: data.kind,
    });
    const after = await fetchAudiosApi(sceneId);
    if (!after.some((a) => a.id === created.id)) {
      throw new Error("Audio was not saved to the database. Please try again.");
    }
    mirrorAudioToLocal(created);
    return created;
  } else {
    setLocalAudio(audio);
  }
  return audio;
}

export async function updateAudio(audio: AudioItem): Promise<void> {
  if (isFirestoreEnabled()) {
    await setFirestoreAudio(audio);
  } else if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    await updateAudioApi(audio.id, {
      name: audio.name,
      sourceUrl: audio.sourceUrl,
      kind: audio.kind,
      order: audio.order,
    });
    mirrorAudioToLocal(audio);
  } else {
    setLocalAudio(audio);
  }
}

export async function removeAudio(audioId: string): Promise<void> {
  if (isFirestoreEnabled()) {
    await deleteFirestoreAudio(audioId);
  } else if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    await deleteAudioApi(audioId);
    deleteLocalAudio(audioId);
  } else {
    deleteLocalAudio(audioId);
  }
}

export async function reorderAudios(
  sceneId: string,
  orderedIds: string[],
): Promise<void> {
  if (isFirestoreEnabled()) {
    const list = await getAudios(sceneId);
    const byId = new Map(list.map((a) => [a.id, a]));
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const audio = byId.get(id);
      if (!audio || audio.order === index) continue;
      await updateAudio({ ...audio, order: index });
    }
    return;
  }
  if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    await reorderAudiosApi(sceneId, orderedIds);
    return;
  }
  const list = await getAudios(sceneId);
  const byId = new Map(list.map((a) => [a.id, a]));
  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    const audio = byId.get(id);
    if (!audio || audio.order === index) continue;
    await updateAudio({ ...audio, order: index });
  }
}

export async function reorderScenes(
  userId: string,
  orderedIds: string[],
): Promise<void> {
  if (isFirestoreEnabled()) {
    const list = await getScenes(userId);
    const byId = new Map(list.map((r) => [r.id, r]));
    for (let index = 0; index < orderedIds.length; index++) {
      const id = orderedIds[index];
      const scene = byId.get(id);
      if (!scene || scene.order === index) continue;
      await updateScene({ ...scene, order: index });
    }
    return;
  }
  if (isSupabaseStorageEnabled() && (await getSupabaseUserId())) {
    await reorderScenesApi(orderedIds);
    return;
  }
  const list = await getScenes(userId);
  const byId = new Map(list.map((r) => [r.id, r]));
  for (let index = 0; index < orderedIds.length; index++) {
    const id = orderedIds[index];
    const scene = byId.get(id);
    if (!scene || scene.order === index) continue;
    await updateScene({ ...scene, order: index });
  }
}

/** Migrates guest-only localStorage scenes into Supabase for the signed-in user. */
export async function migrateLocalDataToSupabase(): Promise<void> {
  if (typeof window === "undefined") return;
  if (!isSupabaseStorageEnabled()) return;

  const toUserId = await getSupabaseUserId();
  if (!toUserId) return;

  purgeLocalCachesForSupabaseSession(toUserId);

  const doneKey = supabaseLocalMigrateDoneKey(toUserId);
  try {
    if (window.localStorage.getItem(doneKey)) return;
  } catch {
    void 0;
  }

  const existingRun = migrateLocalToSupabaseInFlight.get(toUserId);
  if (existingRun) return existingRun;

  const run = (async () => {
    let localScenes: Scene[] = [];
    let localAudios: AudioItem[] = [];

    try {
      const scenesRaw = window.localStorage.getItem(SCENES_KEY);
      localScenes = scenesRaw ? (JSON.parse(scenesRaw) as Scene[]) : [];
    } catch {
      localScenes = [];
    }

    try {
      const audiosRaw = window.localStorage.getItem(AUDIOS_KEY);
      localAudios = audiosRaw ? (JSON.parse(audiosRaw) as AudioItem[]) : [];
    } catch {
      localAudios = [];
    }

    // Only guest-created rows: never migrate another user's mirrored local cache.
    const scenesToMigrate = localScenes.filter(
      (s) => s.userId === ANONYMOUS_UID,
    );
    if (scenesToMigrate.length === 0) {
      try {
        window.localStorage.setItem(doneKey, "1");
      } catch {
        void 0;
      }
      return;
    }

    for (const scene of scenesToMigrate) {
      const sceneForSupabase: Scene = {
        ...scene,
        userId: toUserId,
      };
      let sceneIdForAudios = sceneForSupabase.id;
      try {
        await createSceneApi({
          id: sceneForSupabase.id,
          title: sceneForSupabase.title,
          description: sceneForSupabase.description,
          labels: sceneForSupabase.labels,
          slug: sceneForSupabase.slug,
          order: sceneForSupabase.order,
          createdAt: sceneForSupabase.createdAt,
        });
      } catch (e) {
        if (!isLikelyIdempotentConflict(e)) throw e;
        const remoteScenes = await fetchScenesApi();
        const mine = remoteScenes.find((s) => s.id === sceneForSupabase.id);
        if (mine) {
          sceneIdForAudios = mine.id;
        } else {
          const created = await createSceneApi({
            title: sceneForSupabase.title,
            description: sceneForSupabase.description,
            labels: sceneForSupabase.labels,
            slug: sceneForSupabase.slug,
            order: sceneForSupabase.order,
            createdAt: sceneForSupabase.createdAt,
          });
          sceneIdForAudios = created.id;
        }
      }

      const audiosForScene = localAudios.filter(
        (audio) => audio.sceneId === scene.id,
      );
      for (const audio of audiosForScene) {
        const audioForSupabase: AudioItem = {
          ...audio,
          sceneId: sceneIdForAudios,
        };
        try {
          await createAudioApi(sceneIdForAudios, {
            id: audioForSupabase.id,
            name: audioForSupabase.name,
            sourceUrl: audioForSupabase.sourceUrl,
            kind: audioForSupabase.kind,
            createdAt: audioForSupabase.createdAt,
            order: audioForSupabase.order,
          });
        } catch (e) {
          if (!isRecoverableAudioMigrateError(e)) throw e;
        }
      }
    }

    relabelAnonymousScenesInLocalStorage(toUserId);

    try {
      window.localStorage.setItem(doneKey, "1");
    } catch {
      void 0;
    }
  })();

  migrateLocalToSupabaseInFlight.set(toUserId, run);
  run.finally(() => migrateLocalToSupabaseInFlight.delete(toUserId));

  return run;
}
