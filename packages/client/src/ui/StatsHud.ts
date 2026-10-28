import Phaser from 'phaser';
import { attackPhase, type Player, type World } from '@brawler/shared';

const REFRESH_MS = 250;

/**
 * Top-left overlay with render FPS, measured simulation rate and each
 * player's physics state. If the loop is right, "sim" stays at ~60 whatever the FPS is.
 */
export class StatsHud {
  private readonly scene: Phaser.Scene;
  private readonly text: Phaser.GameObjects.Text;
  private elapsedMs = 0;
  private ticksAtLastRefresh = 0;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.text = scene.add.text(12, 12, '', { fontFamily: 'monospace', fontSize: '16px', color: '#9fe870' });
  }

  get gameObject(): Phaser.GameObjects.GameObject {
    return this.text;
  }

  update(frameMs: number, world: World): void {
    this.elapsedMs += frameMs;
    if (this.elapsedMs < REFRESH_MS) return;

    const simHz = ((world.tick - this.ticksAtLastRefresh) * 1000) / this.elapsedMs;
    const fps = this.scene.game.loop.actualFps;
    const lines = [`FPS ${fps.toFixed(0)}   sim ${simHz.toFixed(1)} Hz   tick ${world.tick}`];
    world.players.forEach((player, i) => lines.push(describePlayer(`P${i + 1}`, player)));
    this.text.setText(lines);

    this.elapsedMs = 0;
    this.ticksAtLastRefresh = world.tick;
  }
}

function describePlayer(label: string, p: Player): string {
  const state = [
    `vx ${p.vx.toFixed(0).padStart(5)}`,
    `vy ${p.vy.toFixed(0).padStart(5)}`,
    p.grounded ? 'ground' : 'air   ',
    `jumps ${p.airJumpsLeft}`,
    `dodge ${p.dodgeKind.padEnd(4)} cd ${String(p.dodgeCooldown).padStart(2)}`,
    p.airDodgeAvailable ? '' : 'no-airdodge',
    p.fastFalling ? 'FAST FALL' : '',
    p.hitstunTicks > 0 ? `STUN ${p.hitstunTicks}` : '',
    p.respawnTicks > 0 ? `RESPAWN ${p.respawnTicks}` : '',
    p.invulnTicks > 0 ? `INVULN ${p.invulnTicks}` : '',
    p.attackDir === 'none'
      ? ''
      : `${p.attackStrength} ${p.attackDir} ${attackPhase(p)} t${p.attackTick}` +
        (p.attackStrength === 'heavy' ? ` charge ${p.attackChargeTicks}` : ''),
  ];
  return `${label}  ${state.filter(Boolean).join('  ')}`;
}
