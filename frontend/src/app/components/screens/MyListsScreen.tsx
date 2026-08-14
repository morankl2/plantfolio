import { Plus, BookOpen } from "lucide-react";
import { TopBar } from "../TopBar";
import { BottomNav } from "../BottomNav";
import { LISTS, getPlantsForList } from "../../data";

interface MyListsScreenProps {
  isEmpty?: boolean;
  onListTap?: (id: string) => void;
  onNavigate?: (tab: "discover" | "lists" | "account") => void;
}

function ListCard({
  name,
  emoji,
  plantCount,
  thumbUrls,
  onTap,
}: {
  name: string;
  emoji: string;
  plantCount: number;
  thumbUrls: string[];
  onTap?: () => void;
}) {
  return (
    <button
      onClick={onTap}
      className="flex flex-col w-full"
      style={{
        borderRadius: 16,
        backgroundColor: "#FAF7F1",
        border: "1px solid #D8C3A5",
        boxShadow: "0 2px 8px rgba(47,74,61,0.06)",
        overflow: "hidden",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      {/* Photo collage */}
      <div className="relative" style={{ height: 110 }}>
        {thumbUrls.length === 0 ? (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: "#EDE8DC" }}
          >
            <span style={{ fontSize: 32 }}>{emoji}</span>
          </div>
        ) : (
          <div className="grid grid-cols-2 w-full h-full">
            {thumbUrls.slice(0, 4).map((url, i) => (
              <div key={i} className="overflow-hidden" style={{ backgroundColor: "#EDE8DC" }}>
                <img src={url} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
            {/* Fill remaining slots */}
            {Array.from({ length: Math.max(0, 4 - thumbUrls.length) }).map((_, i) => (
              <div key={`empty-${i}`} style={{ backgroundColor: "#E8E2D4" }} />
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="px-4 py-3">
        <p
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#2F4A3D",
          }}
        >
          {name}
        </p>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            color: "#9CAF88",
            marginTop: 2,
          }}
        >
          {plantCount} {plantCount === 1 ? "plant" : "plants"}
        </p>
      </div>
    </button>
  );
}

export function MyListsScreen({ isEmpty = false, onListTap, onNavigate }: MyListsScreenProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      <TopBar
        title="My Lists"
        right={
          <button style={{ border: "none", background: "none", cursor: "pointer" }}>
            <Plus size={22} strokeWidth={1.5} color="#2F4A3D" />
          </button>
        }
      />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        {isEmpty ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-5 px-4">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 72, height: 72, backgroundColor: "#EDE8DC" }}
            >
              <BookOpen size={32} strokeWidth={1.5} color="#9CAF88" />
            </div>
            <div className="text-center">
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "#2F4A3D",
                  marginBottom: 8,
                }}
              >
                Your garden starts here
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 15,
                  color: "#7A776F",
                  lineHeight: 1.6,
                }}
              >
                Save plants to named lists like "Front Yard" or "Shade Garden" and build your planting plan.
              </p>
            </div>
            <button
              style={{
                height: 50,
                paddingLeft: 28,
                paddingRight: 28,
                borderRadius: 12,
                backgroundColor: "#C77B4D",
                border: "none",
                cursor: "pointer",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                color: "#F6F1E7",
              }}
            >
              + Create your first list
            </button>
          </div>
        ) : (
          <>
            {/* List grid */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              {LISTS.map((list) => {
                const plants = getPlantsForList(list);
                return (
                  <ListCard
                    key={list.id}
                    name={list.name}
                    emoji={list.emoji}
                    plantCount={plants.length}
                    thumbUrls={plants.slice(0, 4).map((p) => p.imageUrl)}
                    onTap={() => onListTap?.(list.id)}
                  />
                );
              })}

              {/* New list card */}
              <button
                className="flex flex-col items-center justify-center gap-2"
                style={{
                  height: 166,
                  borderRadius: 16,
                  border: "1.5px dashed #9CAF88",
                  backgroundColor: "transparent",
                  cursor: "pointer",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 36, height: 36, backgroundColor: "#EDE8DC" }}
                >
                  <Plus size={18} strokeWidth={1.5} color="#9CAF88" />
                </div>
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: "#9CAF88",
                  }}
                >
                  New list
                </span>
              </button>
            </div>

            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: "#9CAF88",
                textAlign: "center",
                paddingBottom: 8,
              }}
            >
              {LISTS.reduce((acc, l) => acc + l.plantIds.length, 0)} plants saved across {LISTS.length} lists
            </p>
          </>
        )}
      </div>

      <BottomNav active="lists" onNavigate={onNavigate} />
    </div>
  );
}
