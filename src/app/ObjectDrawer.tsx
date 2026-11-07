import { useState } from 'react';
import { playSfx } from '../audio/audio';
import { categories, objectKinds, type ObjectCategory } from '../content/objects';
import { strings } from '../i18n/strings.en';
import { Carousel } from '../ui/Carousel';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';
import { useVoiceLabel } from '../ui/useVoiceLabel';

function ObjectTile({
  label,
  icon,
  tint,
}: {
  label: string;
  icon: Parameters<typeof Icon>[0]['name'];
  tint: string;
}) {
  const voice = useVoiceLabel(label);
  return (
    <button
      type="button"
      className="object-tile"
      style={{ background: tint }}
      aria-label={label}
      {...voice}
      onClick={() => playSfx('tap')}
    >
      <Icon name={icon} size={46} />
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
          <ObjectTile key={o.id} label={o.label} icon={o.icon} tint={o.tint} />
        ))}
      />
    </div>
  );
}
