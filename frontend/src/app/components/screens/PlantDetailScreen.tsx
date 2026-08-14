import { useState, ReactNode } from "react";
import { Share2, Droplets, Ruler, CalendarDays, Leaf } from "lucide-react";
import { TopBar } from "../TopBar";
import { BottomNav } from "../BottomNav";
import { SaveToListSheet } from "../SaveToListSheet";
import { PLANTS } from "../../data";

interface PlantDetailScreenProps {
  plantId?: string;
  isGuest?: boolean;
  onBack?: () => void;
  onNavigate?: (tab: "discover" | "lists" | "account") => void;
}

function TagBadge({ label }: { label: string }) {
  return (
    <span
      style={{
        fontFamily: "'Public Sans', sans-serif",
        fontSize: 11,
        fontWeight: 500,
        color: "#2F4A3D",
        border: "1px solid #9CAF88",
        borderRadius: 999,
        padding: "4px 12px",
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        whiteSpace: "nowrap",
      }}
    >
      {label}
    </span>
  );
}

function CareItem({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div
      className="flex flex-col gap-1 flex-1 items-center"
      style={{
        padding: "12px 8px",
        backgroundColor: "#EDE8DC",
        borderRadius: 12,
      }}
    >
      <div className="flex items-center justify-center">{icon}</div>
      <span
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 10,
          fontWeight: 600,
          color: "#9CAF88",
          textTransform: "uppercase",
          letterSpacing: "0.06em",
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontFamily: "'IBM Plex Mono', monospace",
          fontSize: 11,
          color: "#2F4A3D",
          textAlign: "center",
          lineHeight: 1.4,
        }}
      >
        {value}
      </span>
    </div>
  );
}

export function PlantDetailScreen({
  plantId = "echinacea-purpurea",
  isGuest = false,
  onBack,
  onNavigate,
}: PlantDetailScreenProps) {
  const [showSheet, setShowSheet] = useState(false);
  const plant = PLANTS.find((p) => p.id === plantId) ?? PLANTS[0];

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      <TopBar
        onBack={onBack}
        right={
          <button style={{ border: "none", background: "none", cursor: "pointer" }}>
            <Share2 size={20} strokeWidth={1.5} color="#2F4A3D" />
          </button>
        }
      />

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Hero photo */}
        <div className="relative" style={{ height: 220 }}>
          <img
            src={plant.imageUrl}
            alt={plant.commonName}
            className="w-full h-full object-cover"
            style={{ backgroundColor: "#EDE8DC" }}
          />
        </div>

        {/* Content card */}
        <div
          className="relative -mt-6 mx-0"
          style={{
            backgroundColor: "#F6F1E7",
            borderRadius: "24px 24px 0 0",
            padding: "20px 20px 0",
          }}
        >
          {/* Name + latin */}
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 26,
              fontWeight: 600,
              color: "#2F4A3D",
              lineHeight: 1.2,
              marginBottom: 4,
            }}
          >
            {plant.commonName}
          </h1>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 13,
              color: "#9CAF88",
              marginBottom: 14,
              fontStyle: "italic",
            }}
          >
            {plant.latinName}
          </p>

          {/* Tags row */}
          <div className="flex flex-wrap gap-2 mb-5">
            <TagBadge label={plant.sunlight} />
            {plant.soilTypes.map((s) => (
              <TagBadge key={s} label={s} />
            ))}
            <TagBadge label={`Zone ${plant.zones}`} />
            {plant.native && <TagBadge label="Native" />}
            {plant.edible && <TagBadge label="Edible" />}
            {plant.flowering && <TagBadge label="Flowering" />}
          </div>

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "#D8C3A5", marginBottom: 16 }} />

          {/* Description */}
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 15,
              color: "#33312C",
              lineHeight: 1.65,
              marginBottom: 20,
            }}
          >
            {plant.description}
          </p>

          {/* Care section */}
          <div className="mb-2">
            <div className="flex items-center gap-2 mb-3">
              <Leaf size={15} strokeWidth={1.5} color="#2F4A3D" />
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
                Care at a glance
              </span>
            </div>
            <div className="flex gap-2">
              <CareItem
                icon={<Droplets size={18} strokeWidth={1.5} color="#2F4A3D" />}
                label="Water"
                value={plant.water}
              />
              <CareItem
                icon={<Ruler size={18} strokeWidth={1.5} color="#2F4A3D" />}
                label="Mature size"
                value={plant.matureSize}
              />
              <CareItem
                icon={<CalendarDays size={18} strokeWidth={1.5} color="#2F4A3D" />}
                label="Bloom"
                value={plant.bloomSeason}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Save button — in normal flow above BottomNav */}
      <div
        className="shrink-0 px-5"
        style={{
          paddingTop: 12,
          paddingBottom: 12,
          backgroundColor: "#F6F1E7",
          borderTop: "1px solid #D8C3A5",
        }}
      >
        <button
          onClick={() => setShowSheet(true)}
          className="w-full flex items-center justify-center"
          style={{
            height: 52,
            borderRadius: 12,
            backgroundColor: "#C77B4D",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(199,123,77,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#F6F1E7",
            }}
          >
            Save to a list
          </span>
        </button>
      </div>

      <BottomNav active="discover" onNavigate={onNavigate} />

      {/* Save to list bottom sheet */}
      {showSheet && (
        <SaveToListSheet
          isGuest={isGuest}
          onClose={() => setShowSheet(false)}
          onSignIn={() => setShowSheet(false)}
        />
      )}
    </div>
  );
}
