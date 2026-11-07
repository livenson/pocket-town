import type { ChangeEvent } from 'react';
import { playSfx } from '../../audio/audio';
import type { IconName } from '../../design/icons';
import { strings } from '../../i18n';
import { useSettings, type BotEnergy, type Settings } from '../../state/settings';
import { Icon } from '../../ui/Icon';
import { useShowTextLabels } from '../../ui/labels';
import { IconButton } from '../../ui/IconButton';
import { Switch } from '../../ui/Switch';
import { ScreenFrame } from './ScreenFrame';

const L = strings.settingsLabels;

type VolumeKey = 'effectsVolume' | 'musicVolume' | 'voiceVolume';
const volumes = (): { key: VolumeKey; icon: IconName; label: string }[] => [
  { key: 'effectsVolume', icon: 'sparkle', label: L.effects },
  { key: 'musicVolume', icon: 'note', label: L.music },
  { key: 'voiceVolume', icon: 'talk', label: L.voice },
];

type ToggleKey = 'voiceOver' | 'textLabels' | 'leftHanded' | 'calmMotion';
const toggles = (): { key: ToggleKey; icon: IconName; label: string }[] => [
  { key: 'voiceOver', icon: 'speaker', label: L.voiceOver },
  { key: 'textLabels', icon: 'tag', label: L.textLabels },
  { key: 'leftHanded', icon: 'hand', label: L.leftHanded },
  { key: 'calmMotion', icon: 'wave', label: L.calmMotion },
];

const energies = (): { value: BotEnergy; icon: IconName; label: string }[] => [
  { value: 'lively', icon: 'sun', label: L.lively },
  { value: 'calm', icon: 'moon', label: L.calm },
  { value: 'paused', icon: 'pause', label: L.paused },
];

/** Child settings: big controls, icons first. */
export function SettingsScreen() {
  const settings = useSettings();
  const update = (patch: Partial<Settings>) => settings.update(patch);
  const words = useShowTextLabels();
  const labelClass = words ? 'settings__label' : 'settings__label visually-hidden';

  return (
    <ScreenFrame title={strings.screens.settings} className="screen--settings">
      <div className="settings">
        <section className="settings__group">
          {volumes().map((v) => (
            <label key={v.key} className="settings__row">
              <span className="settings__icon" aria-hidden="true">
                <Icon name={v.icon} />
              </span>
              <span className={labelClass}>{L.volume(v.label)}</span>
              <input
                type="range"
                className="slider"
                min={0}
                max={1}
                step={0.1}
                value={settings[v.key]}
                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                  update({ [v.key]: Number(e.target.value) })
                }
                onPointerUp={() => {
                  if (v.key === 'effectsVolume') playSfx('tap');
                }}
              />
            </label>
          ))}
        </section>
        <section className="settings__group">
          {toggles().map((t) => (
            <div key={t.key} className="settings__row">
              <span className="settings__icon" aria-hidden="true">
                <Icon name={t.icon} />
              </span>
              {words && (
                <span className="settings__label" aria-hidden="true">
                  {t.label}
                </span>
              )}
              <Switch
                label={t.label}
                checked={settings[t.key]}
                onChange={(on) => update({ [t.key]: on })}
              />
            </div>
          ))}
        </section>
        <section className="settings__group">
          <div className="settings__row">
            <span className="settings__icon" aria-hidden="true">
              <Icon name="peg" />
            </span>
            {words && (
              <span className="settings__label" aria-hidden="true">
                {L.botEnergy}
              </span>
            )}
            <div className="segmented" role="group" aria-label={L.botEnergy}>
              {energies().map((e) => (
                <IconButton
                  key={e.value}
                  icon={e.icon}
                  label={e.label}
                  tone="plain"
                  pressed={settings.botEnergy === e.value}
                  onClick={() => update({ botEnergy: e.value })}
                />
              ))}
            </div>
          </div>
        </section>
      </div>
    </ScreenFrame>
  );
}
