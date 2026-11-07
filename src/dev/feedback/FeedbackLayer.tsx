// The play-testing tool the kid sees on the dev server: tell Claude something
// (point at it, pick a face, say it), then hear what Claude did and decide.
import { useCallback, useEffect, useRef, useState } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { game } from '../../app/game';
import { currentLanguage } from '../../i18n';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import type { IconName } from '../../design/icons';
import { BUSY, sendNew, sendVerdict, useInbox, type ItemSummary, type RoundPayload } from './api';
import {
  blobToBase64,
  canRecord,
  captureScreen,
  describePoint,
  recentTrail,
  startRecording,
  UI_ATTR,
  type Recording,
} from './capture';
import { goTo } from './restore';
import { fs } from './strings';

type Mood = 'love' | 'ok' | 'sad' | 'idea';
type PointInfo = ReturnType<typeof describePoint>;

type Step =
  | { kind: 'closed' }
  | { kind: 'capturing' }
  | { kind: 'point'; shot: string | null }
  | { kind: 'tell'; shot: string | null; point: PointInfo | null }
  | { kind: 'sending' }
  | { kind: 'said'; text: string; icon: IconName }
  | { kind: 'reply'; id: string };

const uiProps = { [UI_ATTR]: '' };

function Face({ mood }: { mood: Mood }) {
  if (mood === 'idea') return <Icon name="sparkle" size={44} strokeWidth={3} />;
  const mouth =
    mood === 'love'
      ? 'M15 27 Q24 36 33 27'
      : mood === 'ok'
        ? 'M16 30 L32 30'
        : 'M15 33 Q24 25 33 33';
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
    >
      <circle cx="24" cy="24" r="20" />
      <circle cx="17" cy="19" r="1.5" fill="currentColor" />
      <circle cx="31" cy="19" r="1.5" fill="currentColor" />
      <path d={mouth} />
    </svg>
  );
}

function Mic() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="3.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="17" y="6" width="14" height="24" rx="7" />
      <path d="M10 23a14 14 0 0 0 28 0M24 37v6M17 43h14" />
    </svg>
  );
}

/** A big round button with an icon; the label is spoken on hover and read by screen readers. */
function Btn({
  label,
  onClick,
  children,
  tone = 'paper',
  pressed,
  size = 'md',
}: {
  label: string;
  onClick: () => void;
  children: React.ReactNode;
  tone?: 'paper' | 'go' | 'stop' | 'soft';
  pressed?: boolean;
  size?: 'md' | 'lg';
}) {
  return (
    <button
      type="button"
      className={`fb-btn fb-btn--${tone} fb-btn--${size}`}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      onPointerEnter={(e) => e.pointerType === 'mouse' && speak(label)}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function round(
  base: { shot: string | null; point: PointInfo | null },
  extra: Omit<RoundPayload, 'screenshot' | 'point' | 'trail' | 'screen' | 'roomId' | 'world'>,
): RoundPayload {
  const ui = useUi.getState();
  return {
    ...extra,
    screenshot: base.shot,
    point: base.point,
    trail: recentTrail(),
    screen: ui.nav.screen,
    roomId: ui.roomId,
    world: JSON.parse(JSON.stringify(game.world)) as unknown,
  };
}

function TellCard({
  shot,
  point,
  prompt,
  onSend,
  onClose,
}: {
  shot: string | null;
  point: PointInfo | null;
  prompt: string;
  onSend: (r: RoundPayload) => void;
  onClose: () => void;
}) {
  const S = fs();
  const [mood, setMood] = useState<Mood | null>(null);
  const [text, setText] = useState('');
  const [voice, setVoice] = useState<Blob | null>(null);
  const [level, setLevel] = useState(0);
  const [recording, setRecording] = useState<Recording | null>(null);
  const [micOk] = useState(canRecord);
  const autoStop = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => speak(prompt), [prompt]);
  useEffect(() => () => clearTimeout(autoStop.current), []);

  const stop = async () => {
    clearTimeout(autoStop.current);
    if (!recording) return;
    const rec = recording;
    setRecording(null);
    setLevel(0);
    setVoice(await rec.stop());
    playSfx('place');
  };
  const toggleMic = async () => {
    if (recording) return stop();
    if (!micOk) return speak(S.noMic);
    try {
      speechSynthesis.cancel();
      const rec = await startRecording(setLevel);
      setRecording(rec);
      autoStop.current = setTimeout(() => void stop(), 90_000);
    } catch {
      speak(S.noMic);
    }
  };
  const send = async () => {
    let blob = voice;
    if (recording) {
      const rec = recording;
      setRecording(null);
      blob = await rec.stop();
    }
    const data = blob ? { mime: blob.type, data: await blobToBase64(blob) } : null;
    onSend(round({ shot, point }, { mood, text, voice: data }));
  };

  const vw = window.innerWidth;
  const vh = window.innerHeight;
  return (
    <div className="fb-card fb-card--tell" role="dialog" aria-modal="true" aria-label={prompt}>
      {shot && (
        <div className="fb-shot" style={{ aspectRatio: `${vw} / ${vh}` }}>
          <img src={shot} alt="" />
          {point && (
            <span
              className="fb-shot__mark"
              style={{ left: `${(point.x / vw) * 100}%`, top: `${(point.y / vh) * 100}%` }}
            />
          )}
        </div>
      )}
      <div className="fb-row" role="group" aria-label={prompt}>
        {(['love', 'ok', 'sad', 'idea'] as const).map((m) => (
          <Btn
            key={m}
            label={S[m]}
            pressed={mood === m}
            tone="soft"
            onClick={() => {
              playSfx('tap');
              setMood(m);
              speak(S[m]);
            }}
          >
            <Face mood={m} />
          </Btn>
        ))}
      </div>
      <div className="fb-row">
        <span className="fb-mic" style={{ ['--level' as string]: level }}>
          <Btn
            label={recording ? S.stop : S.record}
            tone={recording ? 'stop' : 'paper'}
            size="lg"
            pressed={!!recording}
            onClick={() => void toggleMic()}
          >
            {recording ? <span className="fb-stop-square" aria-hidden="true" /> : <Mic />}
          </Btn>
        </span>
        {voice && !recording && (
          <Btn label={S.listen} onClick={() => void new Audio(URL.createObjectURL(voice)).play()}>
            <Icon name="speaker" size={40} strokeWidth={3} />
          </Btn>
        )}
      </div>
      <label className="fb-write">
        <Icon name="pencil" size={24} strokeWidth={3} />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label={S.write}
          placeholder="…"
          rows={2}
        />
      </label>
      <div className="fb-row fb-row--end">
        <Btn label={S.close} onClick={onClose}>
          <Icon name="close" size={36} strokeWidth={3} />
        </Btn>
        <Btn label={S.send} tone="go" size="lg" onClick={() => void send()}>
          <Icon name="mail" size={48} strokeWidth={3} />
        </Btn>
      </div>
    </div>
  );
}

function ReplyCard({
  item,
  onDone,
  onAgain,
}: {
  item: ItemSummary;
  onDone: (text: string, icon: IconName) => void;
  onAgain: () => void;
}) {
  const S = fs();
  const reply = item.reply;
  const say = reply?.say ?? '';
  useEffect(() => {
    playSfx('chime');
    const t = setTimeout(() => speak(say), 300);
    return () => clearTimeout(t);
  }, [say]);
  const verdict = (v: 'keep' | 'undo' | 'heard', text: string, icon: IconName) => {
    void sendVerdict(item.id, v);
    onDone(text, icon);
  };
  const proposal = item.status === 'proposed';
  return (
    <div className="fb-card fb-card--reply" role="dialog" aria-modal="true" aria-label={S.message}>
      <span className="fb-helper" aria-hidden="true">
        <Icon name="sparkle" size={56} strokeWidth={3} />
      </span>
      <p className="fb-say" aria-live="polite">
        {say}
      </p>
      <div className="fb-row">
        <Btn label={S.hearAgain} onClick={() => speak(say)}>
          <Icon name="speaker" size={40} strokeWidth={3} />
        </Btn>
        {(reply?.screen || reply?.roomId) && (
          <Btn
            label={S.showMe}
            onClick={() => {
              goTo(reply.screen, reply.roomId);
              onDone('', 'eye');
            }}
          >
            <Icon name="eye" size={40} strokeWidth={3} />
          </Btn>
        )}
      </div>
      {proposal ? (
        <div className="fb-row fb-row--decide">
          <Btn label={S.undo} tone="soft" onClick={() => verdict('undo', S.undone, 'undo')}>
            <Icon name="undo" size={40} strokeWidth={3} />
          </Btn>
          <Btn label={S.again} tone="soft" onClick={onAgain}>
            <Icon name="refresh" size={40} strokeWidth={3} />
          </Btn>
          <Btn label={S.keep} tone="go" size="lg" onClick={() => verdict('keep', S.kept, 'heart')}>
            <Icon name="heart" size={52} strokeWidth={3} />
          </Btn>
        </div>
      ) : (
        <div className="fb-row fb-row--end">
          <Btn label={S.gotIt} tone="go" size="lg" onClick={() => verdict('heard', '', 'check')}>
            <Icon name="check" size={52} strokeWidth={3} />
          </Btn>
        </div>
      )}
    </div>
  );
}

export function FeedbackLayer() {
  const S = fs();
  const items = useInbox((s) => s.items);
  const [step, setStep] = useState<Step>({ kind: 'closed' });
  /** Set while the kid explains how a proposed change should be different. */
  const [againId, setAgainId] = useState<string | null>(null);
  const waiting = items.find((i) => i.status === 'proposed' || i.status === 'declined');
  const busy = items.some((i) => BUSY.includes(i.status));

  const close = useCallback(() => {
    setStep({ kind: 'closed' });
    setAgainId(null);
  }, []);

  useEffect(() => {
    if (step.kind === 'closed') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        close();
      }
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [step.kind, close]);

  useEffect(() => {
    if (step.kind !== 'said') return;
    if (step.text) speak(step.text);
    const t = setTimeout(close, 2200);
    return () => clearTimeout(t);
  }, [step, close]);

  const begin = async () => {
    playSfx('camera');
    setStep({ kind: 'capturing' });
    const shot = await captureScreen();
    setStep({ kind: 'point', shot });
    speak(S.point);
  };

  const send = async (r: RoundPayload) => {
    setStep({ kind: 'sending' });
    const me = useProfiles.getState();
    const player = me.profiles.find((p) => p.id === me.activeId);
    const ok = againId
      ? await sendVerdict(againId, 'again', r)
      : await sendNew({
          ...r,
          language: currentLanguage(),
          player: player ? { name: player.name, age: player.age } : null,
          layout: document.documentElement.dataset.layout ?? '',
          viewport: { w: window.innerWidth, h: window.innerHeight, dpr: window.devicePixelRatio },
          userAgent: navigator.userAgent,
        });
    playSfx(ok ? 'confirm' : 'soft');
    setAgainId(null);
    setStep({ kind: 'said', text: S.thanks, icon: 'heart' });
  };

  return (
    <div className="fb" {...uiProps}>
      {step.kind === 'closed' && (
        <div className="fb-dock">
          {waiting && (
            <button
              type="button"
              className="fb-dock__btn fb-dock__btn--message"
              aria-label={S.message}
              onClick={() => setStep({ kind: 'reply', id: waiting.id })}
            >
              <Icon name="sparkle" size={36} strokeWidth={3} />
            </button>
          )}
          <button
            type="button"
            className="fb-dock__btn"
            aria-label={S.open}
            onClick={() => void begin()}
          >
            <Icon name="talk" size={36} strokeWidth={3} />
            {busy && (
              <span className="fb-dock__busy" role="img" aria-label={S.thinking}>
                <Icon name="sparkle" size={18} strokeWidth={3} />
              </span>
            )}
          </button>
        </div>
      )}

      {step.kind === 'capturing' && <div className="fb-flash" aria-hidden="true" />}

      {step.kind === 'point' && (
        <div
          className="fb-point"
          role="dialog"
          aria-modal="true"
          aria-label={S.point}
          onPointerDown={(e) => {
            if (e.target !== e.currentTarget) return;
            playSfx('place');
            setStep({ kind: 'tell', shot: step.shot, point: describePoint(e.clientX, e.clientY) });
          }}
        >
          <span className="fb-point__hint" aria-hidden="true">
            <Icon name="target" size={56} strokeWidth={3} />
          </span>
          <div className="fb-point__bar">
            <Btn label={S.close} onClick={close}>
              <Icon name="close" size={36} strokeWidth={3} />
            </Btn>
            <Btn
              label={S.everything}
              size="lg"
              tone="soft"
              onClick={() => setStep({ kind: 'tell', shot: step.shot, point: null })}
            >
              <Icon name="eye" size={44} strokeWidth={3} />
            </Btn>
          </div>
        </div>
      )}

      {step.kind === 'tell' && (
        <div className="fb-scrim">
          <TellCard
            shot={step.shot}
            point={step.point}
            prompt={againId ? S.againTell : S.tell}
            onSend={(r) => void send(r)}
            onClose={close}
          />
        </div>
      )}

      {step.kind === 'sending' && (
        <div className="fb-scrim">
          <div className="fb-card fb-card--small" aria-live="polite">
            <span className="fb-spin" aria-label={S.send} role="img">
              <Icon name="mail" size={56} strokeWidth={3} />
            </span>
          </div>
        </div>
      )}

      {step.kind === 'said' && step.text && (
        <div className="fb-scrim" onPointerDown={close}>
          <div className="fb-card fb-card--small" role="status">
            <Icon name={step.icon} size={64} strokeWidth={3} />
            <p className="fb-say">{step.text}</p>
          </div>
        </div>
      )}

      {step.kind === 'reply' &&
        (() => {
          const item = items.find((i) => i.id === step.id);
          if (!item || (item.status !== 'proposed' && item.status !== 'declined')) return null;
          return (
            <div className="fb-scrim">
              <ReplyCard
                item={item}
                onDone={(text, icon) => (text ? setStep({ kind: 'said', text, icon }) : close())}
                onAgain={() => {
                  setAgainId(item.id);
                  void begin();
                }}
              />
            </div>
          );
        })()}
    </div>
  );
}
