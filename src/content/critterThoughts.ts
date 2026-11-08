// What the animals on the world map think (owner: "their thoughts are boring").
// Each kind has its own voice: the duck is dramatic about bread and puddles, the
// cat is grand and sleepy, the dog is excitable, the bird gossips about what it
// sees from above, the butterfly is dreamy and the hedgehog is shy and loves snacks.
// Pure data: the words live in the dictionaries (strings.critters.thoughts, by
// key), and every thought has a picture so a child who doesn't read gets the gist.
import type { Strings } from '../i18n/strings.en';
import type { CritterId } from './critters';

export type ThoughtKey = keyof Strings['critters']['thoughts'];
export type AnswerKey = keyof Strings['critters']['answers'];

/**
 * When a thought fits: the time of day, the plane on the map, or what someone in
 * the town is doing. The "who" conditions name that character in the thought.
 */
export type ThoughtWhen =
  | 'morning'
  | 'day'
  | 'evening'
  | 'night'
  | 'planeUp'
  | 'planeDown'
  | 'sleeper'
  | 'eater'
  | 'walker'
  | 'atCafe'
  | 'atPark'
  | 'atLibrary'
  | 'atMusic'
  | 'atHospital'
  | 'atWorkshop'
  | 'atShop'
  | 'atAirport';

/** Conditions whose thought names a character (its words are a function of the name). */
export const NAMED_WHEN: readonly ThoughtWhen[] = [
  'sleeper',
  'eater',
  'walker',
  'atCafe',
  'atPark',
  'atLibrary',
  'atMusic',
  'atHospital',
  'atWorkshop',
  'atShop',
  'atAirport',
];

/** A little surprise the animal acts out (calm motion: the picture stays still). */
export type Trick = 'spin' | 'flip' | 'stretch' | 'sneeze' | 'roll' | 'juggle';

export type ThoughtKind = 'chat' | 'fact' | 'joke' | 'riddle' | 'wish' | 'trick' | 'town';

export interface Thought {
  key: ThoughtKey;
  kind: ThoughtKind;
  /** Picture in src/design/thingArt.ts shown in the bubble. */
  pic: string;
  /** Only when this holds in the town right now. */
  when?: ThoughtWhen;
  /** The bubble is a way to go to this building. */
  place?: string;
  /** Riddles and jokes with a punchline: tap to hear the answer. */
  answer?: { key: AnswerKey; pic: string };
  trick?: Trick;
  /** Juggling: the pictures thrown up in the air. */
  props?: string[];
}

const ask = (key: AnswerKey, pic: string) => ({ key, pic });

export const critterThoughts: Record<CritterId, Thought[]> = {
  duck: [
    { key: 'duckPuddle', kind: 'chat', pic: 'droplet' },
    { key: 'duckBread', kind: 'chat', pic: 'bread' },
    { key: 'duckGlide', kind: 'chat', pic: 'sparkles' },
    { key: 'duckPeas', kind: 'fact', pic: 'pea-pod' },
    { key: 'duckFeet', kind: 'fact', pic: 'snowflake' },
    {
      key: 'duckUmbrella',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('duckUmbrella', 'umbrella'),
    },
    {
      key: 'duckSqueeze',
      kind: 'joke',
      pic: 'red-question-mark',
      answer: ask('duckSqueeze', 'duck'),
    },
    { key: 'duckWishBread', kind: 'wish', pic: 'bread', place: 'shop' },
    { key: 'duckFish', kind: 'wish', pic: 'fish', place: 'park' },
    { key: 'duckFlip', kind: 'trick', pic: 'sparkles', trick: 'flip' },
    { key: 'duckMorning', kind: 'town', pic: 'sunrise', when: 'morning' },
    { key: 'duckNight', kind: 'town', pic: 'crescent-moon', when: 'night' },
    { key: 'duckPlane', kind: 'town', pic: 'airplane', when: 'planeUp' },
    { key: 'duckCrumbs', kind: 'town', pic: 'bread', when: 'eater' },
    { key: 'duckShopper', kind: 'town', pic: 'shopping-bags', when: 'atShop' },
  ],
  cat: [
    { key: 'catRuler', kind: 'chat', pic: 'crown' },
    { key: 'catNaps', kind: 'chat', pic: 'zzz' },
    { key: 'catSunny', kind: 'chat', pic: 'sun' },
    { key: 'catSleepFact', kind: 'fact', pic: 'sleeping-face' },
    { key: 'catWhiskers', kind: 'fact', pic: 'sparkles' },
    { key: 'catMouse', kind: 'joke', pic: 'red-question-mark', answer: ask('catMouse', 'mouse') },
    {
      key: 'catClock',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('catClock', 'alarm-clock'),
    },
    { key: 'catSofa', kind: 'wish', pic: 'sleeping-face', place: 'home' },
    { key: 'catBook', kind: 'wish', pic: 'books', place: 'library' },
    { key: 'catStretch', kind: 'trick', pic: 'crown', trick: 'stretch' },
    { key: 'catMidday', kind: 'town', pic: 'sun', when: 'day' },
    { key: 'catEvening', kind: 'town', pic: 'sunset', when: 'evening' },
    { key: 'catNight', kind: 'town', pic: 'crescent-moon', when: 'night' },
    { key: 'catPlane', kind: 'town', pic: 'airplane', when: 'planeUp' },
    { key: 'catNapper', kind: 'town', pic: 'zzz', when: 'sleeper' },
    { key: 'catReader', kind: 'town', pic: 'closed-book', when: 'atLibrary' },
  ],
  dog: [
    { key: 'dogStick', kind: 'chat', pic: 'wood' },
    { key: 'dogFriends', kind: 'chat', pic: 'red-heart' },
    { key: 'dogTail', kind: 'chat', pic: 'sparkles' },
    { key: 'dogNosePrint', kind: 'fact', pic: 'paw-prints' },
    { key: 'dogSmell', kind: 'fact', pic: 'pizza' },
    {
      key: 'dogCircles',
      kind: 'joke',
      pic: 'red-question-mark',
      answer: ask('dogCircles', 'dizzy'),
    },
    {
      key: 'dogBirthday',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('dogBirthday', 'birthday-cake'),
    },
    { key: 'dogPark', kind: 'wish', pic: 'soccer-ball', place: 'park' },
    { key: 'dogPlaster', kind: 'wish', pic: 'adhesive-bandage', place: 'hospital' },
    { key: 'dogSpin', kind: 'trick', pic: 'dizzy', trick: 'spin' },
    { key: 'dogMorning', kind: 'town', pic: 'sunrise', when: 'morning' },
    { key: 'dogNight', kind: 'town', pic: 'crescent-moon', when: 'night' },
    { key: 'dogPlane', kind: 'town', pic: 'airplane', when: 'planeUp' },
    { key: 'dogWalker', kind: 'town', pic: 'paw-prints', when: 'walker' },
    { key: 'dogFixer', kind: 'town', pic: 'hammer', when: 'atWorkshop' },
  ],
  bird: [
    { key: 'birdSweets', kind: 'chat', pic: 'eyes' },
    { key: 'birdHat', kind: 'chat', pic: 'feather' },
    { key: 'birdOcean', kind: 'fact', pic: 'world-map' },
    {
      key: 'birdSouth',
      kind: 'joke',
      pic: 'red-question-mark',
      answer: ask('birdSouth', 'luggage'),
    },
    {
      key: 'birdWings',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('birdWings', 'airplane'),
    },
    { key: 'birdKitchen', kind: 'wish', pic: 'eyes', place: 'neighbour' },
    { key: 'birdSing', kind: 'wish', pic: 'musical-notes', place: 'musicHall' },
    { key: 'birdPlanes', kind: 'wish', pic: 'luggage', place: 'airport' },
    {
      key: 'birdJuggle',
      kind: 'trick',
      pic: 'cherries',
      trick: 'juggle',
      props: ['cherries', 'strawberry', 'cherries'],
    },
    { key: 'birdMorning', kind: 'town', pic: 'sunrise', when: 'morning' },
    { key: 'birdPlaneUp', kind: 'town', pic: 'airplane', when: 'planeUp' },
    { key: 'birdPlaneDown', kind: 'town', pic: 'airplane', when: 'planeDown' },
    { key: 'birdWalker', kind: 'town', pic: 'eyes', when: 'walker' },
    { key: 'birdPatient', kind: 'town', pic: 'stethoscope', when: 'atHospital' },
    { key: 'birdTraveller', kind: 'town', pic: 'luggage', when: 'atAirport' },
  ],
  butterfly: [
    { key: 'butterflyPaint', kind: 'chat', pic: 'rainbow' },
    { key: 'butterflyDream', kind: 'chat', pic: 'thought-balloon' },
    { key: 'butterflyClouds', kind: 'chat', pic: 'cloud' },
    { key: 'butterflyFeet', kind: 'fact', pic: 'tulip' },
    { key: 'butterflyCaterpillar', kind: 'fact', pic: 'bug' },
    {
      key: 'butterflyCandle',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('butterflyCandle', 'candle'),
    },
    {
      key: 'butterflyLight',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('butterflyLight', 'light-bulb'),
    },
    { key: 'butterflyGarden', kind: 'wish', pic: 'cherry-blossom', place: 'park' },
    { key: 'butterflyStory', kind: 'wish', pic: 'closed-book', place: 'library' },
    { key: 'butterflyLoop', kind: 'trick', pic: 'sparkles', trick: 'flip' },
    { key: 'butterflyEvening', kind: 'town', pic: 'sunset', when: 'evening' },
    { key: 'butterflyNight', kind: 'town', pic: 'crescent-moon', when: 'night' },
    { key: 'butterflyParkVisitor', kind: 'town', pic: 'sunflower', when: 'atPark' },
    { key: 'butterflyMusician', kind: 'town', pic: 'musical-notes', when: 'atMusic' },
  ],
  hedgehog: [
    { key: 'hedgehogShy', kind: 'chat', pic: 'shushing-face' },
    { key: 'hedgehogSnack', kind: 'chat', pic: 'cookie' },
    { key: 'hedgehogSoft', kind: 'chat', pic: 'red-heart' },
    { key: 'hedgehogSpikes', kind: 'fact', pic: 'hedgehog' },
    { key: 'hedgehogHoglets', kind: 'fact', pic: 'red-heart' },
    {
      key: 'hedgehogEgg',
      kind: 'riddle',
      pic: 'red-question-mark',
      answer: ask('hedgehogEgg', 'egg'),
    },
    {
      key: 'hedgehogHug',
      kind: 'joke',
      pic: 'red-question-mark',
      answer: ask('hedgehogHug', 'red-heart'),
    },
    { key: 'hedgehogCake', kind: 'wish', pic: 'shortcake', place: 'cafe' },
    { key: 'hedgehogSqueak', kind: 'wish', pic: 'toolbox', place: 'workshop' },
    { key: 'hedgehogSneeze', kind: 'trick', pic: 'sneezing-face', trick: 'sneeze' },
    { key: 'hedgehogRoll', kind: 'trick', pic: 'dizzy', trick: 'roll' },
    { key: 'hedgehogDay', kind: 'town', pic: 'sleeping-face', when: 'day' },
    { key: 'hedgehogNight', kind: 'town', pic: 'crescent-moon', when: 'night' },
    { key: 'hedgehogSnorer', kind: 'town', pic: 'shushing-face', when: 'sleeper' },
    { key: 'hedgehogSniff', kind: 'town', pic: 'cookie', when: 'eater' },
    { key: 'hedgehogCafe', kind: 'town', pic: 'hot-beverage', when: 'atCafe' },
    { key: 'hedgehogDoctor', kind: 'town', pic: 'adhesive-bandage', when: 'atHospital' },
  ],
};
