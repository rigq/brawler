import Phaser from 'phaser';
import { DEFAULT_LINEUP, WORLD_HEIGHT, WORLD_WIDTH, isCharacterId } from '@brawler/shared';
import { THEME } from './render/palette.ts';
import { GameScene } from './scenes/GameScene.ts';
import { OnlineScene } from './scenes/OnlineScene.ts';
import { mountControlsPanel } from './ui/ControlsPanel.ts';

// Until the menu (I1): ?online plays online, ?training opens training mode, otherwise local 2 players.
// Until character select (I2): ?p1=samu&p2=chachin picks the characters (online: whoever creates the room).
const params = new URLSearchParams(location.search);
const characters = ['p1', 'p2'].map((key, slot) => {
  const id = params.get(key);
  return isCharacterId(id) ? id : DEFAULT_LINEUP[slot]!;
});
const scene = params.has('online')
  ? new OnlineScene(characters)
  : new GameScene(params.has('training') ? 'training' : 'versus', characters);

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  backgroundColor: THEME.canvas,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { gamepad: true },
  scene: [scene],
});

mountControlsPanel(document.body);
