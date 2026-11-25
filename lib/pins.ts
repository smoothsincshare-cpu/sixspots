// All data access lives here. Local mode = localStorage, Supabase mode = shared database.
import { SEED_PINS } from "./seed";
import { supabase, supabaseEnabled } from "./supabase";
import type { Category, Pin } from "./types";

export type NewPin = { title: string; category: Category; note: string; x: number; y: number };
export type Votes = Record<string, 1 | -1>;

const K_PINS = "sixspots.pins";
const K_VOTES = "sixspots.votes";
const K_SEEDED = "sixspots.seededAt";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

function seededAt(): number {
  let t = read<number>(K_SEEDED, 0);
  if (!t) {
    t = Date.now();
    write(K_SEEDED, t);
  }
  return t;
}

function seedPins(): Pin[] {
  const t = seededAt();
  return SEED_PINS.map((s) => ({
    id: s.id,
    title: s.title,
    category: s.category,
    note: s.note,
    x: s.x,
    y: s.y,
    createdAt: new Date(t - s.minutesAgo * 60_000).toISOString(),
    score: s.score,
    image: s.image ?? null,
    subtitle: s.subtitle ?? null,
    details: s.details ?? null,
  }));
}

type Row = {
  id: string; title: string; category: Category; note: string | null; x: number; y: number; created_at: string; score: number | null;
  image_url?: string | null; subtitle?: string | null; details?: [string, string][] | null;
};
const fromRow = (r: Row): Pin => ({
  id: r.id, title: r.title, category: r.category, note: r.note, x: r.x, y: r.y, createdAt: r.created_at, score: r.score ?? 0,
  image: r.image_url ?? null, subtitle: r.subtitle ?? null, details: r.details ?? null,
});

export async function listPins(): Promise<Pin[]> {
  if (supabaseEnabled) {
    const { data, error } = await supabase().from("pin_scores").select("*").order("created_at", { ascending: false });
    if (error) throw error;
    return (data as Row[]).map(fromRow);
  }
  const votes = read<Votes>(K_VOTES, {});
  const mine = read<Pin[]>(K_PINS, []);
  return [...mine, ...seedPins()].map((p) => ({ ...p, score: p.score + (votes[p.id] ?? 0) }));
}

// Voting needs no sign-in: each browser gets a random voter id, one vote per pin per browser.
const K_VOTER = "sixspots.voterId";
function voterId(): string {
  let id = read<string>(K_VOTER, "");
  if (!id) {
    id = crypto.randomUUID();
    write(K_VOTER, id);
  }
  return id;
}

export async function getMyVotes(): Promise<Votes> {
  if (supabaseEnabled) {
    const { data, error } = await supabase().rpc("my_votes", { p_voter: voterId() });
    if (error) throw error;
    return Object.fromEntries(((data ?? []) as { pin_id: string; value: 1 | -1 }[]).map((v) => [v.pin_id, v.value]));
  }
  return read<Votes>(K_VOTES, {});
}

export async function addPin(p: NewPin): Promise<Pin> {
  const clean = { title: p.title.trim().slice(0, 60), category: p.category, note: p.note.trim().slice(0, 280) || null, x: Math.round(p.x), y: Math.round(p.y) };
  if (supabaseEnabled) {
    const { data, error } = await supabase().from("pins").insert(clean).select().single();
    if (error) throw error;
    return fromRow({ ...(data as Row), score: 0 });
  }
  const pin: Pin = { id: crypto.randomUUID(), ...clean, createdAt: new Date().toISOString(), score: 0 };
  write(K_PINS, [pin, ...read<Pin[]>(K_PINS, [])]);
  return pin;
}

// value 0 removes the vote. One vote per pin per browser, no sign-in needed.
export async function setVote(pinId: string, value: 1 | -1 | 0): Promise<void> {
  if (supabaseEnabled) {
    const { error } = await supabase().rpc("cast_vote", { p_pin: pinId, p_voter: voterId(), p_value: value });
    if (error) throw error;
    return;
  }
  const votes = read<Votes>(K_VOTES, {});
  if (value === 0) delete votes[pinId];
  else votes[pinId] = value;
  write(K_VOTES, votes);
}

// Used on the server for link previews (Open Graph).
export async function getPinTitle(id: string): Promise<string | null> {
  const seed = SEED_PINS.find((s) => s.id === id);
  if (seed) return seed.title;
  if (!supabaseEnabled) return null;
  const { data } = await supabase().from("pins").select("title").eq("id", id).maybeSingle();
  return (data as { title: string } | null)?.title ?? null;
}
