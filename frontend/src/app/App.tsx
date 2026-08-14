import { useState, useMemo, useEffect, useRef, createContext, useContext, ReactNode } from "react";
import {
  Leaf, Bookmark, BookmarkCheck, Sun, Droplets, ChevronRight, ChevronDown,
  X, Plus, Search, Check, Camera, Settings, HelpCircle, LogOut, Pencil,
  Trash2, User, SendHorizonal,
} from "lucide-react";
import { Plant, PlantList } from "./data";
import { fetchPlants, fetchPlantById, googleSignIn, getCurrentUser, signOutRequest, type AuthUser } from "./api";

// ─── Types ────────────────────────────────────────────────────────────────────

type Page =
  | { name: "discover" }
  | { name: "plant"; id: string }
  | { name: "lists" }
  | { name: "list"; id: string }
  | { name: "support" }
  | { name: "account" };

interface FilterState {
  query: string;
  sunlight: Set<string>;
  zone: string;
  nativeOnly: boolean;
  floweringOnly: boolean;
  edibleOnly: boolean;
}

// Sidebar-editable subset of FilterState. Edits land here first and only
// take effect (and trigger a search) once the user clicks "Search" — query
// isn't included since the hero search box stays instant (it's free,
// client-side only, and isn't part of the left-nav sidebar).
type SidebarFilters = Omit<FilterState, "query">;

// ─── Context ──────────────────────────────────────────────────────────────────

interface AppCtx {
  page: Page;
  setPage: (p: Page) => void;
  isSignedIn: boolean;
  currentUser: AuthUser | null;
  completeSignIn: (user: AuthUser) => void;
  signOut: () => void;
  savedPlants: Set<string>;
  toggleSave: (id: string) => void;
  isSaved: (id: string) => boolean;
  userLists: PlantList[];
  addToList: (listId: string, plantId: string) => void;
  removeFromList: (listId: string, plantId: string) => void;
  createList: (name: string, emoji: string) => void;
  deleteList: (id: string) => void;
  renameList: (id: string, name: string) => void;
  filters: FilterState;
  setFilters: (f: Partial<FilterState>) => void;
  clearFilters: () => void;
  draftFilters: SidebarFilters;
  setDraftFilters: (f: Partial<SidebarFilters>) => void;
  applyDraftFilters: () => void;
  // 0 = no explicit search has happened yet. DiscoverPage's fetch effect
  // keys off this instead of the filter values themselves, so nothing ever
  // calls the API until Search is clicked (not even an implicit fetch on
  // first mount) — sidebar edits alone never bump it.
  searchTrigger: number;
  bumpSearchTrigger: () => void;
  cachePlants: (plants: Plant[]) => void;
  getPlantsForList: (list: PlantList) => Plant[];
  getCachedPlants: () => Plant[];
}

const AppContext = createContext<AppCtx | null>(null);

const FILTER_DEFAULTS: FilterState = {
  query: "",
  sunlight: new Set(),
  zone: "",
  nativeOnly: false,
  floweringOnly: false,
  edibleOnly: false,
};

const SIDEBAR_FILTER_DEFAULTS: SidebarFilters = {
  sunlight: new Set(),
  zone: "",
  nativeOnly: false,
  floweringOnly: false,
  edibleOnly: false,
};

function useApp() {
  const c = useContext(AppContext);
  if (!c) throw new Error("useApp must be used within AppProvider");
  return c;
}

function AppProvider({ children }: { children: ReactNode }) {
  const [page, setPage] = useState<Page>({ name: "discover" });
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [savedPlants, setSaved] = useState<Set<string>>(new Set());
  const [userLists, setLists] = useState<PlantList[]>([]);
  const [filters, setFiltersState] = useState<FilterState>(FILTER_DEFAULTS);
  const [draftFilters, setDraftFiltersState] = useState<SidebarFilters>(SIDEBAR_FILTER_DEFAULTS);
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [plantsCache, setPlantsCache] = useState<Map<string, Plant>>(new Map());

  // Restores the signed-in state from the backend session cookie (if any) on
  // load, rather than defaulting to signed-in like the original wireframe did.
  useEffect(() => {
    getCurrentUser()
      .then(setCurrentUser)
      .catch(() => setCurrentUser(null));
  }, []);

  const cachePlants = (plants: Plant[]) =>
    setPlantsCache((prev) => {
      const next = new Map(prev);
      plants.forEach((p) => next.set(p.id, p));
      return next;
    });

  const getPlantsForList = (list: PlantList): Plant[] =>
    list.plantIds
      .map((id) => plantsCache.get(id))
      .filter((p): p is Plant => Boolean(p));

  const getCachedPlants = (): Plant[] => Array.from(plantsCache.values());

  const ctx: AppCtx = {
    page,
    setPage,
    isSignedIn: currentUser !== null,
    currentUser,
    completeSignIn: (user) => setCurrentUser(user),
    signOut: () => {
      setCurrentUser(null);
      signOutRequest();
    },
    savedPlants,
    toggleSave: (id) =>
      setSaved((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      }),
    isSaved: (id) => savedPlants.has(id),
    userLists,
    addToList: (lid, pid) =>
      setLists((prev) =>
        prev.map((l) =>
          l.id === lid && !l.plantIds.includes(pid)
            ? { ...l, plantIds: [...l.plantIds, pid] }
            : l
        )
      ),
    removeFromList: (lid, pid) =>
      setLists((prev) =>
        prev.map((l) =>
          l.id === lid ? { ...l, plantIds: l.plantIds.filter((p) => p !== pid) } : l
        )
      ),
    createList: (name, emoji) =>
      setLists((prev) => [
        ...prev,
        { id: `list-${Date.now()}`, name, emoji, plantIds: [] },
      ]),
    deleteList: (id) => setLists((prev) => prev.filter((l) => l.id !== id)),
    renameList: (id, name) =>
      setLists((prev) => prev.map((l) => (l.id === id ? { ...l, name } : l))),
    filters,
    setFilters: (f) => setFiltersState((prev) => ({ ...prev, ...f })),
    clearFilters: () => {
      setFiltersState(FILTER_DEFAULTS);
      setDraftFiltersState(SIDEBAR_FILTER_DEFAULTS);
      setSearchTrigger(0);
    },
    draftFilters,
    setDraftFilters: (f) => setDraftFiltersState((prev) => ({ ...prev, ...f })),
    applyDraftFilters: () => {
      setFiltersState((prev) => ({ ...prev, ...draftFilters }));
      setSearchTrigger((n) => n + 1);
    },
    searchTrigger,
    bumpSearchTrigger: () => setSearchTrigger((n) => n + 1),
    cachePlants,
    getPlantsForList,
    getCachedPlants,
  };

  return <AppContext.Provider value={ctx}>{children}</AppContext.Provider>;
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function PlantfolioLogo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 220 220" fill="none">
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
        <g key={i} transform={`rotate(${deg} 110 110)`}>
          <ellipse cx="110" cy="52" rx="13" ry="42" fill="#E3A83B" stroke="#C98F27" strokeWidth="2" />
        </g>
      ))}
      <line x1="88" y1="136" x2="32" y2="204" stroke="#2F4A3D" strokeWidth="16" strokeLinecap="round" />
      <circle cx="110" cy="110" r="40" fill="none" stroke="#C77B4D" strokeWidth="3" />
      <circle cx="110" cy="110" r="33" fill="#2E2013" />
    </svg>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header() {
  const { page, setPage, isSignedIn, currentUser } = useApp();
  const active = page.name;
  const initials = (currentUser?.name ?? currentUser?.email ?? "?")
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  function NavLink({
    target,
    label,
  }: {
    target: "discover" | "lists" | "support" | "account";
    label: string;
  }) {
    const isActive = active === target;
    return (
      <button
        onClick={() => setPage({ name: target } as Page)}
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          fontWeight: 500,
          color: isActive ? "#F6F1E7" : "rgba(246,241,231,0.5)",
          background: isActive ? "rgba(255,255,255,0.13)" : "transparent",
          border: "none",
          borderRadius: 8,
          padding: "6px 13px",
          cursor: "pointer",
          transition: "color 0.15s, background 0.15s",
        }}
      >
        {label}
      </button>
    );
  }

  return (
    <header
      style={{
        height: 60,
        backgroundColor: "#2F4A3D",
        borderBottom: "1px solid rgba(255,255,255,0.07)",
        display: "flex",
        alignItems: "center",
        gap: 4,
        padding: "0 24px",
        flexShrink: 0,
        position: "sticky",
        top: 0,
        zIndex: 50,
      }}
    >
      {/* Wordmark */}
      <button
        onClick={() => setPage({ name: "discover" })}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: "0 4px 0 0",
          marginRight: 8,
        }}
      >
        <PlantfolioLogo size={26} />
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 17,
            fontWeight: 600,
            color: "#F6F1E7",
            letterSpacing: "-0.01em",
          }}
        >
          Plantfolio
        </span>
      </button>

      {/* Primary nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
        <NavLink target="discover" label="Discover" />
        <NavLink target="lists" label="My Lists" />
      </div>

      <div style={{ flex: 1 }} />

      {/* Secondary nav */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <NavLink target="support" label="Support" />

        {isSignedIn ? (
          <button
            onClick={() => setPage({ name: "account" })}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              background:
                active === "account"
                  ? "rgba(255,255,255,0.16)"
                  : "rgba(255,255,255,0.09)",
              border: "none",
              borderRadius: 20,
              padding: "4px 12px 4px 4px",
              cursor: "pointer",
              transition: "background 0.15s",
            }}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: "50%",
                backgroundColor: "#C77B4D",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 12,
                fontWeight: 600,
                color: "#F6F1E7",
                flexShrink: 0,
              }}
            >
              {initials}
            </div>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#F6F1E7",
              }}
            >
              {currentUser?.name ?? currentUser?.email}
            </span>
          </button>
        ) : (
          <button
            onClick={() => setPage({ name: "account" })}
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              backgroundColor: "#C77B4D",
              color: "#F6F1E7",
              border: "none",
              borderRadius: 8,
              padding: "7px 16px",
              cursor: "pointer",
            }}
          >
            Sign in
          </button>
        )}
      </div>
    </header>
  );
}

// ─── Google Sign-In Button ────────────────────────────────────────────────────
// Wraps Google Identity Services (loaded via the <script> tag in index.html).
// Renders Google's own button into a div ref rather than a custom button,
// since GIS owns the click handling and credential flow.

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (resp: { credential: string }) => void }) => void;
          renderButton: (parent: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

function GoogleSignInButton({ onSuccess }: { onSuccess: (user: AuthUser) => void }) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

  useEffect(() => {
    if (!clientId) return;
    let cancelled = false;

    function tryRender(attemptsLeft: number) {
      if (cancelled) return;
      if (!window.google?.accounts?.id) {
        if (attemptsLeft > 0) setTimeout(() => tryRender(attemptsLeft - 1), 100);
        return;
      }
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: async (response) => {
          try {
            const user = await googleSignIn(response.credential);
            onSuccess(user);
          } catch (err) {
            console.error("Google sign-in failed", err);
          }
        },
      });
      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          width: 300,
        });
      }
    }

    tryRender(40);
    return () => {
      cancelled = true;
    };
  }, [clientId, onSuccess]);

  if (!clientId) {
    return (
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 12,
          color: "#9CAF88",
          textAlign: "center",
        }}
      >
        Google sign-in isn't configured (missing VITE_GOOGLE_CLIENT_ID).
      </p>
    );
  }

  return <div ref={buttonRef} style={{ display: "flex", justifyContent: "center" }} />;
}

// ─── Sign-in Gate Modal ───────────────────────────────────────────────────────

function GateModal({ onClose }: { onClose: () => void }) {
  const { completeSignIn } = useApp();
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(47,74,61,0.48)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#FAF7F1",
          borderRadius: 20,
          padding: "36px 32px",
          maxWidth: 380,
          width: "100%",
          position: "relative",
          boxShadow: "0 28px 72px rgba(47,74,61,0.24)",
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 14,
            right: 14,
            width: 30,
            height: 30,
            borderRadius: "50%",
            backgroundColor: "#EDE8DC",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={14} strokeWidth={2} color="#2F4A3D" />
        </button>
        <div
          style={{
            width: 56,
            height: 56,
            borderRadius: "50%",
            backgroundColor: "#EDE8DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Bookmark size={24} strokeWidth={1.5} color="#C77B4D" />
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 21,
            fontWeight: 500,
            color: "#2F4A3D",
            textAlign: "center",
            marginBottom: 8,
          }}
        >
          Save plants to your lists
        </h2>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 14,
            color: "#7A776F",
            textAlign: "center",
            lineHeight: 1.65,
            marginBottom: 24,
          }}
        >
          Create a free account to save plants and build curated garden collections.
        </p>
        <GoogleSignInButton
          onSuccess={(user) => {
            completeSignIn(user);
            onClose();
          }}
        />
      </div>
    </div>
  );
}

// ─── Save-to-List Modal ───────────────────────────────────────────────────────

const LIST_EMOJIS = ["🌿", "🌱", "🌻", "🍃", "🌲", "🌸", "🪴", "🌾"];

function SaveModal({ plantId, onClose }: { plantId: string; onClose: () => void }) {
  const { userLists, addToList, removeFromList, createList } = useApp();
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌿");

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 100,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        backgroundColor: "rgba(47,74,61,0.48)",
        backdropFilter: "blur(6px)",
      }}
    >
      <div
        style={{
          backgroundColor: "#FAF7F1",
          borderRadius: 20,
          maxWidth: 440,
          width: "100%",
          overflow: "hidden",
          boxShadow: "0 28px 72px rgba(47,74,61,0.24)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid #E8E2D4",
          }}
        >
          <h3
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 18,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            Save to list
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30,
              height: 30,
              borderRadius: "50%",
              backgroundColor: "#EDE8DC",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <X size={14} strokeWidth={2} color="#2F4A3D" />
          </button>
        </div>

        {/* List items */}
        <div
          style={{
            maxHeight: 280,
            overflowY: "auto",
            padding: "12px 16px",
            display: "flex",
            flexDirection: "column",
            gap: 7,
          }}
        >
          {userLists.map((list) => {
            const inList = list.plantIds.includes(plantId);
            return (
              <button
                key={list.id}
                onClick={() =>
                  inList
                    ? removeFromList(list.id, plantId)
                    : addToList(list.id, plantId)
                }
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 14px",
                  borderRadius: 11,
                  textAlign: "left",
                  backgroundColor: inList ? "#EDE8DC" : "transparent",
                  border: "1px solid #E8E2D4",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 20 }}>{list.emoji}</span>
                <div style={{ flex: 1 }}>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 14,
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
                {inList && <Check size={16} strokeWidth={2.2} color="#C77B4D" />}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #E8E2D4" }}>
          {creating ? (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {LIST_EMOJIS.map((e) => (
                  <button
                    key={e}
                    onClick={() => setNewEmoji(e)}
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 8,
                      fontSize: 18,
                      border:
                        e === newEmoji ? "1.5px solid #C77B4D" : "1px solid #E8E2D4",
                      backgroundColor: e === newEmoji ? "#EDE8DC" : "transparent",
                      cursor: "pointer",
                    }}
                  >
                    {e}
                  </button>
                ))}
              </div>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="List name…"
                style={{
                  padding: "10px 14px",
                  borderRadius: 10,
                  border: "1px solid #D8C3A5",
                  backgroundColor: "#EDE8DC",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  color: "#2F4A3D",
                  outline: "none",
                }}
              />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setCreating(false)}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 10,
                    border: "1px solid #D8C3A5",
                    backgroundColor: "transparent",
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    color: "#7A776F",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  disabled={!newName.trim()}
                  onClick={() => {
                    createList(newName.trim(), newEmoji);
                    setCreating(false);
                    setNewName("");
                  }}
                  style={{
                    flex: 1,
                    padding: "9px 0",
                    borderRadius: 10,
                    border: "none",
                    backgroundColor: newName.trim() ? "#C77B4D" : "#E8E2D4",
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    fontWeight: 500,
                    color: newName.trim() ? "#F6F1E7" : "#9CAF88",
                    cursor: newName.trim() ? "pointer" : "not-allowed",
                  }}
                >
                  Create
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setCreating(true)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                backgroundColor: "transparent",
                border: "none",
                cursor: "pointer",
              }}
            >
              <Plus size={14} strokeWidth={2.2} color="#C77B4D" />
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#C77B4D",
                }}
              >
                New list
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plant Card (grid card) ───────────────────────────────────────────────────

function PlantCard({ plant }: { plant: Plant }) {
  const { isSaved, toggleSave, isSignedIn, setPage } = useApp();
  const [gateOpen, setGateOpen] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [hovered, setHovered] = useState(false);
  const saved = isSaved(plant.id);

  return (
    <>
      <div
        onClick={() => setPage({ name: "plant", id: plant.id })}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          borderRadius: 14,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          cursor: "pointer",
          backgroundColor: "#FAF7F1",
          border: "1px solid #E8E2D4",
          boxShadow: hovered
            ? "0 10px 30px rgba(47,74,61,0.14)"
            : "0 1px 4px rgba(47,74,61,0.06)",
          transform: hovered ? "translateY(-3px)" : "translateY(0)",
          transition: "box-shadow 0.18s, transform 0.18s",
        }}
      >
        {/* Image */}
        <div
          style={{ position: "relative", paddingBottom: "65%", overflow: "hidden", flexShrink: 0 }}
        >
          <img
            src={plant.imageUrl}
            alt={plant.commonName}
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transition: "transform 0.35s",
              transform: hovered ? "scale(1.06)" : "scale(1)",
            }}
          />
          {plant.native && (
            <span
              style={{
                position: "absolute",
                top: 10,
                left: 10,
                backgroundColor: "#2F4A3D",
                color: "#F6F1E7",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 11,
                fontWeight: 600,
                borderRadius: 999,
                padding: "3px 9px",
              }}
            >
              Native
            </span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isSignedIn) {
                setGateOpen(true);
                return;
              }
              if (saved) toggleSave(plant.id);
              else setSaveOpen(true);
            }}
            style={{
              position: "absolute",
              top: 10,
              right: 10,
              width: 34,
              height: 34,
              borderRadius: "50%",
              backgroundColor: saved ? "#C77B4D" : "rgba(246,241,231,0.92)",
              backdropFilter: "blur(4px)",
              border: "none",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              opacity: hovered || saved ? 1 : 0,
              transition: "opacity 0.15s",
            }}
          >
            {saved ? (
              <BookmarkCheck size={15} strokeWidth={1.8} color="#F6F1E7" />
            ) : (
              <Bookmark size={15} strokeWidth={1.8} color="#2F4A3D" />
            )}
          </button>
        </div>

        {/* Info */}
        <div
          style={{
            padding: "14px 14px 13px",
            display: "flex",
            flexDirection: "column",
            gap: 8,
            flex: 1,
          }}
        >
          <div>
            <p
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
              }}
            >
              {plant.latinName}
            </p>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
            {plant.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                style={{
                  backgroundColor: "#EDE8DC",
                  color: "#2F4A3D",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  borderRadius: 999,
                  padding: "3px 9px",
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              paddingTop: 8,
              borderTop: "1px solid #EDE8DC",
              marginTop: "auto",
            }}
          >
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: "#7A776F",
              }}
            >
              <Sun size={12} strokeWidth={1.5} color="#C77B4D" />
              {plant.sunlight}
            </span>
            <span
              style={{
                display: "flex",
                alignItems: "center",
                gap: 4,
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 12,
                color: "#7A776F",
              }}
            >
              <Leaf size={12} strokeWidth={1.5} color="#9CAF88" />
              Zone {plant.zones}
            </span>
            {plant.edible && (
              <span
                style={{
                  marginLeft: "auto",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  fontWeight: 500,
                  color: "#9CAF88",
                }}
              >
                Edible
              </span>
            )}
          </div>
        </div>
      </div>

      {gateOpen && <GateModal onClose={() => setGateOpen(false)} />}
      {saveOpen && <SaveModal plantId={plant.id} onClose={() => setSaveOpen(false)} />}
    </>
  );
}

// ─── Filter Sidebar ───────────────────────────────────────────────────────────

function FilterSidebar() {
  const { draftFilters, setDraftFilters, applyDraftFilters, clearFilters } = useApp();

  const toggleSun = (v: string) => {
    const n = new Set(draftFilters.sunlight);
    n.has(v) ? n.delete(v) : n.add(v);
    setDraftFilters({ sunlight: n });
  };

  const activeCount =
    draftFilters.sunlight.size +
    (draftFilters.zone ? 1 : 0) +
    (draftFilters.nativeOnly ? 1 : 0) +
    (draftFilters.floweringOnly ? 1 : 0) +
    (draftFilters.edibleOnly ? 1 : 0);

  return (
    <aside
      style={{
        width: 252,
        flexShrink: 0,
        backgroundColor: "#FAF7F1",
        borderRight: "1px solid #E8E2D4",
        overflowY: "auto",
        padding: "22px 18px",
      }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 22,
        }}
      >
        <span
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 16,
            fontWeight: 500,
            color: "#2F4A3D",
          }}
        >
          Filters
        </span>
        {activeCount > 0 && (
          <button
            onClick={clearFilters}
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              color: "#C77B4D",
              background: "none",
              border: "none",
              cursor: "pointer",
            }}
          >
            Clear ({activeCount})
          </button>
        )}
      </div>

      {/* Sunlight */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: "#9CAF88",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 9,
          }}
        >
          Sunlight
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
          {["Full Sun", "Partial", "Shade"].map((s) => {
            const on = draftFilters.sunlight.has(s);
            return (
              <button
                key={s}
                onClick={() => toggleSun(s)}
                style={{
                  padding: "6px 13px",
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: "'Public Sans', sans-serif",
                  backgroundColor: on ? "#2F4A3D" : "#EDE8DC",
                  color: on ? "#F6F1E7" : "#2F4A3D",
                  border: "none",
                  cursor: "pointer",
                  transition: "background 0.12s, color 0.12s",
                }}
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>

      {/* USDA Zone */}
      <div style={{ marginBottom: 20 }}>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: "#9CAF88",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 9,
          }}
        >
          USDA Zone
        </p>
        <select
          value={draftFilters.zone}
          onChange={(e) => setDraftFilters({ zone: e.target.value })}
          style={{
            width: "100%",
            padding: "8px 12px",
            borderRadius: 8,
            border: "1px solid #D8C3A5",
            backgroundColor: "#EDE8DC",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: "#2F4A3D",
            outline: "none",
            boxSizing: "border-box",
          }}
        >
          <option value="">Any zone</option>
          {Array.from({ length: 13 }, (_, i) => i + 1).map((z) => (
            <option key={z} value={String(z)}>
              Zone {z}
            </option>
          ))}
        </select>
      </div>

      {/* Plant Traits */}
      <div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 10,
            fontWeight: 700,
            color: "#9CAF88",
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: 9,
          }}
        >
          Plant Traits
        </p>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {(
            [
              { label: "Native plants only", key: "nativeOnly" },
              { label: "Flowering", key: "floweringOnly" },
              { label: "Edible", key: "edibleOnly" },
            ] as Array<{ label: string; key: "nativeOnly" | "floweringOnly" | "edibleOnly" }>
          ).map(({ label, key }) => {
            const on = draftFilters[key];
            return (
              <button
                key={key}
                onClick={() => setDraftFilters({ [key]: !on })}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  borderRadius: 8,
                  width: "100%",
                  textAlign: "left",
                  backgroundColor: on ? "#EDE8DC" : "transparent",
                  border: on ? "1px solid #D8C3A5" : "1px solid transparent",
                  cursor: "pointer",
                  transition: "background 0.12s",
                }}
              >
                <span
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    color: on ? "#2F4A3D" : "#7A776F",
                    fontWeight: on ? 500 : 400,
                  }}
                >
                  {label}
                </span>
                <div
                  style={{
                    width: 18,
                    height: 18,
                    borderRadius: 4,
                    border: on ? "none" : "1.5px solid #D8C3A5",
                    backgroundColor: on ? "#2F4A3D" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {on && <Check size={11} strokeWidth={2.5} color="#F6F1E7" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <button
        onClick={applyDraftFilters}
        style={{
          width: "100%",
          marginTop: 20,
          padding: "10px 0",
          borderRadius: 10,
          backgroundColor: "#C77B4D",
          color: "#F6F1E7",
          border: "none",
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          fontWeight: 600,
          cursor: "pointer",
        }}
      >
        Search
      </button>
    </aside>
  );
}

// ─── Discover Page ────────────────────────────────────────────────────────────

function DiscoverPage() {
  const { filters, setFilters, setDraftFilters, clearFilters, cachePlants, searchTrigger, bumpSearchTrigger } =
    useApp();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Keyed on searchTrigger (bumped only by clicking "Search" or removing an
  // active-filter chip below) rather than the filter values themselves, so
  // nothing calls the API — not even on first mount — until the user
  // explicitly asks for it. Sunlight/edible/zone are filtered server-side
  // (zone via an inclusive range match — see backend/app/perenual_client.py).
  // Query/native/flowering stay client-side since Perenual doesn't support them.
  useEffect(() => {
    if (searchTrigger === 0) {
      setPlants([]);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPlants({
      sunlight: [...filters.sunlight],
      edible: filters.edibleOnly,
      zone: filters.zone || undefined,
    })
      .then((results) => {
        if (cancelled) return;
        setPlants(results);
        cachePlants(results);
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load plants");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTrigger]);

  const filtered = useMemo(() => {
    return plants.filter((p) => {
      if (
        filters.query &&
        !p.commonName.toLowerCase().includes(filters.query.toLowerCase()) &&
        !p.latinName.toLowerCase().includes(filters.query.toLowerCase())
      )
        return false;
      if (filters.nativeOnly && !p.native) return false;
      if (filters.floweringOnly && !p.flowering) return false;
      return true;
    });
  }, [plants, filters]);

  const activeCount =
    filters.sunlight.size +
    (filters.zone ? 1 : 0) +
    (filters.nativeOnly ? 1 : 0) +
    (filters.floweringOnly ? 1 : 0) +
    (filters.edibleOnly ? 1 : 0);

  return (
    <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
      {/* Sticky filter sidebar */}
      <FilterSidebar />

      {/* Scrollable content */}
      <div style={{ flex: 1, overflowY: "auto" }}>
        {/* Hero + Search */}
        <div
          style={{
            padding: "36px 40px 32px",
            background: "linear-gradient(135deg, #2F4A3D 0%, #3B5C4E 100%)",
          }}
        >
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 28,
              fontWeight: 500,
              color: "#F6F1E7",
              lineHeight: 1.2,
              marginBottom: 6,
            }}
          >
            Discover Native Plants
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              color: "rgba(246,241,231,0.62)",
              marginBottom: 18,
            }}
          >
            Browse plants native to your region — matched to your sunlight, soil, and climate zone.
          </p>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              height: 46,
              backgroundColor: "rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "0 14px",
              backdropFilter: "blur(4px)",
              maxWidth: 520,
            }}
          >
            <Search size={15} strokeWidth={1.5} color="rgba(246,241,231,0.5)" />
            <input
              value={filters.query}
              onChange={(e) => setFilters({ query: e.target.value })}
              placeholder="Search by common or latin name…"
              style={{
                flex: 1,
                background: "transparent",
                border: "none",
                outline: "none",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#F6F1E7",
              }}
            />
            {filters.query && (
              <button
                onClick={() => setFilters({ query: "" })}
                style={{ background: "none", border: "none", cursor: "pointer" }}
              >
                <X size={14} strokeWidth={2} color="rgba(246,241,231,0.5)" />
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeCount > 0 && (
          <div
            style={{
              padding: "10px 40px",
              borderBottom: "1px solid #E8E2D4",
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexWrap: "wrap",
            }}
          >
            {[...filters.sunlight].map((s) => (
              <span
                key={s}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "#2F4A3D",
                  color: "#F6F1E7",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                {s}
                <button
                  onClick={() => {
                    const n = new Set(filters.sunlight);
                    n.delete(s);
                    setFilters({ sunlight: n });
                    setDraftFilters({ sunlight: n });
                    bumpSearchTrigger();
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                >
                  <X size={10} strokeWidth={2.2} color="#9CAF88" />
                </button>
              </span>
            ))}
            {filters.nativeOnly && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "#2F4A3D",
                  color: "#F6F1E7",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                Native only
                <button
                  onClick={() => {
                    setFilters({ nativeOnly: false });
                    setDraftFilters({ nativeOnly: false });
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                >
                  <X size={10} strokeWidth={2.2} color="#9CAF88" />
                </button>
              </span>
            )}
            {filters.floweringOnly && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "#2F4A3D",
                  color: "#F6F1E7",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                Flowering
                <button
                  onClick={() => {
                    setFilters({ floweringOnly: false });
                    setDraftFilters({ floweringOnly: false });
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                >
                  <X size={10} strokeWidth={2.2} color="#9CAF88" />
                </button>
              </span>
            )}
            {filters.edibleOnly && (
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  backgroundColor: "#2F4A3D",
                  color: "#F6F1E7",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 12,
                  borderRadius: 999,
                  padding: "4px 10px",
                }}
              >
                Edible
                <button
                  onClick={() => {
                    setFilters({ edibleOnly: false });
                    setDraftFilters({ edibleOnly: false });
                    bumpSearchTrigger();
                  }}
                  style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
                >
                  <X size={10} strokeWidth={2.2} color="#9CAF88" />
                </button>
              </span>
            )}
          </div>
        )}

        {/* Results */}
        <div style={{ padding: "22px 40px 48px" }}>
          {searchTrigger > 0 && (
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 13,
                color: "#7A776F",
                marginBottom: 18,
              }}
            >
              <span style={{ fontWeight: 600, color: "#2F4A3D" }}>{filtered.length}</span> plants
              found
            </p>
          )}

          {searchTrigger === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 0",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#EDE8DC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Search size={28} strokeWidth={1.5} color="#9CAF88" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 500,
                    color: "#2F4A3D",
                    marginBottom: 8,
                  }}
                >
                  Set your filters and search
                </p>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 14,
                    color: "#7A776F",
                    lineHeight: 1.65,
                    maxWidth: 340,
                  }}
                >
                  Pick a sunlight, zone, or trait filter in the sidebar (optional), then click
                  Search to browse plants.
                </p>
              </div>
            </div>
          ) : error ? (
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 14, color: "#C77B4D" }}>
              {error}
            </p>
          ) : loading ? (
            <p style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 14, color: "#7A776F" }}>
              Loading plants…
            </p>
          ) : filtered.length === 0 ? (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                padding: "80px 0",
                gap: 16,
              }}
            >
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  backgroundColor: "#EDE8DC",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Leaf size={30} strokeWidth={1.5} color="#9CAF88" />
              </div>
              <div style={{ textAlign: "center" }}>
                <p
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 20,
                    fontWeight: 500,
                    color: "#2F4A3D",
                    marginBottom: 8,
                  }}
                >
                  No plants match those filters
                </p>
                <p
                  style={{
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 14,
                    color: "#7A776F",
                    lineHeight: 1.65,
                    maxWidth: 340,
                  }}
                >
                  Try loosening sun or soil requirements — most native plants tolerate some
                  variation.
                </p>
              </div>
              <button
                onClick={clearFilters}
                style={{
                  padding: "9px 22px",
                  borderRadius: 10,
                  border: "1.5px solid #C77B4D",
                  backgroundColor: "transparent",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#C77B4D",
                  cursor: "pointer",
                }}
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(228px, 1fr))",
                gap: 20,
              }}
            >
              {filtered.map((p) => (
                <PlantCard key={p.id} plant={p} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Plant Detail Page ────────────────────────────────────────────────────────

function PlantDetailPage({ plantId }: { plantId: string }) {
  const { isSaved, toggleSave, isSignedIn, setPage, cachePlants, getCachedPlants } = useApp();
  const [plant, setPlant] = useState<Plant | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [saveOpen, setSaveOpen] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setPlant(null);
    setNotFound(false);
    fetchPlantById(plantId)
      .then((result) => {
        if (cancelled) return;
        setPlant(result);
        cachePlants([result]);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [plantId]);

  const saved = plant ? isSaved(plant.id) : false;
  // "Related" plants come from whatever's already been fetched into the
  // shared cache (e.g. from Discover), rather than a separate API call.
  const related = getCachedPlants()
    .filter((p) => p.id !== plantId)
    .slice(0, 4);

  if (notFound) {
    return (
      <div style={{ padding: 40, fontFamily: "'Public Sans', sans-serif", color: "#7A776F" }}>
        Plant not found.
      </div>
    );
  }

  if (!plant) {
    return (
      <div style={{ padding: 40, fontFamily: "'Public Sans', sans-serif", color: "#7A776F" }}>
        Loading…
      </div>
    );
  }

  return (
    <>
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 40px 64px" }}>
        {/* Breadcrumb */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 28,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: "#9CAF88",
          }}
        >
          <button
            onClick={() => setPage({ name: "discover" })}
            style={{
              color: "#9CAF88",
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 0,
            }}
          >
            Discover
          </button>
          <ChevronRight size={13} strokeWidth={1.5} color="#D8C3A5" />
          <span style={{ color: "#2F4A3D" }}>{plant.commonName}</span>
        </div>

        {/* Two-column layout */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 52,
            alignItems: "start",
          }}
        >
          {/* Left: photo + tags */}
          <div>
            <div
              style={{
                borderRadius: 20,
                overflow: "hidden",
                aspectRatio: "4/3",
                backgroundColor: "#EDE8DC",
              }}
            >
              <img
                src={plant.imageUrl}
                alt={plant.commonName}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 16 }}>
              {plant.tags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    backgroundColor: "#EDE8DC",
                    color: "#2F4A3D",
                    fontFamily: "'Public Sans', sans-serif",
                    fontSize: 13,
                    borderRadius: 999,
                    padding: "5px 13px",
                    border: "1px solid #D8C3A5",
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Right: info */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Name + badge */}
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <h1
                  style={{
                    fontFamily: "'Fraunces', Georgia, serif",
                    fontSize: 34,
                    fontWeight: 500,
                    color: "#2F4A3D",
                    lineHeight: 1.15,
                    flex: 1,
                  }}
                >
                  {plant.commonName}
                </h1>
                {plant.native && (
                  <span
                    style={{
                      backgroundColor: "#2F4A3D",
                      color: "#F6F1E7",
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 12,
                      fontWeight: 600,
                      borderRadius: 999,
                      padding: "4px 12px",
                      flexShrink: 0,
                      marginTop: 6,
                    }}
                  >
                    Native
                  </span>
                )}
              </div>
              <p
                style={{
                  fontFamily: "'IBM Plex Mono', monospace",
                  fontSize: 14,
                  color: "#9CAF88",
                  marginTop: 4,
                  marginBottom: 14,
                }}
              >
                {plant.latinName}
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 15,
                  color: "#555250",
                  lineHeight: 1.75,
                }}
              >
                {plant.description}
              </p>
            </div>

            {/* Care cards */}
            <div
              style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}
            >
              {[
                {
                  icon: <Droplets size={13} strokeWidth={1.5} color="#9CAF88" />,
                  label: "Water",
                  value: plant.water,
                },
                {
                  icon: <Leaf size={13} strokeWidth={1.5} color="#9CAF88" />,
                  label: "Mature Size",
                  value: plant.matureSize,
                },
                {
                  icon: <Sun size={13} strokeWidth={1.5} color="#C77B4D" />,
                  label: "Bloom",
                  value: plant.bloomSeason,
                },
              ].map((c) => (
                <div
                  key={c.label}
                  style={{
                    backgroundColor: "#EDE8DC",
                    borderRadius: 12,
                    padding: "12px 14px",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 5,
                      marginBottom: 5,
                    }}
                  >
                    {c.icon}
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#9CAF88",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                      }}
                    >
                      {c.label}
                    </span>
                  </div>
                  <p
                    style={{
                      fontFamily: "'Public Sans', sans-serif",
                      fontSize: 13,
                      color: "#2F4A3D",
                      fontWeight: 500,
                      lineHeight: 1.4,
                    }}
                  >
                    {c.value}
                  </p>
                </div>
              ))}
            </div>

            {/* Plant data grid */}
            <div
              style={{
                backgroundColor: "#EDE8DC",
                borderRadius: 14,
                padding: "16px 18px",
              }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "14px 24px",
                }}
              >
                {[
                  ["Sunlight", plant.sunlight],
                  ["USDA Zones", plant.zones],
                  ["Soil types", plant.soilTypes.join(", ")],
                  ["Flowering", plant.flowering ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 10,
                        fontWeight: 700,
                        color: "#9CAF88",
                        textTransform: "uppercase",
                        letterSpacing: "0.07em",
                        marginBottom: 3,
                      }}
                    >
                      {k}
                    </p>
                    <p
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 14,
                        color: "#2F4A3D",
                        fontWeight: 500,
                      }}
                    >
                      {v}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={() => {
                if (!isSignedIn) {
                  setGateOpen(true);
                  return;
                }
                if (saved) toggleSave(plant.id);
                else setSaveOpen(true);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
                padding: "14px 0",
                borderRadius: 14,
                backgroundColor: saved ? "#EDE8DC" : "#C77B4D",
                color: saved ? "#2F4A3D" : "#F6F1E7",
                border: saved ? "1px solid #D8C3A5" : "none",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {saved ? (
                <>
                  <BookmarkCheck size={18} strokeWidth={1.8} /> Saved to a list
                </>
              ) : (
                <>
                  <Bookmark size={18} strokeWidth={1.8} /> Save to a list
                </>
              )}
            </button>
          </div>
        </div>

        {/* Related plants */}
        <div style={{ marginTop: 56 }}>
          <h2
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 22,
              fontWeight: 500,
              color: "#2F4A3D",
              marginBottom: 20,
            }}
          >
            You might also like
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: 18,
            }}
          >
            {related.map((p) => (
              <PlantCard key={p.id} plant={p} />
            ))}
          </div>
        </div>
      </div>

      {saveOpen && <SaveModal plantId={plant.id} onClose={() => setSaveOpen(false)} />}
      {gateOpen && <GateModal onClose={() => setGateOpen(false)} />}
    </>
  );
}

// ─── List Card ────────────────────────────────────────────────────────────────

function ListCard({
  list,
  plants,
  onClick,
}: {
  list: PlantList;
  plants: Plant[];
  onClick: () => void;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        textAlign: "left",
        borderRadius: 16,
        overflow: "hidden",
        backgroundColor: "#FAF7F1",
        border: "1px solid #E8E2D4",
        cursor: "pointer",
        boxShadow: hov
          ? "0 10px 30px rgba(47,74,61,0.13)"
          : "0 1px 4px rgba(47,74,61,0.06)",
        transform: hov ? "translateY(-3px)" : "translateY(0)",
        transition: "box-shadow 0.18s, transform 0.18s",
      }}
    >
      {/* 2×2 photo collage */}
      <div
        style={{
          height: 140,
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gridTemplateRows: "1fr 1fr",
          gap: 2,
          backgroundColor: "#EDE8DC",
          flexShrink: 0,
        }}
      >
        {[0, 1, 2, 3].map((i) => (
          <div key={i} style={{ backgroundColor: "#EDE8DC", overflow: "hidden" }}>
            {plants[i] && (
              <img
                src={plants[i].imageUrl}
                alt=""
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ padding: "14px 16px" }}>
        <div
          style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}
        >
          <span style={{ fontSize: 18 }}>{list.emoji}</span>
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 16,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            {list.name}
          </p>
        </div>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            color: "#9CAF88",
          }}
        >
          {list.plantIds.length} {list.plantIds.length === 1 ? "plant" : "plants"}
        </p>
      </div>
    </button>
  );
}

// ─── New List Card ────────────────────────────────────────────────────────────

function NewListCard({ onClick }: { onClick: () => void }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 10,
        minHeight: 200,
        borderRadius: 16,
        border: `1.5px dashed ${hov ? "#C77B4D" : "#D8C3A5"}`,
        backgroundColor: "transparent",
        cursor: "pointer",
        transition: "border-color 0.15s",
      }}
    >
      <div
        style={{
          width: 44,
          height: 44,
          borderRadius: "50%",
          backgroundColor: "#EDE8DC",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Plus size={20} strokeWidth={1.8} color="#9CAF88" />
      </div>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
          color: "#9CAF88",
        }}
      >
        New list
      </p>
    </button>
  );
}

// ─── My Lists Page ────────────────────────────────────────────────────────────

function MyListsPage() {
  const { isSignedIn, userLists, setPage, createList, getPlantsForList } = useApp();
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState("");
  const [newEmoji, setNewEmoji] = useState("🌿");

  if (!isSignedIn) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "80px 32px",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#EDE8DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <Leaf size={36} strokeWidth={1.3} color="#9CAF88" />
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 26,
            fontWeight: 500,
            color: "#2F4A3D",
            textAlign: "center",
          }}
        >
          Your plant lists live here
        </h2>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 15,
            color: "#7A776F",
            lineHeight: 1.65,
            textAlign: "center",
            maxWidth: 360,
          }}
        >
          Sign in to create and manage your curated plant collections.
        </p>
        <button
          onClick={() => setPage({ name: "account" })}
          style={{
            marginTop: 8,
            padding: "12px 28px",
            borderRadius: 12,
            backgroundColor: "#C77B4D",
            color: "#F6F1E7",
            border: "none",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          Sign in to continue
        </button>
      </div>
    );
  }

  const totalPlants = userLists.reduce((a, l) => a + l.plantIds.length, 0);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 40px 60px" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div>
          <h1
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 30,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            My Lists
          </h1>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: "#9CAF88",
              marginTop: 4,
            }}
          >
            {userLists.length} {userLists.length === 1 ? "list" : "lists"} · {totalPlants} plants
            saved
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "10px 18px",
            borderRadius: 10,
            backgroundColor: "#C77B4D",
            color: "#F6F1E7",
            border: "none",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            fontWeight: 500,
            cursor: "pointer",
          }}
        >
          <Plus size={15} strokeWidth={2.2} /> New list
        </button>
      </div>

      {userLists.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 18,
              backgroundColor: "#EDE8DC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={30} strokeWidth={1.5} color="#9CAF88" />
          </div>
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 20,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            No lists yet
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              color: "#7A776F",
            }}
          >
            Create your first list to start organizing plants.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
            gap: 20,
          }}
        >
          {userLists.map((list) => (
            <ListCard
              key={list.id}
              list={list}
              plants={getPlantsForList(list)}
              onClick={() => setPage({ name: "list", id: list.id })}
            />
          ))}
          <NewListCard onClick={() => setShowCreate(true)} />
        </div>
      )}

      {/* Create modal */}
      {showCreate && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(47,74,61,0.48)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F1",
              borderRadius: 20,
              padding: 28,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 28px 72px rgba(47,74,61,0.24)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 500,
                color: "#2F4A3D",
                marginBottom: 16,
              }}
            >
              New list
            </h3>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
              {LIST_EMOJIS.map((e) => (
                <button
                  key={e}
                  onClick={() => setNewEmoji(e)}
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 8,
                    fontSize: 18,
                    border:
                      e === newEmoji ? "1.5px solid #C77B4D" : "1px solid #E8E2D4",
                    backgroundColor: e === newEmoji ? "#EDE8DC" : "transparent",
                    cursor: "pointer",
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="List name…"
              style={{
                width: "100%",
                padding: "10px 14px",
                borderRadius: 10,
                border: "1px solid #D8C3A5",
                backgroundColor: "#EDE8DC",
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#2F4A3D",
                outline: "none",
                boxSizing: "border-box",
                marginBottom: 14,
              }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => {
                  setShowCreate(false);
                  setNewName("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid #D8C3A5",
                  backgroundColor: "transparent",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: "#7A776F",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                disabled={!newName.trim()}
                onClick={() => {
                  createList(newName.trim(), newEmoji);
                  setShowCreate(false);
                  setNewName("");
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: newName.trim() ? "#C77B4D" : "#E8E2D4",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: newName.trim() ? "#F6F1E7" : "#9CAF88",
                  cursor: newName.trim() ? "pointer" : "not-allowed",
                }}
              >
                Create list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── List Detail Page ─────────────────────────────────────────────────────────

function ListDetailPage({ listId }: { listId: string }) {
  const { userLists, setPage, removeFromList, deleteList, renameList, getPlantsForList } = useApp();
  const list = userLists.find((l) => l.id === listId);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState(list?.name ?? "");
  const [confirmDel, setConfirmDel] = useState(false);
  const [hoveredPlant, setHoveredPlant] = useState<string | null>(null);

  if (!list) {
    return (
      <div style={{ padding: 40, fontFamily: "'Public Sans', sans-serif", color: "#7A776F" }}>
        List not found.
      </div>
    );
  }

  const plants = getPlantsForList(list);

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "32px 40px 60px" }}>
      {/* Breadcrumb */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          marginBottom: 24,
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 13,
          color: "#9CAF88",
        }}
      >
        <button
          onClick={() => setPage({ name: "lists" })}
          style={{
            color: "#9CAF88",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          My Lists
        </button>
        <ChevronRight size={13} strokeWidth={1.5} color="#D8C3A5" />
        <span style={{ color: "#2F4A3D" }}>{list.name}</span>
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <span style={{ fontSize: 28 }}>{list.emoji}</span>
          {editing ? (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    renameList(list.id, editName.trim());
                    setEditing(false);
                  }
                  if (e.key === "Escape") setEditing(false);
                }}
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 24,
                  fontWeight: 500,
                  color: "#2F4A3D",
                  border: "1px solid #C77B4D",
                  borderRadius: 8,
                  padding: "4px 10px",
                  outline: "none",
                  backgroundColor: "#FAF7F1",
                }}
              />
              <button
                onClick={() => {
                  renameList(list.id, editName.trim());
                  setEditing(false);
                }}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#C77B4D",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Check size={14} strokeWidth={2.5} color="#F6F1E7" />
              </button>
            </div>
          ) : (
            <div>
              <h1
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 28,
                  fontWeight: 500,
                  color: "#2F4A3D",
                }}
              >
                {list.name}
              </h1>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: "#9CAF88",
                  marginTop: 2,
                }}
              >
                {list.plantIds.length} plants
              </p>
            </div>
          )}
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button
            onClick={() => {
              setEditName(list.name);
              setEditing(true);
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid #D8C3A5",
              backgroundColor: "transparent",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: "#2F4A3D",
              cursor: "pointer",
            }}
          >
            <Pencil size={14} strokeWidth={1.5} /> Rename
          </button>
          <button
            onClick={() => setConfirmDel(true)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "8px 14px",
              borderRadius: 9,
              border: "1px solid #E8C0BB",
              backgroundColor: "transparent",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              color: "#C77B4D",
              cursor: "pointer",
            }}
          >
            <Trash2 size={14} strokeWidth={1.5} /> Delete
          </button>
        </div>
      </div>

      {plants.length === 0 ? (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            padding: "80px 0",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "#EDE8DC",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Leaf size={30} strokeWidth={1.5} color="#9CAF88" />
          </div>
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 20,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            This list is empty
          </p>
          <button
            onClick={() => setPage({ name: "discover" })}
            style={{
              padding: "10px 22px",
              borderRadius: 10,
              backgroundColor: "#C77B4D",
              color: "#F6F1E7",
              border: "none",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 13,
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Browse plants
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(228px, 1fr))",
            gap: 20,
          }}
        >
          {plants.map((plant) => (
            <div
              key={plant.id}
              style={{ position: "relative" }}
              onMouseEnter={() => setHoveredPlant(plant.id)}
              onMouseLeave={() => setHoveredPlant(null)}
            >
              <PlantCard plant={plant} />
              <button
                onClick={() => removeFromList(list.id, plant.id)}
                style={{
                  position: "absolute",
                  top: 10,
                  left: 10,
                  display: "flex",
                  alignItems: "center",
                  gap: 4,
                  padding: "5px 10px",
                  borderRadius: 7,
                  border: "none",
                  backgroundColor: "rgba(170,45,25,0.88)",
                  color: "#F6F1E7",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  fontWeight: 500,
                  cursor: "pointer",
                  opacity: hoveredPlant === plant.id ? 1 : 0,
                  transition: "opacity 0.15s",
                  pointerEvents: hoveredPlant === plant.id ? "auto" : "none",
                }}
              >
                <X size={11} strokeWidth={2.2} /> Remove
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
            backgroundColor: "rgba(47,74,61,0.48)",
            backdropFilter: "blur(6px)",
          }}
        >
          <div
            style={{
              backgroundColor: "#FAF7F1",
              borderRadius: 20,
              padding: 28,
              maxWidth: 360,
              width: "100%",
              boxShadow: "0 28px 72px rgba(47,74,61,0.24)",
            }}
          >
            <h3
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 500,
                color: "#2F4A3D",
                marginBottom: 8,
              }}
            >
              Delete "{list.name}"?
            </h3>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#7A776F",
                lineHeight: 1.65,
                marginBottom: 22,
              }}
            >
              This will permanently remove the list and all its saved plant references.
            </p>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                onClick={() => setConfirmDel(false)}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "1px solid #D8C3A5",
                  backgroundColor: "transparent",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  color: "#7A776F",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  deleteList(list.id);
                  setPage({ name: "lists" });
                }}
                style={{
                  flex: 1,
                  padding: "10px 0",
                  borderRadius: 10,
                  border: "none",
                  backgroundColor: "#C77B4D",
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 13,
                  fontWeight: 500,
                  color: "#F6F1E7",
                  cursor: "pointer",
                }}
              >
                Delete list
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Support Page ─────────────────────────────────────────────────────────────

const SUPPORT_CATS = ["Bug report", "Suggestion", "Plant data issue", "Account help", "Other"];

function SupportPage() {
  const [category, setCategory] = useState("Suggestion");
  const [showCat, setShowCat] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const canSubmit = subject.trim().length > 0 && description.trim().length > 0;

  if (submitted) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "80px 32px",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#EDE8DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Check size={30} strokeWidth={1.8} color="#9CAF88" />
        </div>
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 24,
              fontWeight: 500,
              color: "#2F4A3D",
              marginBottom: 8,
            }}
          >
            Thanks for reaching out
          </p>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 15,
              color: "#7A776F",
              lineHeight: 1.65,
              maxWidth: 360,
            }}
          >
            We'll review your message and reply to your email within a couple of days.
          </p>
        </div>
        <button
          onClick={() => setSubmitted(false)}
          style={{
            marginTop: 8,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 14,
            color: "#9CAF88",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          Send another message
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 560, margin: "0 auto", padding: "36px 40px 64px" }}>
      <h1
        style={{
          fontFamily: "'Fraunces', Georgia, serif",
          fontSize: 28,
          fontWeight: 500,
          color: "#2F4A3D",
          marginBottom: 6,
        }}
      >
        Get in touch
      </h1>
      <p
        style={{
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          color: "#7A776F",
          lineHeight: 1.65,
          marginBottom: 28,
        }}
      >
        Have a question, spotted a bug, or want to suggest a feature? We'd love to hear from you.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
        {/* Category */}
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Category
          </label>
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowCat((v) => !v)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                height: 48,
                padding: "0 14px",
                borderRadius: 12,
                border: "1px solid #D8C3A5",
                backgroundColor: "#FAF7F1",
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 14,
                  color: "#33312C",
                }}
              >
                {category}
              </span>
              <ChevronDown size={16} strokeWidth={1.5} color="#9CAF88" />
            </button>
            {showCat && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  top: "calc(100% + 4px)",
                  zIndex: 20,
                  borderRadius: 12,
                  overflow: "hidden",
                  border: "1px solid #D8C3A5",
                  backgroundColor: "#FAF7F1",
                  boxShadow: "0 8px 28px rgba(47,74,61,0.14)",
                }}
              >
                {SUPPORT_CATS.map((c, i) => (
                  <button
                    key={c}
                    onClick={() => {
                      setCategory(c);
                      setShowCat(false);
                    }}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      height: 44,
                      padding: "0 14px",
                      borderBottom:
                        i < SUPPORT_CATS.length - 1 ? "1px solid #EDE8DC" : "none",
                      backgroundColor: c === category ? "#EDE8DC" : "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <span
                      style={{
                        fontFamily: "'Public Sans', sans-serif",
                        fontSize: 14,
                        color: "#33312C",
                      }}
                    >
                      {c}
                    </span>
                    {c === category && (
                      <Check size={14} strokeWidth={2.2} color="#C77B4D" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Subject
          </label>
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Brief summary…"
            style={{
              width: "100%",
              height: 48,
              padding: "0 14px",
              borderRadius: 12,
              border: "1px solid #D8C3A5",
              backgroundColor: "#FAF7F1",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              color: "#33312C",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us what happened or what you'd like to see…"
            rows={5}
            style={{
              width: "100%",
              padding: "12px 14px",
              borderRadius: 12,
              border: "1px solid #D8C3A5",
              backgroundColor: "#FAF7F1",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              color: "#33312C",
              outline: "none",
              resize: "none",
              lineHeight: 1.65,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Screenshot */}
        <div>
          <label
            style={{
              display: "block",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 11,
              fontWeight: 700,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.07em",
              marginBottom: 8,
            }}
          >
            Screenshot{" "}
            <span
              style={{ fontWeight: 400, textTransform: "none", color: "#9CAF88" }}
            >
              (optional)
            </span>
          </label>
          <button
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              width: "100%",
              height: 48,
              padding: "0 14px",
              borderRadius: 12,
              border: "1.5px dashed #9CAF88",
              backgroundColor: "transparent",
              cursor: "pointer",
            }}
          >
            <Camera size={16} strokeWidth={1.5} color="#9CAF88" />
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#9CAF88",
              }}
            >
              Attach a screenshot
            </span>
          </button>
        </div>

        {/* Submit */}
        <button
          disabled={!canSubmit}
          onClick={() => setSubmitted(true)}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            padding: "14px 0",
            borderRadius: 12,
            border: "none",
            backgroundColor: canSubmit ? "#C77B4D" : "#E8E2D4",
            color: canSubmit ? "#F6F1E7" : "#9CAF88",
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 14,
            fontWeight: 600,
            cursor: canSubmit ? "pointer" : "not-allowed",
          }}
        >
          <SendHorizonal size={16} strokeWidth={1.5} />
          Send message
        </button>
      </div>
    </div>
  );
}

// ─── Settings Row ─────────────────────────────────────────────────────────────

function SettingsRow({
  icon,
  label,
  value,
  onClick,
  danger,
  isLast,
}: {
  icon: ReactNode;
  label: string;
  value?: string;
  onClick?: () => void;
  danger?: boolean;
  isLast?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        width: "100%",
        padding: "13px 16px",
        borderBottom: isLast ? "none" : "1px solid #EDE8DC",
        backgroundColor: hov && onClick ? "#F5F1EA" : "transparent",
        border: "none",
        borderBottomStyle: isLast ? undefined : "solid",
        borderBottomWidth: isLast ? 0 : 1,
        borderBottomColor: "#EDE8DC",
        cursor: onClick ? "pointer" : "default",
        transition: "background 0.1s",
        textAlign: "left",
      }}
    >
      <span style={{ color: danger ? "#C77B4D" : "#9CAF88", flexShrink: 0 }}>
        {icon}
      </span>
      <span
        style={{
          flex: 1,
          fontFamily: "'Public Sans', sans-serif",
          fontSize: 14,
          color: danger ? "#C77B4D" : "#2F4A3D",
        }}
      >
        {label}
      </span>
      {value && (
        <span
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 12,
            color: "#9CAF88",
          }}
        >
          {value}
        </span>
      )}
      {onClick && !danger && (
        <ChevronRight size={15} strokeWidth={1.5} color="#D8C3A5" />
      )}
    </button>
  );
}

// ─── Account Page ─────────────────────────────────────────────────────────────

function AccountPage() {
  const { isSignedIn, currentUser, completeSignIn, signOut, setPage, userLists, savedPlants } = useApp();

  if (!isSignedIn) {
    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          flex: 1,
          padding: "80px 32px",
          gap: 16,
        }}
      >
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: "50%",
            backgroundColor: "#EDE8DC",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 4,
          }}
        >
          <User size={36} strokeWidth={1.3} color="#9CAF88" />
        </div>
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 26,
            fontWeight: 500,
            color: "#2F4A3D",
            textAlign: "center",
          }}
        >
          Welcome to Plantfolio
        </h2>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 15,
            color: "#7A776F",
            lineHeight: 1.65,
            textAlign: "center",
            maxWidth: 360,
          }}
        >
          Sign in to access your saved plants, curated lists, and personalized settings.
        </p>
        <div style={{ marginTop: 8 }}>
          <GoogleSignInButton onSuccess={completeSignIn} />
        </div>
        <button
          onClick={() => setPage({ name: "support" })}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 5,
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 13,
            color: "#9CAF88",
            background: "none",
            border: "none",
            cursor: "pointer",
          }}
        >
          <HelpCircle size={14} strokeWidth={1.5} /> Contact support
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 680, margin: "0 auto", padding: "36px 40px 64px" }}>
      {/* Profile hero card */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 20,
          padding: "24px 28px",
          borderRadius: 20,
          backgroundColor: "#2F4A3D",
          marginBottom: 24,
        }}
      >
        {currentUser?.picture ? (
          <img
            src={currentUser.picture}
            alt=""
            style={{ width: 60, height: 60, borderRadius: "50%", flexShrink: 0, objectFit: "cover" }}
          />
        ) : (
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: "50%",
              backgroundColor: "#C77B4D",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 20,
              fontWeight: 600,
              color: "#F6F1E7",
              flexShrink: 0,
            }}
          >
            {(currentUser?.name ?? currentUser?.email ?? "?")
              .split(" ")
              .map((part) => part[0])
              .slice(0, 2)
              .join("")
              .toUpperCase()}
          </div>
        )}
        <div style={{ flex: 1 }}>
          <p
            style={{
              fontFamily: "'Fraunces', Georgia, serif",
              fontSize: 20,
              fontWeight: 500,
              color: "#F6F1E7",
            }}
          >
            {currentUser?.name ?? currentUser?.email}
          </p>
          <p
            style={{
              fontFamily: "'IBM Plex Mono', monospace",
              fontSize: 12,
              color: "rgba(246,241,231,0.5)",
              marginTop: 2,
            }}
          >
            {currentUser?.email}
          </p>
        </div>
        <div style={{ display: "flex", gap: 24 }}>
          {[
            { val: userLists.length, label: "Lists" },
            { val: savedPlants.size, label: "Saved" },
          ].map(({ val, label }) => (
            <div key={label} style={{ textAlign: "center" }}>
              <p
                style={{
                  fontFamily: "'Fraunces', Georgia, serif",
                  fontSize: 22,
                  fontWeight: 500,
                  color: "#F6F1E7",
                }}
              >
                {val}
              </p>
              <p
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 11,
                  color: "rgba(246,241,231,0.5)",
                }}
              >
                {label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* My Garden */}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #E8E2D4",
          backgroundColor: "#FAF7F1",
          marginBottom: 14,
        }}
      >
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #EDE8DC" }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              color: "#9CAF88",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            My Garden
          </p>
        </div>
        <SettingsRow
          icon={<Leaf size={16} strokeWidth={1.5} />}
          label="My Lists"
          value={`${userLists.length} lists`}
          onClick={() => setPage({ name: "lists" })}
        />
        <SettingsRow
          icon={<Bookmark size={16} strokeWidth={1.5} />}
          label="Saved Plants"
          value={`${savedPlants.size} plants`}
          onClick={() => setPage({ name: "discover" })}
          isLast
        />
      </div>

      {/* Help & Feedback */}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #E8E2D4",
          backgroundColor: "#FAF7F1",
          marginBottom: 14,
        }}
      >
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #EDE8DC" }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              color: "#9CAF88",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Help & Feedback
          </p>
        </div>
        <SettingsRow
          icon={<HelpCircle size={16} strokeWidth={1.5} />}
          label="Contact Support"
          onClick={() => setPage({ name: "support" })}
        />
        <SettingsRow
          icon={<Settings size={16} strokeWidth={1.5} />}
          label="About Plantfolio"
          isLast
        />
      </div>

      {/* Session */}
      <div
        style={{
          borderRadius: 14,
          overflow: "hidden",
          border: "1px solid #E8E2D4",
          backgroundColor: "#FAF7F1",
        }}
      >
        <div style={{ padding: "10px 16px", borderBottom: "1px solid #EDE8DC" }}>
          <p
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 10,
              fontWeight: 700,
              color: "#9CAF88",
              textTransform: "uppercase",
              letterSpacing: "0.1em",
            }}
          >
            Session
          </p>
        </div>
        <SettingsRow
          icon={<LogOut size={16} strokeWidth={1.5} />}
          label="Sign out"
          onClick={signOut}
          danger
          isLast
        />
      </div>
    </div>
  );
}

// ─── App Shell ────────────────────────────────────────────────────────────────

function AppShell() {
  const { page } = useApp();
  const isDiscover = page.name === "discover";

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        overflow: "hidden",
        backgroundColor: "#F6F1E7",
      }}
    >
      <Header />
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {isDiscover ? (
          <DiscoverPage />
        ) : (
          <div style={{ flex: 1, overflowY: "auto" }}>
            {page.name === "plant" && <PlantDetailPage plantId={page.id} />}
            {page.name === "lists" && <MyListsPage />}
            {page.name === "list" && <ListDetailPage listId={page.id} />}
            {page.name === "support" && <SupportPage />}
            {page.name === "account" && <AccountPage />}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <AppProvider>
      <AppShell />
    </AppProvider>
  );
}
