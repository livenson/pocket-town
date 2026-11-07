import { useEffect } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { strings } from '../../i18n';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { PegPortrait } from '../../ui/PegPortrait';
import { useShowTextLabels } from '../../ui/labels';

const CONFETTI = [
  { x: 10, y: 14, c: '#FFB627', r: 30 },
  { x: 78, y: 18, c: '#fff', r: -20 },
  { x: 22, y: 28, c: '#4F6BF0', r: 0, dot: true },
  { x: 84, y: 34, c: '#7BC74D', r: 60 },
  { x: 46, y: 12, c: '#FF8FB1', r: 0, dot: true },
  { x: 14, y: 48, c: '#FFE08A', r: -45 },
  { x: 90, y: 54, c: '#FFB627', r: 20 },
  { x: 62, y: 26, c: '#fff', r: 70 },
];

/** A short celebration, then straight into play. */
export function HoorayScreen() {
  const go = useUi((s) => s.go);
  const profiles = useProfiles((s) => s.profiles);
  const activeId = useProfiles((s) => s.activeId);
  const words = useShowTextLabels();
  const me = profiles.find((p) => p.id === activeId);
  const title = strings.onboarding.hooray(me?.name ?? '');

  useEffect(() => {
    playSfx('jingle');
    speak(title);
  }, [title]);

  if (!me) return null;
  return (
    <div className="screen screen--hooray">
      {CONFETTI.map((c, i) => (
        <span
          key={i}
          className={c.dot ? 'confetti confetti--dot' : 'confetti'}
          aria-hidden="true"
          style={{
            left: `${c.x}%`,
            top: `${c.y}%`,
            background: c.c,
            transform: `rotate(${c.r}deg)`,
            animationDelay: `${i * 90}ms`,
          }}
        />
      ))}
      <span className="hooray-peg" aria-hidden="true">
        <PegPortrait appearance={me.appearance} size={250} eyes="wow" />
      </span>
      <span className="hooray-shadow" aria-hidden="true" />
      <h1 className="hooray-title">{title}</h1>
      <button
        type="button"
        className="hooray-play"
        aria-label={strings.play}
        onClick={() => {
          playSfx('tap');
          go('scene');
        }}
      >
        <Icon name="play" size={40} strokeWidth={3} />
        {words && <span>{strings.play}</span>}
      </button>
    </div>
  );
}
