export type Mode = "card" | "full";

export type Line = {
  paths: number[][];
  h: number;
  l: number;
  c?: number;
  a: number;
  w: number;
  fill?: boolean;
  add?: boolean;
  closed?: boolean;
};

export type Style = {
  id: string;
  name: string;
  pattern: "free" | "periodic";
  card?: boolean;
};

export type Piece = {
  style: string;
  /** Advances the piece by dt seconds and draws it. step(0) just draws. */
  step(dt: number): void;
  /** Turns every hue by this many degrees. */
  setHueShift(deg: number): void;
};

export type PieceOptions = {
  seed: string;
  /** A hex color the palette is built around, such as a language color. */
  color?: string | null;
  /** A style id; defaults to the seed's own style. */
  style?: string;
  mode?: Mode;
  /** Start from nothing and grow in, instead of from the settled still frame. */
  grow?: boolean;
  /** Half speed and fainter lines. */
  calm?: boolean;
};

export declare const STYLES: ReadonlyArray<Style>;
export declare const GROW_SECONDS: number;
export declare const SETTLE_SECONDS: number;
export declare function styleById(id: string): Style | undefined;
export declare function styleFor(seed: string): string;
export declare function pick(seeds: string[]): string[];
export declare function createPiece(canvas: HTMLCanvasElement, options: PieceOptions): Piece | null;
