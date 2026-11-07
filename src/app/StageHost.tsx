import { useEffect, useRef } from 'react';

/** Hosts the Pixi canvas. The stage code is loaded on first use, so Pixi is not in the first download. */
export function StageHost() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    let cancelled = false;
    let detach: (() => void) | null = null;
    void import('../stage/stage').then(async ({ getStage }) => {
      const stage = await getStage();
      if (cancelled) return;
      stage.attach(el);
      detach = () => stage.detach();
    });
    return () => {
      cancelled = true;
      detach?.();
    };
  }, []);
  return <div ref={ref} className="stage-host" />;
}
