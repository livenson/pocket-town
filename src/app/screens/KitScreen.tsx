import { useState } from 'react';
import type { IconName } from '../../design/icons';
import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { Carousel } from '../../ui/Carousel';
import { HintHalo } from '../../ui/HintHalo';
import { HoldButton } from '../../ui/HoldButton';
import { iconNames } from '../../design/iconNames';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { Sheet } from '../../ui/Sheet';
import { StepRail } from '../../ui/StepRail';
import { Switch } from '../../ui/Switch';
import { ObjectDrawer } from '../ObjectDrawer';
import { TimePill } from '../TimePill';
import { ScreenFrame } from './ScreenFrame';

const STEPS = [
  { id: 'body', icon: 'peg', label: 'Body', done: true },
  { id: 'face', icon: 'face', label: 'Face', done: true },
  { id: 'hair', icon: 'hair', label: 'Hair' },
  { id: 'clothes', icon: 'shirt', label: 'Clothes' },
  { id: 'colours', icon: 'palette', label: 'Colours' },
] as const satisfies readonly { id: string; icon: IconName; label: string; done?: boolean }[];

/** Hidden screen showing every component, for visual and accessibility checks. */
export function KitScreen() {
  const toast = useUi((s) => s.toast);
  const [on, setOn] = useState(true);
  const [off, setOff] = useState(false);
  const [sheet, setSheet] = useState(false);
  const [step, setStep] = useState('hair');
  const [halo, setHalo] = useState(true);

  return (
    <ScreenFrame title={strings.screens.kit} className="screen--kit">
      <div className="kit">
        <section className="kit__section" aria-label="Buttons">
          <Button variant="primary" icon="play" label={strings.play} showWord />
          <Button variant="primary" icon="play" label={strings.play} />
          <Button variant="secondary" icon="house" label={strings.hub.myHouse} showWord />
          <Button variant="dice" />
          <Button variant="done" />
        </section>

        <section className="kit__section" aria-label="Icon buttons">
          <IconButton icon="home" label={strings.home} shortcut="H" />
          <IconButton icon="undo" label={strings.undo} shortcut="Ctrl Z" />
          <IconButton icon="redo" label={strings.redo} aria-disabled sound={null} />
          <IconButton icon="map" label={strings.map} shortcut="M" />
          <HoldButton
            label={strings.kit.holdToDelete}
            onConfirm={() => toast('trash', strings.kit.held)}
          />
          <TimePill />
        </section>

        <section className="kit__section" aria-label="Switches and halo">
          <Switch label="Switch on" checked={on} onChange={setOn} showLabel />
          <Switch label="Switch off" checked={off} onChange={setOff} showLabel />
          <HintHalo active={halo}>
            <IconButton icon="cake" label={strings.kit.halo} onClick={() => setHalo((h) => !h)} />
          </HintHalo>
          <Button
            variant="secondary"
            icon="list"
            label={strings.kit.toast}
            showWord
            onClick={() => toast('star', strings.kit.toast)}
          />
          <Button
            variant="secondary"
            icon="plus"
            label={strings.kit.sheet}
            showWord
            onClick={() => setSheet(true)}
          />
        </section>

        <section className="kit__section" aria-label={strings.kit.steps}>
          <StepRail
            label={strings.kit.steps}
            steps={[...STEPS]}
            current={step}
            onSelect={setStep}
          />
        </section>

        <section className="kit__section kit__section--wide" aria-label={strings.thingsDrawer}>
          <ObjectDrawer perPage={4} />
        </section>

        <section className="kit__section kit__section--wide" aria-label="Icons">
          <Carousel
            label="Icons"
            perPage={16}
            columns={8}
            items={iconNames.map((name) => (
              <span key={name} className="kit__icon" title={name}>
                <Icon name={name} size={34} />
                <span>{name}</span>
              </span>
            ))}
          />
        </section>
      </div>
      <Sheet open={sheet} label={strings.kit.sheet} onClose={() => setSheet(false)}>
        <ObjectDrawer perPage={3} columns={3} />
      </Sheet>
    </ScreenFrame>
  );
}
