import { create } from 'zustand';
import { produce } from 'immer';

// TODO: You might want to allow multiple states to be active at once
export type TileState = 'visible' | 'unknown' | 'flag' | 'mine' | 'explosion';
export type Mode = 'flag' |'reveal';

type Point = {
  x: number;
  y: number;
};

// TODO: Optimize the lookup to not use strings

type SectionState = {
  size: number;
  offsetX: number;
  offsetY: number;
  playing: boolean;
  _tileState: Record<string, { state: TileState; mineCount: number; mine: boolean, x: number, y: number }>;
  initialize(mines: Point[]): void;
  tile(x: number, y: number): { state: TileState; mineCount: number };
  update(action: Mode, x: number, y: number): void;
};

function getNeighbourKeys(x: number, y: number, size: number) {
  const keys: string[] = [];
  if (0 < x) {
    keys.push(`${x-1},${y}`);
    if (0 < y) {
      keys.push(`${x-1},${y-1}`);
    }
    if ((y + 1) < size) {
      keys.push(`${x-1},${y+1}`);
    }
  }
  if ((x + 1) < size) {
    keys.push(`${x+1},${y}`);
    if (0 < y) {
      keys.push(`${x+1},${y-1}`);
    }
    if ((y + 1) < size) {
      keys.push(`${x+1},${y+1}`);
    }
  }

  if (0 < y) {
    keys.push(`${x},${y-1}`);
  }
  if (y + 1 < size) {
    keys.push(`${x},${y+1}`);
  }

  return keys;
}

function reveal(state: SectionState, x: number, y: number) {
  const key = `${x},${y}`;
  const current = state._tileState[key];
  current.state = 'visible';
  if (current.mineCount === 0) {
    const neighbours = getNeighbourKeys(x, y, state.size);
    for (const neighbour of neighbours) {
      const neighbourTile = state._tileState[neighbour];
      if (neighbourTile.state === 'unknown') {
        reveal(state, neighbourTile.x, neighbourTile.y);
      }
    }
  }
}

export function randomizer(size: number, count: number): Point[] {
  const points: Point[] = [];
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    points.push({ x, y });
  }

  return points;
}

export function createSectionStore(size: number, offsetX: number, offsetY: number) {
  return create<SectionState>((set, get) => ({
    size,
    offsetX,
    offsetY,
    mode: 'reveal',
    playing: true,
    _tileState: {},
    initialize(mines) { // TODO: Overflow from the neighbours
      const tileState: SectionState['_tileState'] = {};

      // TODO: Make it sparse
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          tileState[`${x},${y}`] = {
            x,
            y,
            state: 'unknown',
            mineCount: 0,
            mine: false,
          };
        }
      }

      for (const mine of mines) {
        tileState[`${mine.x},${mine.y}`].mine = true;

        getNeighbourKeys(mine.x, mine.y, size).forEach((key) => {
          tileState[key].mineCount++;
        });
      }

      set((state) => ({
        ...state,
        playing: true,
        _tileState: tileState,
      }));
    },
    tile(x, y) {
      return get()._tileState[`${x},${y}`] ?? { state: 'unknown', mineCount: 0 };
    },
    update(mode, x, y) {
      if(!get().playing) {
        return;
      }

      const key = `${x},${y}`;

      if (mode === 'flag') {
        return set(produce<SectionState>((state) => {
          const current = state._tileState[key];

          if (current.state === 'flag') {
            current.state = 'unknown';
          } else if (current.state === 'unknown') {
            current.state = 'flag';
          }
        }));
      }

      if (mode === 'reveal') {
        return set(produce<SectionState>((state) => {
          const current = state._tileState[key];
            if (current.mine) {
              current.state = 'explosion';
              state.playing = false;
              return;
            }

            reveal(state, x, y);
        }));
      }

      throw new Error(`Unknown mode ${mode}`);
    },
  }));
}

export type SectionStore = ReturnType<typeof createSectionStore>;