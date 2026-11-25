import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import AppShell from "@/components/AppShell";
import { getPinTitle } from "@/lib/pins";

// Every pin link gets its own preview title on Reddit and Discord.
export async function generateMetadata({ searchParams }: PageProps<"/">): Promise<Metadata> {
  const pin = (await searchParams).pin;
  const id = typeof pin === "string" ? pin : null;
  const title = id ? await getPinTitle(id).catch(() => null) : null;
  if (!title) return {};
  return {
    title: `${title} - SixSpots`,
    description: "SixSpots - unofficial GTA 6 fan map",
    openGraph: { title, description: "SixSpots - unofficial GTA 6 fan map", url: `/?pin=${id}` },
    twitter: { title, description: "SixSpots - unofficial GTA 6 fan map" },
  };
}

// Pin links are per-request (?pin=), so the page renders at request time.
async function Dynamic() {
  await connection();
  return null;
}

export default function Page() {
  return (
    <>
      <Suspense>
        <Dynamic />
      </Suspense>
      <AppShell />
    </>
  );
}
