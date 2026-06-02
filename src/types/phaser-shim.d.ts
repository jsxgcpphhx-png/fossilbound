declare namespace Phaser {
    const AUTO: number;

    namespace Types {
      namespace Core {
        interface GameConfig {
          [key: string]: unknown;
        }
      }
    }

    namespace Scale {
      const FIT: number;
      const CENTER_BOTH: number;
    }

    namespace Input {
      namespace Keyboard {
        const KeyCodes: Record<string, number>;
        function JustDown(key: Key): boolean;
        interface Key {
          [key: string]: unknown;
        }
      }
    }

    namespace GameObjects {
      interface GameObject {
        setDepth(depth: number): this;
        setOrigin(x?: number, y?: number): this;
        setRotation(rotation: number): this;
        setStrokeStyle(width: number, color: number, alpha?: number): this;
        destroy(): void;
        alpha: number;
      }

      interface Sprite extends GameObject {
        scene: Scene;
        x: number;
        y: number;
        setPosition(x: number, y: number): this;
      }

      interface Rectangle extends GameObject {}
      interface Text extends GameObject {
        setText(text: string): this;
      }
      interface Group {
        setVisible(visible: boolean): this;
      }
    }

    interface CanvasTexture {
      getContext(): CanvasRenderingContext2D | null;
      refresh(): void;
    }

    class Scene {
      constructor(sceneConfig?: string | object);
      cameras: { main: { setBackgroundColor(color: string): void } };
      textures: { createCanvas(key: string, width: number, height: number): CanvasTexture | null };
      add: {
        circle(x: number, y: number, radius: number, color: number, alpha?: number): GameObjects.GameObject;
        group(children: unknown[]): GameObjects.Group;
        rectangle(x: number, y: number, width: number, height: number, color: number, alpha?: number): GameObjects.Rectangle;
        sprite(x: number, y: number, key: string): GameObjects.Sprite;
        text(x: number, y: number, text: string, style?: object): GameObjects.Text;
      };
      input: {
        keyboard?: {
          addKey(keyCode: number): Input.Keyboard.Key;
          checkDown(key: Input.Keyboard.Key, duration: number): boolean;
          once(eventName: string, callback: () => void): void;
        };
        once(eventName: string, callback: () => void): void;
      };
      scene: { start(sceneKey: string): void };
      tweens: { add(config: Record<string, unknown>): void };
    }

    class Game {
      constructor(config: Types.Core.GameConfig);
    }
}

export = Phaser;
