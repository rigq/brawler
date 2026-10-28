import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '@brawler/shared';
import { GameScene } from './scenes/GameScene.ts';
import { OnlineScene } from './scenes/OnlineScene.ts';

// Until the menu (F5.1): add ?online to the URL to play online, otherwise local 2 players.
const online = new URLSearchParams(location.search).has('online');

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: WORLD_WIDTH,
  height: WORLD_HEIGHT,
  backgroundColor: '#1d2330',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  input: { gamepad: true },
  scene: [online ? OnlineScene : GameScene],
});
