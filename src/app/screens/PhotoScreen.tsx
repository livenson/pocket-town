import { useEffect, useState } from 'react';
import { strings } from '../../i18n/strings.en';
import { deletePhoto, listPhotos, loadPhoto, type PhotoInfo } from '../../persist/photos';
import { HoldButton } from '../../ui/HoldButton';
import { Icon } from '../../ui/Icon';
import { Carousel } from '../../ui/Carousel';
import { ScreenFrame } from './ScreenFrame';

function useObjectUrl(id: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!id) return;
    let made: string | null = null;
    let cancelled = false;
    void loadPhoto(id).then((blob) => {
      if (!blob || cancelled) return;
      made = URL.createObjectURL(blob);
      setUrl(made);
    });
    return () => {
      cancelled = true;
      if (made) URL.revokeObjectURL(made);
    };
  }, [id]);
  return url;
}

function Thumb({ photo, onOpen }: { photo: PhotoInfo; onOpen: () => void }) {
  const url = useObjectUrl(photo.id);
  return (
    <button
      type="button"
      className="photo-thumb"
      aria-label={new Date(photo.takenAt).toLocaleString()}
      onClick={onOpen}
    >
      {url ? <img src={url} alt="" /> : <Icon name="photo" size={40} />}
    </button>
  );
}

/** D7 album: photos taken in play, saved on this device only. */
export function PhotoScreen() {
  const [photos, setPhotos] = useState<PhotoInfo[] | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const bigUrl = useObjectUrl(open);

  useEffect(() => {
    void listPhotos().then(setPhotos);
  }, []);

  return (
    <ScreenFrame title={strings.screens.photo} className="screen--photos">
      {open ? (
        <div className="photo-view">
          {bigUrl && <img src={bigUrl} alt="" className="photo-view__img" />}
          <div className="photo-view__actions">
            <HoldButton
              label={strings.deletePhoto}
              onConfirm={() => {
                void deletePhoto(open).then(async () => {
                  setOpen(null);
                  setPhotos(await listPhotos());
                });
              }}
            />
            <button
              type="button"
              className="photo-view__back"
              aria-label={strings.back}
              onClick={() => setOpen(null)}
            >
              <Icon name="back" />
            </button>
          </div>
        </div>
      ) : photos && photos.length > 0 ? (
        <Carousel
          label={strings.screens.photo}
          perPage={6}
          columns={3}
          items={photos.map((p) => (
            <Thumb key={p.id} photo={p} onOpen={() => setOpen(p.id)} />
          ))}
        />
      ) : (
        <div className="placeholder-body">
          <span className="placeholder-body__icon" aria-hidden="true">
            <Icon name="photo" size={72} strokeWidth={3} />
          </span>
          <p className="visually-hidden">{strings.noPhotos}</p>
        </div>
      )}
    </ScreenFrame>
  );
}
