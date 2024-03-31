import { StoreApi, create } from 'zustand';
import { produce } from 'immer';
import type { Interaction, Mode, Point } from './types';
import { type SectionStore, type SectionState, createSectionStore, getNeighbourKeys } from './sectionStore';

enum GameState {
  Playing,
  Lost,
  Loading,
}

type Creator = (offsetX: number, offsetY: number) => Promise<{ mines: Point[], interactions: Interaction[] }>;

type WorldState = {
  playing: GameState;
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  _stores: Record<string, SectionStore>;
  initialize(): void;
  peek(offsetX: number, offsetY: number): SectionStore | undefined;
  request(offsetX: number, offsetY: number): void;
  process(): void;
  interaction(offsetX: number, offsetY: number, mode: Mode, x: number, y: number): void;
};

const size = 8;
const edge = size - 1;

const directions = [
  { dx: -1, dy: -1 },
  { dx: -1, dy: 0 },
  { dx: -1, dy: 1 },
  { dx: 0, dy: -1 },
  { dx: 0, dy: 1 },
  { dx: 1, dy: -1 },
  { dx: 1, dy: 0 },
  { dx: 1, dy: 1 },
];

// TODO: Encapsulation Fail!!!!
type RangeData = Parameters<SectionState['applyNeighbour']>[2];

function getRange(tiles: SectionState['_tileState'], dx: number, dy: number): RangeData {
  if (dx !== 0 && dy !== 0) {
    const data = tiles[`${dx === -1 ? 0 : edge},${dy === -1 ? 0 : edge}`];
    return [{
      point: {
        x: dx === -1 ? edge : 0,
        y: dy === -1 ? edge : 0,
      },
      mineCount: data?.mine ? 1 : 0,
      edgeCount: data ? 1 : 0,
    }];
  }

  let x = 0;
  let y = 0;
  let iy = 0;
  let ix = 0;

  if (dx === -1) {
    x = edge;
    iy = 1;
  } else if (dx === 1) {
    x = 0;
    iy = 1;
  } else if (dy === -1) {
    y = edge;
    ix = 1;
  } else if (dy === 1) {
    y = 0;
    ix = 1;
  } else {
    throw new Error('Invalid direction');
  }

  let points: RangeData = [];
  for (; x < size && y < size; x += ix, y += iy) {
    let mineCount = 0;
    let edgeCount = 0;
    const nx =
      dx === -1 ? -1 :
      dx === 1 ? size :
      x;
    const ny =
      dy === -1 ? -1 :
      dy === 1 ? size :
      y;
    getNeighbourKeys(nx, ny, size).forEach((key) => {
      const data = tiles[key];
      if (data) {
        edgeCount++;
        if (data.mine) {
          mineCount++;
        }
      }
    });

    points.push({
      point: {
        x,
        y,
      },
      mineCount,
      edgeCount,
    });
  }

  return points;
}

export function createWorldStore(factory: Creator) {
  type Api = StoreApi<WorldState>;
  type QueueRecord = { offsetX: number, offsetY: number, retries: number };

  const queue: QueueRecord[] = [];

  async function createSection(target: QueueRecord, set: Api['setState'], get: Api['getState']) {
    try {
      const { peek } = get();
      const response = await factory(target.offsetX, target.offsetY);
      const store = createSectionStore(size, target.offsetX, target.offsetY);

      set(produce((state) => {
        state._stores[`${target.offsetX},${target.offsetY}`] = store;
        state.minX = Math.min(state.minX, target.offsetX);
        state.maxX = Math.max(state.maxX, target.offsetX);
        state.minY = Math.min(state.minY, target.offsetY);
        state.maxY = Math.max(state.maxY, target.offsetY);
      }));

      // TODO: Reduce getState calls and force them to be internal to the stores
      store.getState().initialize(response.mines);

      directions.forEach(({ dx, dy }) => {
        const neighbour = peek(target.offsetX + dx, target.offsetY + dy);
        if (neighbour) {
          let storeState = store.getState();
          let neighbourState = neighbour.getState();

          storeState.applyNeighbour(`${dx},${dy}`, neighbourState.update, getRange(neighbourState._tileState, dx, dy));

          storeState = store.getState();
          neighbourState = neighbour.getState();
          neighbourState.applyNeighbour(`${-dx},${-dy}`, storeState.update, getRange(storeState._tileState, -dx, -dy));
        }
      });

      response.interactions.forEach(({ mode, x, y }) => {
        store.getState().update(mode, x, y);
      });
    } catch (ex) {
      // TODO: Logging
      if (process.env.NODE_ENV === 'development') {
        console.error(ex);
      }

      if (target.retries > 0) {
        target.retries--;
        queue.push(target);
      }
    }
  }

  const batchSize = 10;
  async function innerProcessing(set: Api['setState'], get: Api['getState']) {
    const promises: Promise<void>[] = [];

    for (let i = 0; i < Math.min(batchSize, queue.length); i++) {
      const item = queue[i];
      const store = get().peek(item.offsetX, item.offsetY);
      if (!store) {
        promises.push(createSection(item, set, get));
      }
    }

    await Promise.all(promises);
    queue.splice(0, promises.length);
  }

  // TODO: Can debounce queing
  function loop(set: Api['setState'], get: Api['getState']) {
    if (queue.length === 0) {
      return;
    }

    requestAnimationFrame(() => {
      innerProcessing(set, get).finally(() => {
        loop(set, get);
      });
    });
  }

  return create<WorldState>((set, get) => ({
    playing: GameState.Loading,
    _stores: {},
    next: [],
    minX: 0,
    maxX: 0,
    minY: 0,
    maxY: 0,
    initialize() {
      const { request, process } = get();
      for (let x = -3; x <= 3; x++) {
        for (let y = -3; y <= 3; y++) {
          request(x, y);
        }
      }

      process();
    },
    peek(offsetX: number, offsetY: number) {
      return get()._stores[`${offsetX},${offsetY}`];
    },
    interaction(offsetX, offsetY, mode, x, y) {
      const { peek } = get();
      const store = peek(offsetX, offsetY);
      if (!store) {
        throw new Error(`Section not found (${offsetX}, ${offsetY})`);
      }

      store.getState().update(mode, x, y);
    },
    request(offsetX: number, offsetY: number) {
      queue.push({ offsetX, offsetY, retries: 5 });
    },
    process() {
      loop(set, get);
    },
  }));
}

export type WorldStore = ReturnType<typeof createWorldStore>;
