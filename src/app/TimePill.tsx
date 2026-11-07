import { strings } from '../i18n';
import { useUi, type TimeSpeed } from '../state/ui';
import { IconButton } from '../ui/IconButton';

const options = (): {
  speed: TimeSpeed;
  icon: 'pause' | 'play' | 'ff';
  label: string;
  key: string;
}[] => [
  { speed: 'pause', icon: 'pause', label: strings.pause, key: 'Space' },
  { speed: 'play', icon: 'play', label: strings.play, key: 'Space' },
  { speed: 'fast', icon: 'ff', label: strings.faster, key: 'F' },
];

/** Pause / play / fast. The current speed is filled ink and marked pressed. */
export function TimePill() {
  const time = useUi((s) => s.time);
  const setTime = useUi((s) => s.setTime);
  return (
    <div className="time-pill" role="group" aria-label={strings.time}>
      {options().map((o) => (
        <IconButton
          key={o.speed}
          icon={o.icon}
          label={o.label}
          shortcut={o.key}
          tone="plain"
          noTextLabel
          pressed={time === o.speed}
          onClick={() => setTime(o.speed)}
        />
      ))}
    </div>
  );
}
