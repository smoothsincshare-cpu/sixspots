export const CATEGORIES = ["Hidden Car", "Side Mission", "Collectible", "Weapon", "Easter Egg"] as const;
export type Category = (typeof CATEGORIES)[number];

export const CATEGORY_COLORS: Record<Category, string> = {
  "Hidden Car": "#FF3D8B",
  "Side Mission": "#00E5C7",
  Collectible: "#FFC23D",
  Weapon: "#FF7A3D",
  "Easter Egg": "#9B7BFF",
};

export type Pin = {
  id: string;
  title: string;
  category: Category;
  note: string | null;
  x: number; // 0..MAP_W, left to right on the map
  y: number; // 0..MAP_H, top to bottom on the map
  createdAt: string;
  score: number;
  image?: string | null; // photo shown at the top of the pin card
  subtitle?: string | null; // e.g. "Standout Vehicle", "Stunt Jump"
  details?: [string, string][] | null; // label/value rows, e.g. ["Sell Value", "$1,730"]
};

// Map units = pixels of the original 1332x2000 map (public/map.webp is a 2x sharper copy).
export const MAP_W = 1332;
export const MAP_H = 2000;
export const VERIFIED_AT = 5;
export const HIDE_BELOW = -3;
