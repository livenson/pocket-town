import { useRef, useState, type ReactNode } from 'react';
import type { PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import {
  shapeScale,
  usesSecondColour,
  type Accessory,
  type Clothes,
  type FaceDetail,
  type Figure,
  type Kind,
  type Appearance,
  type BodyShape,
  type HairStyle,
  type Mouth,
  type Pattern,
} from '../../content/appearance';
import { starterCast } from '../../content/characters';
import {
  allTraits,
  clothesKinds,
  figures,
  randomClothes,
  secondColours,
  withFigure,
  kinds,
  hairStyles,
  names,
  randomLook,
  randomName,
  randomTraits,
} from '../../content/looks';
import { traits as traitDefs, type TraitId } from '../../content/traits';
import type { IconName } from '../../design/icons';
import { hairColors, outfitColors, skinTones } from '../../design/tokens';
import { strings, traitName } from '../../i18n';
import { useCreation } from '../../state/creation';
import { DraftHistory, type Draft } from '../../state/draftHistory';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Carousel } from '../../ui/Carousel';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { StepRail } from '../../ui/StepRail';
import { Switch } from '../../ui/Switch';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { finishCreation, saveCharacter } from '../game';

type StepId =
  | 'start'
  | 'body'
  | 'face'
  | 'hair'
  | 'clothes'
  | 'accessories'
  | 'colours'
  | 'personality'
  | 'name';

const STEPS: { id: StepId; icon: IconName }[] = [
  { id: 'start', icon: 'dice' },
  { id: 'body', icon: 'peg' },
  { id: 'face', icon: 'face' },
  { id: 'hair', icon: 'hair' },
  { id: 'clothes', icon: 'shirt' },
  { id: 'accessories', icon: 'glasses' },
  { id: 'colours', icon: 'palette' },
  { id: 'personality', icon: 'heart' },
  { id: 'name', icon: 'tag' },
];

const SHAPES: BodyShape[] = ['tall', 'mid', 'short'];
const MOUTHS: Mouth[] = ['smile', 'grin', 'calm'];
const PATTERNS: Pattern[] = ['plain', 'stripes', 'dots', 'collar', 'heart', 'star'];
const ACCESSORIES: Accessory[] = ['none', 'glasses', 'bow', 'hat', 'headband', 'flower', 'crown'];
const ACCENTS = ['#FFF8F0', ...outfitColors];
function pick<T>(items: readonly T[], fallback: T): T {
  return items[Math.floor(Math.random() * items.length)] ?? fallback;
}

/** The character being made, as a snapshot for undo. */
function currentDraft(): Draft {
  const c = useCreation.getState();
  return { appearance: c.appearance, name: c.name, traits: c.traits };
}

/** A choice tile: picture first, tick badge when chosen (never colour alone). */
function Choice({
  label,
  selected,
  onPick,
  children,
  swatch,
  tall,
}: {
  label: string;
  selected: boolean;
  onPick: () => void;
  children?: ReactNode;
  swatch?: string;
  tall?: boolean;
}) {
  const voice = useVoiceLabel(label);
  return (
    <button
      type="button"
      className={swatch ? 'choice choice--swatch' : tall ? 'choice choice--tall' : 'choice'}
      style={swatch ? { background: swatch } : undefined}
      aria-label={label}
      aria-pressed={selected}
      {...voice}
      onClick={() => {
        playSfx('tap');
        onPick();
      }}
    >
      {children}
      {selected && (
        <span className="choice__tick" aria-hidden="true">
          <Icon name="check" size={16} strokeWidth={3.4} />
        </span>
      )}
    </button>
  );
}

function Section({
  icon,
  title,
  children,
  columns = 4,
}: {
  icon: IconName;
  title: string;
  children: ReactNode;
  columns?: number;
}) {
  return (
    <section className="wizard-section">
      <h2 className="wizard-section__title">
        <Icon name={icon} size={24} />
        <span>{title}</span>
      </h2>
      <div
        className="wizard-section__grid"
        style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      >
        {children}
      </div>
    </section>
  );
}

function Swatches({
  colors,
  value,
  label,
  onPick,
}: {
  colors: readonly string[];
  value: string | undefined;
  label: (n: number) => string;
  onPick: (c: string) => void;
}) {
  return (
    <>
      {colors.map((c, i) => (
        <Choice
          key={c}
          label={label(i + 1)}
          selected={value === c}
          swatch={c}
          onPick={() => onPick(c)}
        />
      ))}
    </>
  );
}

/** C1 avatar wizard: live preview on a turntable, steps in any order, dice/undo/redo/done. */
/** A colour picker for any colour (advanced face): a real input, 44 px or more. */
function AnyColour({
  label,
  value,
  onPick,
}: {
  label: string;
  value: string;
  onPick: (c: string) => void;
}) {
  return (
    <label className="any-colour">
      <input
        type="color"
        value={value}
        aria-label={label}
        onChange={(e) => onPick(e.target.value.toUpperCase())}
      />
      <span className="any-colour__word">{label}</span>
    </label>
  );
}

const EYE_COLOURS = ['#6B4A2E', '#3B2A1E', '#3D7BD9', '#3E8E4A', '#8A9A5B', '#7A8590'];
const TATTOO_COLOURS = ['#3D5AA8', '#2A1640', '#D9416A', '#0FA394', '#8E3CA8', '#EF4B2F'];
const SIZES = [0.85, 1, 1.22] as const;
const GAPS = [0.9, 1, 1.12] as const;
const WIDTHS = [0.8, 1, 1.28] as const;

/** The option closest to a size multiplier (photos give any value). */
function nearest(v: number | undefined, opts: readonly number[]): number {
  return opts.reduce((b, o) => (Math.abs(o - (v ?? 1)) < Math.abs(b - (v ?? 1)) ? o : b), 1);
}

/**
 * "More face detail": photo-robot granularity, so a character can look like a
 * particular child. Every row previews the character's own face.
 */
function AdvancedFace({
  a,
  setFace,
  look,
}: {
  a: Appearance;
  setFace: (patch: FaceDetail) => void;
  look: (patch: Partial<Appearance>) => void;
}) {
  const F = strings.avatar.face;
  const f = a.face ?? {};
  const head = (patch: FaceDetail, extra: Partial<Appearance> = {}) => (
    <PegPortrait
      appearance={{ ...a, ...extra, face: { ...f, ...patch }, accessory: 'none' }}
      size={96}
      crop="head"
    />
  );
  const row = <T extends string | number | boolean>(
    title: string,
    options: readonly T[],
    current: T,
    name: (o: T, i: number) => string,
    patch: (o: T) => FaceDetail,
    columns = 3,
  ) => (
    <Section icon="face" title={title} columns={columns}>
      {options.map((o, i) => (
        <Choice
          key={String(o)}
          label={name(o, i)}
          selected={current === o}
          tall
          onPick={() => setFace(patch(o))}
        >
          {head(patch(o))}
        </Choice>
      ))}
    </Section>
  );
  const sizeNames = [F.sizes.small, F.sizes.middle, F.sizes.big];
  const gapNames = [F.gaps.close, F.gaps.middle, F.gaps.wide];
  const widthNames = [F.widths.narrow, F.widths.middle, F.widths.wide];
  const showEyeColour = (f.eyes ?? 'dots') !== 'dots';
  return (
    <>
      {row(
        F.shape,
        ['round', 'oval', 'wide', 'heart', 'square', 'pear'] as const,
        f.shape ?? 'round',
        (o) => F.shapes[o],
        (o) => ({ shape: o }),
      )}
      {row(
        F.eyes,
        ['dots', 'round', 'almond'] as const,
        f.eyes ?? 'dots',
        (o) => F.eyeStyles[o],
        (o) => ({ eyes: o }),
      )}
      {showEyeColour && (
        <Section icon="palette" title={F.eyeColour} columns={4}>
          <Swatches
            colors={EYE_COLOURS}
            value={f.eyeColour ?? '#6B4A2E'}
            label={strings.avatar.colour}
            onPick={(c) => setFace({ eyeColour: c })}
          />
          <AnyColour
            label={F.exactEyes}
            value={f.eyeColour ?? '#6B4A2E'}
            onPick={(c) => setFace({ eyeColour: c })}
          />
        </Section>
      )}
      {row(
        F.eyeSize,
        SIZES,
        nearest(f.eyeSize, SIZES),
        (_, i) => sizeNames[i] ?? '',
        (o) => ({ eyeSize: o }),
      )}
      {row(
        F.eyeGap,
        GAPS,
        nearest(f.eyeGap, GAPS),
        (_, i) => gapNames[i] ?? '',
        (o) => ({ eyeGap: o }),
      )}
      {row(
        F.brows,
        ['none', 'thin', 'thick', 'arched'] as const,
        f.brows ?? 'none',
        (o) => F.browKinds[o],
        (o) => ({ brows: o }),
        4,
      )}
      {row(
        F.nose,
        ['none', 'dot', 'button', 'long'] as const,
        f.nose ?? 'none',
        (o) => F.noses[o],
        (o) => ({ nose: o }),
        4,
      )}
      {row(
        F.mouthWidth,
        WIDTHS,
        nearest(f.mouthWidth, WIDTHS),
        (_, i) => widthNames[i] ?? '',
        (o) => ({ mouthWidth: o }),
      )}
      {a.kind === undefined || a.kind === 'person'
        ? row(
            F.ears,
            [false, true] as const,
            f.ears ?? false,
            (o) => (o ? F.earsOn : F.earsOff),
            (o) => ({ ears: o }),
            2,
          )
        : null}
      {row(
        F.fringe,
        ['none', 'straight', 'side'] as const,
        f.fringe ?? 'none',
        (o) => F.fringes[o],
        (o) => ({ fringe: o }),
      )}
      {row(
        F.blushOn,
        [true, false] as const,
        f.blush ?? true,
        (o) => (o ? F.blushOn : F.blushOff),
        (o) => ({ blush: o }),
        2,
      )}
      {row(
        F.beard,
        ['none', 'stubble', 'moustache', 'short', 'full'] as const,
        f.beard ?? 'none',
        (o) => F.beards[o],
        (o) => ({ beard: o }),
      )}
      <Section icon="star" title={F.tattoo} columns={3}>
        {(['none', 'heart', 'star', 'anchor', 'bolt', 'flower'] as const).map((t) => (
          <Choice
            key={t}
            label={F.tattoos[t]}
            selected={(f.tattoo ?? 'none') === t}
            tall
            onPick={() => setFace({ tattoo: t })}
          >
            <PegPortrait
              appearance={{ ...a, face: { ...f, tattoo: t }, accessory: 'none' }}
              size={96}
              crop={(f.tattooPlace ?? 'arm') === 'cheek' ? 'head' : 'full'}
            />
          </Choice>
        ))}
      </Section>
      {(f.tattoo ?? 'none') !== 'none' && (
        <>
          <Section icon="star" title={F.place} columns={2}>
            {(['arm', 'cheek'] as const).map((p) => (
              <Choice
                key={p}
                label={F.places[p]}
                selected={(f.tattooPlace ?? 'arm') === p}
                tall
                onPick={() => setFace({ tattooPlace: p })}
              >
                <PegPortrait
                  appearance={{ ...a, face: { ...f, tattooPlace: p }, accessory: 'none' }}
                  size={96}
                  crop={p === 'cheek' ? 'head' : 'full'}
                />
              </Choice>
            ))}
          </Section>
          <Section icon="palette" title={F.tattooColour} columns={3}>
            <Swatches
              colors={TATTOO_COLOURS}
              value={f.tattooColour ?? '#3D5AA8'}
              label={strings.avatar.colour}
              onPick={(c) => setFace({ tattooColour: c })}
            />
          </Section>
        </>
      )}
      <Section icon="palette" title={F.exact} columns={2}>
        <AnyColour label={F.exactSkin} value={a.skin} onPick={(c) => look({ skin: c })} />
        <AnyColour label={F.exactHair} value={a.hair} onPick={(c) => look({ hair: c })} />
      </Section>
    </>
  );
}

export function AvatarWizardScreen() {
  const draft = useCreation();
  const go = useUi((s) => s.go);
  const back = useUi((s) => s.back);
  const profiles = useProfiles((s) => s.profiles);
  const age = useCreation((s) => s.age);
  const words = useShowTextLabels();
  const [step, setStep] = useState<StepId>('body');
  // "More face detail" always starts closed: the simple face step stays simple.
  const [moreFace, setMoreFace] = useState(false);
  const [visited, setVisited] = useState<Set<StepId>>(() => new Set(['body']));
  const [spin, setSpin] = useState(0);
  const history = useRef(new DraftHistory());
  const spinStart = useRef<{ x: number; spin: number } | null>(null);
  const A = strings.avatar;
  const a = draft.appearance;

  const current = currentDraft;
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const refreshHistory = () => {
    setCanUndo(history.current.canUndo);
    setCanRedo(history.current.canRedo);
  };
  /** Every change goes through here so undo and redo see it. */
  const change = (patch: Partial<Draft>) => {
    history.current.record(current());
    useCreation.getState().set(patch);
    refreshHistory();
  };
  const look = (patch: Partial<Appearance>) =>
    change({ appearance: { ...useCreation.getState().appearance, ...patch } });

  const goStep = (id: string) => {
    const s = STEPS.find((x) => x.id === id)?.id ?? 'body';
    setStep(s);
    setVisited((v) => new Set(v).add(s));
    speak(A.steps[s] ?? '');
  };

  /** The dice: surprise only what this step is about. */
  const surprise = () => {
    playSfx('dice');
    const r = randomLook();
    switch (step) {
      case 'start':
        change({ appearance: r, name: randomName(draft.name), traits: randomTraits() });
        break;
      case 'body':
        look({
          ...withFigure(useCreation.getState().appearance, pick(figures, 'girl')),
          shape: pick(SHAPES, 'mid'),
          kind: pick(kinds, 'person'),
          skin: r.skin,
        });
        break;
      case 'face':
        look({ mouth: pick(MOUTHS, 'smile') });
        break;
      case 'hair':
        look({ hairStyle: r.hairStyle, hair: r.hair });
        break;
      case 'clothes':
        look({
          clothes: randomClothes(useCreation.getState().appearance.figure),
          second: pick(secondColours, '#3D5AA8'),
          pattern: pick(PATTERNS, 'plain'),
          outfit: r.outfit,
          accent: pick(ACCENTS, '#FFF8F0'),
        });
        break;
      case 'accessories':
        look({ accessory: pick(ACCESSORIES, 'none'), accent: pick(ACCENTS, '#FFF8F0') });
        break;
      case 'colours':
        look({ skin: r.skin, hair: r.hair, outfit: r.outfit, accent: pick(ACCENTS, '#FFF8F0') });
        break;
      case 'personality':
        change({ traits: randomTraits() });
        break;
      case 'name':
        change({ name: randomName(draft.name) });
        break;
    }
  };

  const toggleTrait = (t: TraitId) => {
    const chosen = draft.traits.includes(t);
    if (chosen) return;
    // Three always stay chosen: a new pick replaces the oldest.
    const [, b, c] = draft.traits;
    change({ traits: [b, c, t] });
    speak(traitName(t));
  };

  const done = () => {
    playSfx('confirm');
    const target = useCreation.getState().target;
    if (target.kind === 'newPlayer') {
      void finishCreation().then(() => go('hooray'));
      return;
    }
    saveCharacter();
    back();
  };

  const stepDone = (id: StepId) => visited.has(id) && id !== step;
  const scale = shapeScale[a.shape ?? 'mid'];

  const options = (() => {
    switch (step) {
      case 'start':
        return (
          <>
            <Section icon="dice" title={A.steps.start ?? ''} columns={3}>
              <Choice
                label={A.blank}
                selected={false}
                tall
                onPick={() =>
                  change({
                    appearance: {
                      skin: skinTones[2],
                      outfit: '#D9C3B0',
                      hair: hairColors[1],
                      hairStyle: 'crop',
                    },
                  })
                }
              >
                <Icon name="peg" size={44} />
              </Choice>
              <Choice
                label={A.dice}
                selected={false}
                tall
                onPick={() =>
                  change({
                    appearance: randomLook(),
                    name: randomName(draft.name),
                    traits: randomTraits(),
                  })
                }
              >
                <Icon name="dice" size={44} />
              </Choice>
            </Section>
            <Section icon="dup" title={A.copy('')} columns={3}>
              {[
                ...starterCast.map((c) => ({ id: c.id, name: c.name, appearance: c.appearance })),
                ...profiles,
              ].map((c) => (
                <Choice
                  key={c.id}
                  label={A.copy(c.name)}
                  selected={false}
                  tall
                  onPick={() => change({ appearance: { ...c.appearance } })}
                >
                  <PegPortrait appearance={c.appearance} size={86} crop="head" />
                </Choice>
              ))}
            </Section>
          </>
        );
      case 'body':
        return (
          <>
            <Section icon="peg" title={A.figure} columns={2}>
              {figures.map((f: Figure) => (
                <Choice
                  key={f}
                  label={A.figures[f]}
                  selected={a.figure === f}
                  tall
                  onPick={() => look(withFigure(a, f))}
                >
                  <PegPortrait appearance={{ ...withFigure(a, f), accessory: 'none' }} size={110} />
                </Choice>
              ))}
            </Section>
            <Section icon="peg" title={A.shape} columns={3}>
              {SHAPES.map((s) => (
                <Choice
                  key={s}
                  label={A.shapes[s] ?? s}
                  selected={(a.shape ?? 'mid') === s}
                  tall
                  onPick={() => look({ shape: s })}
                >
                  <PegPortrait
                    appearance={{
                      ...a,
                      hairStyle: 'none',
                      outfit: '#D9C3B0',
                      skin: '#C9AE97',
                      accessory: 'none',
                      pattern: 'plain',
                    }}
                    size={80 * shapeScale[s]}
                  />
                </Choice>
              ))}
            </Section>
            <Section icon="peg" title={A.kind} columns={3}>
              {kinds.map((k: Kind) => (
                <Choice
                  key={k}
                  label={A.kinds[k] ?? k}
                  selected={(a.kind ?? 'person') === k}
                  tall
                  onPick={() => look({ kind: k })}
                >
                  <PegPortrait
                    appearance={{ ...a, kind: k, accessory: 'none' }}
                    size={96}
                    crop="head"
                  />
                </Choice>
              ))}
            </Section>
            <Section icon="palette" title={A.skin}>
              <Swatches
                colors={skinTones}
                value={a.skin}
                label={A.skinTone}
                onPick={(c) => look({ skin: c })}
              />
            </Section>
          </>
        );
      case 'face':
        return (
          <>
            <Section icon="face" title={A.mouth} columns={3}>
              {MOUTHS.map((m) => (
                <Choice
                  key={m}
                  label={A.mouths[m] ?? m}
                  selected={(a.mouth ?? 'smile') === m}
                  tall
                  onPick={() => look({ mouth: m })}
                >
                  <PegPortrait appearance={{ ...a, mouth: m }} size={110} crop="head" />
                </Choice>
              ))}
            </Section>
            <Section icon="face" title={A.cheeks} columns={3}>
              {[false, true].map((f) => (
                <Choice
                  key={String(f)}
                  label={f ? A.freckles : A.noFreckles}
                  selected={(a.freckles ?? false) === f}
                  tall
                  onPick={() => look({ freckles: f })}
                >
                  <PegPortrait appearance={{ ...a, freckles: f }} size={110} crop="head" />
                </Choice>
              ))}
            </Section>
            <div className="wizard-more">
              <Switch label={A.face.toggle} checked={moreFace} onChange={setMoreFace} showLabel />
              <p className="wizard-more__note">{A.face.note}</p>
            </div>
            {moreFace && (
              <AdvancedFace
                a={a}
                look={look}
                setFace={(patch) => look({ face: { ...a.face, ...patch } })}
              />
            )}
          </>
        );
      case 'hair':
        return (
          <>
            <Section icon="hair" title={A.hairStyle} columns={3}>
              {hairStyles.map((h: HairStyle) => (
                <Choice
                  key={h}
                  label={A.hairStyles[h] ?? h}
                  selected={a.hairStyle === h}
                  tall
                  onPick={() => look({ hairStyle: h })}
                >
                  <PegPortrait
                    appearance={{ ...a, hairStyle: h, accessory: 'none' }}
                    size={96}
                    crop="head"
                  />
                </Choice>
              ))}
            </Section>
            <Section icon="palette" title={A.hairColour} columns={5}>
              <Swatches
                colors={hairColors}
                value={a.hair}
                label={A.colour}
                onPick={(c) => look({ hair: c })}
              />
            </Section>
          </>
        );
      case 'clothes':
        return (
          <>
            <Section icon="shirt" title={A.clothes}>
              {clothesKinds.map((c: Clothes) => (
                <Choice
                  key={c}
                  label={A.clothesKinds[c]}
                  selected={(a.clothes ?? 'tunic') === c}
                  tall
                  onPick={() => look({ clothes: c })}
                >
                  <PegPortrait appearance={{ ...a, clothes: c, accessory: 'none' }} size={96} />
                </Choice>
              ))}
            </Section>
            {usesSecondColour.has(a.clothes ?? 'tunic') && (
              <Section icon="palette" title={A.second}>
                <Swatches
                  colors={secondColours.filter((c, i) => secondColours.indexOf(c) === i)}
                  value={a.second ?? (a.clothes === 'cape' ? '#EF4B2F' : '#3D5AA8')}
                  label={A.colour}
                  onPick={(c) => look({ second: c })}
                />
              </Section>
            )}
            <Section icon="shirt" title={A.pattern}>
              {PATTERNS.map((p) => (
                <Choice
                  key={p}
                  label={A.patterns[p] ?? p}
                  selected={(a.pattern ?? 'plain') === p}
                  tall
                  onPick={() => look({ pattern: p, accent: a.accent ?? '#FFF8F0' })}
                >
                  <PegPortrait
                    appearance={{
                      ...a,
                      pattern: p,
                      accent: a.accent ?? '#FFF8F0',
                      accessory: 'none',
                    }}
                    size={96}
                  />
                </Choice>
              ))}
            </Section>
            <Section icon="palette" title={A.outfit}>
              <Swatches
                colors={outfitColors}
                value={a.outfit}
                label={A.colour}
                onPick={(c) => look({ outfit: c })}
              />
            </Section>
          </>
        );
      case 'accessories':
        return (
          <>
            <Section icon="glasses" title={A.accessory}>
              {ACCESSORIES.map((x) => (
                <Choice
                  key={x}
                  label={A.accessories[x] ?? x}
                  selected={(a.accessory ?? 'none') === x}
                  tall
                  onPick={() => look({ accessory: x })}
                >
                  <PegPortrait appearance={{ ...a, accessory: x }} size={96} crop="head" />
                </Choice>
              ))}
            </Section>
            <Section icon="palette" title={A.accent}>
              <Swatches
                colors={ACCENTS}
                value={a.accent}
                label={A.colour}
                onPick={(c) => look({ accent: c })}
              />
            </Section>
          </>
        );
      case 'colours':
        return (
          <>
            <Section icon="palette" title={A.skin}>
              <Swatches
                colors={skinTones}
                value={a.skin}
                label={A.skinTone}
                onPick={(c) => look({ skin: c })}
              />
            </Section>
            <Section icon="hair" title={A.hairColour} columns={5}>
              <Swatches
                colors={hairColors}
                value={a.hair}
                label={A.colour}
                onPick={(c) => look({ hair: c })}
              />
            </Section>
            <Section icon="shirt" title={A.outfit}>
              <Swatches
                colors={outfitColors}
                value={a.outfit}
                label={A.colour}
                onPick={(c) => look({ outfit: c })}
              />
            </Section>
          </>
        );
      case 'personality':
        return (
          <Section icon="heart" title={A.steps.personality ?? ''} columns={5}>
            {allTraits.map((t) => (
              <Choice
                key={t}
                label={`${traitName(t)}${draft.traits.includes(t) ? `, ${A.chosen}` : ''}`}
                selected={draft.traits.includes(t)}
                tall
                onPick={() => toggleTrait(t)}
              >
                <Icon name={traitDefs[t].icon} size={36} />
                {words && <span className="choice__word">{traitName(t)}</span>}
              </Choice>
            ))}
          </Section>
        );
      case 'name':
        return (
          <>
            <div className="name-row">
              <span className="name-pill">{draft.name}</span>
              <button
                type="button"
                className="dice-button dice-button--small"
                aria-label={A.rollName}
                onClick={() => {
                  playSfx('dice');
                  change({ name: randomName(draft.name) });
                  speak(useCreation.getState().name);
                }}
              >
                <Icon name="dice" size={40} strokeWidth={3} />
              </button>
            </div>
            {age !== null && age >= 9 && (
              <label className="name-input">
                <span className="visually-hidden">{A.typeName}</span>
                <Icon name="pencil" size={24} />
                <input
                  type="text"
                  maxLength={14}
                  value={draft.name}
                  autoComplete="off"
                  spellCheck={false}
                  aria-label={A.typeName}
                  onChange={(e) =>
                    change({ name: e.target.value.replace(/[^\p{L}\p{N} '-]/gu, '').slice(0, 14) })
                  }
                />
              </label>
            )}
            <Carousel
              label={A.names}
              perPage={8}
              columns={4}
              items={names.map((n) => (
                <Choice
                  key={n}
                  label={n}
                  selected={draft.name === n}
                  onPick={() => change({ name: n })}
                >
                  <span className="choice__word choice__word--name">{n}</span>
                </Choice>
              ))}
            />
          </>
        );
    }
  })();

  return (
    <div className="wizard">
      <aside className="wizard__rail">
        <StepRail
          label={A.stepsLabel}
          current={step}
          onSelect={goStep}
          steps={STEPS.map((s) => ({
            id: s.id,
            icon: s.icon,
            label: A.steps[s.id] ?? s.id,
            done: stepDone(s.id),
          }))}
        />
      </aside>
      <header className="wizard__top">
        <IconButton icon="back" label={strings.back} onClick={back} />
        <IconButton
          icon="undo"
          label={strings.undo}
          aria-disabled={!canUndo || undefined}
          onClick={() => {
            const prev = history.current.undo(current());
            if (prev) {
              useCreation.getState().set(prev);
              refreshHistory();
            }
          }}
        />
        <IconButton
          icon="redo"
          label={strings.redo}
          aria-disabled={!canRedo || undefined}
          onClick={() => {
            const next = history.current.redo(current());
            if (next) {
              useCreation.getState().set(next);
              refreshHistory();
            }
          }}
        />
        <span className="wizard__top-end">
          <button
            type="button"
            className="dice-button dice-button--small"
            aria-label={A.surpriseStep}
            onClick={surprise}
          >
            <Icon name="dice" size={40} strokeWidth={3} />
          </button>
          <button type="button" className="done-button" aria-label={strings.done} onClick={done}>
            <Icon name="check" size={40} strokeWidth={3.2} />
          </button>
        </span>
      </header>
      <main
        className="wizard__preview"
        onPointerDown={(e: PointerEvent<HTMLElement>) => {
          spinStart.current = { x: e.clientX, spin };
          e.currentTarget.setPointerCapture?.(e.pointerId);
        }}
        onPointerMove={(e) => {
          if (spinStart.current)
            setSpin(spinStart.current.spin + (e.clientX - spinStart.current.x) * 0.8);
        }}
        onPointerUp={() => {
          spinStart.current = null;
        }}
      >
        <h1 className="visually-hidden">{strings.screens.avatarWizard}</h1>
        <span className="wizard__disc" aria-hidden="true" />
        <span
          className="wizard__peg"
          role="img"
          aria-label={`${strings.onboarding.yourCharacter}: ${draft.name}`}
          style={{ transform: `rotateY(${spin}deg)` }}
        >
          <PegPortrait appearance={a} size={Math.round(290 * scale)} />
        </span>
        <span className="wizard__stand" aria-hidden="true" />
        <span className="wizard__name" aria-hidden="true">
          {draft.name}
        </span>
        <span className="wizard__spin" aria-hidden="true">
          <Icon name="rotate" size={22} />
          {words && <span>{A.spin}</span>}
        </span>
      </main>
      <section className="wizard__options" aria-label={A.steps[step] ?? ''}>
        {options}
      </section>
    </div>
  );
}
