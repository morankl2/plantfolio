import { ReactNode } from "react";
import { LogOut, ChevronRight, HelpCircle, Info } from "lucide-react";
import { TopBar } from "../TopBar";
import { BottomNav } from "../BottomNav";

interface AccountScreenProps {
  isSignedIn?: boolean;
  onSignIn?: () => void;
  onSignOut?: () => void;
  onSupport?: () => void;
  onNavigate?: (tab: "discover" | "lists" | "account") => void;
}

function SettingsRow({
  icon,
  label,
  detail,
  onClick,
  danger,
}: {
  icon: ReactNode;
  label: string;
  detail?: string;
  onClick?: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center justify-between w-full"
      style={{
        height: 52,
        paddingLeft: 16,
        paddingRight: 16,
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "1px solid #EDE8DC",
        backgroundColor: "transparent",
        cursor: "pointer",
        textAlign: "left",
      }}
    >
      <div className="flex items-center gap-3">
        {icon}
        <span
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 15,
            color: danger ? "#c0392b" : "#33312C",
          }}
        >
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        {detail && (
          <span
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "#9CAF88",
            }}
          >
            {detail}
          </span>
        )}
        {!danger && <ChevronRight size={16} strokeWidth={1.5} color="#D8C3A5" />}
      </div>
    </button>
  );
}

export function AccountScreen({
  isSignedIn = true,
  onSignIn,
  onSignOut,
  onSupport,
  onNavigate,
}: AccountScreenProps) {
  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      <TopBar title="Account" />

      <div className="flex-1 overflow-y-auto pb-4">
        {isSignedIn ? (
          <>
            {/* Account card */}
            <div className="px-5 py-5">
              <div
                className="flex items-center gap-4 p-4"
                style={{
                  borderRadius: 16,
                  backgroundColor: "#FAF7F1",
                  border: "1px solid #D8C3A5",
                }}
              >
                {/* Avatar */}
                <div
                  className="flex items-center justify-center rounded-full overflow-hidden"
                  style={{ width: 52, height: 52, backgroundColor: "#9CAF88", flexShrink: 0 }}
                >
                  <span
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: 22,
                      fontWeight: 500,
                      color: "#FAF7F1",
                    }}
                  >
                    JH
                  </span>
                </div>
                <div>
                  <p
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: 17,
                      fontWeight: 500,
                      color: "#2F4A3D",
                    }}
                  >
                    Jane Hartley
                  </p>
                  <p
                    style={{
                      fontFamily: "'IBM Plex Mono', monospace",
                      fontSize: 12,
                      color: "#9CAF88",
                      marginTop: 2,
                    }}
                  >
                    jane.hartley@gmail.com
                  </p>
                </div>
                {/* Google badge */}
                <div className="ml-auto">
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.32Z" fill="#4285F4" />
                    <path d="M10 20c2.7 0 4.97-.9 6.62-2.45l-3.23-2.51c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H1.06v2.6A10 10 0 0 0 10 20Z" fill="#34A853" />
                    <path d="M4.41 11.87A5.99 5.99 0 0 1 4.1 10c0-.65.11-1.28.31-1.87V5.53H1.06A10 10 0 0 0 0 10c0 1.61.38 3.14 1.06 4.47l3.35-2.6Z" fill="#FBBC05" />
                    <path d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.97 1 12.7 0 10 0A10 10 0 0 0 1.06 5.53l3.35 2.6C5.2 5.72 7.4 3.96 10 3.96Z" fill="#EA4335" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Settings sections */}
            <div className="px-5 mb-4">
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9CAF88",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                Help & About
              </p>
              <div
                style={{
                  borderRadius: 14,
                  backgroundColor: "#FAF7F1",
                  border: "1px solid #D8C3A5",
                  overflow: "hidden",
                }}
              >
                <SettingsRow
                  icon={<HelpCircle size={18} strokeWidth={1.5} color="#9CAF88" />}
                  label="Support & Feedback"
                  onClick={onSupport}
                />
                <SettingsRow
                  icon={<Info size={18} strokeWidth={1.5} color="#9CAF88" />}
                  label="About Plantfolio"
                  detail="v1.0.0"
                />
              </div>
            </div>

            {/* Sign out */}
            <div className="px-5">
              <div
                style={{
                  borderRadius: 14,
                  backgroundColor: "#FAF7F1",
                  border: "1px solid #D8C3A5",
                  overflow: "hidden",
                }}
              >
                <SettingsRow
                  icon={<LogOut size={18} strokeWidth={1.5} color="#c0392b" />}
                  label="Sign out"
                  danger
                  onClick={onSignOut}
                />
              </div>
            </div>
          </>
        ) : (
          <>
            {/* Guest account card */}
            <div className="px-5 pt-5 pb-2">
              <div
                className="flex flex-col items-center gap-4 p-6"
                style={{
                  borderRadius: 16,
                  backgroundColor: "#FAF7F1",
                  border: "1px solid #D8C3A5",
                }}
              >
                <div
                  className="flex items-center justify-center rounded-full"
                  style={{ width: 56, height: 56, backgroundColor: "#EDE8DC" }}
                >
                  <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
                    <path
                      d="M14 4C10.7 4 8 6.7 8 10s2.7 6 6 6 6-2.7 6-6-2.7-6-6-6ZM4 24c0-4.4 4.5-8 10-8s10 3.6 10 8"
                      stroke="#9CAF88"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="text-center">
                  <p
                    style={{
                      fontFamily: "'Fraunces', Georgia, serif",
                      fontSize: 18,
                      fontWeight: 500,
                      color: "#2F4A3D",
                      marginBottom: 6,
                    }}
                  >
                    Browsing as guest
                  </p>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 14,
                      color: "#7A776F",
                      lineHeight: 1.6,
                    }}
                  >
                    Sign in to save plants to lists, access your garden from any device, and sync across sessions.
                  </p>
                </div>
                <button
                  onClick={onSignIn}
                  className="w-full flex items-center justify-center gap-3"
                  style={{
                    height: 50,
                    borderRadius: 12,
                    backgroundColor: "transparent",
                    border: "1.5px solid #D8C3A5",
                    cursor: "pointer",
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 20 20">
                    <path d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.38a4.6 4.6 0 0 1-2 3.02v2.51h3.23c1.89-1.74 2.99-4.3 2.99-7.32Z" fill="#4285F4" />
                    <path d="M10 20c2.7 0 4.97-.9 6.62-2.45l-3.23-2.51c-.9.6-2.05.95-3.39.95-2.6 0-4.8-1.76-5.59-4.12H1.06v2.6A10 10 0 0 0 10 20Z" fill="#34A853" />
                    <path d="M4.41 11.87A5.99 5.99 0 0 1 4.1 10c0-.65.11-1.28.31-1.87V5.53H1.06A10 10 0 0 0 0 10c0 1.61.38 3.14 1.06 4.47l3.35-2.6Z" fill="#FBBC05" />
                    <path d="M10 3.96c1.47 0 2.79.5 3.83 1.5l2.87-2.87C14.97 1 12.7 0 10 0A10 10 0 0 0 1.06 5.53l3.35 2.6C5.2 5.72 7.4 3.96 10 3.96Z" fill="#EA4335" />
                  </svg>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 15,
                      fontWeight: 500,
                      color: "#33312C",
                    }}
                  >
                    Sign in with Google
                  </span>
                </button>
              </div>
            </div>

            {/* Settings sections */}
            <div className="px-5 mt-4">
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#9CAF88",
                  textTransform: "uppercase",
                  letterSpacing: "0.07em",
                  marginBottom: 8,
                  paddingLeft: 4,
                }}
              >
                Help & About
              </p>
              <div
                style={{
                  borderRadius: 14,
                  backgroundColor: "#FAF7F1",
                  border: "1px solid #D8C3A5",
                  overflow: "hidden",
                }}
              >
                <SettingsRow
                  icon={<HelpCircle size={18} strokeWidth={1.5} color="#9CAF88" />}
                  label="Support & Feedback"
                  onClick={onSupport}
                />
                <SettingsRow
                  icon={<Info size={18} strokeWidth={1.5} color="#9CAF88" />}
                  label="About Plantfolio"
                  detail="v1.0.0"
                />
              </div>
            </div>
          </>
        )}
      </div>

      <BottomNav active="account" onNavigate={onNavigate} />
    </div>
  );
}
