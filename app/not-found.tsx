import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-[480px] flex flex-col items-center text-center gap-6">
        <svg width="140" height="180" viewBox="0 0 140 180" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          {/* Pot */}
          <rect x="38" y="108" width="64" height="10" rx="5" fill="#C4742A"/>
          <path d="M44 118 L96 118 L90 168 L50 168 Z" fill="#C4522A"/>
          <ellipse cx="70" cy="118" rx="28" ry="6" fill="#3A2E1E" opacity="0.55"/>
          {/* Plant — animated group */}
          <g className="plant-sway">
            <rect x="67" y="54" width="5" height="58" rx="2.5" fill="#2E5239"/>
            <ellipse cx="44" cy="88" rx="22" ry="10" fill="#4A7051" stroke="#2E5239" strokeOpacity="0.4" transform="rotate(-38 44 88)" className="leaf-droop"/>
            <g className="plant-sway-slow">
              <ellipse cx="98" cy="72" rx="24" ry="10" fill="#4A7051" stroke="#2E5239" strokeOpacity="0.4" transform="rotate(32 98 72)"/>
            </g>
            <ellipse cx="62" cy="52" rx="14" ry="7" fill="#4A7051" opacity="0.85" transform="rotate(-18 62 52)" className="leaf-droop"/>
            <text x="110" y="58" fontFamily="Fraunces" fontWeight="500" fontSize="28" fill="#C4742A" opacity="0.55">?</text>
          </g>
        </svg>

        <div className="flex flex-col items-center gap-2">
          <p className="font-sans text-xs font-semibold tracking-widest uppercase text-ink-soft">
            Page not found
          </p>
          <p className="font-display text-[120px] leading-none text-ink font-medium">
            404
          </p>
        </div>

        <div className="flex flex-col items-center gap-1">
          <p className="font-display font-semibold text-[28px] leading-tight text-ink">
            This page seems to have wandered off
          </p>
          <p className="font-display italic text-ink-soft text-base">
            pagina errante &lsquo;Lost Path&rsquo;
          </p>
        </div>

        <p className="font-sans text-ink-soft text-base leading-relaxed">
          The path you followed must have overgrown. It happens — gardens are
          always changing. Head back to your collection and pick up where you
          left off.
        </p>

        <Link
          href="/plants"
          className="bg-ink text-paper font-sans font-medium text-sm px-6 py-3 rounded-full hover:bg-ink-soft transition-colors"
        >
          ← Back to my plant collection
        </Link>
      </div>
    </div>
  );
}
