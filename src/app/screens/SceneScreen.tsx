import { useEffect, useState } from 'react';
import { strings } from '../../i18n';
import { useDecor } from '../../state/decor';
import { usePlay } from '../../state/play';
import { useSettings } from '../../state/settings';
import { useUi } from '../../state/ui';
import { IconButton } from '../../ui/IconButton';
import { Sheet } from '../../ui/Sheet';
import { BotCard } from '../BotCard';
import { CameraOverlay } from '../CameraOverlay';
import { CarryLayer } from '../CarryLayer';
import { CharactersDock } from '../CharactersDock';
import { FollowBar } from '../FollowBar';
import { HintBubble } from '../HintBubble';
import { hint, useHints } from '../hints';
import { game, useGame } from '../game';
import { useLayoutMode, useViewportWidth } from '../media';
import { DecorToolbar } from '../decorate/DecorToolbar';
import { FurnitureDrawer } from '../decorate/FurnitureDrawer';
import { ObjectDrawer } from '../ObjectDrawer';
import { StageHost } from '../StageHost';
import { StageTargets } from '../StageTargets';
import { TimePill } from '../TimePill';

/** The play screen: the stage in the middle, tools on the same edges everywhere. */
export function SceneScreen() {
  const layout = useLayoutMode();
  const leftHanded = useSettings((s) => s.leftHanded);
  const go = useUi((s) => s.go);
  const home = useUi((s) => s.home);
  const sheetOpen = useUi((s) => s.plusSheetOpen);
  const setSheetOpen = useUi((s) => s.setPlusSheetOpen);
  const canUndo = useGame((s) => s.canUndo);
  const canRedo = useGame((s) => s.canRedo);
  const following = usePlay((s) => s.followBotId !== null);
  const carrying = usePlay((s) => s.carrying !== null);
  const cameraOpen = usePlay((s) => s.cameraOpen);
  const setCameraOpen = usePlay((s) => s.setCameraOpen);
  const [sheetTab, setSheetTab] = useState<'characters' | 'things'>('things');
  const phone = layout === 'phone';
  const hintStep = useHints((s) => s.step);
  // First play for this player: start the hint chain (once; it never comes back).
  useEffect(() => {
    useHints.getState().start(phone);
  }, [phone]);
  const width = useViewportWidth();
  // Tiles that fit beside the docks: ~100 px each after the arrows (2 × 76 px).
  const portrait = typeof window !== 'undefined' && window.innerHeight > width;
  const iconBtn = layout === 'tablet' ? 64 : 56;
  const drawerWidth = portrait
    ? width - (iconBtn + 28) - 72
    : width - (iconBtn + 28) - (iconBtn * 3 + 20) - 104;
  const perPage = Math.max(3, Math.min(6, Math.floor((drawerWidth - 2 * (iconBtn + 12)) / 100)));
  // Picking something up from the phone sheet closes it, so the stage is free to tap.
  const sheetShown = sheetOpen && !carrying;
  const decorating = useDecor((s) => s.on);
  // Leaving the play screen ends decorating.
  useEffect(() => () => useDecor.getState().setOn(false), []);

  return (
    <div
      className="scene"
      data-hand={leftHanded ? 'left' : 'right'}
      data-carrying={carrying || undefined}
      data-camera={cameraOpen || undefined}
      data-decorating={decorating || undefined}
    >
      <div className="stage" aria-label={strings.stage} role="region">
        <StageHost />
        <StageTargets />
      </div>

      {following ? (
        <FollowBar />
      ) : (
        <>
          <div className="dock dock--top-left">
            <IconButton icon="home" label={strings.home} shortcut="H" onClick={home} />
            <IconButton
              icon="undo"
              label={strings.undo}
              shortcut="Ctrl Z"
              aria-disabled={!canUndo || undefined}
              sound={null}
              onClick={() => game.undo()}
            />
            <IconButton
              icon="redo"
              label={strings.redo}
              shortcut="Ctrl Shift Z"
              aria-disabled={!canRedo || undefined}
              sound={null}
              onClick={() => game.redo()}
            />
          </div>

          <div className="dock dock--top-right">
            <IconButton
              icon="globe"
              label={strings.map}
              shortcut="M"
              className={hintStep === 'map' ? 'hint-glow' : undefined}
              onClick={() => {
                hint.mapOpened();
                go('map');
              }}
            />
            <IconButton
              icon={decorating ? 'check' : 'pencil'}
              label={decorating ? strings.decorate.done : strings.decorate.start}
              shortcut="E"
              pressed={decorating}
              onClick={() => {
                const on = !useDecor.getState().on;
                useDecor.getState().setOn(on);
                if (on) {
                  usePlay.getState().drop();
                  usePlay.getState().closeCard();
                }
              }}
            />
          </div>
        </>
      )}

      {!phone && (
        <nav className="dock dock--characters" aria-label={strings.charactersHere}>
          <CharactersDock />
        </nav>
      )}

      {!phone && (
        <section className="dock dock--drawer" aria-label={strings.thingsDrawer}>
          {decorating ? <FurnitureDrawer perPage={perPage} /> : <ObjectDrawer perPage={perPage} />}
        </section>
      )}

      <div className="dock dock--bottom-right">
        <IconButton
          icon="camera"
          label={strings.camera}
          shortcut="C"
          onClick={() => setCameraOpen(true)}
        />
        <TimePill />
      </div>

      {phone && (
        <>
          <button
            type="button"
            className={hintStep === 'plus' ? 'plus-button hint-glow' : 'plus-button'}
            aria-label={strings.addSheet}
            aria-haspopup="dialog"
            aria-expanded={sheetShown}
            onClick={() => {
              setSheetOpen(true);
              hint.sheetOpened();
            }}
          >
            <svg width="36" height="36" viewBox="0 0 32 32" aria-hidden="true">
              <path
                d="M16 7v18M7 16h18"
                stroke="currentColor"
                strokeWidth="3.2"
                strokeLinecap="round"
              />
            </svg>
          </button>
          <Sheet
            open={sheetShown}
            label={strings.addSheet}
            onClose={() => setSheetOpen(false)}
            header={
              <div className="sheet-tabs" role="group" aria-label={strings.addSheet}>
                <IconButton
                  icon="peg"
                  label={strings.characters}
                  tone="plain"
                  noTextLabel
                  pressed={sheetTab === 'characters'}
                  onClick={() => setSheetTab('characters')}
                />
                <IconButton
                  icon="ball"
                  label={strings.things}
                  tone="plain"
                  noTextLabel
                  pressed={sheetTab === 'things'}
                  onClick={() => setSheetTab('things')}
                />
              </div>
            }
          >
            {decorating ? (
              <FurnitureDrawer perPage={3} columns={3} />
            ) : sheetTab === 'things' ? (
              <ObjectDrawer perPage={3} columns={3} />
            ) : (
              <CharactersDock />
            )}
          </Sheet>
        </>
      )}

      {decorating && <DecorToolbar />}
      {!following && !decorating && <HintBubble />}
      <CarryLayer />
      <BotCard />
      <CameraOverlay />
    </div>
  );
}
