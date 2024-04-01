import { create } from 'zustand';
import { produce } from 'immer';
import { Mode, TileState, Point } from './types';

// TODO: Optimize the lookup to not use strings

type TileData = {
  state: TileState;
  mineCount: number;
  edgeCount: number;
  mine: boolean;
  x: number;
  y: number;
}

export type SectionState = {
  size: number;
  offsetX: number;
  offsetY: number;
  _tileState: Record<string, TileData>;
  _nearby: Record<string, SectionState['update']>;
  initialize(mines: Point[]): void;
  tile(x: number, y: number): TileData;
  update(action: Mode, x: number, y: number): void;
  applyNeighbour(key: string, updater: SectionState['update'], range: {point: Point, mineCount: number, edgeCount: number }[]): void;
};

// TODO: Unit test?
export function getNeighbourKeys(x: number, y: number, size: number) {
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

    // x is a column, y is a row
    // HAX: Expand to hit populated neighbours
    if (x === 0) {
      state._nearby['-1,0']?.('reveal', state.size - 1, y);
    } else if (x === state.size - 1) {
      state._nearby['1,0']?.('reveal', 0, y);
    }

    if (y === 0) {
      state._nearby['0,-1']?.('reveal', x, state.size - 1);
    } else if (y === state.size - 1) {
      state._nearby['0,1']?.('reveal', x, 0);
    }

    if (x === 0 && y === 0) {
      state._nearby['-1,-1']?.('reveal', state.size - 1, state.size - 1);
    } else if (x === state.size - 1 && y === 0) {
      state._nearby['1,-1']?.('reveal', 0, state.size - 1);
    } else if (x === 0 && y === state.size - 1) {
      state._nearby['-1,1']?.('reveal', state.size - 1, 0);
    } else if (x === state.size - 1 && y === state.size -1) {
      state._nearby['1,11']?.('reveal', 0, 0);
    }
  }
}

export function randomizer(size: number, count: number): Point[] {
  const points: Point[] = [];
  const unique = new Set<string>();
  for (let i = 0; i < count; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const key = `${x},${y}`;
    if (!unique.has(key)) {
      unique.add(key);
      points.push({ x, y });
    } else {
      i--;
    }
  }

  return points;
}

function isCorner(size: number, x: number, y: number) {
  return (x === 0 || x === size - 1) && (y === 0 || y === size - 1);
}

function countEdges(size: number, x: number, y: number) {
  let count = 0;
  if (x === 0) {
    count += 3;
  } else if (x === size - 1) {
    count += 3;
  }
  if (y === 0) {
    count += 3;
  } else if (y === size - 1) {
    count += 3;
  }

  if (isCorner(size, x, y)) {
    count--;
  }

  return count;
}

export function createSectionStore(size: number, offsetX: number, offsetY: number) {
  return create<SectionState>((set, get) => ({
    size,
    offsetX,
    offsetY,
    _tileState: {},
    _nearby: {},
    initialize(mines) { // Neighbours are applied externally
      const tileState: SectionState['_tileState'] = {};

      // TODO: Make it sparse
      for (let y = 0; y < size; y++) {
        for (let x = 0; x < size; x++) {
          tileState[`${x},${y}`] = {
            x,
            y,
            state: 'unknown',
            edgeCount: countEdges(size, x, y),
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
        _tileState: tileState,
      }));
    },
    tile(x, y) {
      return get()._tileState[`${x},${y}`];
    },
    update(mode, x, y) {
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
              // TODO: stop it
              return;
            }

            reveal(state, x, y);
        }));
      }

      throw new Error(`Unknown mode ${mode}`);
    },
    applyNeighbour(key, updater, range) {
      // TODO: What if we load it and the nearby has already been seen
      set(produce((state) => {
        if (state._nearby[key]) {
          state._nearby[key] = updater;
          return;
        }

        range.forEach(({ point, mineCount, edgeCount }) => {
          const { x, y } = point;
          const key = `${x},${y}`;
          const current = state._tileState[key];
          current.mineCount += mineCount;
          current.edgeCount -= edgeCount;
        });
      }));
    },
  }));
}

export type SectionStore = ReturnType<typeof createSectionStore>;