// The plane on the world map (see mapPlane.ts). Decoration only: the airport itself
// is the button. Calm motion (setting or system) keeps it parked by the airport;
// pausing time holds it where it is; faster time makes it fly faster.
import { useEffect, useRef } from 'react';
import { pictureUrl } from '../design/thingPicture';
import { useUi } from '../state/ui';
import { useCalmMotion } from './media';
import { mapPlaneAt } from './mapPlane';

/** The picture's nose points north-east; turn it to point east first. */
const PICTURE_TURN = 45;
const SPEED = { pause: 0, play: 1, fast: 2 } as const;

export function MapPlane() {
  const calm = useCalmMotion();
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const place = (t: number) => {
      const box = el.parentElement;
      const aspect = box && box.clientHeight > 0 ? box.clientWidth / box.clientHeight : 1.5;
      const p = mapPlaneAt(t, aspect);
      el.style.left = `${p.x * 100}%`;
      el.style.top = `${p.y * 100}%`;
      el.style.setProperty('--turn', `${(p.heading * 180) / Math.PI + PICTURE_TURN}deg`);
      el.style.setProperty('--height', p.height.toFixed(3));
      el.dataset.flying = p.height > 0.05 ? 'true' : 'false';
    };
    let t = 0;
    place(t);
    if (calm) return;
    let raf = 0;
    let last = performance.now();
    const loop = (now: number) => {
      t += (Math.min(now - last, 100) / 1000) * SPEED[useUi.getState().time];
      last = now;
      place(t);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [calm]);

  return (
    <span ref={ref} className="map-plane" aria-hidden="true">
      <span className="map-plane__shadow" />
      <img
        className="map-plane__picture"
        src={pictureUrl('airplane')}
        alt=""
        width={52}
        height={52}
        draggable={false}
      />
    </span>
  );
}
