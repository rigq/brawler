import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '@brawler/shared';
import { THEME } from './render/palette.ts';
import { GameScene } from './scenes/GameScene.ts';
import { OnlineScene } from './scenes/OnlineScene.ts';

// Until the menu (I1): ?online plays online, ?training opens training mode, otherwise local 2 players.
const params = new URLSearchParams(location.search);
const scene = params.has('online') ? new OnlineScene() : new GameScene(params.has('training') ? 'training' : 'versus');

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
