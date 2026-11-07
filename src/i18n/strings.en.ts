// All visible and spoken text lives here. Children never need to read it: every
// label is also an icon, and is spoken on long-press (touch) or hover (desktop).

export const strings = {
  appName: 'Pocket Town',

  // Shell and navigation
  home: 'Home',
  back: 'Back',
  undo: 'Undo',
  redo: 'Redo',
  map: 'Map',
  edit: 'Edit',
  camera: 'Photo',
  play: 'Play',
  pause: 'Pause',
  faster: 'Faster',
  time: 'Time',
  close: 'Close',
  more: 'More',
  done: 'Done',
  surpriseMe: 'Surprise me',
  next: 'Next',
  previous: 'Previous',
  settings: 'Settings',
  grownUps: 'Grown-ups',
  shortcuts: 'Shortcuts',
  characters: 'Characters',
  things: 'Things',
  charactersHere: 'Characters here',
  thingsDrawer: 'Things drawer',
  addSheet: 'Add',
  stage: 'Play stage',
  pageOf: (page: number, pages: number) => `Page ${page} of ${pages}`,

  // Object categories
  food: 'Food',
  toys: 'Toys',
  music: 'Music',
  books: 'Books',
  plants: 'Plants',

  // Screens
  screens: {
    splash: 'Pocket Town',
    age: 'How old are you?',
    profile: 'Who is playing?',
    avatarWizard: 'Make a character',
    houseWizard: 'My house',
    hub: 'Home',
    map: 'World',
    scene: 'Play',
    gate: 'Grown-ups only',
    grownUp: 'Grown-up area',
    settings: 'Settings',
    characters: 'My characters',
    photo: 'Photos',
    kit: 'Component kit',
  },
  hub: {
    world: 'World',
    myCharacters: 'My characters',
    myHouse: 'My house',
    friends: 'Friends',
    friendsLocked: 'Friends: coming later. Ask a grown-up.',
  },
  comingSoon: 'Coming soon',

  // Settings
  settingsLabels: {
    effects: 'Sound effects',
    music: 'Music',
    voice: 'Voice',
    voiceOver: 'Voice-over',
    textLabels: 'Words under buttons',
    leftHanded: 'Left-handed',
    calmMotion: 'Calm motion',
    botEnergy: 'Bot energy',
    lively: 'Lively',
    calm: 'Calm',
    paused: 'Paused',
    volume: (name: string) => `${name} volume`,
  },

  // Parental gate
  gate: {
    title: 'Grown-ups only',
    promptBefore: 'To continue, type the number ',
    promptAfter: '.',
    wrong: 'That’s not it. Try again.',
    note: 'The number changes every time and is written as words.',
    erase: 'Erase',
    ok: 'Continue',
    entered: 'Number typed so far',
    leave: 'Back to play',
  },

  grownUp: {
    intro: 'Settings for grown-ups. Nothing in Pocket Town leaves this device.',
    kit: 'Component kit (for checking the design)',
  },

  // Kit
  kit: {
    holdToDelete: 'Hold to delete',
    held: 'Deleted (hold worked)',
    toast: 'Show a toast',
    sheet: 'Open a sheet',
    halo: 'Hint halo',
    steps: 'Steps',
  },

  // Keyboard shortcuts overlay
  shortcutList: [
    ['H', 'Home'],
    ['M', 'Map'],
    ['E', 'Edit'],
    ['Space', 'Pause / play'],
    ['F', 'Faster'],
    ['C', 'Photo'],
    ['Tab', 'Next control'],
    ['Enter', 'Open / press'],
    ['Ctrl Z', 'Undo'],
    ['Ctrl Shift Z', 'Redo'],
    ['Esc', 'Close'],
    ['?', 'Show shortcuts'],
  ] as const,
} as const;

const ONES = [
  'zero',
  'one',
  'two',
  'three',
  'four',
  'five',
  'six',
  'seven',
  'eight',
  'nine',
  'ten',
  'eleven',
  'twelve',
  'thirteen',
  'fourteen',
  'fifteen',
  'sixteen',
  'seventeen',
  'eighteen',
  'nineteen',
] as const;
const TENS = [
  '',
  '',
  'twenty',
  'thirty',
  'forty',
  'fifty',
  'sixty',
  'seventy',
  'eighty',
  'ninety',
] as const;

/** 0–99 in English words, e.g. 47 → "forty-seven". */
export function numberToWords(n: number): string {
  if (!Number.isInteger(n) || n < 0 || n > 99) throw new RangeError(`Out of range: ${n}`);
  if (n < 20) return ONES[n] ?? '';
  const tens = TENS[Math.floor(n / 10)] ?? '';
  const ones = n % 10;
  return ones === 0 ? tens : `${tens}-${ONES[ones] ?? ''}`;
}
