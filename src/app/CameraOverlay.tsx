import { useState } from 'react';
import { playSfx } from '../audio/audio';
import { strings } from '../i18n/strings.en';
import { savePhoto } from '../persist/photos';
import { usePlay } from '../state/play';
import { useUi } from '../state/ui';
import { Icon } from '../ui/Icon';
import { IconButton } from '../ui/IconButton';

/** D7 photo mode over the stage: shutter, album, close. Photos stay on this device. */
export function CameraOverlay() {
  const open = usePlay((s) => s.cameraOpen);
  const setOpen = usePlay((s) => s.setCameraOpen);
  const go = useUi((s) => s.go);
  const toast = useUi((s) => s.toast);
  const [flash, setFlash] = useState(0);
  if (!open) return null;

  const shoot = async () => {
    playSfx('camera');
    setFlash((f) => f + 1);
    const { getStage } = await import('../stage/stage');
    const blob = await (await getStage()).snapshot();
    if (!blob) return;
    const saved = await savePhoto(blob).then(
      () => true,
      () => false,
    );
    if (saved) toast('photo', strings.photoSaved);
  };

  return (
    <div className="camera-overlay">
      <div className="camera-overlay__frame" aria-hidden="true" />
      {flash > 0 && <div key={flash} className="camera-overlay__flash" aria-hidden="true" />}
      <IconButton
        icon="close"
        label={strings.closeCamera}
        className="camera-overlay__close"
        onClick={() => setOpen(false)}
      />
      <div className="camera-overlay__controls">
        <button
          type="button"
          className="camera-overlay__album"
          aria-label={strings.myPhotos}
          onClick={() => go('photo')}
        >
          <Icon name="photo" size={30} />
        </button>
        <button
          type="button"
          className="camera-overlay__shutter"
          aria-label={strings.takePhoto}
          onClick={() => void shoot()}
        />
        <span className="camera-overlay__spacer" />
      </div>
      <p className="camera-overlay__note">{strings.photoOnly}</p>
    </div>
  );
}
