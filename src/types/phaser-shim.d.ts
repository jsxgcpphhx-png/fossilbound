declare namespace Phaser {
    const AUTO: number;

    namespace Types {
      namespace Core {
        interface GameConfig {
          [key: string]: unknown;
        }
      }

    namespace GameObjects {
        namespace Text {
          interface TextStyle {
            [key: string]: unknown;
          }
        }
      }
    }

    namespace Cameras {
      namespace Scene2D {
        const Events: { FADE_OUT_COMPLETE: string };
        interface Camera {
          setBackgroundColor(color: string): void;
          setBounds(x: number, y: number, width: number, height: number): void;
          setZoom(zoom: number): void;
          setScroll(x: number, y: number): void;
          setRoundPixels(value: boolean): void;
          startFollow(target: GameObjects.GameObject, roundPixels?: boolean, lerpX?: number, lerpY?: number): void;
          fadeIn(duration: number, red?: number, green?: number, blue?: number): void;
          fadeOut(duration: number, red?: number, green?: number, blue?: number): void;
          once(eventName: string, callback: () => void): void;
          ignore(entries: GameObjects.GameObject | GameObjects.GameObject[]): void;
        }
      }
    }

    namespace Scale {
      const FIT: number;
      const CENTER_BOTH: number;
    }

    namespace Math {
      function Between(min: number, max: number): number;
      function Clamp(value: number, min: number, max: number): number;
      namespace Distance {
        function Between(x1: number, y1: number, x2: number, y2: number): number;
      }
    }

    namespace Geom {
      class Rectangle {
        constructor(x: number, y: number, width: number, height: number);
        x: number;
        y: number;
        width: number;
        height: number;
        left: number;
        right: number;
        top: number;
        bottom: number;
        centerX: number;
        centerY: number;
      }
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

    namespace Textures {
      enum FilterMode { NEAREST }
    }

    namespace GameObjects {
      interface GameObject {
        setDepth(depth: number): this;
        setOrigin(x?: number, y?: number): this;
        setRotation(rotation: number): this;
        setStrokeStyle(width: number, color: number, alpha?: number): this;
        destroy(): void;
        alpha: number;
        x: number;
        y: number;
        setPosition(x: number, y: number): this;
        setVisible(visible: boolean): this;
        setScrollFactor(x: number, y?: number): this;
      }

      interface Sprite extends GameObject {
        scene: Scene;
        x: number;
        y: number;
        setPosition(x: number, y: number): this;
      }

      interface Rectangle extends GameObject {}
      interface Shape extends GameObject {}
      interface Image extends GameObject {
        setDisplaySize(width: number, height: number): this;
        setCrop(x: number, y: number, width: number, height: number): this;
      }
      interface Text extends GameObject {
        setText(text: string): this;
        setColor(color: string): this;
        setBackgroundColor(color: string): this;
      }
      interface Group {
        setVisible(visible: boolean): this;
        setScrollFactor(x: number, y?: number): this;
      }
    }

    interface CanvasTexture {
      getContext(): CanvasRenderingContext2D | null;
      refresh(): void;
    }

    class Scene {
      constructor(sceneConfig?: string | object);
      cameras: { main: Cameras.Scene2D.Camera; add(x: number, y: number, width: number, height: number, makeMain?: boolean, name?: string): Cameras.Scene2D.Camera };
      children: { list: GameObjects.GameObject[] };
      textures: {
        createCanvas(key: string, width: number, height: number): CanvasTexture | null;
        exists(key: string): boolean;
        get(key: string): { setFilter(filterMode: Textures.FilterMode): void };
      };
      load: {
        image(key: string, url: string): void;
        spritesheet(key: string, url: string, config: { frameWidth: number; frameHeight: number; spacing?: number; margin?: number }): void;
      };
      add: {
        circle(x: number, y: number, radius: number, color: number, alpha?: number): GameObjects.GameObject;
        group(children: unknown[]): GameObjects.Group;
        rectangle(x: number, y: number, width: number, height: number, color: number, alpha?: number): GameObjects.Rectangle;
        ellipse(x: number, y: number, width: number, height: number, color: number, alpha?: number): GameObjects.Shape;
        triangle(x: number, y: number, x1: number, y1: number, x2: number, y2: number, x3: number, y3: number, color: number, alpha?: number): GameObjects.Shape;
        line(x: number, y: number, x1: number, y1: number, x2: number, y2: number, color: number, alpha?: number): GameObjects.Shape;
        sprite(x: number, y: number, key: string, frame?: string | number): GameObjects.Sprite;
        image(x: number, y: number, key: string, frame?: string | number): GameObjects.Image;
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
      scene: { key: string; start(sceneKey: string, data?: unknown): void };
      tweens: { add(config: Record<string, unknown>): void };
      time: { now: number };
    }

    class Game {
      constructor(config: Types.Core.GameConfig);
    }
}

export = Phaser;
