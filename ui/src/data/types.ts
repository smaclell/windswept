// TODO: You might want to allow multiple states to be active at once

export type TileState = 'visible' | 'unknown' | 'flag' | 'mine' | 'explosion';
export type Mode = 'flag' | 'reveal';
export type Point = { x: number, y: number };

export type Interaction = Point & {
  mode: Mode,
};