import { useState } from "react";
import { SlidersHorizontal, X, Leaf } from "lucide-react";
import { TopBar } from "../TopBar";
import { BottomNav } from "../BottomNav";
import { PlantCard } from "../PlantCard";
import { PLANTS } from "../../data";

interface SearchResultsScreenProps {
  isEmpty?: boolean;
  onBack?: () => void;
  onPlantTap?: (id: string) => void;
  onNavigate?: (tab: "discover" | "lists" | "account") => void;
}

export function SearchResultsScreen({
  isEmpty = false,
  onBack,
  onPlantTap,
  onNavigate,
}: SearchResultsScreenProps) {
  const [saved, setSaved] = useState<Set<string>>(new Set(["amelanchier-canadensis"]));
  const [activeFilters] = useState(["Full Sun", "Native", "Zone 7a"]);

  const toggleSave = (id: string) => {
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      <TopBar
        title="Results"
        onBack={onBack}
        right={
          <div className="relative">
            <SlidersHorizontal size={20} strokeWidth={1.5} color="#2F4A3D" />
            <span
              className="absolute flex items-center justify-center"
              style={{
                top: -6,
                right: -6,
                width: 15,
                height: 15,
                borderRadius: "50%",
                backgroundColor: "#C77B4D",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 9,
                fontWeight: 700,
                color: "#F6F1E7",
              }}
            >
              3
            </span>
          </div>
        }
      />

      {/* Active filter chips */}
      <div
        className="shrink-0 flex items-center gap-2 px-5 py-2.5 overflow-x-auto"
        style={{
          backgroundColor: "#FAF7F1",
          borderBottom: "1px solid #D8C3A5",
        }}
      >
        {activeFilters.map((f) => (
          <span
            key={f}
            className="flex items-center gap-1.5 shrink-0"
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "#2F4A3D",
              backgroundColor: "#9CAF88",
              borderRadius: 999,
              padding: "4px 10px",
            }}
          >
            {f}
            <X size={11} strokeWidth={2} color="#2F4A3D" />
          </span>
        ))}
      </div>

      {/* Results count */}
      {!isEmpty && (
        <div className="px-5 pt-3 pb-1 shrink-0">
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: "#9CAF88",
            }}
          >
            {PLANTS.length} plants found
          </p>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center px-8 h-full gap-4">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 72, height: 72, backgroundColor: "#EDE8DC" }}
            >
              <Leaf size={32} strokeWidth={1.5} color="#9CAF88" />
            </div>
            <div className="text-center">
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 20,
                  fontWeight: 500,
                  color: "#2F4A3D",
                  marginBottom: 8,
                }}
              >
                No plants match those filters yet
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 15,
                  color: "#7A776F",
                  lineHeight: 1.6,
                }}
              >
                Try loosening sun or soil requirements — most native plants tolerate some variation.
              </p>
            </div>
            <button
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                fontWeight: 500,
                color: "#C77B4D",
                border: "1.5px solid #C77B4D",
                borderRadius: 10,
                padding: "10px 24px",
                background: "none",
                cursor: "pointer",
              }}
            >
              Adjust filters
            </button>
          </div>
        ) : (
          /* Plant list */
          <div className="flex flex-col gap-3 px-5 py-3 pb-6">
            {PLANTS.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                saved={saved.has(plant.id)}
                onSave={() => toggleSave(plant.id)}
                onTap={() => onPlantTap?.(plant.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="discover" onNavigate={onNavigate} />
    </div>
  );
}
