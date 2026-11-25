"use client";

import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useEffect, useMemo } from "react";
import { ImageOverlay, MapContainer, Marker, useMap, useMapEvents } from "react-leaflet";
import { CATEGORY_COLORS, MAP_H, MAP_W, type Pin } from "@/lib/types";

const BOUNDS: L.LatLngBoundsExpression = [[0, 0], [MAP_H, MAP_W]];
// fit the whole map on load
const FIT = BOUNDS;
const SEA = "#1761ad";
// map.webp has an extra blended sea border: 200 units left/right, 300 top/bottom
const IMAGE_BOUNDS: L.LatLngBoundsExpression = [[-300, -200], [MAP_H + 300, MAP_W + 200]];
const toLatLng = (x: number, y: number): L.LatLngTuple => [MAP_H - y, x];

function pinIcon(color: string, selected: boolean, draft = false) {
  const s = selected ? 1.3 : 1;
  const w = Math.round(30 * s), h = Math.round(40 * s);
  const ring = selected ? `<span class="pin-ring" style="border-color:${color}"></span>` : "";
  const html = `<div class="pin ${draft ? "pin-draft" : ""}" style="width:${w}px;height:${h}px">${ring}
    <svg viewBox="0 0 30 40" width="${w}" height="${h}"><path d="M15 39C15 39 28 24.5 28 14.5A13 13 0 0 0 2 14.5C2 24.5 15 39 15 39Z" fill="${color}" stroke="#0B1020" stroke-width="2.5"/><circle cx="15" cy="14.5" r="5" fill="#0B1020"/></svg></div>`;
  return L.divIcon({ html, className: "pin-wrap", iconSize: [w, h], iconAnchor: [w / 2, h - 1] });
}

function Events({ onDrop, onBackground }: { onDrop: (x: number, y: number) => void; onBackground: () => void }) {
  useMapEvents({
    contextmenu(e) {
      const x = e.latlng.lng, y = MAP_H - e.latlng.lat;
      if (x >= 0 && x <= MAP_W && y >= 0 && y <= MAP_H) onDrop(x, y);
    },
    click() {
      onBackground();
    },
  });
  return null;
}

function Focus({ pin, nonce }: { pin: Pin | null; nonce: number }) {
  const map = useMap();
  useEffect(() => {
    if (!pin) return;
    // zoom in a little, and keep the pin left of the card on wide screens
    const z = Math.max(map.getZoom(), 0.5);
    const target = map.project(toLatLng(pin.x, pin.y), z).add([map.getSize().x > 700 ? 190 : 0, 0]);
    map.flyTo(map.unproject(target, z), z, { duration: 0.9 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nonce]);
  return null;
}

function FitOnLoad() {
  const map = useMap();
  useEffect(() => {
    let touched = false, fitting = false;
    const fit = () => {
      fitting = true;
      map.invalidateSize();
      map.fitBounds(FIT, { padding: [10, 10], animate: false });
      fitting = false;
    };
    fit();
    // keep refitting while the layout settles (fonts, header wrap), until the user moves the map
    const stop = () => {
      if (!fitting) touched = true;
    };
    map.on("dragstart zoomstart", stop);
    const ro = new ResizeObserver(() => !touched && fit());
    ro.observe(map.getContainer());
    const t = setTimeout(() => {
      ro.disconnect();
      map.off("dragstart zoomstart", stop);
    }, 2000);
    return () => {
      clearTimeout(t);
      ro.disconnect();
      map.off("dragstart zoomstart", stop);
    };
  }, [map]);
  return null;
}

export default function MapView(props: {
  pins: Pin[];
  selectedId: string | null;
  draft: { x: number; y: number } | null;
  focus: { pin: Pin | null; nonce: number };
  onSelect: (id: string) => void;
  onDrop: (x: number, y: number) => void;
  onBackground: () => void;
}) {
  const { pins, selectedId, draft, focus, onSelect, onDrop, onBackground } = props;
  const icons = useMemo(() => {
    const m = new Map<string, L.DivIcon>();
    for (const p of pins) m.set(p.id, pinIcon(CATEGORY_COLORS[p.category], p.id === selectedId));
    return m;
  }, [pins, selectedId]);

  return (
    <MapContainer
      crs={L.CRS.Simple}
      bounds={BOUNDS}
      maxBounds={[[-500, -500], [MAP_H + 500, MAP_W + 500]]}
      maxBoundsViscosity={0.8}
      minZoom={-3}
      maxZoom={3}
      zoomSnap={0.25}
      zoomDelta={0.5}
      wheelPxPerZoomLevel={90}
      attributionControl={false}
      className="h-full w-full"
      style={{ background: SEA }}
    >
      <ImageOverlay url="/map.webp?v=3" bounds={IMAGE_BOUNDS} />
      <FitOnLoad />
      <Focus pin={focus.pin} nonce={focus.nonce} />
      <Events onDrop={onDrop} onBackground={onBackground} />
      {pins.map((p) => (
        <Marker
          key={p.id}
          position={toLatLng(p.x, p.y)}
          icon={icons.get(p.id)!}
          zIndexOffset={p.id === selectedId ? 1000 : 0}
          eventHandlers={{ click: () => onSelect(p.id) }}
        />
      ))}
      {draft && <Marker position={toLatLng(draft.x, draft.y)} icon={pinIcon("#F5F7FF", true, true)} interactive={false} />}
    </MapContainer>
  );
}
