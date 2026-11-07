import { useState } from 'react';
import { categories, objectKinds, type ObjectCategory } from '../content/objects';
import type { AnyIconName } from '../design/foodIcons';
import { strings, thingName } from '../i18n';
import { useCarrySource } from '../input/carry';
import { useHints } from './hints';
import { usePlay } from '../state/play';
import { Carousel } from '../ui/Carousel';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { useShowTextLabels } from '../ui/labels';
import { useVoiceLabel } from '../ui/useVoiceLabel';

interface TileProps {
  id: string;
  label: string;
  icon: AnyIconName;
  tint: string;
}

/** A thing in the drawer: drag it out, or tap to pick it up (it rides on a marigold halo). */
function ObjectTile({ id, label, icon, tint }: TileProps) {
  const voice = useVoiceLabel(label);
  const carry = useCarrySource(id, { from: 'drawer' });
  const inHand = usePlay((s) => s.carrying?.kind === id && s.carrying.source.from === 'drawer');
  const hinted = useHints((s) => s.step === 'cake' && id === 'cake');
  const words = useShowTextLabels();
  return (
    <button
      type="button"
      className={hinted ? 'object-tile hint-glow' : 'object-tile'}
      style={{ background: tint }}
      aria-label={label}
      aria-pressed={inHand}
      data-kind={id}
      {...voice}
      {...carry}
      onClickCapture={voice.onClickCapture}
    >
      <Icon name={icon} size={46} />
      {words && (
        <span className="object-tile__name" aria-hidden="true">
          {label}
        </span>
      )}
    </button>
  );
}

/** Object drawer: category tabs and a paged carousel of things. */
export function ObjectDrawer({ perPage, columns }: { perPage: number; columns?: number }) {
  const [category, setCategory] = useState<ObjectCategory>('food');
  const items = objectKinds.filter((o) => o.category === category);
  return (
    <div className="drawer">
      <div className="drawer__tabs" role="group" aria-label={strings.things}>
        {categories.map((c) => (
          <IconButton
            key={c.id}
            icon={c.icon}
            label={strings[c.id]}
            tone="plain"
            noTextLabel
            pressed={c.id === category}
            className="drawer__tab"
            onClick={() => setCategory(c.id)}
          />
        ))}
      </div>
      <Carousel
        key={category}
        label={strings[category]}
        perPage={perPage}
        columns={columns}
        items={items.map((o) => (
          <ObjectTile key={o.id} id={o.id} label={thingName(o.id)} icon={o.icon} tint={o.tint} />
        ))}
      />
    </div>
  );
}
