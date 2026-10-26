import Phaser from 'phaser';
import { GAME_TITLE } from '@brawler/shared';

// Empty scene for now: proves Phaser boots and `shared` is importable.
export class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');
  }

  create(): void {
    const { width, height } = this.scale;
    this.add
      .text(width / 2, height / 2, GAME_TITLE, { fontFamily: 'monospace', fontSize: '48px', color: '#ffffff' })
      .setOrigin(0.5);
  }
}
