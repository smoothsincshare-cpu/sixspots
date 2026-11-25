"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { User } from "@supabase/supabase-js";
import AdSlot from "./AdSlot";
import { DropPanel, GoogleButton, PinCard, SignInModal } from "./Panels";
import { addPin, getMyVotes, listPins, setVote, type Votes } from "@/lib/pins";
import { supabase, supabaseEnabled } from "@/lib/supabase";
import { CATEGORIES, CATEGORY_COLORS, HIDE_BELOW, type Category, type Pin } from "@/lib/types";

const MapView = dynamic(() => import("./MapView"), { ssr: false, loading: () => <div className="h-full w-full bg-[#1761ad]" /> });

export function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 34 34" aria-hidden>
        <rect width="34" height="34" rx="10" fill="#141B2E" />
        <path d="M17 28s8-8.6 8-14.3A8 8 0 0 0 9 13.7C9 19.4 17 28 17 28z" fill="#FF3D8B" />
        <circle cx="17" cy="13.7" r="3.2" fill="#00E5C7" />
      </svg>
      <div className="leading-none">
        <div className="text-[19px] font-extrabold tracking-tight text-white">
          Six<span className="text-[#00E5C7]">Spots</span>
        </div>
        <div className="mt-1 text-[11px] font-medium text-white/50">Unofficial GTA 6 fan map</div>
      </div>
    </div>
  );
}

export default function AppShell() {
  const [pins, setPins] = useState<Pin[]>([]);
  const [votes, setVotes] = useState<Votes>({});
  const [filter, setFilter] = useState<Category | "All">("All");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null);
  const [focus, setFocus] = useState<{ pin: Pin | null; nonce: number }>({ pin: null, nonce: 0 });
  const [user, setUser] = useState<User | null>(null);
  const [askSignIn, setAskSignIn] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((t: string) => {
    setToast(t);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [p, v] = await Promise.all([listPins(), getMyVotes()]);
      setPins(p);
      setVotes(v);
      return p;
    } catch (e) {
      console.error(e);
      showToast("Couldn't load pins");
      return [];
    }
  }, [showToast]);

  // first load + open ?pin=<id>
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- load data once on mount
    refresh().then((p) => {
      const id = new URLSearchParams(location.search).get("pin");
      const pin = id ? p.find((x) => x.id === id) : null;
      if (pin) {
        setSelectedId(pin.id);
        setTimeout(() => setFocus({ pin, nonce: Date.now() }), 250);
      }
    });
  }, [refresh]);

  // auth
  useEffect(() => {
    if (!supabaseEnabled) return;
    const db = supabase();
    db.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data } = db.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
      getMyVotes().then(setVotes).catch(() => {});
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = () => {
    if (!supabaseEnabled) return;
    supabase().auth.signInWithOAuth({ provider: "google", options: { redirectTo: location.href } });
  };
  const signOut = async () => {
    setMenuOpen(false);
    await supabase().auth.signOut();
  };
  const needsAuth = supabaseEnabled && !user;

  // keep the URL in sync with the open pin so every pin has its own link
  const select = (id: string | null) => {
    setSelectedId(id);
    setDraft(null);
    const u = new URL(location.href);
    if (id) u.searchParams.set("pin", id);
    else u.searchParams.delete("pin");
    history.replaceState(null, "", u);
  };

  const visible = useMemo(() => pins.filter((p) => p.score >= HIDE_BELOW && (filter === "All" || p.category === filter)), [pins, filter]);
  const selected = pins.find((p) => p.id === selectedId) ?? null;

  // voting is open to everyone (one vote per pin per browser); only dropping pins needs Google sign-in
  const vote = async (pin: Pin, v: 1 | -1) => {
    const prev = votes[pin.id] ?? 0;
    const next: 1 | -1 | 0 = prev === v ? 0 : v;
    // optimistic update
    setVotes((o) => {
      const n = { ...o };
      if (next === 0) delete n[pin.id];
      else n[pin.id] = next;
      return n;
    });
    setPins((ps) => ps.map((p) => (p.id === pin.id ? { ...p, score: p.score - prev + next } : p)));
    try {
      await setVote(pin.id, next);
    } catch (e) {
      console.error(e);
      showToast("Vote failed");
      refresh();
    }
  };

  const onDrop = (x: number, y: number) => {
    if (needsAuth) return setAskSignIn(true);
    select(null);
    setDraft({ x, y });
  };

  return (
    <div className="flex h-dvh flex-col bg-[#0B1020] text-[#F5F7FF]">
      <header className="relative z-[1100] flex flex-wrap items-center gap-x-6 gap-y-3 border-b border-white/10 bg-[#0B1020]/95 px-4 py-3 sm:px-6">
        <Logo />
        <nav className="order-3 -mx-1 flex w-full [scrollbar-width:none] [&::-webkit-scrollbar]:hidden gap-2 overflow-x-auto px-1 pb-0.5 sm:order-none sm:w-auto sm:flex-1">
          {(["All", ...CATEGORIES] as const).map((c) => {
            const on = filter === c;
            const color = c === "All" ? "#F5F7FF" : CATEGORY_COLORS[c];
            return (
              <button
                key={c}
                onClick={() => setFilter(c)}
                className="flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition"
                style={on ? { background: color, borderColor: color, color: "#0B1020" } : { borderColor: "rgba(255,255,255,.14)", color: "rgba(255,255,255,.8)" }}
              >
                {c !== "All" && <i className="h-2 w-2 rounded-full" style={{ background: on ? "#0B1020" : color }} />}
                {c}
              </button>
            );
          })}
        </nav>
        <div className="ml-auto sm:ml-0">
          {supabaseEnabled &&
            (user ? (
              <div className="relative">
                <button onClick={() => setMenuOpen((m) => !m)} className="block rounded-full ring-2 ring-[#00E5C7]/70 transition hover:ring-[#00E5C7]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={user.user_metadata?.avatar_url ?? ""} alt="Your account" referrerPolicy="no-referrer" className="h-9 w-9 rounded-full bg-white/10 object-cover" />
                </button>
                {menuOpen && (
                  <div className="menu-pop absolute right-0 top-full mt-2 w-40 overflow-hidden rounded-xl border border-white/10 bg-[#1b2440] py-1 shadow-2xl">
                    <button onClick={signOut} className="w-full px-4 py-2.5 text-left text-sm font-medium hover:bg-white/10">Sign out</button>
                  </div>
                )}
              </div>
            ) : (
              <GoogleButton onClick={signIn} />
            ))}
        </div>
      </header>

      <main className="relative flex-1 overflow-hidden">
        <MapView
          pins={visible}
          selectedId={selectedId}
          draft={draft}
          focus={focus}
          onSelect={(id) => select(id)}
          onDrop={onDrop}
          onBackground={() => {
            if (selectedId) select(null);
          }}
        />
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-[1000] flex justify-end sm:inset-x-auto sm:bottom-auto sm:right-5 sm:top-5">
          {draft ? (
            <DropPanel
              onCancel={() => setDraft(null)}
              onSave={async (v) => {
                try {
                  const pin = await addPin({ ...v, ...draft });
                  setPins((ps) => [pin, ...ps]);
                  setDraft(null);
                  setFilter((f) => (f === "All" || f === pin.category ? f : "All"));
                  showToast("Pin dropped");
                } catch (e) {
                  console.error(e);
                  showToast("Couldn't save the pin");
                }
              }}
            />
          ) : selected ? (
            <PinCard key={selected.id} pin={selected} myVote={votes[selected.id] ?? 0} onVote={(v) => vote(selected, v)} onClose={() => select(null)} onToast={showToast} />
          ) : null}
        </div>
        {!draft && !selected && (
          <div className="pointer-events-none absolute bottom-4 left-1/2 z-[900] hidden -translate-x-1/2 rounded-full bg-[#141B2E]/90 px-4 py-2 text-xs font-medium text-white/60 sm:block">
            Right-click anywhere on the map to drop a pin
          </div>
        )}
        {toast && (
          <div className="toast-pop absolute left-1/2 top-4 z-[1200] -translate-x-1/2 rounded-full bg-[#00E5C7] px-4 py-2 text-sm font-bold text-[#0B1020] shadow-xl">{toast}</div>
        )}
      </main>

      <div className="flex justify-center bg-[#0B1020] px-3 empty:hidden [&:has(>*)]:py-2">
        <AdSlot variant="banner" />
      </div>
      <footer className="border-t border-white/10 bg-[#0B1020] px-4 py-2.5 text-center text-[11px] text-white/45">
        SixSpots is a fan project. Not affiliated with or endorsed by Rockstar Games.
      </footer>

      {askSignIn && <SignInModal onSignIn={signIn} onClose={() => setAskSignIn(false)} />}
    </div>
  );
}
