import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";

interface TopBarProps {
  title?: string;
  onBack?: () => void;
  right?: ReactNode;
  transparent?: boolean;
}

export function TopBar({ title, onBack, right, transparent }: TopBarProps) {
  return (
    <div
      className="shrink-0 flex items-center px-5"
      style={{
        height: 52,
        backgroundColor: transparent ? "transparent" : "#FAF7F1",
        borderBottom: transparent ? "none" : "1px solid #D8C3A5",
      }}
    >
      <div className="w-10 flex items-center">
        {onBack && (
          <button
            onClick={onBack}
            className="flex items-center gap-1 -ml-1"
            style={{ border: "none", background: "none", cursor: "pointer" }}
          >
            <ChevronLeft size={22} strokeWidth={1.5} color="#2F4A3D" />
          </button>
        )}
      </div>

      <div className="flex-1 flex justify-center">
        {title && (
          <span
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 18,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            {title}
          </span>
        )}
      </div>

      <div className="w-10 flex items-center justify-end">{right}</div>
    </div>
  );
}
