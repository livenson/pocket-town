import { objectKinds } from '../../content/objects';
import { pictureUrl } from '../../design/thingPicture';
import { usePlay } from '../../state/play';
import { Icon } from '../../ui/Icon';
import './workshop.css';

/**
 * Making something at the workbench: a puff, sparkles and the new thing popping up
 * (or, for a tool on its own, a little knock). Decoration only; calm motion leaves
 * just the sound.
 */
export function CraftBurst() {
  const burst = usePlay((s) => s.burst);
  if (!burst) return null;
  const art = burst.made ? objectKinds.find((o) => o.id === burst.made)?.art : undefined;
  return (
    <div
      key={burst.id}
      className={burst.made ? 'craft-burst' : 'craft-burst craft-burst--knock'}
      aria-hidden="true"
      style={{ transform: `translate(${burst.x}px, ${burst.y}px)` }}
    >
      <span className="craft-burst__puff" />
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="craft-burst__spark" style={{ ['--i' as string]: i }}>
          <Icon name="sparkle" size={22} />
        </span>
      ))}
      {art && (
        <img className="craft-burst__made" src={pictureUrl(art)} alt="" width={64} height={64} />
      )}
    </div>
  );
}
