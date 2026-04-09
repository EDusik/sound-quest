import { create } from "zustand";
import type { ActivePlayer, PlaybackState, YouTubeControl } from "@/shared/lib/types";

interface AudioStore {
  players: Map<string, ActivePlayer>;
  register: (payload: {
    id: string;
    audioId: string;
    sceneId: string;
    name: string;
    sourceUrl: string;
    ref?: HTMLAudioElement | null;
    youtubeControl?: YouTubeControl | null;
  }) => void;
  unregister: (id: string) => void;
  setState: (id: string, state: PlaybackState) => void;
  setRef: (id: string, ref: HTMLAudioElement | null) => void;
  setYoutubeControl: (id: string, control: YouTubeControl | null) => void;
  setVolume: (id: string, volume: number) => void;
  setLoop: (id: string, loop: boolean) => void;
  setTime: (id: string, currentTime: number, duration: number) => void;
  getPlayingCount: () => number;
  getPlayingList: () => ActivePlayer[];
  stopAll: () => void;
}

export const useAudioStore = create<AudioStore>((set, get) => ({
  players: new Map(),

  register: (payload) => {
    set((s) => {
      const next = new Map(s.players);
      next.set(payload.id, {
        id: payload.id,
        audioId: payload.audioId,
        sceneId: payload.sceneId,
        name: payload.name,
        sourceUrl: payload.sourceUrl,
        state: "idle",
        volume: 1,
        loop: false,
        ref: payload.ref ?? null,
        youtubeControl: payload.youtubeControl ?? null,
      });
      return { players: next };
    });
  },

  unregister: (id) => {
    set((s) => {
      const next = new Map(s.players);
      next.delete(id);
      return { players: next };
    });
  },

  setState: (id, state) => {
    set((s) => {
      const p = s.players.get(id);
      if (!p) return s;
      const next = new Map(s.players);
      next.set(id, { ...p, state });
      return { players: next };
    });
  },

  setRef: (id, ref) => {
    set((s) => {
      const p = s.players.get(id);
      if (!p || p.ref === ref) return s;
      const next = new Map(s.players);
      next.set(id, { ...p, ref });
      return { players: next };
    });
  },

  setYoutubeControl: (id, control) => {
    set((s) => {
      const p = s.players.get(id);
      if (!p) return s;
      const next = new Map(s.players);
      next.set(id, { ...p, youtubeControl: control });
      return { players: next };
    });
  },

  setVolume: (id, volume) => {
    set((s) => {
      const p = s.players.get(id);
      if (!p) return s;
      const next = new Map(s.players);
      next.set(id, { ...p, volume });
      return { players: next };
    });
  },

  setLoop: (id, loop) => {
    set((s) => {
      const p = s.players.get(id);
      if (!p) return s;
      const next = new Map(s.players);
      next.set(id, { ...p, loop });
      return { players: next };
    });
  },

  setTime: (id, currentTime, duration) => {
    set((s) => {
      const p = s.players.get(id);
      if (!p) return s;
      const next = new Map(s.players);
      next.set(id, { ...p, currentTime, duration });
      return { players: next };
    });
  },

  getPlayingCount: () => {
    let n = 0;
    for (const p of get().players.values()) {
      if (p.state === "playing") n++;
    }
    return n;
  },

  getPlayingList: () => {
    return Array.from(get().players.values()).filter((p) => p.state === "playing");
  },

  stopAll: () => {
    const { players, setState } = get();
    for (const p of players.values()) {
      if (p.ref) {
        p.ref.pause();
        p.ref.currentTime = 0;
      } else if (p.youtubeControl) {
        p.youtubeControl.stop();
      }
      setState(p.id, "stopped");
    }
  },
}));

