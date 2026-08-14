import { useState } from "react";
import { ChevronDown, Camera, SendHorizonal } from "lucide-react";
import { TopBar } from "../TopBar";

interface SupportFormScreenProps {
  onBack?: () => void;
}

const CATEGORIES = ["Bug report", "Suggestion", "Plant data issue", "Other"];

export function SupportFormScreen({ onBack }: SupportFormScreenProps) {
  const [category, setCategory] = useState("Suggestion");
  const [showCatDropdown, setShowCatDropdown] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col" style={{ backgroundColor: "#F6F1E7" }}>
        <TopBar title="Support" onBack={onBack} />
        <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4">
          <div
            className="flex items-center justify-center rounded-full"
            style={{ width: 64, height: 64, backgroundColor: "#EDE8DC" }}
          >
            <svg width="30" height="30" viewBox="0 0 30 30" fill="none">
              <circle cx="15" cy="15" r="13" stroke="#9CAF88" strokeWidth="1.5" />
              <path d="M9 15.5l4 4 8-8" stroke="#9CAF88" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div className="text-center">
            <p
              style={{
                fontFamily: "'Fraunces', Georgia, serif",
                fontSize: 20,
                fontWeight: 500,
                color: "#2F4A3D",
                marginBottom: 6,
              }}
            >
              Thanks for reaching out
            </p>
            <p
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 14,
                color: "#7A776F",
                lineHeight: 1.6,
              }}
            >
              We'll review your message and reply to your email within a couple of days.
            </p>
          </div>
          <button
            onClick={() => setSubmitted(false)}
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 14,
              fontWeight: 500,
              color: "#9CAF88",
              border: "none",
              background: "none",
              cursor: "pointer",
            }}
          >
            Send another message
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ backgroundColor: "#F6F1E7" }}>
      <TopBar title="Support" onBack={onBack} />

      <div className="flex-1 overflow-y-auto px-5 py-4">
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 14,
            color: "#7A776F",
            lineHeight: 1.6,
            marginBottom: 20,
          }}
        >
          Have a question, spotted a bug, or want to suggest a feature? We'd love to hear from you.
        </p>

        {/* Category */}
        <div className="mb-5">
          <label
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 6,
            }}
          >
            Category
          </label>
          <div className="relative">
            <button
              onClick={() => setShowCatDropdown((v) => !v)}
              className="w-full flex items-center justify-between"
              style={{
                height: 46,
                borderRadius: 10,
                border: "1px solid #D8C3A5",
                backgroundColor: "#FAF7F1",
                paddingLeft: 14,
                paddingRight: 14,
                cursor: "pointer",
              }}
            >
              <span
                style={{
                  fontFamily: "'Public Sans', sans-serif",
                  fontSize: 15,
                  color: "#33312C",
                }}
              >
                {category}
              </span>
              <ChevronDown size={18} strokeWidth={1.5} color="#9CAF88" />
            </button>

            {showCatDropdown && (
              <div
                className="absolute left-0 right-0 top-full mt-1 z-10 flex flex-col overflow-hidden"
                style={{
                  borderRadius: 10,
                  border: "1px solid #D8C3A5",
                  backgroundColor: "#FAF7F1",
                  boxShadow: "0 4px 16px rgba(47,74,61,0.1)",
                }}
              >
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      setCategory(cat);
                      setShowCatDropdown(false);
                    }}
                    className="flex items-center justify-between px-4"
                    style={{
                      height: 44,
                      borderBottom: cat !== CATEGORIES[CATEGORIES.length - 1] ? "1px solid #EDE8DC" : "none",
                      backgroundColor: category === cat ? "#EDE8DC" : "transparent",
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
                      {cat}
                    </span>
                    {category === cat && (
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <path d="M3 8l4 4 6-6" stroke="#C77B4D" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Subject */}
        <div className="mb-5">
          <label
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 6,
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
              height: 46,
              borderRadius: 10,
              border: "1px solid #D8C3A5",
              backgroundColor: "#FAF7F1",
              paddingLeft: 14,
              paddingRight: 14,
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 15,
              color: "#33312C",
              outline: "none",
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Description */}
        <div className="mb-5">
          <label
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 6,
            }}
          >
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Tell us what happened or what you'd like to see…"
            rows={4}
            style={{
              width: "100%",
              borderRadius: 10,
              border: "1px solid #D8C3A5",
              backgroundColor: "#FAF7F1",
              padding: "12px 14px",
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 15,
              color: "#33312C",
              outline: "none",
              resize: "none",
              lineHeight: 1.6,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Screenshot attach */}
        <div className="mb-6">
          <label
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 12,
              fontWeight: 600,
              color: "#2F4A3D",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              display: "block",
              marginBottom: 6,
            }}
          >
            Screenshot{" "}
            <span style={{ color: "#9CAF88", fontWeight: 400, textTransform: "none" }}>
              (optional)
            </span>
          </label>
          <button
            className="flex items-center gap-2 w-full"
            style={{
              height: 46,
              borderRadius: 10,
              border: "1.5px dashed #9CAF88",
              backgroundColor: "transparent",
              paddingLeft: 14,
              paddingRight: 14,
              cursor: "pointer",
            }}
          >
            <Camera size={18} strokeWidth={1.5} color="#9CAF88" />
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
          onClick={() => setSubmitted(true)}
          className="w-full flex items-center justify-center gap-2"
          style={{
            height: 52,
            borderRadius: 12,
            backgroundColor: "#C77B4D",
            border: "none",
            cursor: "pointer",
            marginBottom: 24,
          }}
        >
          <SendHorizonal size={18} strokeWidth={1.5} color="#F6F1E7" />
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 15,
              fontWeight: 600,
              color: "#F6F1E7",
            }}
          >
            Send message
          </span>
        </button>
      </div>
    </div>
  );
}
