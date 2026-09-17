// ResiliNet – BrandMark: original product mark.
// A shield (resilience) containing a cascading failure: two healthy nodes
// converge through a stressed node down to a failed one. Failure, contained.

interface BrandMarkProps {
  size?: number;
  label?: string;
}

export function BrandMark({ size = 20, label }: BrandMarkProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      {/* Shield — resilience boundary */}
      <path
        d="M16 3.8l7.7 3.1v7.3c0 5.5-3.7 9.6-7.7 11.4-4-1.8-7.7-5.9-7.7-11.4V6.9L16 3.8z"
        stroke="#5ee7d4"
        strokeWidth={2.1}
        strokeLinejoin="round"
      />
      {/* Cascade edges — healthy nodes converge on the stressed node */}
      <path
        d="M12.9 11.6l3.1 3.4 3.1-3.4"
        stroke="#5ee7d4"
        strokeOpacity={0.6}
        strokeWidth={1.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Healthy nodes */}
      <circle cx={12.9} cy={11.6} r={1.9} fill="#5ee7d4" />
      <circle cx={19.1} cy={11.6} r={1.9} fill="#5ee7d4" />
      {/* Stressed node + failure edge */}
      <path
        d="M16 16.9v1.6"
        stroke="#f59e0b"
        strokeWidth={1.2}
        strokeLinecap="round"
      />
      <circle cx={16} cy={15} r={1.9} fill="#f59e0b" />
      {/* Failed node */}
      <circle cx={16} cy={20.4} r={1.9} fill="#ef4444" />
    </svg>
  );
}
