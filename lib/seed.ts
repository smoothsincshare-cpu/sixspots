import type { Category } from "./types";

// 14 demo pins so the map never looks empty. minutesAgo is turned into a timestamp when loaded.
// x/y are pixels on the 1332x2000 map. Pins with image/details show a photo card.
export const SEED_PINS: {
  id: string;
  title: string;
  category: Category;
  note: string;
  x: number;
  y: number;
  minutesAgo: number;
  score: number;
  image?: string;
  subtitle?: string;
  details?: [string, string][];
}[] = [
  {
    id: "seed-13", title: "Vapid Smush! Ganado", category: "Hidden Car", subtitle: "Standout Vehicle",
    note: "Next to the juice sign in front of the abandoned Smush! Fresh Juice stand, on the highway between Fort Myers and Miami.",
    image: "/pins/vapid-smush-ganado.webp", x: 430, y: 1290, minutesAgo: 50, score: 6,
    details: [["Access", "Unlocked"], ["Security", "None"], ["Tracker", "None"], ["Sell Value", "$1,730"], ["Type", "Muscle"], ["Era", "1970s Antique"], ["Seats", "2"], ["Storage", "6"], ["Body Condition", "Poor"], ["Specialist", "Muscle"]],
  },
  {
    id: "seed-14", title: "Kalaga River Stunt Jump", category: "Side Mission", subtitle: "Stunt Jump",
    note: "On a dirt mound on the side of the lake road, just off the highway north of Lake Okeechobee.",
    image: "/pins/kalaga-river-stunt-jump.webp", x: 600, y: 470, minutesAgo: 110, score: 5,
    details: [["Challenge", "Land a front flip"]],
  },
  { id: "seed-01", title: "Rooftop garage sports car", category: "Hidden Car", note: "Top floor of the parking garage by the beach. Climb the ramp at night.", x: 1140, y: 1260, minutesAgo: 180, score: 4 },
  { id: "seed-02", title: "Muscle car behind the diner", category: "Hidden Car", note: "Under a tarp behind the roadside diner off the highway.", x: 240, y: 720, minutesAgo: 300, score: 7 },
  { id: "seed-03", title: "Dune buggy in the swamp shack", category: "Hidden Car", note: "Inside the shack on stilts. Take the airboat in.", x: 530, y: 1150, minutesAgo: 95, score: 2 },
  { id: "seed-04", title: "Police cruiser at the airport hangar", category: "Hidden Car", note: "Hangar door opens after the second story mission.", x: 650, y: 1230, minutesAgo: 40, score: 6 },
  { id: "seed-05", title: "Classic convertible at the lake house", category: "Hidden Car", note: "Garage on the north shore of the lake.", x: 690, y: 515, minutesAgo: 220, score: 3 },
  { id: "seed-06", title: "Speedboat under the island bridge", category: "Hidden Car", note: "Tied up under the bridge on the island side.", x: 1000, y: 1390, minutesAgo: 15, score: 1 },
  { id: "seed-07", title: "Street race meetup", category: "Side Mission", note: "Shows up on Friday nights in the city.", x: 1080, y: 880, minutesAgo: 260, score: 9 },
  { id: "seed-08", title: "Airboat smuggling run", category: "Side Mission", note: "Talk to the guy on the dock at the swamp edge.", x: 450, y: 1050, minutesAgo: 130, score: 3 },
  { id: "seed-09", title: "Rooftop photo job", category: "Side Mission", note: "Phone call after you reach the tallest towers downtown.", x: 800, y: 1350, minutesAgo: 60, score: 2 },
  { id: "seed-10", title: "Gold coin in the lighthouse", category: "Collectible", note: "Top of the lighthouse at the southern tip of the keys.", x: 130, y: 1890, minutesAgo: 340, score: 5 },
  { id: "seed-11", title: "Alien figurine on the hill", category: "Collectible", note: "Behind the launch tower out at the cape.", x: 1020, y: 150, minutesAgo: 25, score: -1 },
  { id: "seed-12", title: "Signal jammer on the water tower", category: "Collectible", note: "Climb the ladder on the tower by the highway.", x: 680, y: 270, minutesAgo: 75, score: 4 },
];
