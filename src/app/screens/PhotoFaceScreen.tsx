import { useEffect, useMemo, useRef, useState } from 'react';
import type { Appearance } from '../../content/appearance';
import { randomLook, randomName, randomTraits } from '../../content/looks';
import { strings } from '../../i18n';
import type { PhotoLook } from '../../photo/faceFromPhoto';
import { LookAverager } from '../../photo/lookAverager';
import { BodyReader } from '../../photo/liveBody';
import { ExpressionReader, type LiveFace } from '../../photo/liveFace';
import type { Angles } from '../../stage/peg/rig';
import { useCreation } from '../../state/creation';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { PegPortrait } from '../../ui/PegPortrait';
import { playerBotId } from '../game';
import { ScreenFrame } from './ScreenFrame';

type Phase =
  'idle' | 'loading' | 'camera' | 'looking' | 'result' | 'noFace' | 'unavailable' | 'denied';

/** The suggested look on top of a starting look (the player's, or a surprise). */
function applyLook(base: Appearance, look: PhotoLook): Appearance {
  return {
    ...base,
    ...(look.skin ? { skin: look.skin } : {}),
    ...(look.hair ? { hair: look.hair } : {}),
    face: { ...base.face, ...look.face },
  };
}

/**
 * Grown-ups only (behind the gate): make a character from a photo or the camera.
 * The face finder runs on this device; the picture is never saved or sent. The
 * camera view shows the suggested character beside it, copying smiles and blinks,
 * waving and raised arms.
 */
export function PhotoFaceScreen() {
  const P = strings.photoFace;
  const go = useUi((s) => s.go);
  const me = useProfiles((s) => s.profiles.find((p) => p.id === s.activeId) ?? null);
  const [base] = useState<Appearance>(() => me?.appearance ?? randomLook());
  const [phase, setPhase] = useState<Phase>('idle');
  const [look, setLook] = useState<PhotoLook | null>(null);
  const [live, setLive] = useState<LiveFace | null>(null);
  // Made once: the camera loop reads expressions from it on every frame.
  const [reader] = useState(() => new ExpressionReader());
  /** The mirror's arms and upper body (null until the body finder has seen a frame). */
  const [pose, setPose] = useState<Angles | null>(null);
  const [bodyReader] = useState(() => new BodyReader());
  /** The mirror learns the child's resting face first. */
  const [calibrated, setCalibrated] = useState(false);
  const video = useRef<HTMLVideoElement>(null);
  const stream = useRef<MediaStream | null>(null);
  const stopWatch = useRef<(() => void) | null>(null);
  const averager = useRef(new LookAverager());
  /** False once the screen is left: async steps that finish later then undo themselves. */
  const alive = useRef(true);
  /** Bumps on every start or stop, so a slow start that was cancelled gives up. */
  const session = useRef(0);
  /** Set once the face finder's code has loaded (only then is there anything to close). */
  const finderLoaded = useRef(false);
  /** Set once the body finder's code has loaded. */
  const bodyLoaded = useRef(false);

  const stopCamera = () => {
    session.current++;
    stopWatch.current?.();
    stopWatch.current = null;
    for (const t of stream.current?.getTracks() ?? []) t.stop();
    stream.current = null;
    if (video.current) video.current.srcObject = null;
  };

  // Leaving the screen: camera off, face finder's memory freed (if it was loaded).
  useEffect(() => {
    const watch = stopWatch;
    const media = stream;
    const loaded = finderLoaded;
    const bodyOn = bodyLoaded;
    const onScreen = alive;
    const run = session;
    onScreen.current = true;
    return () => {
      onScreen.current = false;
      run.current++;
      watch.current?.();
      watch.current = null;
      for (const t of media.current?.getTracks() ?? []) t.stop();
      media.current = null;
      if (loaded.current)
        void import('../../photo/faceFinder').then((m) => m.closeFinder()).catch(() => {});
      if (bodyOn.current)
        void import('../../photo/bodyFinder').then((m) => m.closeBody()).catch(() => {});
    };
  }, []);

  /** Load the face finder's code; null when it cannot load (offline, old device). */
  const loadFinder = async () => {
    try {
      const m = await import('../../photo/faceFinder');
      finderLoaded.current = true;
      return m;
    } catch {
      return null;
    }
  };

  /** Load the body finder; null when it cannot load (the face mirror still works). */
  const loadBody = async () => {
    try {
      const m = await import('../../photo/bodyFinder');
      bodyLoaded.current = true;
      const ok = await m.prepareBody();
      // The screen was left while it loaded: free it at once.
      if (!alive.current) {
        await m.closeBody();
        return null;
      }
      return ok ? m : null;
    } catch {
      return null;
    }
  };

  const startCamera = async () => {
    stopCamera();
    const run = session.current;
    /** The screen was left or the camera stopped while we were waiting. */
    const gone = () => !alive.current || session.current !== run;
    setPhase('loading');
    averager.current.reset();
    setLook(null);
    let media: MediaStream;
    try {
      media = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: { ideal: 640 }, height: { ideal: 480 } },
        audio: false,
      });
    } catch {
      if (!gone()) setPhase('denied');
      return;
    }
    const v = video.current;
    if (gone() || !v) {
      for (const t of media.getTracks()) t.stop();
      return;
    }
    stream.current = media;
    v.srcObject = media;
    await v.play().catch(() => {});
    const finder = await loadFinder();
    const ready = finder ? await finder.prepareFinder() : false;
    if (gone()) return;
    if (!finder || !ready) {
      stopCamera();
      setPhase('unavailable');
      return;
    }
    let last = 0;
    let lookAt = 0;
    reader.reset();
    bodyReader.reset();
    setCalibrated(false);
    setPose(null);
    // The body finder loads beside the face mirror, which starts without waiting
    // for it; until it is ready (or if it cannot load) the arms stay at rest.
    let body: Awaited<ReturnType<typeof loadBody>> = null;
    let angles: Angles | null = null;
    void loadBody().then((m) => {
      if (!gone()) body = m;
    });
    try {
      const stop = await finder.watchVideo(v, ({ look: l, scores, points }) => {
        if (l) averager.current.add(l);
        // The expression is read on every frame (so smoothing and calibration see
        // them all) and drawn about 30 times a second; the slower-changing look
        // (shape, colours) about 5 times a second.
        const face = reader.read(scores, points);
        // The body is read from the same video, every second frame or less often.
        const b = body?.readBody(v);
        if (b) angles = bodyReader.read(b.points, b.aspect);
        const now = performance.now();
        if (now - last < 33) return;
        last = now;
        setLive(face);
        setPose(angles);
        setCalibrated(reader.calibrated);
        if (now - lookAt > 200) {
          lookAt = now;
          setLook(averager.current.current());
        }
      });
      if (gone()) {
        stop();
        return;
      }
      stopWatch.current = stop;
      setPhase('camera');
    } catch {
      stopCamera();
      if (alive.current) setPhase('unavailable');
    }
  };

  const keep = () => {
    stopCamera();
    setLive(null);
    setPhase(look ? 'result' : 'noFace');
  };

  const fromPhoto = async (file: File | undefined) => {
    if (!file) return;
    stopCamera();
    setPhase('looking');
    const finder = await loadFinder();
    const r = finder ? await finder.lookFromPhoto(file) : { kind: 'unavailable' as const };
    if (!alive.current) return;
    if (r.kind === 'look') {
      setLook(r.look);
      setPhase('result');
    } else setPhase(r.kind);
  };

  // The look changes about 5 times a second; the expression about 30: only
  // recompute the look when it changes.
  const preview = useMemo(() => (look ? applyLook(base, look) : base), [base, look]);

  const applyTo = (target: 'new' | 'me') => {
    if (!look) return;
    const set = useCreation.getState().set;
    if (target === 'me' && me) {
      set({
        target: { kind: 'editBot', botId: playerBotId(me) },
        appearance: structuredClone(preview),
        name: me.name,
        traits: [...me.traits],
      });
    } else {
      set({
        target: { kind: 'newBot' },
        appearance: structuredClone(preview),
        name: randomName(),
        traits: randomTraits(),
      });
    }
    go('avatarWizard');
  };

  const status =
    phase === 'loading'
      ? P.loading
      : phase === 'looking'
        ? P.looking
        : phase === 'noFace'
          ? P.noFace
          : phase === 'unavailable'
            ? P.unavailable
            : phase === 'denied'
              ? P.denied
              : phase === 'camera'
                ? calibrated
                  ? P.mirror
                  : P.calibrating
                : null;

  return (
    <ScreenFrame title={strings.screens.photoFace} className="screen--photo-face">
      <div className="photo-face">
        <p className="grown-up__note">{P.privacy}</p>
        <div className="photo-face__stage">
          <div className="photo-face__camera" data-on={phase === 'camera' || phase === 'loading'}>
            <video
              ref={video}
              className="photo-face__video"
              playsInline
              muted
              aria-label={P.video}
            />
          </div>
          <figure className="photo-face__preview" aria-label={P.preview}>
            <PegPortrait
              appearance={preview}
              live={phase === 'camera' && live ? live : undefined}
              pose={phase === 'camera' && pose ? pose : undefined}
              size={260}
              crop="reach"
            />
          </figure>
        </div>
        {status && (
          <p className="photo-face__status" role="status">
            {status}
          </p>
        )}
        <div className="photo-face__actions">
          {phase === 'camera' ? (
            <>
              <Button variant="primary" icon="check" label={P.keep} showWord onClick={keep} />
              <Button
                variant="secondary"
                icon="close"
                label={P.stop}
                showWord
                onClick={() => {
                  stopCamera();
                  setPhase('idle');
                }}
              />
            </>
          ) : phase === 'result' ? (
            <>
              <Button
                variant="primary"
                icon="plus"
                label={P.newCharacter}
                showWord
                onClick={() => applyTo('new')}
              />
              {me && (
                <Button
                  variant="secondary"
                  icon="peg"
                  label={P.give(me.name)}
                  showWord
                  onClick={() => applyTo('me')}
                />
              )}
              <Button
                variant="secondary"
                icon="refresh"
                label={P.again}
                showWord
                onClick={() => {
                  setLook(null);
                  setPhase('idle');
                }}
              />
            </>
          ) : (
            <>
              <Button
                variant="primary"
                icon="camera"
                label={P.camera}
                showWord
                disabled={phase === 'loading' || phase === 'looking'}
                onClick={() => void startCamera()}
              />
              <label
                className="photo-face__file btn btn--secondary btn--word"
                aria-disabled={phase === 'loading' || phase === 'looking' || undefined}
              >
                <input
                  type="file"
                  accept="image/*"
                  disabled={phase === 'loading' || phase === 'looking'}
                  className="visually-hidden"
                  onChange={(e) => {
                    void fromPhoto(e.target.files?.[0]);
                    e.target.value = '';
                  }}
                />
                <span>{P.photo}</span>
              </label>
            </>
          )}
        </div>
      </div>
    </ScreenFrame>
  );
}
