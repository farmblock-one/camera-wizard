import type { PersonPose } from '../db/db';
import { POSE_CONNECTIONS } from '../vision/mediapipe';

export const PERSON_COLORS = ['#facc15', '#22d3ee', '#f472b6', '#a3e635'];

interface Props {
  people: PersonPose[];
  width: number;
  height: number;
  outline?: boolean;
  skeleton?: boolean;
  /** Fill the outline (silhouette) instead of only drawing its edge. */
  fill?: boolean;
  strokeScale?: number;
  /** 'contain' matches an <img> with object-contain (whole image, letterboxed). */
  fit?: 'fill' | 'contain';
  className?: string;
}

/** SVG layer drawn over an image of the same aspect ratio. */
export function PoseOverlay({ people, width, height, outline = true, skeleton = false, fill = false, strokeScale = 1, fit = 'fill', className = '' }: Props) {
  const sw = (Math.max(width, height) / 250) * strokeScale;
  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio={fit === 'contain' ? 'xMidYMid meet' : 'none'}
      className={`pointer-events-none absolute inset-0 h-full w-full ${className}`}
    >
      {people.map((p, i) => {
        const color = PERSON_COLORS[i % PERSON_COLORS.length];
        return (
          <g key={i}>
            {outline && p.outline.length > 2 && (
              <polygon
                points={p.outline.map(([x, y]) => `${(x * width).toFixed(1)},${(y * height).toFixed(1)}`).join(' ')}
                fill={fill ? color : 'none'}
                fillOpacity={fill ? 0.35 : 0}
                stroke={color}
                strokeWidth={sw}
                strokeLinejoin="round"
                strokeDasharray={fill ? undefined : `${sw * 3} ${sw * 1.5}`}
              />
            )}
            {skeleton &&
              POSE_CONNECTIONS.map(({ start, end }) => {
                const a = p.landmarks[start];
                const b = p.landmarks[end];
                if (!a || !b || a[2] < 0.3 || b[2] < 0.3) return null;
                return (
                  <line
                    key={`${start}-${end}`}
                    x1={a[0] * width}
                    y1={a[1] * height}
                    x2={b[0] * width}
                    y2={b[1] * height}
                    stroke={color}
                    strokeWidth={sw * 0.9}
                    strokeLinecap="round"
                    opacity={0.9}
                  />
                );
              })}
          </g>
        );
      })}
    </svg>
  );
}
