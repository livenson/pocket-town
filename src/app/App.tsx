import { useEffect, type ReactElement } from 'react';
import { applyLanguageSetting, currentLanguage, strings } from '../i18n';
import { useKeyboardShortcuts } from '../input/shortcuts';
import { setHouseNamer } from '../sim/houses';
import { useSettings } from '../state/settings';
import { useUi } from '../state/ui';
import { Toasts } from '../ui/Toasts';
import { useShowTextLabels } from '../ui/labels';
import type { ScreenId } from './machine';
import { useCalmMotion, useLayoutMode } from './media';
import { AgeScreen } from './screens/AgeScreen';
import { AvatarWizardScreen } from './screens/AvatarWizardScreen';
import { CharactersScreen } from './screens/CharactersScreen';
import { HouseWizardScreen } from './screens/HouseWizardScreen';
import { DiceAvatarScreen } from './screens/DiceAvatarScreen';
import { HoorayScreen } from './screens/HoorayScreen';
import { GateScreen } from './screens/GateScreen';
import { GrownUpScreen } from './screens/GrownUpScreen';
import { HubScreen } from './screens/HubScreen';
import { KitScreen } from './screens/KitScreen';
import { MapScreen } from './screens/MapScreen';
import { PhotoScreen } from './screens/PhotoScreen';
import { PhotoFaceScreen } from './screens/PhotoFaceScreen';
import { PianoScreen } from './screens/PianoScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SceneScreen } from './screens/SceneScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SplashScreen } from './screens/SplashScreen';
import { Postcard } from './Postcard';
import { ShortcutsOverlay } from './ShortcutsOverlay';

function renderScreen(screen: ScreenId): ReactElement {
  switch (screen) {
    case 'splash':
      return <SplashScreen />;
    case 'age':
      return <AgeScreen />;
    case 'profile':
      return <ProfileScreen />;
    case 'diceAvatar':
      return <DiceAvatarScreen />;
    case 'hooray':
      return <HoorayScreen />;
    case 'hub':
      return <HubScreen />;
    case 'map':
      return <MapScreen />;
    case 'scene':
      return <SceneScreen />;
    case 'gate':
      return <GateScreen />;
    case 'grownUp':
      return <GrownUpScreen />;
    case 'settings':
      return <SettingsScreen />;
    case 'kit':
      return <KitScreen />;
    case 'photo':
      return <PhotoScreen />;
    case 'avatarWizard':
      return <AvatarWizardScreen />;
    case 'characters':
      return <CharactersScreen />;
    case 'houseWizard':
      return <HouseWizardScreen />;
    case 'piano':
      return <PianoScreen />;
    case 'photoFace':
      return <PhotoFaceScreen />;
  }
}

/** Reflect layout and preferences as attributes on <html> so CSS can follow them. */
function useDocumentAttributes(): void {
  const layout = useLayoutMode();
  const calm = useCalmMotion();
  const labels = useShowTextLabels();
  const leftHanded = useSettings((s) => s.leftHanded);
  useEffect(() => {
    const d = document.documentElement.dataset;
    d.layout = layout;
    d.calm = String(calm);
    d.labels = String(labels);
    d.hand = leftHanded ? 'left' : 'right';
  }, [layout, calm, labels, leftHanded]);
}

/** Follow the language setting; re-render everything when it changes. */
function useLanguage(): string {
  const setting = useSettings((s) => s.language);
  // Apply during render so this render already uses the right words.
  applyLanguageSetting(setting);
  setHouseNamer((n) => strings.house.name(n));
  return currentLanguage();
}

export function App() {
  const screen = useUi((s) => s.nav.screen);
  const language = useLanguage();
  useDocumentAttributes();
  useKeyboardShortcuts();
  return (
    <>
      <div key={`${screen}:${language}`} className="screen-transition" data-screen={screen}>
        {renderScreen(screen)}
      </div>
      <ShortcutsOverlay />
      <Postcard />
      <Toasts />
    </>
  );
}
