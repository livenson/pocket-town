// The burst where a thing was put in one of its places (content/placeIdeas.ts):
// hearts for a meal together, notes for a jam, stars, petals, confetti, zzz or
// bubbles. Decorative; the characters coming over say the rest.
import type { BurstKind } from '../content/placeIdeas';
import type { IconName } from '../design/icons';
import { color } from '../design/tokens';
import { usePlay } from '../state/play';
import { Icon } from '../ui/Icon';

const LOOK: Record<BurstKind, { icon: IconName | null; colors: string[] }> = {
  hearts: { icon: 'heart', colors: [color.heart, color.tomato, color.blossom] },
  notes: { icon: 'note', colors: [color.purple, color.cornflower, color.teal] },
  stars: { icon: 'star', colors: [color.marigold, color.tomato, color.teal] },
  petals: { icon: 'plant', colors: [color.leaf, color.blossom, color.marigold] },
  confetti: { icon: null, colors: [color.tomato, color.marigold, color.teal, color.cornflower] },
  zzz: { icon: 'zzz', colors: [color.cornflower, color.purple] },
  bubbles: { icon: null, colors: [color.sky, color.water, '#FFFFFF'] },
};

const COUNT = 10;

export function PlaceBurst() {
  const moment = usePlay((s) => s.moment);
  if (!moment) return null;
  const look = LOOK[moment.kind];
  return (
    <div
      key={moment.id}
      className={`place-burst place-burst--${moment.kind}`}
      aria-hidden="true"
      style={{ transform: `translate(${moment.x}px, ${moment.y}px)` }}
    >
      {Array.from({ length: COUNT }, (_, i) => (
        <span
          key={i}
          className="place-burst__bit"
          style={{
            ['--a' as string]: `${(i / COUNT) * 360}deg`,
            ['--d' as string]: `${(i % 3) * 60}ms`,
            color: look.colors[i % look.colors.length],
          }}
        >
          {look.icon ? <Icon name={look.icon} size={36} strokeWidth={3.4} /> : null}
        </span>
      ))}
    </div>
  );
}
