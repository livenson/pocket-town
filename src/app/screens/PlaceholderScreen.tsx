import { strings } from '../../i18n/strings.en';
import { useUi } from '../../state/ui';
import { Button } from '../../ui/Button';
import { Icon } from '../../ui/Icon';
import { ScreenFrame } from './ScreenFrame';

/** Screens that later milestones fill in (wizards, gallery, photo album). */
export function PlaceholderScreen({ title }: { title: string }) {
  const back = useUi((s) => s.back);
  return (
    <ScreenFrame title={title}>
      <div className="placeholder-body">
        <span className="placeholder-body__icon" aria-hidden="true">
          <Icon name="hourglass" size={72} strokeWidth={3} />
        </span>
        <p className="visually-hidden">{strings.comingSoon}</p>
        <Button variant="done" onClick={back} />
      </div>
    </ScreenFrame>
  );
}
