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
  playing: boolean;
  _tileState: Record<string, TileData>;
  initialize(mines: Point[]): void;
  tile(x: number, y: number): TileData;
  update(action: Mode, x: number, y: number): void;
  applyNeighbour(range: {point: Point, mineCount: number, edgeCount: number }[]): void;
};

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
  // TODO: Apply Neighbours
  // TODO: Edges
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
    mode: 'reveal',
    playing: true,
    _tileState: {},
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
        playing: true,
        _tileState: tileState,
      }));
    },
    tile(x, y) {
      return get()._tileState[`${x},${y}`];
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
    applyNeighbour(range) {
      set(produce((state) => {
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