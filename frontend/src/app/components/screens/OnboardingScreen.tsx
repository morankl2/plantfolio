interface OnboardingScreenProps {
  onGuest?: () => void;
  onSignIn?: () => void;
}

export function OnboardingScreen({ onGuest, onSignIn }: OnboardingScreenProps) {
  return (
    <div
      className="flex-1 flex flex-col overflow-hidden"
      style={{ backgroundColor: "#F6F1E7" }}
    >
      {/* Decorative botanical top fill */}
      <div className="relative shrink-0" style={{ height: 220 }}>
        <svg
          viewBox="0 0 390 220"
          fill="none"
          className="absolute inset-0 w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Soft watercolor-like blobs */}
          <ellipse cx="320" cy="60" rx="100" ry="80" fill="#9CAF88" opacity="0.12" />
          <ellipse cx="60" cy="100" rx="80" ry="60" fill="#C77B4D" opacity="0.07" />
          <ellipse cx="195" cy="170" rx="120" ry="70" fill="#9CAF88" opacity="0.09" />

          {/* Botanical line illustrations */}
          {/* Stem + leaves top-right */}
          <path d="M340 0 Q 345 50 330 90" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.35" />
          <path d="M330 40 Q 355 25 370 35" stroke="#2F4A3D" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
          <path d="M333 60 Q 310 52 300 62" stroke="#2F4A3D" strokeWidth="1.2" strokeLinecap="round" fill="none" opacity="0.35" />
          <ellipse cx="370" cy="35" rx="12" ry="7" transform="rotate(-20 370 35)" stroke="#2F4A3D" strokeWidth="1.2" fill="none" opacity="0.3" />
          <ellipse cx="300" cy="62" rx="12" ry="7" transform="rotate(30 300 62)" stroke="#2F4A3D" strokeWidth="1.2" fill="none" opacity="0.3" />

          {/* Small wildflower left */}
          <line x1="55" y1="220" x2="55" y2="140" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" opacity="0.3" />
          <g opacity="0.3">
            {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, i) => (
              <ellipse
                key={i}
                cx={55 + 10 * Math.cos((deg * Math.PI) / 180)}
                cy={140 + 10 * Math.sin((deg * Math.PI) / 180)}
                rx="4"
                ry="8"
                transform={`rotate(${deg} ${55 + 10 * Math.cos((deg * Math.PI) / 180)} ${140 + 10 * Math.sin((deg * Math.PI) / 180)})`}
                fill="#9CAF88"
              />
            ))}
            <circle cx="55" cy="140" r="5" fill="#C77B4D" />
          </g>

          {/* Grass/reeds right side */}
          <path d="M360 220 Q 355 175 358 155" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
          <path d="M375 220 Q 378 170 372 148" stroke="#2F4A3D" strokeWidth="1.5" strokeLinecap="round" fill="none" opacity="0.25" />
          <path d="M348 220 Q 342 180 346 162" stroke="#2F4A3D" strokeWidth="1" strokeLinecap="round" fill="none" opacity="0.2" />
        </svg>
      </div>

      {/* Logo + tagline */}
      <div className="flex flex-col items-center px-8 -mt-6">
        {/* Flower icon mark */}
        <div className="mb-3">
          <svg width="80" height="80" viewBox="0 0 220 220" fill="none" xmlns="http://www.w3.org/2000/svg">
            {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((deg, i) => (
              <g key={i} transform={`rotate(${deg} 110 110)`}>
                <ellipse cx="110" cy="52" rx="13" ry="42" fill="#E3A83B" stroke="#C98F27" strokeWidth="2" opacity="0.9" />
              </g>
            ))}
            <line x1="88" y1="136" x2="32" y2="204" stroke="#2F4A3D" strokeWidth="16" strokeLinecap="round" />
            <circle cx="110" cy="110" r="40" fill="none" stroke="#C77B4D" strokeWidth="3" />
            <circle cx="110" cy="110" r="33" fill="#2E2013" />
          </svg>
        </div>

        <h1
          style={{
            fontFamily: "'Fraunces', Georgia, serif",
            fontSize: 38,
            fontWeight: 600,
            color: "#2F4A3D",
            letterSpacing: "-0.01em",
            lineHeight: 1,
            marginBottom: 8,
          }}
        >
          Plantfolio
        </h1>

        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 16,
            color: "#7A776F",
            textAlign: "center",
            lineHeight: 1.5,
            marginBottom: 2,
          }}
        >
          Find the right plant for your yard.
        </p>

        <p
          style={{
            fontFamily: "'IBM Plex Mono', monospace",
            fontSize: 11,
            color: "#9CAF88",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginTop: 4,
          }}
        >
          Search · Save · Grow
        </p>
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* CTA buttons */}
      <div className="flex flex-col gap-3 px-6 pb-2">
        <button
          onClick={onGuest}
          className="w-full flex items-center justify-center"
          style={{
            height: 54,
            borderRadius: 12,
            backgroundColor: "#C77B4D",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 12px rgba(199,123,77,0.3)",
          }}
        >
          <span
            style={{
              fontFamily: "'Public Sans', sans-serif",
              fontSize: 16,
              fontWeight: 600,
              color: "#F6F1E7",
            }}
          >
            Continue as guest
          </span>
        </button>

        <button
          onClick={onSignIn}
          className="w-full flex items-center justify-center gap-3"
          style={{
            height: 54,
            borderRadius: 12,
            backgroundColor: "transparent",
            border: "1.5px solid #2F4A3D",
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
              fontSize: 16,
              fontWeight: 500,
              color: "#2F4A3D",
            }}
          >
            Sign in with Google
          </span>
        </button>

        <p
          style={{
            fontFamily: "'Public Sans', sans-serif",
            fontSize: 12,
            color: "#9CAF88",
            textAlign: "center",
            lineHeight: 1.5,
          }}
        >
          Guests can search but need to sign in to save plants to lists.
        </p>
      </div>
    </div>
  );
}
