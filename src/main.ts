import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './data/constants';
import { AmberleafTownScene } from './scenes/AmberleafTownScene';
import { BattleScene } from './scenes/BattleScene';
import { FernTrailScene } from './scenes/FernTrailScene';
import { IntroScene } from './scenes/IntroScene';
import { IslandBaseScene } from './scenes/IslandBaseScene';
import { LabScene } from './scenes/LabScene';
import { MossbankVillageScene } from './scenes/MossbankVillageScene';
import { TitleScene } from './scenes/TitleScene';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: '#17251d',
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [TitleScene, IntroScene, AmberleafTownScene, LabScene, FernTrailScene, MossbankVillageScene, IslandBaseScene, BattleScene]
};

new Phaser.Game(config);
