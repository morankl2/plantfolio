import { useState } from "react";
import { Search, MapPin, SlidersHorizontal, X } from "lucide-react";
import { BottomNav } from "../BottomNav";

interface HomeScreenProps {
  onSearch?: () => void;
  onNavigate?: (tab: "discover" | "lists" | "account") => void;
}

type SunOption = "Full Sun" | "Partial" | "Shade";
type SoilOption = "Clay" | "Loamy" | "Sandy";

function FilterPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        fontFamily: "'Public Sans', sans-serif",
        fontSize: 13,
        fontWeight: active ? 500 : 400,
        color: active ? "#2F4A3D" : "#33312C",
        backgroundColor: active ? "#9CAF88" : "transparent",
        border: active ? "none" : "1px solid #D8C3A5",
        borderRadius: 999,
        padding: "6px 14px",
        cursor: "pointer",
        transition: "all 0.15s",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </button>
  );
}

function Toggle({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <div className="flex items-center justify-between" style={{ paddingTop: 4, paddingBottom: 4 }}>
      <span
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 15,
          color: "#33312C",
        }}
      >
        {label}
      </span>
      <button
        onClick={onChange}
        style={{
          width: 44,
          height: 26,
          borderRadius: 999,
          backgroundColor: checked ? "#C77B4D" : "#D8C3A5",
          border: "none",
          cursor: "pointer",
          padding: 3,
          display: "flex",
          alignItems: "center",
          justifyContent: checked ? "flex-end" : "flex-start",
          transition: "background 0.2s",
        }}
      >
        <div
          style={{
            width: 20,
            height: 20,
            borderRadius: "50%",
            backgroundColor: "#FAF7F1",
            boxShadow: "0 1px 3px rgba(0,0,0,0.2)",
          }}
        />
      </button>
    </div>
  );
}

export function HomeScreen({ onSearch, onNavigate }: HomeScreenProps) {
  const [sun, setSun] = useState<Set<SunOption>>(new Set(["Full Sun"]));
  const [soil, setSoil] = useState<Set<SoilOption>>(new Set());
  const [zone, setZone] = useState("21401");
  const [native, setNative] = useState(false);
  const [flowering, setFlowering] = useState(false);
  const [edible, setEdible] = useState(false);
  const [filtersExpanded, setFiltersExpanded] = useState(true);

  const activeCount =
    sun.size + soil.size + (native ? 1 : 0) + (flowering ? 1 : 0) + (edible ? 1 : 0);

  const toggleSun = (v: SunOption) => {
    setSun((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const toggleSoil = (v: SoilOption) => {
    setSoil((prev) => {
      const next = new Set(prev);
      if (next.has(v)) next.delete(v);
      else next.add(v);
      return next;
    });
  };

  const clearAll = () => {
    setSun(new Set());
    setSoil(new Set());
    setNative(false);
    setFlowering(false);
    setEdible(false);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      {/* Header */}
      <div
        className="shrink-0 flex items-center justify-between px-5"
        style={{
          height: 52,
          backgroundColor: "#FAF7F1",
          borderBottom: "1px solid #D8C3A5",
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 20,
            fontWeight: 500,
            color: "#2F4A3D",
          }}
        >
          Plantfolio
        </span>
        <button
          onClick={() => setFiltersExpanded((v) => !v)}
          className="relative flex items-center gap-1.5"
          style={{ border: "none", background: "none", cursor: "pointer" }}
        >
          <SlidersHorizontal size={20} strokeWidth={1.5} color="#2F4A3D" />
          {activeCount > 0 && (
            <span
              className="absolute -top-1.5 -right-1.5 flex items-center justify-center"
              style={{
                width: 16,
                height: 16,
                borderRadius: "50%",
                backgroundColor: "#C77B4D",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 10,
                fontWeight: 700,
                color: "#F6F1E7",
              }}
            >
              {activeCount}
            </span>
          )}
        </button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto" style={{ paddingBottom: 80 }}>
        {/* Search bar */}
        <div className="px-5 pt-4 pb-3">
          <div
            onClick={onSearch}
            className="flex items-center gap-3"
            style={{
              height: 46,
              borderRadius: 12,
              backgroundColor: "#FAF7F1",
              border: "1px solid #D8C3A5",
              paddingLeft: 14,
              paddingRight: 14,
              cursor: "pointer",
            }}
          >
            <Search size={18} strokeWidth={1.5} color="#9CAF88" />
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 15,
                color: "#9CAF88",
              }}
            >
              Search by name or browse filters
            </span>
          </div>
        </div>

        {filtersExpanded && (
          <div className="px-5 pb-2">
            {/* Sunlight section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {/* Sun icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="8" r="3.5" stroke="#2F4A3D" strokeWidth="1.5" />
                  {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
                    <line
                      key={i}
                      x1={8 + 5 * Math.cos((deg * Math.PI) / 180)}
                      y1={8 + 5 * Math.sin((deg * Math.PI) / 180)}
                      x2={8 + 7 * Math.cos((deg * Math.PI) / 180)}
                      y2={8 + 7 * Math.sin((deg * Math.PI) / 180)}
                      stroke="#2F4A3D"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  ))}
                </svg>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2F4A3D",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Sunlight
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["Full Sun", "Partial", "Shade"] as SunOption[]).map((opt) => (
                  <FilterPill
                    key={opt}
                    label={opt}
                    active={sun.has(opt)}
                    onClick={() => toggleSun(opt)}
                  />
                ))}
              </div>
            </div>

            {/* Soil type section */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                {/* Layers / soil icon */}
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M2 11 Q 8 9 14 11" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 8 Q 8 6 14 8" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M2 5 Q 8 3 14 5" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2F4A3D",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  Soil Type
                </span>
              </div>
              <div className="flex gap-2 flex-wrap">
                {(["Clay", "Loamy", "Sandy"] as SoilOption[]).map((opt) => (
                  <FilterPill
                    key={opt}
                    label={opt}
                    active={soil.has(opt)}
                    onClick={() => toggleSoil(opt)}
                  />
                ))}
              </div>
            </div>

            {/* Growing Zone */}
            <div className="mb-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin size={14} strokeWidth={1.5} color="#2F4A3D" />
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 11,
                    fontWeight: 600,
                    color: "#2F4A3D",
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                  }}
                >
                  USDA Growing Zone
                </span>
              </div>
              <div
                className="flex items-center gap-2"
                style={{
                  height: 44,
                  borderRadius: 10,
                  border: "1px solid #D8C3A5",
                  backgroundColor: "#FAF7F1",
                  paddingLeft: 12,
                  paddingRight: 12,
                }}
              >
                <MapPin size={16} strokeWidth={1.5} color="#9CAF88" />
                <input
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  placeholder="ZIP code or zone…"
                  style={{
                    flex: 1,
                    border: "none",
                    background: "transparent",
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 14,
                    color: "#33312C",
                    outline: "none",
                  }}
                />
                <span
                  style={{
                    fontFamily: "'IBM Plex Mono', monospace",
                    fontSize: 12,
                    color: "#9CAF88",
                    backgroundColor: "#EDE8DC",
                    borderRadius: 6,
                    padding: "3px 8px",
                  }}
                >
                  Zone 7a
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  color: "#9CAF88",
                  marginTop: 5,
                }}
              >
                Detected from your ZIP · tap to change
              </p>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: "#D8C3A5", marginBottom: 16 }} />

            {/* Toggles */}
            <div className="flex flex-col gap-3">
              <Toggle label="Native plants only" checked={native} onChange={() => setNative((v) => !v)} />
              <Toggle label="Flowering" checked={flowering} onChange={() => setFlowering((v) => !v)} />
              <Toggle label="Edible" checked={edible} onChange={() => setEdible((v) => !v)} />
            </div>

            {/* Apply + Clear */}
            <div className="flex gap-3 items-center mt-5">
              <button
                onClick={onSearch}
                className="flex-1 flex items-center justify-center"
                style={{
                  height: 50,
                  borderRadius: 12,
                  backgroundColor: "#C77B4D",
                  border: "none",
                  cursor: "pointer",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 15,
                    fontWeight: 600,
                    color: "#F6F1E7",
                  }}
                >
                  Apply filters
                </span>
              </button>
              <button
                onClick={clearAll}
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  color: "#9CAF88",
                  border: "none",
                  background: "none",
                  cursor: "pointer",
                  whiteSpace: "nowrap",
                }}
              >
                Clear all
              </button>
            </div>
          </div>
        )}

        {/* Collapsed state hint */}
        {!filtersExpanded && (
          <div className="px-5 pt-2">
            <div className="flex flex-wrap gap-2">
              {Array.from(sun).map((s) => (
                <span
                  key={s}
                  className="flex items-center gap-1"
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#2F4A3D",
                    backgroundColor: "#9CAF88",
                    borderRadius: 999,
                    padding: "5px 12px",
                  }}
                >
                  {s}
                  <X size={12} strokeWidth={2} color="#2F4A3D" />
                </span>
              ))}
              <button
                onClick={() => setFiltersExpanded(true)}
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: "#9CAF88",
                  border: "1px solid #9CAF88",
                  borderRadius: 999,
                  padding: "5px 14px",
                  background: "none",
                  cursor: "pointer",
                }}
              >
                + More filters
              </button>
            </div>
          </div>
        )}
      </div>

      <BottomNav active="discover" onNavigate={onNavigate} />
    </div>
  );
}
