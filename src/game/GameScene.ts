// =====================================================================
// STARTUP RUN — 메인 게임 씬 (Phaser 3) v2
// 단순화: 파워업 없음 / 무조건 회피 / 시작 시 튜토리얼 idle 상태
// =====================================================================

import * as Phaser from 'phaser';
import { CANVAS, MECHANICS, PALETTE, type DeathCause } from '@/lib/constants';
import { InputHandler } from './input';
import {
  OBSTACLE_DEFS,
  pickRandomPattern,
  type ObstacleType,
} from './obstacles';
import { BossManager } from './boss';
import { soundFX } from './sound';
import {
  createPlayerSprite,
  createObstacleSprite,
  type PlayerSprite,
} from './sprites';

export type GameOverResult = {
  score: number;
  durationMs: number;
  deathCause: DeathCause;
  milestones: { 100: boolean; 365: boolean; 1000: boolean };
  sessionId: string;
};

type ObstacleObject = {
  container: Phaser.GameObjects.Container;
  rect: Phaser.GameObjects.Rectangle; // invisible AABB hitbox (alpha 0)
  label: Phaser.GameObjects.Text;
  type: ObstacleType;
  velocityX: number;
};

function vibrate(pattern: number | number[]): void {
  try {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  } catch {
    // unsupported
  }
}

export class GameScene extends Phaser.Scene {
  private sessionId: string = '';
  private onGameOver!: (result: GameOverResult) => void;

  // 상태 머신
  private waitingForFirstInput: boolean = true;
  private gameActive: boolean = false;

  // 진행 수치
  private speed: number = MECHANICS.startSpeed;
  private score: number = 0;
  private distanceAccum: number = 0;
  private startTime: number = 0;
  private isDucking: boolean = false;
  private duckTimer: number = 0;
  private readonly DUCK_DURATION_MS = 600;

  private milestones: { 100: boolean; 365: boolean; 1000: boolean } = {
    100: false,
    365: false,
    1000: false,
  };

  private displayScore: number = 0;
  private bonusScore: number = 0;

  // 오브젝트 — 플레이어 분리: hitbox(물리) + sprite(시각)
  private playerHitbox!: Phaser.GameObjects.Rectangle; // 충돌용 invisible rect
  private playerSprite!: PlayerSprite;                  // 시각용 컨테이너
  private ground!: Phaser.GameObjects.Rectangle;
  private obstacles: ObstacleObject[] = [];

  // run cycle 타이머
  private runTimer: number = 0;

  // 물리
  private obstacleGroup!: Phaser.Physics.Arcade.StaticGroup;
  private playerBody!: Phaser.Physics.Arcade.Body;

  // 점프 상태
  private isOnGround: boolean = true;
  private jumpCount: number = 0;

  // HUD
  private scoreTxt!: Phaser.GameObjects.Text;
  private milestoneOverlay!: Phaser.GameObjects.Text;
  private bossWarningTxt!: Phaser.GameObjects.Text;
  private soundBtnTxt!: Phaser.GameObjects.Text;
  private soundBtnBg!: Phaser.GameObjects.Graphics;

  // 튜토리얼
  private tutorialMain!: Phaser.GameObjects.Text;
  private tutorialSub!: Phaser.GameObjects.Text;
  private tutorialBlinkTimer: number = 0;

  // 배경
  private bgLines: Phaser.GameObjects.Rectangle[] = [];
  private bgScrollX: number = 0;
  private groundDashes: Phaser.GameObjects.Rectangle[] = [];

  // 장애물 스폰
  private nextObstacleMs: number = 0;
  private spawnCooldown: number = MECHANICS.obstacleInterval.startMs;
  private pendingPattern: ObstacleType[] = [];
  private patternGapMs: number = 0;
  private patternTimer: number = 0;

  // 매니저
  private bossManager!: BossManager;
  private inputHandler!: InputHandler;

  // 보스 페이즈 추적 (warning SFX 한 번만 재생)
  private prevBossPhase: string = 'idle';

  // 카메라
  private shakeMs: number = 0;

  constructor() {
    super({ key: 'GameScene' });
  }

  // =====================================================================
  // 씬 라이프사이클
  // =====================================================================

  init(data: { sessionId: string; onGameOver: (r: GameOverResult) => void }): void {
    this.sessionId = data.sessionId ?? '';
    this.onGameOver = data.onGameOver;
  }

  create(): void {
    this.resetState();
    this.buildBackground();
    this.buildGround();
    this.buildPlayer();
    this.buildHUD();
    this.buildTutorial();
    this.setupPhysics();

    this.bossManager = new BossManager();

    this.inputHandler = new InputHandler(
      this,
      {
        onJump: () => this.handleJump(),
        onDuck: () => this.handleDuck(),
      },
      { pointerGuardTopPx: 30 },
    );

    // idle 상태: 첫 탭 기다림
    this.waitingForFirstInput = true;
    this.gameActive = false;
    this.nextObstacleMs = this.spawnCooldown;
  }

  update(_time: number, delta: number): void {
    const dt = delta;

    // 튜토리얼 깜빡임은 idle 상태에서도 동작
    if (this.waitingForFirstInput) {
      this.tutorialBlinkTimer += dt;
      if (this.tutorialBlinkTimer > 600) {
        this.tutorialBlinkTimer = 0;
        this.tutorialMain.setVisible(!this.tutorialMain.visible);
      }
      this.inputHandler.update();
      return;
    }

    if (!this.gameActive) return;

    this.inputHandler.update();

    // 속도 ramp
    this.speed = Math.min(
      this.speed + (MECHANICS.speedRamp * dt) / 1000,
      MECHANICS.speedCap,
    );
    const effectiveSpeed = this.speed;

    // 거리 누적 → 점수
    this.distanceAccum += effectiveSpeed * (dt / 1000);
    const newScore = Math.floor(this.distanceAccum / MECHANICS.pxPerDay);

    if (newScore > this.score) {
      this.score = newScore;
      this.checkMilestone(this.score);
      this.updateSpawnCooldown();
    }

    this.displayScore = this.score + this.bonusScore;

    // 보스
    if (!this.bossManager.isActive) {
      this.updateObstacleSpawn(dt);
    }
    this.bossManager.update(
      this.score,
      dt,
      (type) => this.spawnObstacle(type),
      () => this.handleBossCleared(),
    );

    // 장애물 이동 + 충돌
    this.updateObstacles(effectiveSpeed, dt);

    // 플레이어 물리
    this.updatePlayer(dt);

    // HUD
    this.updateHUD();

    // 보스 warning 텍스트 + SFX (페이즈 전환 시 한 번만)
    if (this.bossManager.phase === 'warning') {
      if (this.prevBossPhase !== 'warning') {
        soundFX.bossWarning();
      }
      this.bossWarningTxt.setText(this.bossManager.warningText);
      this.bossWarningTxt.setVisible(true);
    } else {
      this.bossWarningTxt.setVisible(false);
    }
    this.prevBossPhase = this.bossManager.phase;

    // 카메라 셰이크 타이머
    if (this.shakeMs > 0) {
      this.shakeMs -= dt;
    }
    if (this.bossManager.phase === 'pattern') {
      this.cameras.main.shake(100, 0.002);
    }

    this.updateBackground(effectiveSpeed, dt);

    // 숙이기 타이머
    if (this.isDucking) {
      this.duckTimer -= dt;
      if (this.duckTimer <= 0) {
        this.standUp();
      }
    }
  }

  // =====================================================================
  // 리셋
  // =====================================================================

  private resetState(): void {
    this.speed = MECHANICS.startSpeed;
    this.score = 0;
    this.displayScore = 0;
    this.bonusScore = 0;
    this.distanceAccum = 0;
    this.gameActive = false;
    this.waitingForFirstInput = true;
    this.isDucking = false;
    this.duckTimer = 0;
    this.isOnGround = true;
    this.jumpCount = 0;
    this.obstacles = [];
    this.milestones = { 100: false, 365: false, 1000: false };
    this.nextObstacleMs = 0;
    this.spawnCooldown = MECHANICS.obstacleInterval.startMs;
    this.pendingPattern = [];
    this.patternGapMs = 0;
    this.patternTimer = 0;
    this.shakeMs = 0;
    this.bgScrollX = 0;
    this.bgLines = [];
    this.groundDashes = [];
    this.tutorialBlinkTimer = 0;
    this.runTimer = 0;
  }

  // =====================================================================
  // 빌드: 배경 / 바닥 / 플레이어 / HUD / 튜토리얼
  // =====================================================================

  private buildBackground(): void {
    this.add.rectangle(
      CANVAS.width / 2,
      CANVAS.height / 2,
      CANVAS.width,
      CANVAS.height,
      PALETTE.ink0,
    ).setDepth(0);

    for (let i = 0; i < 8; i++) {
      const line = this.add.rectangle(
        CANVAS.width / 2,
        CANVAS.groundY - 80 + i * 12,
        CANVAS.width,
        1,
        PALETTE.ink5,
        0.3,
      ).setDepth(1);
      this.bgLines.push(line);
    }
  }

  private buildGround(): void {
    this.ground = this.add.rectangle(
      CANVAS.width / 2,
      CANVAS.groundY + 2,
      CANVAS.width,
      4,
      PALETTE.ink6,
    ).setDepth(2);

    // 스크롤 대시 — 바닥 약간 아래 점선이 좌로 흘러 모션감
    const dashSpacing = 36;
    const dashCount = Math.ceil(CANVAS.width / dashSpacing) + 2;
    for (let i = 0; i < dashCount; i++) {
      const dash = this.add.rectangle(
        i * dashSpacing,
        CANVAS.groundY + 14,
        14,
        3,
        PALETTE.ink5,
      ).setDepth(2).setOrigin(0, 0.5);
      this.groundDashes.push(dash);
    }
  }

  private buildPlayer(): void {
    const startX = CANVAS.playerX;
    const startY = CANVAS.groundY - CANVAS.playerH / 2;

    // 시각 스프라이트 컨테이너 (depth 5)
    // 컨테이너 원점 = 중앙 하단이므로 Y를 groundY에 맞춤
    this.playerSprite = createPlayerSprite(
      this,
      startX,
      CANVAS.groundY,
      CANVAS.playerW,
      CANVAS.playerH,
    );
    this.playerSprite.container.setDepth(5);

    // 물리용 invisible hitbox — 크기는 playerW × playerH, 위치는 중앙 기준
    this.playerHitbox = this.add.rectangle(
      startX,
      startY,
      CANVAS.playerW,
      CANVAS.playerH,
      0x000000,
      0, // invisible
    ).setDepth(5);

    this.physics.add.existing(this.playerHitbox);
    this.playerBody = this.playerHitbox.body as Phaser.Physics.Arcade.Body;
    this.playerBody.setGravityY(MECHANICS.gravityY);
    this.playerBody.setCollideWorldBounds(false);
  }

  private buildHUD(): void {
    this.scoreTxt = this.add.text(14, 14, '창업 0일차', {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '22px',
      color: '#fff1e8',
      resolution: 2,
    }).setDepth(10);

    this.milestoneOverlay = this.add.text(
      CANVAS.width / 2,
      CANVAS.height / 2,
      '',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '32px',
        color: '#ffec27',
        resolution: 2,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 4,
      },
    )
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    this.bossWarningTxt = this.add.text(
      CANVAS.width / 2,
      80,
      '',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '16px',
        color: '#ff004d',
        resolution: 2,
        align: 'center',
        stroke: '#000000',
        strokeThickness: 3,
      },
    )
      .setOrigin(0.5)
      .setDepth(20)
      .setVisible(false);

    // 사운드 ON/OFF 토글 버튼 (우상단)
    const btnEnabled = soundFX.enabled;
    const btnLabel = btnEnabled ? 'SND ON' : 'SND OFF';
    const btnColor = btnEnabled ? '#00e436' : '#5f574f';

    // 텍스트 먼저 생성해 크기 측정
    this.soundBtnTxt = this.add.text(0, 0, btnLabel, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '10px',
      color: btnColor,
      resolution: 2,
    }).setDepth(11);

    // 텍스트 크기 기반으로 배경 박스 계산
    const pad = 4;
    const btnW = this.soundBtnTxt.width + pad * 2;
    const btnH = this.soundBtnTxt.height + pad * 2;
    const btnX = CANVAS.width - 12 - btnW; // 우측에서 12px 여백
    const btnY = 8;

    this.soundBtnTxt.setPosition(btnX + pad, btnY + pad);

    // 테두리 박스 (Graphics)
    this.soundBtnBg = this.add.graphics().setDepth(11);
    this.soundBtnBg.lineStyle(2, PALETTE.ink7, 1);
    this.soundBtnBg.strokeRect(btnX, btnY, btnW, btnH);

    // 클릭 영역 — 투명 rect
    const hitZone = this.add.rectangle(
      btnX + btnW / 2,
      btnY + btnH / 2,
      btnW,
      btnH,
      0x000000,
      0,
    )
      .setDepth(12)
      .setInteractive({ useHandCursor: true });

    hitZone.on('pointerdown', () => {
      const next = !soundFX.enabled;
      soundFX.setEnabled(next);
      this.soundBtnTxt.setText(next ? 'SND ON' : 'SND OFF');
      this.soundBtnTxt.setColor(next ? '#00e436' : '#5f574f');
      // BGM: ON으로 전환 시 게임 active 상태면 재시작
      if (next && this.gameActive) {
        soundFX.startBGM();
      }
    });
  }

  private buildTutorial(): void {
    this.tutorialMain = this.add.text(
      CANVAS.width / 2,
      CANVAS.height / 2 - 40,
      'TAP TO START',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '20px',
        color: '#fff1e8',
        resolution: 2,
        align: 'center',
      },
    ).setOrigin(0.5).setDepth(15);

    this.tutorialSub = this.add.text(
      CANVAS.width / 2,
      CANVAS.height / 2 + 10,
      'TAP = JUMP\nSWIPE DOWN = DUCK',
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: '12px',
        color: '#c2c3c7',
        resolution: 2,
        align: 'center',
        lineSpacing: 8,
      },
    ).setOrigin(0.5).setDepth(15);
  }

  private setupPhysics(): void {
    this.obstacleGroup = this.physics.add.staticGroup();
  }

  // =====================================================================
  // 입력
  // =====================================================================

  private handleJump(): void {
    // 튜토리얼 idle 상태 → 게임 시작
    if (this.waitingForFirstInput) {
      this.startGameplay();
      return;
    }

    if (!this.gameActive) return;
    if (this.jumpCount >= 2) return;

    vibrate(5);
    soundFX.jump();
    this.jumpCount += 1;
    this.isOnGround = false;
    this.playerBody.setVelocityY(MECHANICS.jumpVelocity);

    // 점프 중 sprite 약간 기울임
    this.tweens.add({
      targets: this.playerSprite.container,
      rotation: -0.3,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
    });
  }

  private handleDuck(): void {
    if (this.waitingForFirstInput) {
      this.startGameplay();
      return;
    }
    if (!this.gameActive) return;
    if (this.isDucking) return;

    vibrate(5);
    soundFX.duck();
    this.isDucking = true;
    this.duckTimer = this.DUCK_DURATION_MS;

    this.playerHitbox.setSize(CANVAS.playerW, CANVAS.playerDuckH);
    this.playerHitbox.setY(CANVAS.groundY - CANVAS.playerDuckH / 2);
    if (this.playerBody) {
      this.playerBody.setSize(CANVAS.playerW, CANVAS.playerDuckH);
    }
    // 스프라이트 납작하게
    this.playerSprite.container.setScale(1, 0.6);
  }

  private standUp(): void {
    this.isDucking = false;
    this.playerHitbox.setSize(CANVAS.playerW, CANVAS.playerH);
    this.playerHitbox.setY(CANVAS.groundY - CANVAS.playerH / 2);
    if (this.playerBody) {
      this.playerBody.setSize(CANVAS.playerW, CANVAS.playerH);
    }
    // 스프라이트 원래 크기로
    this.playerSprite.container.setScale(1, 1);
  }

  private startGameplay(): void {
    this.waitingForFirstInput = false;
    this.gameActive = true;
    this.startTime = Date.now();
    this.tutorialMain.setVisible(false);
    this.tutorialSub.setVisible(false);

    soundFX.init();
    soundFX.startBGM();

    // 첫 입력 = 점프
    this.jumpCount = 1;
    this.isOnGround = false;
    this.playerBody.setVelocityY(MECHANICS.jumpVelocity);
    soundFX.jump();
    vibrate(5);
    this.tweens.add({
      targets: this.playerSprite.container,
      rotation: -0.3,
      duration: 150,
      yoyo: true,
      ease: 'Power2',
    });
  }

  // =====================================================================
  // 플레이어 물리 + 스프라이트 동기화
  // =====================================================================

  private updatePlayer(dt: number): void {
    const halfH = (this.isDucking ? CANVAS.playerDuckH : CANVAS.playerH) / 2;
    const floorY = CANVAS.groundY - halfH;
    const vy = this.playerBody.velocity.y;

    // 위로 움직이는 중(점프)일 땐 클램프하지 않음 → 점프 속도 보존
    if (this.playerHitbox.y >= floorY && vy >= 0) {
      const wasAirborne = !this.isOnGround;
      this.playerHitbox.setY(floorY);
      this.playerBody.setVelocityY(0);
      this.isOnGround = true;
      this.jumpCount = 0;
      if (wasAirborne) {
        this.playerSprite.container.setRotation(0);
      }
    }

    // 스프라이트를 hitbox 위치에 동기화
    // 컨테이너 원점이 중앙 하단 = groundY이므로 hitbox 하단 Y를 구함
    const spriteX = this.playerHitbox.x;
    const spriteGroundY = this.playerHitbox.y + halfH;
    this.playerSprite.container.setPosition(spriteX, spriteGroundY);

    // 런 사이클 — 땅에 있을 때만 다리 교차 애니메이션
    if (this.isOnGround && !this.isDucking) {
      this.runTimer += dt;
      const freq = 0.012; // 진동 주파수
      const amp = 6;      // 다리 진동 범위 (px)
      const phase = this.runTimer * freq;
      this.playerSprite.legLeft.setY(-5 + Math.sin(phase) * amp);
      this.playerSprite.legRight.setY(-5 - Math.sin(phase) * amp);
    } else if (!this.isOnGround) {
      // 점프 중: 다리 살짝 위로 모아줌
      this.playerSprite.legLeft.setY(-8);
      this.playerSprite.legRight.setY(-8);
    }
  }

  // =====================================================================
  // 배경 스크롤
  // =====================================================================

  private updateBackground(speed: number, dt: number): void {
    const moveX = -speed * (dt / 1000);
    this.bgScrollX += moveX;

    // 바닥 대시 좌로 스크롤 + 화면 밖이면 우측으로 wrap
    const spacing = 36;
    const totalWidth = CANVAS.width + spacing * 2;
    for (const dash of this.groundDashes) {
      dash.x += moveX;
      if (dash.x < -spacing) {
        dash.x += totalWidth;
      }
    }
  }

  // =====================================================================
  // 장애물 스폰
  // =====================================================================

  private updateSpawnCooldown(): void {
    // 부드러운 곡선: 처음엔 여유, 점점 빡빡해짐
    const { startMs, endMs, endScore, minimum } = MECHANICS.obstacleInterval;
    const t = Math.min(this.score / endScore, 1);
    const eased = Math.pow(t, 1.5);
    const ms = startMs - eased * (startMs - endMs);
    this.spawnCooldown = Math.max(ms, minimum);
  }

  private updateObstacleSpawn(dt: number): void {
    if (this.bossManager.isFreezeOrWarning) return;

    if (this.pendingPattern.length > 0) {
      this.patternTimer -= dt;
      if (this.patternTimer <= 0) {
        const type = this.pendingPattern.shift()!;
        this.spawnObstacle(type);
        this.patternTimer = this.patternGapMs;
      }
      return;
    }

    this.nextObstacleMs -= dt;
    if (this.nextObstacleMs <= 0) {
      const pattern = pickRandomPattern(this.score);
      if (pattern.sequence.length === 1) {
        this.spawnObstacle(pattern.sequence[0]!);
      } else {
        this.spawnObstacle(pattern.sequence[0]!);
        this.pendingPattern = pattern.sequence.slice(1);
        this.patternGapMs = pattern.innerGapMs ?? 400;
        this.patternTimer = this.patternGapMs;
      }
      this.nextObstacleMs = this.spawnCooldown;
    }
  }

  spawnObstacle(type: ObstacleType): void {
    const def = OBSTACLE_DEFS[type];
    const groundY = CANVAS.groundY;

    const x = CANVAS.width + def.width / 2 + 10;
    const y = groundY - def.height / 2 - def.offsetY;

    // 픽셀 스프라이트 컨테이너
    const container = createObstacleSprite(this, type, x, y);
    container.setDepth(4);

    // 라벨은 GameScene이 별도로 add.text (sprites.ts는 텍스트 없음)
    const label = this.add.text(x, y - def.height / 2 - 8, def.label, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: '12px',
      color: '#fff1e8',
      resolution: 2,
    }).setOrigin(0.5, 1).setDepth(4);

    // 충돌 계산용 invisible rect (AABB 기준)
    const rect = this.add.rectangle(x, y, def.width, def.height, 0x000000, 0);

    this.obstacles.push({
      container,
      rect,
      label,
      type,
      velocityX: -this.speed,
    });
  }

  // =====================================================================
  // 오브젝트 업데이트
  // =====================================================================

  private updateObstacles(speed: number, dt: number): void {
    const halfW = CANVAS.playerW / 2;
    const halfH = (this.isDucking ? CANVAS.playerDuckH : CANVAS.playerH) / 2;
    const playerLeft = this.playerHitbox.x - halfW;
    const playerRight = this.playerHitbox.x + halfW;
    const playerTop = this.playerHitbox.y - halfH;
    const playerBottom = this.playerHitbox.y + halfH;

    for (let i = this.obstacles.length - 1; i >= 0; i--) {
      const obs = this.obstacles[i]!;

      const moveX = -speed * (dt / 1000);
      obs.container.x += moveX;
      obs.rect.x += moveX;
      obs.label.x += moveX;

      const def = OBSTACLE_DEFS[obs.type];

      if (obs.container.x < -def.width) {
        obs.container.destroy();
        obs.rect.destroy();
        obs.label.destroy();
        this.obstacles.splice(i, 1);
        continue;
      }

      // AABB 충돌: rect.x는 컨테이너 중심과 동기화되어있음
      const obsLeft = obs.rect.x - def.width / 2;
      const obsRight = obs.rect.x + def.width / 2;
      const obsTop = obs.rect.y - def.height / 2;
      const obsBottom = obs.rect.y + def.height / 2;

      const overlaps =
        playerRight > obsLeft &&
        playerLeft < obsRight &&
        playerBottom > obsTop &&
        playerTop < obsBottom;

      if (overlaps) {
        this.handleCollision(def.deathCause);
        return;
      }
    }
  }

  // =====================================================================
  // 이벤트 핸들러
  // =====================================================================

  private handleCollision(cause: DeathCause): void {
    if (this.bossManager.isActive) {
      this.bossManager.markFailed();
    }
    this.triggerDeath(cause);
  }

  private handleBossCleared(): void {
    this.bonusScore += MECHANICS.bossClearBonus;
    vibrate([50, 30, 50]);
    this.cameras.main.shake(300, 0.008);
    this.showMilestoneText('DEMO DAY\nCLEARED! +100');
  }

  private checkMilestone(day: number): void {
    const milestoneKeys = [100, 365, 1000] as const;
    for (const key of milestoneKeys) {
      if (day >= key && !this.milestones[key]) {
        this.milestones[key] = true;
        this.bonusScore += MECHANICS.milestoneBonus[key];
        this.speed += MECHANICS.milestoneBoost[key];

        soundFX.milestone();
        vibrate([50, 30, 50, 30, 50]);
        this.cameras.main.shake(400, 0.012);
        this.cameras.main.flash(200, 255, 236, 39, false);

        this.showMilestoneText(`${key}일 돌파!`);
        this.events.emit('milestone', key);
      }
    }
  }

  private triggerDeath(cause: DeathCause): void {
    if (!this.gameActive) return;
    this.gameActive = false;

    soundFX.stopBGM();
    soundFX.death();
    vibrate([150, 50, 150]);
    this.cameras.main.shake(500, 0.02);
    this.cameras.main.flash(100, 255, 255, 255, false);
    // 사망 시 카메라 줌 + 스프라이트 회전/튀어오름
    this.cameras.main.zoomTo(1.1, 500);
    this.tweens.add({
      targets: this.playerSprite.container,
      rotation: -1.0,
      y: this.playerSprite.container.y - 10,
      duration: 200,
      ease: 'Power2',
    });

    this.time.delayedCall(600, () => {
      const durationMs = Date.now() - this.startTime;
      this.onGameOver({
        score: this.displayScore,
        durationMs,
        deathCause: cause,
        milestones: { ...this.milestones },
        sessionId: this.sessionId,
      });
    });
  }

  // =====================================================================
  // HUD
  // =====================================================================

  private updateHUD(): void {
    this.scoreTxt.setText(`창업 ${this.displayScore}일차`);
  }

  private showMilestoneText(text: string): void {
    this.milestoneOverlay.setText(text);
    this.milestoneOverlay.setVisible(true);
    this.milestoneOverlay.setAlpha(1);

    this.tweens.add({
      targets: this.milestoneOverlay,
      alpha: 0,
      duration: 1500,
      delay: 800,
      onComplete: () => {
        this.milestoneOverlay.setVisible(false);
      },
    });
  }
}
