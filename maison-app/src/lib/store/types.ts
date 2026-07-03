import type { SuggestionType } from "../classify";

export type { SuggestionType };

export type ViewName =
  | "studio"
  | "calendar"
  | "collections"
  | "path"
  | "journal"
  | "runway"
  | "dna"
  | "materials";

export type MoodKey = "flowing" | "calm" | "stressed" | "grounded" | "tired";

export interface Subtask {
  id: string;
  text: string;
  done: boolean;
}

export interface Task {
  id: string;
  idx: string;
  text: string;
  done: boolean;
  estimatedMinutes?: number;
  subtasks?: Subtask[];
}

export interface JournalDay {
  date: string; // YYYY-MM-DD
  mood: MoodKey | null;
  reflection: string;
}

export interface AiNote {
  id: string;
  type: SuggestionType;
  content: string;
  createdAt: number;
}

export interface PendingSuggestion {
  type: SuggestionType;
  content: string;
  rawInput: string;
}

export interface Material {
  id: string;
  name: string;
  supplier: string;
  costNote: string;
  sampleNote: string;
  colorTag: string; // hex or css color, used as the swatch
  imageUrl?: string; // real fabric photo, when uploaded — falls back to colorTag dot
  createdAt: number;
  linkedCollectionIds?: string[]; // which projects this fabric is used in
}

export interface IterationEntry {
  id: string;
  collectionId: string;
  whatDidntWork: string;
  why: string;
  createdAt: number;
}

export interface ProjectImage {
  id: string;
  dataUrl: string;
  insight?: string; // AI's read on the photo, once analyzed
  createdAt: number;
}

export interface CollectionFolder {
  id: string;
  name: string;
  status: string;
  accent: string;
  count: number;
  sub: string;
  images?: ProjectImage[]; // moodboard / manipulation / reference photos
}

export interface CalendarEvent {
  id: string;
  day: number;
  month: number; // 0-indexed, matches Date.getMonth()
  year: number;
  text: string;
}

export interface RunwayPhoto {
  id: string;
  dataUrl: string;
  designer: string;
  season: string;
  createdAt: number;
}

export const MOOD_ENERGY: Record<MoodKey, string> = {
  flowing: "Flowing",
  calm: "Calm",
  grounded: "Grounded",
  tired: "Low",
  stressed: "Tense",
};
