import Phaser from 'phaser';
import './style.css';
import { GAME_HEIGHT, GAME_WIDTH } from './data/constants';
import { AmberleafTownScene } from './scenes/AmberleafTownScene';
import { EncounterScene } from './scenes/EncounterScene';
import { FernTrailScene } from './scenes/FernTrailScene';
import { LabScene } from './scenes/LabScene';
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
  scene: [TitleScene, AmberleafTownScene, LabScene, FernTrailScene, EncounterScene]
};

new Phaser.Game(config);
