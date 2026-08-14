import { X, Plus, Check } from "lucide-react";
import { useState } from "react";
import { LISTS } from "../data";

interface SaveToListSheetProps {
  isGuest: boolean;
  onClose: () => void;
  onSignIn?: () => void;
}

export function SaveToListSheet({ isGuest, onClose, onSignIn }: SaveToListSheetProps) {
  const [checked, setChecked] = useState<Record<string, boolean>>({
    "front-yard": true,
  });
  const [newListName, setNewListName] = useState("");
  const [showNewListInput, setShowNewListInput] = useState(false);

  const toggle = (id: string) => setChecked((prev) => ({ ...prev, [id]: !prev[id] }));

  return (
    <>
      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(47,74,61,0.45)", zIndex: 40 }}
        onClick={onClose}
      />

      {/* Bottom sheet */}
      <div
        className="absolute bottom-0 left-0 right-0 flex flex-col"
        style={{
          zIndex: 50,
          backgroundColor: "#FAF7F1",
          borderRadius: "20px 20px 0 0",
          boxShadow: "0 -4px 24px rgba(47,74,61,0.12)",
          paddingBottom: 34,
        }}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div style={{ width: 40, height: 4, backgroundColor: "#D8C3A5", borderRadius: 2 }} />
        </div>

        {isGuest ? (
          /* Guest state */
          <div className="flex flex-col items-center px-6 py-6 gap-4">
            <div
              className="flex items-center justify-center rounded-full"
              style={{ width: 52, height: 52, backgroundColor: "#EDE8DC" }}
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
                Sign in to save plants
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  color: "#7A776F",
                  lineHeight: 1.5,
                }}
              >
                Create lists, track your favorites, and access your garden from any device.
              </p>
            </div>
            <button
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-3"
              style={{
                height: 50,
                borderRadius: 12,
                backgroundColor: "#FAF7F1",
                border: "1.5px solid #D8C3A5",
                cursor: "pointer",
              }}
            >
              {/* Google G mark */}
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
            <button
              onClick={onClose}
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#7A776F",
                border: "none",
                background: "none",
                cursor: "pointer",
              }}
            >
              Keep browsing as guest
            </button>
          </div>
        ) : (
          /* Signed-in state */
          <div className="flex flex-col">
            <div className="flex items-center justify-between px-5 py-3">
              <span
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 17,
                  fontWeight: 500,
                  color: "#2F4A3D",
                }}
              >
                Save to a list
              </span>
              <button onClick={onClose} style={{ border: "none", background: "none", cursor: "pointer" }}>
                <X size={20} strokeWidth={1.5} color="#9CAF88" />
              </button>
            </div>

            {/* Divider */}
            <div style={{ height: 1, backgroundColor: "#D8C3A5" }} />

            {/* List items */}
            <div className="flex flex-col">
              {LISTS.map((list) => (
                <button
                  key={list.id}
                  onClick={() => toggle(list.id)}
                  className="flex items-center justify-between px-5"
                  style={{
                    height: 54,
                    border: "none",
                    borderBottom: "1px solid #EDE8DC",
                    background: "none",
                    cursor: "pointer",
                  }}
                >
                  <div className="flex items-center gap-3">
                    <span style={{ fontSize: 20 }}>{list.emoji}</span>
                    <div className="text-left">
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 15,
                          fontWeight: 500,
                          color: "#2F4A3D",
                        }}
                      >
                        {list.name}
                      </p>
                      <p
                        style={{
                          fontFamily: "'Public Sans', sans-serif",
                          fontSize: 12,
                          color: "#9CAF88",
                        }}
                      >
                        {list.plantIds.length} plants
                      </p>
                    </div>
                  </div>
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: checked[list.id] ? "none" : "1.5px solid #D8C3A5",
                      backgroundColor: checked[list.id] ? "#C77B4D" : "transparent",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {checked[list.id] && <Check size={13} strokeWidth={2.5} color="#FAF7F1" />}
                  </div>
                </button>
              ))}
            </div>

            {/* Create new list */}
            <div className="px-5 pt-4">
              {showNewListInput ? (
                <div
                  className="flex items-center gap-2"
                  style={{
                    border: "1.5px solid #C77B4D",
                    borderRadius: 10,
                    padding: "8px 12px",
                  }}
                >
                  <input
                    autoFocus
                    value={newListName}
                    onChange={(e) => setNewListName(e.target.value)}
                    placeholder="List name…"
                    style={{
                      flex: 1,
                      border: "none",
                      background: "transparent",
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 14,
                      color: "#33312C",
                      outline: "none",
                    }}
                  />
                  <button
                    onClick={() => setShowNewListInput(false)}
                    style={{ border: "none", background: "none", cursor: "pointer" }}
                  >
                    <Check size={16} strokeWidth={2} color="#C77B4D" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewListInput(true)}
                  className="flex items-center gap-2"
                  style={{ border: "none", background: "none", cursor: "pointer" }}
                >
                  <div
                    style={{
                      width: 22,
                      height: 22,
                      borderRadius: 6,
                      border: "1.5px dashed #9CAF88",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={13} strokeWidth={2} color="#9CAF88" />
                  </div>
                  <span
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 14,
                      fontWeight: 500,
                      color: "#9CAF88",
                    }}
                  >
                    Create new list
                  </span>
                </button>
              )}
            </div>

            {/* Done button */}
            <div className="px-5 pt-4">
              <button
                onClick={onClose}
                className="w-full flex items-center justify-center"
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
                  Done
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
