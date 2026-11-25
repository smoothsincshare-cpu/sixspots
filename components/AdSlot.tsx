"use client";

import { useEffect, useRef } from "react";

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
const SHOW_PLACEHOLDER = process.env.NEXT_PUBLIC_SHOW_AD_PLACEHOLDERS === "1";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

// Real AdSense unit when NEXT_PUBLIC_ADSENSE_CLIENT is set, a dashed "Ad" box when placeholders are on, otherwise nothing.
export default function AdSlot({ variant }: { variant: "banner" | "box" }) {
  const pushed = useRef(false);
  useEffect(() => {
    if (!CLIENT || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {}
  }, []);

  const size = variant === "banner" ? "h-[60px] w-full max-w-[728px]" : "h-[250px] w-[300px] max-w-full";

  if (CLIENT) {
    return (
      <ins
        className={`adsbygoogle block ${size}`}
        data-ad-client={CLIENT}
        data-ad-format={variant === "banner" ? "horizontal" : "rectangle"}
        data-full-width-responsive="true"
      />
    );
  }
  if (!SHOW_PLACEHOLDER) return null;
  return (
    <div className={`${size} mx-auto grid place-items-center rounded-xl border-2 border-dashed border-white/25 text-sm font-semibold tracking-widest text-white/50`}>
      Ad
    </div>
  );
}
