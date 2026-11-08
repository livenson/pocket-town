// Screen state machine. No URL router: GitHub Pages and single-page apps do not mix
// well, and children never see or need URLs. Pure functions, so it is unit-tested.

export type ScreenId =
  | 'splash'
  | 'age'
  | 'profile'
  | 'diceAvatar'
  | 'hooray'
  | 'avatarWizard'
  | 'houseWizard'
  | 'hub'
  | 'map'
  | 'scene'
  | 'gate'
  | 'grownUp'
  | 'settings'
  | 'characters'
  | 'photo'
  | 'kit'
  | 'piano'
  | 'photoFace';

/** Screens that sit behind the parental gate. */
const GATED: ReadonlySet<ScreenId> = new Set<ScreenId>(['grownUp', 'kit', 'piano', 'photoFace']);

/** Where each screen may go next (besides back and home, which always work). */
export const EDGES: Readonly<Record<ScreenId, readonly ScreenId[]>> = {
  splash: ['age', 'profile'],
  age: ['profile', 'diceAvatar', 'gate'],
  profile: ['age', 'diceAvatar', 'avatarWizard', 'hub', 'scene', 'gate'],
  diceAvatar: ['avatarWizard', 'hooray'],
  hooray: ['scene'],
  avatarWizard: ['houseWizard', 'hub', 'hooray', 'diceAvatar'],
  houseWizard: ['hub', 'scene'],
  hub: ['map', 'characters', 'houseWizard', 'scene', 'settings', 'gate', 'profile'],
  map: ['scene', 'hub'],
  scene: ['map', 'photo', 'houseWizard', 'hub'],
  gate: ['grownUp', 'kit'],
  grownUp: ['kit', 'settings', 'piano', 'photoFace'],
  settings: [],
  characters: ['avatarWizard', 'scene', 'hub'],
  photo: [],
  kit: [],
  piano: [],
  photoFace: ['avatarWizard'],
};

/** Screens where back and home make no sense yet (first launch). */
export const ONBOARDING: ReadonlySet<ScreenId> = new Set<ScreenId>([
  'splash',
  'age',
  'profile',
  'diceAvatar',
  'hooray',
]);

export interface NavState {
  screen: ScreenId;
  /** Screens to return to with "back", most recent last. */
  history: ScreenId[];
  /** Where to go once the parental gate is passed. */
  gateTarget: ScreenId | null;
  /** True while inside the grown-up area after passing the gate. */
  unlocked: boolean;
}

export type NavEvent =
  { type: 'go'; to: ScreenId } | { type: 'back' } | { type: 'home' } | { type: 'gatePassed' };

export const initialNav: NavState = {
  screen: 'splash',
  history: [],
  gateTarget: null,
  unlocked: false,
};

const HOME: ScreenId = 'hub';

function leaveGrownUpArea(state: NavState, to: ScreenId): NavState {
  return GATED.has(to) || to === 'gate' ? state : { ...state, unlocked: false };
}

export function navigate(state: NavState, event: NavEvent): NavState {
  switch (event.type) {
    case 'go': {
      const { to } = event;
      if (to === state.screen) return state;
      if (GATED.has(to) && !state.unlocked) {
        return {
          ...state,
          screen: 'gate',
          history: [...state.history, state.screen],
          gateTarget: to,
        };
      }
      const next: NavState = { ...state, screen: to, history: [...state.history, state.screen] };
      return leaveGrownUpArea(next, to);
    }
    case 'gatePassed': {
      if (state.screen !== 'gate') return state;
      return {
        ...state,
        screen: state.gateTarget ?? 'grownUp',
        gateTarget: null,
        unlocked: true,
      };
    }
    case 'back': {
      const history = [...state.history];
      let previous = history.pop();
      // Never step back onto the gate itself, or into a locked area.
      while (previous === 'gate' || (previous && GATED.has(previous) && !state.unlocked)) {
        previous = history.pop();
      }
      if (!previous) return state.screen === 'splash' ? state : { ...initialNav, screen: HOME };
      const next: NavState = { ...state, screen: previous, history, gateTarget: null };
      return leaveGrownUpArea(next, previous);
    }
    case 'home':
      return { ...initialNav, screen: HOME };
  }
}

/** Screens reachable from `screen` with a forward "go". */
export function canGo(screen: ScreenId, to: ScreenId): boolean {
  return EDGES[screen].includes(to);
}
