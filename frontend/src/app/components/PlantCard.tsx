import { Bookmark, BookmarkCheck } from "lucide-react";
import { Plant } from "../data";

interface PlantCardProps {
  plant: Plant;
  saved?: boolean;
  onSave?: () => void;
  onTap?: () => void;
  showRemove?: boolean;
  onRemove?: () => void;
}

export function PlantCard({
  plant,
  saved = false,
  onSave,
  onTap,
  showRemove = false,
  onRemove,
}: PlantCardProps) {
  return (
    <div
      onClick={onTap}
      className="flex gap-3 rounded-xl cursor-pointer"
      style={{
        padding: 12,
        backgroundColor: "#FAF7F1",
        border: "1px solid #D8C3A5",
        boxShadow: "0 2px 8px rgba(47,74,61,0.06)",
      }}
    >
      {/* Plant photo */}
      <div className="shrink-0 rounded-xl overflow-hidden" style={{ width: 88, height: 88 }}>
        <img
          src={plant.imageUrl}
          alt={plant.commonName}
          className="w-full h-full object-cover"
          style={{ backgroundColor: "#EDE8DC" }}
        />
      </div>

      {/* Info */}
      <div className="flex-1 flex flex-col justify-between min-w-0" style={{ paddingRight: 2 }}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p
              className="truncate"
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 15,
                fontWeight: 500,
                color: "#2F4A3D",
                lineHeight: 1.3,
              }}
            >
              {plant.commonName}
            </p>
            <p
              style={{
                fontFamily: "'IBM Plex Mono', monospace",
                fontSize: 11,
                color: "#9CAF88",
                marginTop: 2,
                lineHeight: 1.3,
              }}
            >
              {plant.latinName}
            </p>
          </div>

          {showRemove ? (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRemove?.();
              }}
              className="shrink-0 mt-0.5"
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  color: "#C77B4D",
                  textDecoration: "underline",
                  textUnderlineOffset: 2,
                }}
              >
                Remove
              </span>
            </button>
          ) : (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onSave?.();
              }}
              className="shrink-0 mt-0.5"
              style={{ border: "none", background: "none", cursor: "pointer" }}
            >
              {saved ? (
                <BookmarkCheck size={18} strokeWidth={1.5} color="#C77B4D" fill="#C77B4D" />
              ) : (
                <Bookmark size={18} strokeWidth={1.5} color="#2F4A3D" />
              )}
            </button>
          )}
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-1.5 mt-2">
          {plant.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 10,
                fontWeight: 500,
                color: "#2F4A3D",
                backgroundColor: "transparent",
                border: "1px solid #9CAF88",
                borderRadius: 999,
                padding: "2px 8px",
                letterSpacing: "0.04em",
                textTransform: "uppercase",
                lineHeight: 1.4,
              }}
            >
              {tag}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
