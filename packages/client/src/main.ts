import Phaser from 'phaser';
import { WORLD_HEIGHT, WORLD_WIDTH } from '@brawler/shared';
import { GameScene } from './scenes/GameScene.ts';

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
  scene: [GameScene],
});
