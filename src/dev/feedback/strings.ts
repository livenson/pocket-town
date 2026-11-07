// Words for the play-testing tool. It only exists on the dev server, so these are
// kept out of the game's dictionaries (and out of the build), in all three languages.
import { currentLanguage, type Language } from '../../i18n';

const en = {
  open: 'Tell Claude something',
  message: 'A message from Claude',
  thinking: 'Claude is thinking about it',
  point: 'Show me what you want to talk about. Tap it!',
  everything: 'All of it',
  tell: 'How do you like it? Tell me!',
  love: 'I love it',
  ok: "It's OK",
  sad: "I don't like it",
  idea: 'I have an idea',
  record: 'Tap and talk',
  stop: 'Stop',
  listen: 'Listen',
  write: 'Write it here, if you like',
  send: 'Send',
  close: 'Close',
  noMic: 'The microphone does not work here. You can write it, or ask a grown-up to help.',
  thanks: "Thank you! I'll have a look.",
  hearAgain: 'Hear it again',
  showMe: 'Show me',
  keep: 'Keep it!',
  undo: 'No, put it back',
  again: 'Change it some more',
  gotIt: 'OK',
  kept: 'Hooray! It stays.',
  undone: "OK, it's back like before.",
  againTell: 'What should be different?',
};

export type FeedbackStrings = typeof en;

const et: FeedbackStrings = {
  open: "Räägi Claude'ile midagi",
  message: 'Sõnum Claudelt',
  thinking: 'Claude mõtleb selle üle',
  point: 'Näita, millest tahad rääkida. Puuduta seda!',
  everything: 'Kõik',
  tell: 'Kuidas see sulle meeldib? Räägi mulle!',
  love: 'Mulle väga meeldib',
  ok: 'On okei',
  sad: 'Mulle ei meeldi',
  idea: 'Mul on idee',
  record: 'Puuduta ja räägi',
  stop: 'Lõpeta',
  listen: 'Kuula',
  write: 'Kirjuta siia, kui tahad',
  send: 'Saada',
  close: 'Sulge',
  noMic: 'Mikrofon siin ei tööta. Võid kirjutada või paluda suurel inimesel aidata.',
  thanks: 'Aitäh! Ma vaatan seda.',
  hearAgain: 'Kuula uuesti',
  showMe: 'Näita mulle',
  keep: 'Jäta alles!',
  undo: 'Ei, pane tagasi',
  again: 'Muuda veel',
  gotIt: 'Okei',
  kept: 'Hurraa! See jääb alles.',
  undone: 'Okei, kõik on nagu enne.',
  againTell: 'Mis peaks teistmoodi olema?',
};

const lv: FeedbackStrings = {
  open: 'Pastāsti Claude kaut ko',
  message: 'Ziņa no Claude',
  thinking: 'Claude par to domā',
  point: 'Parādi, par ko gribi runāt. Pieskaries tam!',
  everything: 'Viss',
  tell: 'Kā tev patīk? Pastāsti man!',
  love: 'Man ļoti patīk',
  ok: 'Ir labi',
  sad: 'Man nepatīk',
  idea: 'Man ir ideja',
  record: 'Pieskaries un runā',
  stop: 'Apturēt',
  listen: 'Klausīties',
  write: 'Uzraksti šeit, ja gribi',
  send: 'Sūtīt',
  close: 'Aizvērt',
  noMic: 'Mikrofons šeit nedarbojas. Vari uzrakstīt vai palūgt pieaugušajam palīdzēt.',
  thanks: 'Paldies! Es apskatīšos.',
  hearAgain: 'Klausīties vēlreiz',
  showMe: 'Parādi man',
  keep: 'Paturēt!',
  undo: 'Nē, liec atpakaļ',
  again: 'Pamaini vēl',
  gotIt: 'Labi',
  kept: 'Urrā! Tas paliek.',
  undone: 'Labi, viss ir kā agrāk.',
  againTell: 'Kam vajadzētu būt citādi?',
};

const all: Record<Language, FeedbackStrings> = { en, et, lv };

export function fs(): FeedbackStrings {
  return all[currentLanguage()];
}
