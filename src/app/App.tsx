import { useEffect, type ReactElement } from 'react';
import { strings } from '../i18n/strings.en';
import { useKeyboardShortcuts } from '../input/shortcuts';
import { useSettings } from '../state/settings';
import { useUi } from '../state/ui';
import { Toasts } from '../ui/Toasts';
import { useShowTextLabels } from '../ui/labels';
import type { ScreenId } from './machine';
import { useCalmMotion, useLayoutMode } from './media';
import { AgeScreen } from './screens/AgeScreen';
import { GateScreen } from './screens/GateScreen';
import { GrownUpScreen } from './screens/GrownUpScreen';
import { HubScreen } from './screens/HubScreen';
import { KitScreen } from './screens/KitScreen';
import { MapScreen } from './screens/MapScreen';
import { PlaceholderScreen } from './screens/PlaceholderScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { SceneScreen } from './screens/SceneScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SplashScreen } from './screens/SplashScreen';
import { ShortcutsOverlay } from './ShortcutsOverlay';

function renderScreen(screen: ScreenId): ReactElement {
  switch (screen) {
    case 'splash':
      return <SplashScreen />;
    case 'age':
      return <AgeScreen />;
    case 'profile':
      return <ProfileScreen />;
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
    case 'avatarWizard':
    case 'houseWizard':
    case 'characters':
    case 'photo':
      return <PlaceholderScreen title={strings.screens[screen]} />;
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

export function App() {
  const screen = useUi((s) => s.nav.screen);
  useDocumentAttributes();
  useKeyboardShortcuts();
  return (
    <>
      <div key={screen} className="screen-transition" data-screen={screen}>
        {renderScreen(screen)}
      </div>
      <ShortcutsOverlay />
      <Toasts />
    </>
  );
}
