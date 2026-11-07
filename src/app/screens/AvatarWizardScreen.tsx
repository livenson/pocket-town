import { useRef, useState, type ReactNode } from 'react';
import type { PointerEvent } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import {
  shapeScale,
  type Accessory,
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
export function AvatarWizardScreen() {
  const draft = useCreation();
  const go = useUi((s) => s.go);
  const back = useUi((s) => s.back);
  const profiles = useProfiles((s) => s.profiles);
  const age = useCreation((s) => s.age);
  const words = useShowTextLabels();
  const [step, setStep] = useState<StepId>('body');
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
        look({ shape: pick(SHAPES, 'mid'), kind: pick(kinds, 'person'), skin: r.skin });
        break;
      case 'face':
        look({ mouth: pick(MOUTHS, 'smile') });
        break;
      case 'hair':
        look({ hairStyle: r.hairStyle, hair: r.hair });
        break;
      case 'clothes':
        look({
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
