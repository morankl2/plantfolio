import { useState } from "react";
import { MoreHorizontal, Check, Pencil } from "lucide-react";
import { TopBar } from "../TopBar";
import { BottomNav } from "../BottomNav";
import { PlantCard } from "../PlantCard";
import { LISTS, getPlantsForList } from "../../data";

interface ListDetailScreenProps {
  listId?: string;
  onBack?: () => void;
  onPlantTap?: (id: string) => void;
  onNavigate?: (tab: "discover" | "lists" | "account") => void;
}

export function ListDetailScreen({
  listId = "front-yard",
  onBack,
  onPlantTap,
  onNavigate,
}: ListDetailScreenProps) {
  const list = LISTS.find((l) => l.id === listId) ?? LISTS[0];
  const [plants, setPlants] = useState(getPlantsForList(list));
  const [isEditingName, setIsEditingName] = useState(false);
  const [listName, setListName] = useState(list.name);

  const removeItem = (id: string) => {
    setPlants((prev) => prev.filter((p) => p.id !== id));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      <TopBar
        onBack={onBack}
        title={isEditingName ? undefined : listName}
        right={
          <button style={{ border: "none", background: "none", cursor: "pointer" }}>
            <MoreHorizontal size={20} strokeWidth={1.5} color="#2F4A3D" />
          </button>
        }
      />

      {/* Editable list name */}
      {isEditingName && (
        <div
          className="shrink-0 flex items-center gap-2 px-5 py-2"
          style={{ borderBottom: "1px solid #D8C3A5", backgroundColor: "#FAF7F1" }}
        >
          <input
            autoFocus
            value={listName}
            onChange={(e) => setListName(e.target.value)}
            style={{
              flex: 1,
              border: "none",
              background: "transparent",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 18,
              fontWeight: 500,
              color: "#2F4A3D",
              outline: "none",
            }}
          />
          <button
            onClick={() => setIsEditingName(false)}
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <Check size={18} strokeWidth={2} color="#C77B4D" />
          </button>
        </div>
      )}

      {/* List header info */}
      <div
        className="shrink-0 flex items-center justify-between px-5 py-3"
        style={{
          backgroundColor: "#FAF7F1",
          borderBottom: "1px solid #D8C3A5",
        }}
      >
        <div className="flex items-center gap-2">
          <span style={{ fontSize: 20 }}>{list.emoji}</span>
          <div>
            <p
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 16,
                fontWeight: 500,
                color: "#2F4A3D",
              }}
            >
              {listName}
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: "#9CAF88",
              }}
            >
              {plants.length} {plants.length === 1 ? "plant" : "plants"}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsEditingName(true)}
          className="flex items-center gap-1.5"
          style={{
            border: "1px solid #D8C3A5",
            borderRadius: 8,
            padding: "6px 10px",
            background: "none",
            cursor: "pointer",
          }}
        >
          <Pencil size={13} strokeWidth={1.5} color="#9CAF88" />
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 500,
              color: "#9CAF88",
            }}
          >
            Rename
          </span>
        </button>
      </div>

      {/* Plant list */}
      <div className="flex-1 overflow-y-auto">
        {plants.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-3 px-8">
            <p
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 18,
                fontWeight: 500,
                color: "#2F4A3D",
                textAlign: "center",
              }}
            >
              This list is empty
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#7A776F",
                textAlign: "center",
                lineHeight: 1.6,
              }}
            >
              Head to Discover to find plants and save them here.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-3 px-5 py-3 pb-6">
            {plants.map((plant) => (
              <PlantCard
                key={plant.id}
                plant={plant}
                showRemove
                onRemove={() => removeItem(plant.id)}
                onTap={() => onPlantTap?.(plant.id)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="lists" onNavigate={onNavigate} />
    </div>
  );
}
