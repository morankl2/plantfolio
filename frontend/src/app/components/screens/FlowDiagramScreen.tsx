const CREAM = "#F6F1E7";
const EVERGREEN = "#2F4A3D";
const SAGE = "#9CAF88";
const TERRACOTTA = "#C77B4D";
const SANDSTONE = "#D8C3A5";
const CHARCOAL = "#33312C";

function ScreenBox({
  x,
  y,
  w = 82,
  h = 52,
  title,
  subtitle,
  accent,
}: {
  x: number;
  y: number;
  w?: number;
  h?: number;
  title: string;
  subtitle?: string;
  accent?: string;
}) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx="8"
        fill={CREAM}
        stroke={accent ?? SANDSTONE}
        strokeWidth={accent ? 1.5 : 1}
      />
      <text
        x={x + w / 2}
        y={y + (subtitle ? h / 2 - 5 : h / 2 + 1)}
        textAnchor="middle"
        fill={EVERGREEN}
        style={{ fontFamily: "'Fraunces', Georgia, serif", fontSize: 9, fontWeight: 500 }}
      >
        {title}
      </text>
      {subtitle && (
        <text
          x={x + w / 2}
          y={y + h / 2 + 9}
          textAnchor="middle"
          fill={SAGE}
          style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 7.5 }}
        >
          {subtitle}
        </text>
      )}
    </g>
  );
}

function Arrow({
  x1,
  y1,
  x2,
  y2,
  label,
  dashed,
}: {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  label?: string;
  dashed?: boolean;
}) {
  const midX = (x1 + x2) / 2;
  const midY = (y1 + y2) / 2;
  const isVertical = Math.abs(x2 - x1) < Math.abs(y2 - y1);

  return (
    <g>
      <line
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={dashed ? TERRACOTTA : SAGE}
        strokeWidth="1.2"
        strokeDasharray={dashed ? "4 3" : undefined}
        markerEnd={dashed ? "url(#arrowhead-red)" : "url(#arrowhead)"}
        strokeLinecap="round"
      />
      {label && (
        <text
          x={isVertical ? midX + 5 : midX}
          y={isVertical ? midY : midY - 5}
          textAnchor={isVertical ? "start" : "middle"}
          fill={dashed ? TERRACOTTA : CHARCOAL}
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 7.5,
            fontStyle: "italic",
          }}
        >
          {label}
        </text>
      )}
    </g>
  );
}

function Annotation({
  x,
  y,
  text,
  color = EVERGREEN,
  width = 90,
}: {
  x: number;
  y: number;
  text: string;
  color?: string;
  width?: number;
}) {
  const lines = text.split("|");
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={lines.length * 11 + 8}
        rx="5"
        fill={color === TERRACOTTA ? "#FFF0E8" : "#EDE8DC"}
        stroke={color}
        strokeWidth="1"
        opacity="0.9"
      />
      {lines.map((line, i) => (
        <text
          key={i}
          x={x + 6}
          y={y + 13 + i * 11}
          fill={color}
          style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 7.5 }}
        >
          {line}
        </text>
      ))}
    </g>
  );
}

function GateNode({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <polygon
        points={`${x},${y - 18} ${x + 22},${y} ${x},${y + 18} ${x - 22},${y}`}
        fill="#FFF0E8"
        stroke={TERRACOTTA}
        strokeWidth="1.5"
      />
      <text
        x={x}
        y={y + 4}
        textAnchor="middle"
        fill={TERRACOTTA}
        style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 7.5, fontWeight: 600 }}
      >
        Guest?
      </text>
    </g>
  );
}

export function FlowDiagramScreen() {
  return (
    <div
      className="flex-1 flex flex-col min-h-0 overflow-y-auto"
      style={{ backgroundColor: "#F6F1E7" }}
    >
      {/* Header */}
      <div
        className="shrink-0 px-5 pt-4 pb-3"
        style={{ borderBottom: "1px solid #D8C3A5" }}
      >
        <h2
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 16,
            fontWeight: 600,
            color: EVERGREEN,
          }}
        >
          Guest → Save to List — User Flow
        </h2>
        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 11,
            color: SAGE,
            marginTop: 2,
          }}
        >
          First-time guest path · auth gate highlighted
        </p>
      </div>

      {/* Legend */}
      <div className="shrink-0 flex items-center gap-4 px-5 py-2" style={{ borderBottom: "1px solid #EDE8DC" }}>
        {[
          { color: SAGE, label: "Normal flow", dashed: false },
          { color: TERRACOTTA, label: "Auth gate / sign-in branch", dashed: true },
        ].map(({ color, label, dashed }) => (
          <div key={label} className="flex items-center gap-1.5">
            <svg width="20" height="8">
              <line
                x1="0"
                y1="4"
                x2="20"
                y2="4"
                stroke={color}
                strokeWidth="1.5"
                strokeDasharray={dashed ? "4 3" : undefined}
              />
            </svg>
            <span
              style={{
                fontFamily: "'Public Sans', sans-serif",
                fontSize: 10,
                color: CHARCOAL,
              }}
            >
              {label}
            </span>
          </div>
        ))}
        <div className="flex items-center gap-1.5">
          <svg width="14" height="14">
            <polygon points="7,0 14,7 7,14 0,7" fill="#FFF0E8" stroke={TERRACOTTA} strokeWidth="1.2" />
          </svg>
          <span style={{ fontFamily: "'Public Sans', sans-serif", fontSize: 10, color: CHARCOAL }}>
            Decision point
          </span>
        </div>
      </div>

      {/* Flow SVG diagram */}
      <div className="flex-1 flex items-start justify-center py-4 px-2">
        <svg
          viewBox="0 0 350 640"
          width="350"
          height="640"
          style={{ maxWidth: "100%", overflow: "visible" }}
        >
          <defs>
            <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={SAGE} />
            </marker>
            <marker id="arrowhead-red" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
              <polygon points="0 0, 6 2, 0 4" fill={TERRACOTTA} />
            </marker>
          </defs>
          {/* ── Welcome ── */}
          <ScreenBox x={134} y={4} title="Welcome" subtitle="1 · Onboarding" />
          <Arrow x1={175} y1={56} x2={175} y2={76} label="Guest taps 'Continue'" />

          {/* ── Search & Filters ── */}
          <ScreenBox x={134} y={76} title="Search & Filters" subtitle="2 · Home" />
          <Arrow x1={175} y1={128} x2={175} y2={148} label="Sets filters, taps Apply" />

          {/* ── Results ── */}
          <ScreenBox x={134} y={148} title="Search Results" subtitle="3 · Results list" />
          <Arrow x1={175} y1={200} x2={175} y2={220} label="Taps a plant card" />

          {/* ── Plant Detail ── */}
          <ScreenBox x={134} y={220} title="Plant Detail" subtitle="4 · Detail view" accent={SAGE} />

          {/* Bookmark tap annotation */}
          <Annotation x={228} y={228} text="Taps bookmark icon|or 'Save to list'" color={CHARCOAL} width={104} />
          <line x1={228} y1={246} x2={222} y2={246} stroke={SANDSTONE} strokeWidth="1" />

          <Arrow x1={175} y1={272} x2={175} y2={296} label="Taps 'Save to list'" />

          {/* ── Decision gate ── */}
          <GateNode x={175} y={314} />

          {/* Yes branch (right) → Sign-in sheet */}
          <Arrow x1={197} y1={314} x2={265} y2={314} dashed label="Is guest" />
          <ScreenBox x={224} y={291} w={82} h={46} title="Sign-in Prompt" subtitle="5b · Guest sheet" accent={TERRACOTTA} />
          <Annotation x={220} y={344} text="Can't save — must|sign in to continue" color={TERRACOTTA} width={90} />

          {/* Google sign-in path */}
          <Arrow x1={265} y1={337} x2={265} y2={390} dashed label="Signs in w/ Google" />
          <ScreenBox x={224} y={390} w={82} h={46} title="Google OAuth" subtitle="OAuth handoff" />

          {/* After sign-in, returns to Save sheet */}
          <Arrow x1={265} y1={436} x2={265} y2={475} dashed label="Returns to save" />

          {/* No branch (straight down) → Save sheet */}
          <Arrow x1={175} y1={332} x2={175} y2={370} label="Signed in" />
          <ScreenBox x={134} y={370} title="Save to List" subtitle="5 · List sheet" accent={SAGE} />

          {/* Merge arrow from sign-in back to save sheet */}
          <path
            d={`M 265 475 Q 265 500 220 500 Q 175 500 175 490`}
            fill="none"
            stroke={TERRACOTTA}
            strokeWidth="1.2"
            strokeDasharray="4 3"
            markerEnd="url(#arrowhead-red)"
          />

          <Arrow x1={175} y1={422} x2={175} y2={450} label="Taps Done" />

          {/* ── My Lists ── */}
          <ScreenBox x={134} y={450} title="My Lists" subtitle="6 · Lists hub" accent={SAGE} />

          {/* Annotations */}
          <Annotation
            x={4}
            y={76}
            text="Free search|no sign-in needed"
            color={EVERGREEN}
            width={92}
          />
          <Annotation
            x={4}
            y={220}
            text="Browsing is fully|available as guest"
            color={EVERGREEN}
            width={100}
          />
          <Annotation
            x={4}
            y={368}
            text="Sign-in gates|only saving"
            color={TERRACOTTA}
            width={88}
          />
          <Annotation
            x={4}
            y={448}
            text="Lists visible only|when signed in"
            color={EVERGREEN}
            width={96}
          />

          {/* Step labels on left rail */}
          {[
            { y: 30, n: "1" },
            { y: 102, n: "2" },
            { y: 174, n: "3" },
            { y: 246, n: "4" },
            { y: 396, n: "5" },
            { y: 476, n: "6" },
          ].map(({ y, n }) => (
            <g key={n}>
              <circle cx="122" cy={y} r="8" fill={SAGE} opacity="0.2" />
              <text
                x={122}
                y={y + 3}
                textAnchor="middle"
                fill={SAGE}
                style={{ fontFamily: "'IBM Plex Mono', monospace", fontSize: 8, fontWeight: 600 }}
              >
                {n}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
