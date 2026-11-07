import { useState } from 'react';
import { playSfx } from '../../audio/audio';
import { numberToWords, strings } from '../../i18n';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';

function randomGateNumber(): number {
  // 21–99, skipping round tens so the words always need two digits worth of reading.
  let n = 0;
  while (n % 10 === 0) n = 21 + Math.floor(Math.random() * 79);
  return n;
}

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'] as const;

/** A3 parental gate: a random two-digit number written in words, typed on a keypad. */
export function GateScreen() {
  const [target] = useState(randomGateNumber);
  const [typed, setTyped] = useState('');
  const [wrong, setWrong] = useState(false);
  const back = useUi((s) => s.back);
  const dispatch = useUi((s) => s.dispatch);

  const press = (key: (typeof KEYS)[number]) => {
    if (key === 'del') {
      playSfx('soft');
      setTyped((t) => t.slice(0, -1));
      setWrong(false);
      return;
    }
    if (key === 'ok') {
      if (typed === String(target)) {
        playSfx('confirm');
        dispatch({ type: 'gatePassed' });
      } else {
        playSfx('soft');
        setTyped('');
        setWrong(true);
      }
      return;
    }
    playSfx('tap');
    setWrong(false);
    setTyped((t) => (t.length < 2 ? t + key : t));
  };

  return (
    <div className="gate">
      <IconButton icon="close" label={strings.gate.leave} className="gate__leave" onClick={back} />
      <main className="gate__card">
        <div className="gate__head">
          <span className="gate__lock" aria-hidden="true">
            <Icon name="lock" size={30} />
          </span>
          <h1 className="gate__title" tabIndex={-1}>
            {strings.gate.title}
          </h1>
        </div>
        <p className="gate__prompt">
          {strings.gate.promptBefore}
          <strong>{numberToWords(target)}</strong>
          {strings.gate.promptAfter}
        </p>
        <div className="gate__digits" aria-label={strings.gate.entered} role="group">
          <span className="gate__digit">{typed[0] ?? ''}</span>
          <span className="gate__digit">{typed[1] ?? ''}</span>
        </div>
        {wrong && (
          <p className="gate__wrong" role="alert">
            {strings.gate.wrong}
          </p>
        )}
        <div className="gate__keys">
          {KEYS.map((k) => (
            <button
              key={k}
              type="button"
              className={`gate__key gate__key--${k === 'ok' ? 'ok' : k === 'del' ? 'del' : 'digit'}`}
              aria-label={k === 'ok' ? strings.gate.ok : k === 'del' ? strings.gate.erase : k}
              onClick={() => press(k)}
            >
              {k === 'ok' ? (
                <Icon name="check" size={30} strokeWidth={3} />
              ) : k === 'del' ? (
                <Icon name="back" size={28} strokeWidth={3} />
              ) : (
                k
              )}
            </button>
          ))}
        </div>
        <p className="gate__note">{strings.gate.note}</p>
      </main>
    </div>
  );
}
