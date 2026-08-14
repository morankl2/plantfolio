import { Search, Bookmark, User } from "lucide-react";

export type NavTab = "discover" | "lists" | "account";

interface BottomNavProps {
  active: NavTab;
  onNavigate?: (tab: NavTab) => void;
}

const tabs: { id: NavTab; label: string; Icon: typeof Search }[] = [
  { id: "discover", label: "Discover", Icon: Search },
  { id: "lists", label: "My Lists", Icon: Bookmark },
  { id: "account", label: "Account", Icon: User },
];

export function BottomNav({ active, onNavigate }: BottomNavProps) {
  return (
    <div
      className="shrink-0 flex items-stretch"
      style={{
        height: 58,
        backgroundColor: "#FAF7F1",
        borderTop: "1px solid #D8C3A5",
      }}
    >
      {tabs.map(({ id, label, Icon }) => {
        const isActive = active === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate?.(id)}
            className="flex-1 flex flex-col items-center justify-center gap-1 transition-opacity"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <Icon
              size={22}
              strokeWidth={isActive ? 2 : 1.5}
              color={isActive ? "#C77B4D" : "#9CAF88"}
            />
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: isActive ? 600 : 400,
                color: isActive ? "#C77B4D" : "#9CAF88",
                letterSpacing: "0.02em",
              }}
            >
              {label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
