export default function CannonLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 152 74"
      role="img"
      aria-label="Gunners League"
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* breech (rear stub) */}
      <path d="M14 28 Q4 28 4 37 Q4 46 14 46 L44 45 L44 29 Z" fill="#EF0107" />
      {/* barrel (front, tapering to muzzle) */}
      <path d="M100 30 L146 33 L146 41 L100 46 Z" fill="#EF0107" />
      <rect x="143" y="31" width="7" height="12" rx="2" fill="#EF0107" />
      {/* carriage trail */}
      <path d="M46 52 Q26 66 8 60 Q25 64 44 50 Z" fill="#EF0107" />
      {/* wheel: ring, spokes, hub */}
      <circle cx="72" cy="40" r="30" fill="none" stroke="#EF0107" strokeWidth="6" />
      <g stroke="#EF0107" strokeWidth="5" strokeLinecap="round">
        <line x1="72" y1="40" x2="72" y2="13" />
        <line x1="72" y1="40" x2="95" y2="27" />
        <line x1="72" y1="40" x2="95" y2="53" />
        <line x1="72" y1="40" x2="72" y2="67" />
        <line x1="72" y1="40" x2="49" y2="53" />
        <line x1="72" y1="40" x2="49" y2="27" />
      </g>
      <circle cx="72" cy="40" r="9" fill="none" stroke="#EF0107" strokeWidth="5" />
      <circle cx="72" cy="40" r="3" fill="#EF0107" />
    </svg>
  );
}
