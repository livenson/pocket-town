import { useState } from 'react';
import { playSfx } from '../../audio/audio';
import { speak } from '../../audio/speech';
import { randomLook, randomName, randomTraits } from '../../content/looks';
import { allBuildings } from '../../content/rooms';
import { buildingName, strings } from '../../i18n';
import type { Bot } from '../../sim/types';
import { useCreation } from '../../state/creation';
import { useProfiles } from '../../state/profiles';
import { useUi } from '../../state/ui';
import { Carousel } from '../../ui/Carousel';
import { HoldButton } from '../../ui/HoldButton';
import { Icon } from '../../ui/Icon';
import { IconButton } from '../../ui/IconButton';
import { PegPortrait } from '../../ui/PegPortrait';
import { Sheet } from '../../ui/Sheet';
import { useShowTextLabels } from '../../ui/labels';
import { useVoiceLabel } from '../../ui/useVoiceLabel';
import { game, playerBotId, useWorldTick } from '../game';
import { useLayoutMode } from '../media';
import { ScreenFrame } from './ScreenFrame';

const G = strings.gallery;

function Card({ bot, mine, onOpen }: { bot: Bot; mine: boolean; onOpen: () => void }) {
  const label = mine ? `${bot.name}. ${G.you}` : bot.name;
  const voice = useVoiceLabel(label);
  const words = useShowTextLabels();
  return (
    <button
      type="button"
      className="character-card"
      data-mine={mine || undefined}
      aria-label={label}
      {...voice}
      onClick={onOpen}
    >
      <span className="character-card__portrait" aria-hidden="true">
        <PegPortrait appearance={bot.appearance} size={150} />
      </span>
      {words && <span className="character-card__name">{bot.name}</span>}
      {mine && (
        <span className="character-card__me" aria-hidden="true">
          <Icon name="star" size={20} strokeWidth={3} />
        </span>
      )}
    </button>
  );
}

/** B3 my characters: paged cards; new, dice; per character edit, copy, move house, goodbye. */
export function CharactersScreen() {
  const world = useWorldTick(1);
  const go = useUi((s) => s.go);
  const profiles = useProfiles((s) => s.profiles);
  const activeId = useProfiles((s) => s.activeId);
  const me = profiles.find((p) => p.id === activeId);
  const myBotId = me ? playerBotId(me) : null;
  const [openId, setOpenId] = useState<string | null>(null);
  const open = world.bots.find((b) => b.id === openId) ?? null;
  const houses = allBuildings().filter((b) => b.kind === 'house');
  const phone = useLayoutMode() === 'phone';

  const startWizard = (target: Parameters<ReturnType<typeof useCreation.getState>['set']>[0]) => {
    useCreation.getState().set(target);
    go('avatarWizard');
  };

  return (
    <ScreenFrame
      title={strings.screens.characters}
      className="screen--characters"
      actions={
        <>
          <button
            type="button"
            className="dice-button dice-button--small"
            aria-label={G.surprise}
            onClick={() => {
              playSfx('dice');
              const name = randomName();
              game.do({
                type: 'addBot',
                id: `c${Date.now().toString(36)}`,
                name,
                appearance: randomLook(),
                traits: randomTraits(),
                homeId: 'home',
              });
              speak(name);
            }}
          >
            <Icon name="dice" size={40} strokeWidth={3} />
          </button>
          <IconButton
            icon="plus"
            label={G.newCharacter}
            onClick={() =>
              startWizard({
                target: { kind: 'newBot' },
                appearance: randomLook(),
                name: randomName(),
                traits: randomTraits(),
              })
            }
          />
        </>
      }
    >
      <Carousel
        label={strings.screens.characters}
        perPage={phone ? 4 : 8}
        columns={phone ? 2 : 4}
        items={world.bots.map((b) => (
          <Card
            key={b.id}
            bot={b}
            mine={b.id === myBotId}
            onOpen={() => {
              playSfx('tap');
              setOpenId(b.id);
            }}
          />
        ))}
      />
      <Sheet
        open={open !== null}
        label={open ? G.actions(open.name) : ''}
        onClose={() => setOpenId(null)}
      >
        {open && (
          <div className="character-actions">
            <span className="character-actions__who" aria-hidden="true">
              <PegPortrait appearance={open.appearance} size={120} />
              <span className="name-pill">{open.name}</span>
            </span>
            <div className="character-actions__buttons">
              <IconButton
                icon="pencil"
                label={G.edit}
                onClick={() => {
                  setOpenId(null);
                  startWizard({
                    target: { kind: 'editBot', botId: open.id },
                    appearance: structuredClone(open.appearance),
                    name: open.name,
                    traits: [...open.traits],
                  });
                }}
              />
              <IconButton
                icon="dup"
                label={G.copy}
                onClick={() => {
                  game.do({
                    type: 'addBot',
                    id: `c${Date.now().toString(36)}`,
                    name: randomName(open.name),
                    appearance: structuredClone(open.appearance),
                    traits: [...open.traits],
                    homeId: open.homeId,
                  });
                  setOpenId(null);
                }}
              />
              {open.id !== myBotId && (
                <HoldButton
                  label={G.remove}
                  onConfirm={() => {
                    game.do({ type: 'removeBot', botId: open.id });
                    setOpenId(null);
                  }}
                />
              )}
            </div>
            {houses.length > 1 && (
              <div className="character-actions__houses" role="group" aria-label={G.moveHouse}>
                {houses.map((h) => (
                  <IconButton
                    key={h.id}
                    icon="house"
                    label={G.livesIn(buildingName(h.id))}
                    tone="plain"
                    pressed={open.homeId === h.id}
                    onClick={() => {
                      if (open.homeId === h.id) return;
                      game.do({ type: 'moveIn', botId: open.id, houseId: h.id });
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </Sheet>
    </ScreenFrame>
  );
}
