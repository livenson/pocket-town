import { useEffect } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { strings } from '../../i18n';
import { useCreation } from '../../state/creation';
import { MAX_PROFILES, useProfiles, type Profile } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { enterProfile } from '../game';

function Face({ profile }: { profile: Profile }) {
  const go = useUi((s) => s.go);
  const label = strings.onboarding.player(profile.name);
  const voice = useVoiceLabel(label);
  return (
    <button
      type="button"
      className="profile-face"
      aria-label={label}
      {...voice}
      onClick={() => {
        playSfx('tap');
        void enterProfile(profile.id).then(() => go('scene'));
      }}
    >
      <PegPortrait appearance={profile.appearance} size={150} crop="head" />
    </button>
  );
}

/** B1 profile select: faces are the login, no passwords. Up to six players per device. */
export function ProfileScreen() {
  const go = useUi((s) => s.go);
  const profiles = useProfiles((s) => s.profiles);
  const pendingAge = useCreation((s) => s.age);
  const words = useShowTextLabels();
  const title = strings.screens.profile;
  const newLabel = strings.onboarding.newPlayer;
  const voice = useVoiceLabel(newLabel);

  useEffect(() => speak(title), [title]);

  return (
    <div className="screen screen--profile">
      <header className="onboard-head">
        <IconButton
          icon="speaker"
          label={strings.onboarding.hearHelp}
          className="speak-btn"
          onClick={() => speak(strings.onboarding.whoIsPlaying)}
        />
        <h1 className="onboard-title" tabIndex={-1}>
          {title}
        </h1>
        <span className="onboard-head__end">
          <IconButton icon="lock" label={strings.grownUps} onClick={() => go('gate')} />
        </span>
      </header>
      <main className="profile-grid" data-count={profiles.length}>
        {profiles.map((p) => (
          <Face key={p.id} profile={p} />
        ))}
        {profiles.length < MAX_PROFILES && (
          <button
            type="button"
            className="profile-new"
            data-hint={profiles.length === 0 || undefined}
            aria-label={newLabel}
            {...voice}
            onClick={() => {
              playSfx('tap');
              useCreation.getState().roll();
              useCreation.getState().set({ target: { kind: 'newPlayer' } });
              // First launch: the age was asked already. Later players are asked now.
              go(pendingAge !== null && profiles.length === 0 ? 'diceAvatar' : 'age');
            }}
          >
            <Icon name="plus" size={72} strokeWidth={3.4} />
            {words && <span className="profile-new__label">{newLabel}</span>}
          </button>
        )}
      </main>
    </div>
  );
}
