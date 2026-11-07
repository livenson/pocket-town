import { town, type BuildingKind } from '../content/rooms';
import type { IconName } from '../design/icons';
import { buildingName, strings } from '../i18n';
import { usePlay } from '../state/play';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { PegPortrait } from '../ui/PegPortrait';
import { useWorldTick } from './game';

const ICON: Record<BuildingKind, IconName> = {
  house: 'house',
  cafe: 'shop',
  park: 'tree',
  library: 'book',
  musicHall: 'note',
};

/** D5 follow-cam: who is followed, the places they have been, and a stop button. */
export function FollowBar() {
  const world = useWorldTick(2);
  const id = usePlay((s) => s.followBotId);
  const crumbs = usePlay((s) => s.breadcrumb);
  const follow = usePlay((s) => s.follow);
  const bot = world.bots.find((b) => b.id === id);
  if (!bot) return null;
  return (
    <nav className="follow-bar" aria-label={strings.following(bot.name)}>
      <span className="follow-bar__who" aria-hidden="true">
        <PegPortrait appearance={bot.appearance} size={56} crop="head" />
      </span>
      <ol className="follow-bar__crumbs">
        {crumbs.map((b, i) => {
          const building = town.find((t) => t.id === b);
          const here = i === crumbs.length - 1 && !bot.travel;
          return (
            <li
              key={`${b}-${i}`}
              className="follow-bar__crumb"
              data-here={here || undefined}
              aria-label={buildingName(b)}
            >
              <Icon name={building ? ICON[building.kind] : 'house'} size={24} />
            </li>
          );
        })}
        {bot.travel && (
          <li className="follow-bar__crumb" data-here aria-label={strings.onTheWay}>
            <Icon name="map" size={24} />
          </li>
        )}
      </ol>
      <IconButton
        icon="close"
        label={strings.stopFollowing}
        className="follow-bar__stop"
        onClick={() => follow(null)}
      />
    </nav>
  );
}
