"use client";

import { useEffect, useRef, useState } from "react";
import AdSlot from "./AdSlot";
import { CATEGORIES, CATEGORY_COLORS, VERIFIED_AT, type Category, type Pin } from "@/lib/types";

export function timeAgo(iso: string) {
  const s = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (s < 60) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m} minute${m === 1 ? "" : "s"} ago`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h} hour${h === 1 ? "" : "s"} ago`;
  const d = Math.round(h / 24);
  return `${d} day${d === 1 ? "" : "s"} ago`;
}

export function CategoryTag({ category }: { category: Category }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold" style={{ background: CATEGORY_COLORS[category] + "22", color: CATEGORY_COLORS[category] }}>
      <i className="h-2 w-2 rounded-full" style={{ background: CATEGORY_COLORS[category] }} />
      {category}
    </span>
  );
}

const panel = "pointer-events-auto rounded-2xl border border-white/10 bg-[#141B2E]/95 shadow-[0_24px_60px_rgba(0,0,0,.55)] backdrop-blur";

export function PinCard(props: {
  pin: Pin;
  myVote: 1 | -1 | 0;
  onVote: (v: 1 | -1) => void;
  onClose: () => void;
  onToast: (t: string) => void;
}) {
  const { pin, myVote, onVote, onClose, onToast } = props;
  const [menu, setMenu] = useState(false);
  const verified = pin.score >= VERIFIED_AT;
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setMenu(false);
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, []);

  const url = typeof window === "undefined" ? "" : `${location.origin}/?pin=${pin.id}`;
  const copy = async (text: string, msg: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      const t = document.createElement("textarea");
      t.value = text;
      document.body.appendChild(t);
      t.select();
      document.execCommand("copy");
      t.remove();
    }
    setMenu(false);
    onToast(msg);
  };
  const canNativeShare = typeof navigator !== "undefined" && "share" in navigator && typeof matchMedia !== "undefined" && matchMedia("(pointer: coarse)").matches;

  const closeIcon = <svg width="18" height="18" viewBox="0 0 24 24"><path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" /></svg>;
  const color = CATEGORY_COLORS[pin.category];

  return (
    <div className={`${panel} [scrollbar-width:none] [&::-webkit-scrollbar]:hidden max-h-[calc(100dvh-150px)] w-full overflow-y-auto sm:w-[380px] ${pin.image ? "" : "p-5"}`}>
      {pin.image && (
        <div className="relative">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={pin.image} alt={pin.title} className="block aspect-[16/9] w-full rounded-t-2xl object-cover" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-[#141B2E] to-transparent" />
          <button onClick={onClose} aria-label="Close" className="absolute right-2.5 top-2.5 rounded-full bg-black/45 p-1.5 text-white backdrop-blur hover:bg-black/65">
            {closeIcon}
          </button>
          <div className="absolute bottom-2.5 left-4"><CategoryTag category={pin.category} /></div>
        </div>
      )}
      <div className={pin.image ? "px-5 pb-5 pt-3" : ""}>
      {!pin.image && (
        <div className="flex items-start justify-between gap-3">
          <CategoryTag category={pin.category} />
          <button onClick={onClose} aria-label="Close" className="-mr-1 -mt-1 rounded-full p-1.5 text-white/50 hover:bg-white/10 hover:text-white">
            {closeIcon}
          </button>
        </div>
      )}
      <h2 className={`${pin.image ? "mt-1" : "mt-3"} flex items-center gap-2 text-xl font-bold leading-tight text-white`}>
        {pin.title}
        <svg width="16" height="16" viewBox="0 0 24 24" className="shrink-0 text-white/50"><path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
      </h2>
      {pin.subtitle && <p className="mt-1.5 text-xs font-extrabold uppercase tracking-wider" style={{ color }}>{pin.subtitle}</p>}
      {verified && (
        <div className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-[#00E5C7]/15 px-2.5 py-1 text-xs font-bold text-[#00E5C7] badge-pop">
          <svg width="14" height="14" viewBox="0 0 24 24"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" /></svg>
          Verified by players
        </div>
      )}
      {pin.note &&
        (pin.details?.length ? (
          <p className="mt-3 text-[15px] leading-snug text-white/75">
            <b className="font-bold text-white">Location: </b>
            {pin.note}
          </p>
        ) : (
          <p className="mt-3 text-[15px] leading-snug text-white/75">{pin.note}</p>
        ))}
      {!!pin.details?.length && (
        <dl className="mt-3 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 rounded-xl bg-white/[.04] px-3.5 py-3 text-[14px]">
          {pin.details.map(([k, v]) => (
            <div key={k} className="contents">
              <dt className="font-bold text-white">{k}:</dt>
              <dd className="text-white/75">{v}</dd>
            </div>
          ))}
        </dl>
      )}
      <p className="mt-3 text-xs text-white/45">Posted {timeAgo(pin.createdAt)}</p>

      <div className="mt-4 flex items-center gap-2">
        <div className="flex items-center rounded-full bg-white/5 p-1">
          <button onClick={() => onVote(1)} aria-label="Vote up" className={`grid h-9 w-9 place-items-center rounded-full transition ${myVote === 1 ? "bg-[#00E5C7] text-[#0B1020]" : "text-white/70 hover:bg-white/10"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 5l7 9h-4.5v5h-5v-5H5z" fill="currentColor" /></svg>
          </button>
          <span key={pin.score} className="score-bump min-w-9 text-center text-lg font-bold tabular-nums text-white">{pin.score}</span>
          <button onClick={() => onVote(-1)} aria-label="Vote down" className={`grid h-9 w-9 place-items-center rounded-full transition ${myVote === -1 ? "bg-[#FF3D8B] text-white" : "text-white/70 hover:bg-white/10"}`}>
            <svg width="18" height="18" viewBox="0 0 24 24"><path d="M12 19l-7-9h4.5V5h5v5H19z" fill="currentColor" /></svg>
          </button>
        </div>

        <div className="relative ml-auto" ref={menuRef}>
          <button onClick={() => setMenu((m) => !m)} className="flex items-center gap-2 rounded-full bg-[#00E5C7] px-4 py-2.5 text-sm font-bold text-[#0B1020] transition hover:brightness-110 active:scale-95">
            <svg width="16" height="16" viewBox="0 0 24 24"><path d="M12 3v12M7 8l5-5 5 5M5 13v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
            Share
          </button>
          {menu && (
            <div className="menu-pop absolute bottom-full right-0 z-10 mb-2 w-56 overflow-hidden rounded-xl border border-white/10 bg-[#1b2440] py-1 shadow-2xl">
              <MenuItem onClick={() => copy(url, "Link copied")} icon="link">Copy link</MenuItem>
              <MenuItem
                onClick={() => {
                  setMenu(false);
                  window.open(`https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(`${pin.title} on SixSpots`)}`, "_blank", "noopener");
                }}
                icon="reddit"
              >
                Share to Reddit
              </MenuItem>
              <MenuItem onClick={() => copy(`${pin.title} → ${url}`, "Copied for Discord")} icon="discord">Copy for Discord</MenuItem>
              {canNativeShare && (
                <MenuItem
                  onClick={() => {
                    setMenu(false);
                    navigator.share({ title: pin.title, text: `${pin.title} on SixSpots`, url }).catch(() => {});
                  }}
                  icon="more"
                >
                  More…
                </MenuItem>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 empty:hidden">
        <AdSlot variant="box" />
      </div>
      </div>
    </div>
  );
}

function MenuItem({ children, onClick, icon }: { children: React.ReactNode; onClick: () => void; icon: "link" | "reddit" | "discord" | "more" }) {
  const icons = {
    link: <path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />,
    reddit: <><circle cx="12" cy="13.5" r="6.5" fill="#FF4500" /><circle cx="9.6" cy="13" r="1.1" fill="#fff" /><circle cx="14.4" cy="13" r="1.1" fill="#fff" /><path d="M9.5 15.8c1.5 1 3.5 1 5 0" stroke="#fff" strokeWidth="1.2" fill="none" strokeLinecap="round" /><circle cx="16.5" cy="5.5" r="1.4" fill="#FF4500" /></>,
    discord: <path d="M7 7.5c3.3-1.3 6.7-1.3 10 0 1.6 2.4 2.3 5 2.1 8-1.4 1-2.8 1.7-4.2 2.1l-.9-1.5M7 7.5C5.4 9.9 4.7 12.5 4.9 15.5c1.4 1 2.8 1.7 4.2 2.1l.9-1.5M8.5 15c2.3 1 4.7 1 7 0M9.6 12.4h.01M14.4 12.4h.01" fill="none" stroke="#5865F2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />,
    more: <path d="M6 12h.01M12 12h.01M18 12h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />,
  };
  return (
    <button onClick={onClick} className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left text-sm font-medium text-white/90 hover:bg-white/10">
      <svg width="20" height="20" viewBox="0 0 24 24" className="shrink-0">{icons[icon]}</svg>
      {children}
    </button>
  );
}

export function DropPanel({ onSave, onCancel }: { onSave: (v: { title: string; category: Category; note: string }) => Promise<void>; onCancel: () => void }) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("Hidden Car");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const titleRef = useRef<HTMLInputElement>(null);
  useEffect(() => titleRef.current?.focus(), []);

  return (
    <form
      className={`${panel} w-full p-5 sm:w-[370px]`}
      onSubmit={async (e) => {
        e.preventDefault();
        if (!title.trim() || busy) return;
        setBusy(true);
        try {
          await onSave({ title, category, note });
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="text-lg font-bold text-white">Drop a pin</h2>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/50">Title</label>
      <input ref={titleRef} value={title} onChange={(e) => setTitle(e.target.value)} maxLength={60} placeholder="What did you find?" className="mt-1.5 w-full rounded-xl border border-white/10 bg-[#0B1020] px-3.5 py-2.5 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-[#00E5C7]" />
      <div className="mt-1 text-right text-[11px] text-white/35">{title.length}/60</div>
      <label className="block text-xs font-semibold uppercase tracking-wider text-white/50">Category</label>
      <div className="mt-2 flex flex-wrap gap-2">
        {CATEGORIES.map((c) => (
          <button type="button" key={c} onClick={() => setCategory(c)} className="rounded-full border px-3 py-1.5 text-xs font-semibold transition" style={category === c ? { background: CATEGORY_COLORS[c], borderColor: CATEGORY_COLORS[c], color: "#0B1020" } : { borderColor: "rgba(255,255,255,.15)", color: "rgba(255,255,255,.75)" }}>
            {c}
          </button>
        ))}
      </div>
      <label className="mt-4 block text-xs font-semibold uppercase tracking-wider text-white/50">Note (optional)</label>
      <textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={280} rows={2} placeholder="How do you get it?" className="mt-1.5 w-full resize-none rounded-xl border border-white/10 bg-[#0B1020] px-3.5 py-2.5 text-[15px] text-white outline-none placeholder:text-white/30 focus:border-[#00E5C7]" />
      <div className="mt-4 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className="rounded-full px-4 py-2.5 text-sm font-semibold text-white/70 hover:bg-white/10">Cancel</button>
        <button type="submit" disabled={!title.trim() || busy} className="rounded-full bg-[#FF3D8B] px-5 py-2.5 text-sm font-bold text-white transition hover:brightness-110 active:scale-95 disabled:opacity-40">
          {busy ? "Saving…" : "Save pin"}
        </button>
      </div>
    </form>
  );
}

export function GoogleButton({ onClick }: { onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex items-center justify-center gap-3 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-[#1f1f1f] shadow transition hover:bg-white/90 active:scale-95">
      <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.4-.4-3.5z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.8 1.2 7.9 3.1l5.7-5.7C34 6.1 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-7.9l-6.5 5C9.5 39.6 16.2 44 24 44z"/><path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-.8 2.2-2.2 4.2-4.1 5.6l6.2 5.2C37 39.2 44 34 44 24c0-1.3-.1-2.4-.4-3.5z"/></svg>
      Sign in with Google
    </button>
  );
}

export function SignInModal({ onSignIn, onClose }: { onSignIn: () => void; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[2000] grid place-items-center bg-black/60 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className={`${panel} modal-pop w-full max-w-sm p-7 text-center`} onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-[#FF3D8B]/15">
          <svg width="28" height="28" viewBox="0 0 24 24"><path d="M12 2l8 3v6c0 5-3.4 9.4-8 11-4.6-1.6-8-6-8-11V5z" fill="none" stroke="#FF3D8B" strokeWidth="2" strokeLinejoin="round" /><path d="M8.5 12l2.5 2.5 4.5-5" fill="none" stroke="#FF3D8B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        </div>
        <p className="mt-4 text-lg font-bold leading-snug text-white">Sign in to drop pins.</p>
        <p className="mt-1.5 text-sm text-white/60">This keeps fake pins off the map.</p>
        <div className="mt-6 flex justify-center">
          <GoogleButton onClick={onSignIn} />
        </div>
      </div>
    </div>
  );
}
