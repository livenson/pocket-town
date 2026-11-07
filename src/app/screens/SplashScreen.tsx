import { useEffect, useRef } from 'react';
import { playSfx } from '../../audio/audio';
import { starterCast } from '../../content/characters';
import { strings } from '../../i18n';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { PegPortrait } from '../../ui/PegPortrait';
import { useShowTextLabels } from '../../ui/labels';

const AUTO_CONTINUE_MS = 2600;
const HOUSES = [
  { roof: '#FFB627', body: '#fff', w: 70, h: 62 },
  { roof: '#0FA394', body: '#FFF8F0', w: 92, h: 96 },
  { roof: '#4F6BF0', body: '#fff', w: 70, h: 62 },
];

/** A1 splash: the town builds itself while the game loads, then carries on by itself. */
export function SplashScreen() {
  const go = useUi((s) => s.go);
  const words = useShowTextLabels();
  const done = useRef(false);

  const next = () => {
    if (done.current) return;
    done.current = true;
    const { profiles } = useProfiles.getState();
    go(profiles.length > 0 ? 'profile' : 'age');
  };

  useEffect(() => {
    // Load the play stage while the town builds, so play starts without a wait.
    const loading = import('../../stage/stage').catch(() => undefined);
    const fonts = document.fonts?.ready ?? Promise.resolve();
    const minimum = new Promise((r) => setTimeout(r, AUTO_CONTINUE_MS));
    let cancelled = false;
    void Promise.all([loading, fonts, minimum]).then(() => {
      if (!cancelled) next();
    });
    return () => {
      cancelled = true;
    };
    // `next` only reads stores; running once on mount is intended.
    // oxlint-disable-next-line react/exhaustive-deps
  }, []);

  return (
    <button
      type="button"
      className="splash"
      aria-label={strings.onboarding.loading}
      onClick={() => {
        playSfx('tap');
        next();
      }}
    >
      <span className="splash__town" aria-hidden="true">
        {HOUSES.map((h, i) => (
          <span key={i} className="splash__house" style={{ animationDelay: `${150 + i * 220}ms` }}>
            <span className="splash__roof" style={{ color: h.roof, width: h.w + 14 }} />
            <span
              className="splash__body"
              style={{ background: h.body, width: h.w, height: h.h }}
            />
          </span>
        ))}
      </span>
      <span className="splash__ground" aria-hidden="true" />
      <span className="splash__title">{strings.appName}</span>
      <span className="splash__pegs" aria-hidden="true">
        {starterCast.slice(0, 3).map((c, i) => (
          <span key={c.id} className="splash__peg" style={{ animationDelay: `${i * 160}ms` }}>
            <PegPortrait appearance={c.appearance} size={72} />
          </span>
        ))}
      </span>
      {words && <span className="splash__loading">{strings.onboarding.building}</span>}
    </button>
  );
}
