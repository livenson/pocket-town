import type { ReactNode } from 'react';

export interface HintHaloProps {
  active: boolean;
  children: ReactNode;
}

/**
 * Marigold ring around the next thing to try. It pulses; under calm motion the
 * pulse stops and a still ring remains, so the hint is never lost.
 */
export function HintHalo({ active, children }: HintHaloProps) {
  return (
    <span className="hint-halo" data-active={active || undefined}>
      {children}
    </span>
  );
}
