// Speak a control's label on long-press (touch, 450 ms) or hover (mouse, 600 ms).
// A long-press that spoke does not also activate the control, so children can
// "ask" what a button does without pressing it.
import { useCallback, useEffect, useRef } from 'react';
import type { MouseEvent, PointerEvent } from 'react';
import { motion } from '../design/tokens';
import { speak } from '../audio/speech';

export interface VoiceLabelHandlers {
  onPointerEnter: (e: PointerEvent<HTMLElement>) => void;
  onPointerDown: (e: PointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerLeave: () => void;
  onPointerCancel: () => void;
  onClickCapture: (e: MouseEvent<HTMLElement>) => void;
}

export function useVoiceLabel(label: string): VoiceLabelHandlers {
  const timer = useRef<number | undefined>(undefined);
  const spokeOnPress = useRef(false);

  const clear = useCallback(() => {
    window.clearTimeout(timer.current);
    timer.current = undefined;
  }, []);

  useEffect(() => clear, [clear]);

  return {
    onPointerEnter: (e) => {
      if (e.pointerType !== 'mouse') return;
      clear();
      timer.current = window.setTimeout(() => speak(label), motion.hoverVoice);
    },
    onPointerDown: (e) => {
      clear();
      spokeOnPress.current = false;
      if (e.pointerType === 'mouse') return;
      timer.current = window.setTimeout(() => {
        spokeOnPress.current = true;
        speak(label);
      }, motion.longPressVoice);
    },
    onPointerUp: clear,
    onPointerLeave: clear,
    onPointerCancel: clear,
    onClickCapture: (e) => {
      if (spokeOnPress.current) {
        spokeOnPress.current = false;
        e.preventDefault();
        e.stopPropagation();
      }
    },
  };
}
