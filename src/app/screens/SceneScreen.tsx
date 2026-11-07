import { useState } from 'react';
import { strings } from '../../i18n/strings.en';
import { useSettings } from '../../state/settings';
import { useUi } from '../../state/ui';
import { IconButton } from '../../ui/IconButton';
import { Sheet } from '../../ui/Sheet';
import { useLayoutMode, useViewportWidth } from '../media';
import { ObjectDrawer } from '../ObjectDrawer';
import { StageHost } from '../StageHost';
import { TimePill } from '../TimePill';

function CharactersDock() {
  const go = useUi((s) => s.go);
  return (
    <div className="characters-dock__list">
      <IconButton icon="plus" label={strings.more} onClick={() => go('characters')} />
    </div>
  );
}

/** The play screen: the stage in the middle, tools on the same edges everywhere. */
export function SceneScreen() {
  const layout = useLayoutMode();
  const leftHanded = useSettings((s) => s.leftHanded);
  const go = useUi((s) => s.go);
  const home = useUi((s) => s.home);
  const sheetOpen = useUi((s) => s.plusSheetOpen);
  const setSheetOpen = useUi((s) => s.setPlusSheetOpen);
  const [sheetTab, setSheetTab] = useState<'characters' | 'things'>('things');
  const phone = layout === 'phone';
  const width = useViewportWidth();
  // Tiles that fit beside the docks: ~100 px each after the arrows (2 × 76 px).
  const portrait = typeof window !== 'undefined' && window.innerHeight > width;
  const iconBtn = layout === 'tablet' ? 64 : 56;
  const drawerWidth = portrait
    ? width - (iconBtn + 28) - 72
    : width - (iconBtn + 28) - (iconBtn * 3 + 20) - 104;
  const perPage = Math.max(3, Math.min(6, Math.floor((drawerWidth - 2 * (iconBtn + 12)) / 100)));

  return (
    <div className="scene" data-hand={leftHanded ? 'left' : 'right'}>
      <div className="stage" aria-label={strings.stage} role="region">
        <StageHost />
      </div>

      <div className="dock dock--top-left">
        <IconButton icon="home" label={strings.home} shortcut="H" onClick={home} />
        <IconButton icon="undo" label={strings.undo} shortcut="Ctrl Z" aria-disabled sound={null} />
        {!phone && (
          <IconButton
            icon="redo"
            label={strings.redo}
            shortcut="Ctrl Shift Z"
            aria-disabled
            sound={null}
          />
        )}
      </div>

      <div className="dock dock--top-right">
        <IconButton icon="map" label={strings.map} shortcut="M" onClick={() => go('map')} />
        <IconButton
          icon="pencil"
          label={strings.edit}
          shortcut="E"
          onClick={() => go('houseWizard')}
        />
      </div>

      {!phone && (
        <nav className="dock dock--characters" aria-label={strings.charactersHere}>
          <CharactersDock />
        </nav>
      )}

      {!phone && (
        <section className="dock dock--drawer" aria-label={strings.thingsDrawer}>
          <ObjectDrawer perPage={perPage} />
        </section>
      )}

      <div className="dock dock--bottom-right">
        <IconButton icon="camera" label={strings.camera} shortcut="C" onClick={() => go('photo')} />
        <TimePill />
      </div>

      {phone && (
        <>
          <button
            type="button"
            className="plus-button"
            aria-label={strings.addSheet}
            aria-haspopup="dialog"
            aria-expanded={sheetOpen}
            onClick={() => setSheetOpen(true)}
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
            open={sheetOpen}
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
            {sheetTab === 'things' ? <ObjectDrawer perPage={3} columns={3} /> : <CharactersDock />}
          </Sheet>
        </>
      )}
    </div>
  );
}
