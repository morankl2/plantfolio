import { ReactNode } from "react";

interface PhoneFrameProps {
  children: ReactNode;
  className?: string;
}

export function PhoneFrame({ children, className = "" }: PhoneFrameProps) {
  return (
    <div
      className={`relative flex flex-col bg-cream overflow-hidden ${className}`}
      style={{
        width: 390,
        height: 844,
        borderRadius: 40,
        border: "1.5px solid #D8C3A5",
        boxShadow: "0 8px 40px rgba(47,74,61,0.14), 0 2px 8px rgba(47,74,61,0.08)",
      }}
    >
      {/* iOS status bar */}
      <div
        className="flex items-center justify-between px-8 shrink-0"
        style={{ height: 44, backgroundColor: "transparent" }}
      >
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontWeight: 600,
            fontSize: 15,
            color: "#2F4A3D",
            letterSpacing: "-0.01em",
          }}
        >
          9:41
        </span>
        <div className="flex items-center gap-1.5">
          {/* Signal bars */}
          <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
            <rect x="0" y="8" width="3" height="4" rx="0.5" fill="#2F4A3D" />
            <rect x="4.5" y="5" width="3" height="7" rx="0.5" fill="#2F4A3D" />
            <rect x="9" y="2.5" width="3" height="9.5" rx="0.5" fill="#2F4A3D" />
            <rect x="13.5" y="0" width="3" height="12" rx="0.5" fill="#2F4A3D" opacity="0.3" />
          </svg>
          {/* WiFi */}
          <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
            <path d="M8 9.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Z" fill="#2F4A3D" />
            <path d="M4.5 6.5C5.7 5.3 6.8 4.7 8 4.7s2.3.6 3.5 1.8" stroke="#2F4A3D" strokeWidth="1.4" strokeLinecap="round" />
            <path d="M1.5 3.5C3.3 1.7 5.5.8 8 .8s4.7.9 6.5 2.7" stroke="#2F4A3D" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          {/* Battery */}
          <div className="flex items-center gap-px">
            <div
              style={{
                width: 25,
                height: 12,
                border: "1.5px solid #2F4A3D",
                borderRadius: 3,
                padding: "1.5px",
                display: "flex",
                alignItems: "stretch",
              }}
            >
              <div style={{ width: "80%", backgroundColor: "#2F4A3D", borderRadius: 1.5 }} />
            </div>
            <div
              style={{
                width: 3,
                height: 6,
                backgroundColor: "#2F4A3D",
                borderRadius: "0 1px 1px 0",
                opacity: 0.5,
              }}
            />
          </div>
        </div>
      </div>

      {/* Screen content */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
        {children}
      </div>

      {/* iOS home indicator */}
      <div className="flex justify-center items-end pb-2 shrink-0" style={{ height: 34 }}>
        <div
          style={{
            width: 134,
            height: 5,
            backgroundColor: "#2F4A3D",
            borderRadius: 3,
            opacity: 0.2,
          }}
        />
      </div>
    </div>
  );
}
