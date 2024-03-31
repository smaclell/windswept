'use client'
import { useCallback, useEffect, useState } from 'react';
import { useStore } from 'zustand';
import { randomizer, createSectionStore, Mode } from '@/store';
import Tile from "../game/tile";
import Section from '../game/section';
import Layout from '../game/layout';

const size = 8;
const store = createSectionStore(size, 0, 0);

// @ts-ignore - debugging
globalThis.store = store;

const fakeTileProps = {
  mineCount: 0,
  x: 0,
  y: 0,
  onClick: (x: number, y: number) => {alert(`{ x: ${x}, y: ${y} }`)},
};

export default function Home() {
  const { initialize } = useStore(store);
  const [mode, setMode] = useState<Mode>('reveal');
  const [ready, setReady] = useState(false);

  const [minX, setMinX] = useState(-5);
  const [maxX, setMaxX] = useState(5);
  const [minY, setMinY] = useState(-5);
  const [maxY, setMaxY] = useState(5);

  const createSection = useCallback((offsetX: number, offsetY: number) => {
    const store = createSectionStore(size, offsetX, offsetY);
    store.getState().initialize(randomizer(size, 8));

    if (offsetX < minX) {
      setMinX(offsetX);
    }
    if (offsetX > maxX) {
      setMaxX(offsetX);
    }
    if (offsetY < minY) {
      setMinY(offsetY);
    }
    if (offsetY > maxY) {
      setMaxY(offsetY);
    }

    return store;
  }, [maxX, maxY, minX, minY]);

  const reset = useCallback(() => initialize(randomizer(size, 8)), [initialize]);

  useEffect(() => {
    reset();
    setReady(true);
  }, [reset]);

  if (process.env.NODE_ENV !== 'development') {
    return null;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <h1>Test Page</h1>
      <p>This is the test page to help validate each component and tricky scenarios</p>
      <section className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h2>Tiles</h2>
        <div className="flex flex-wrap">
          <Tile state="unknown" {...fakeTileProps} />
          <Tile state="flag" {...fakeTileProps} />
          <Tile state="mine" {...fakeTileProps} />
          <Tile state="explosion" {...fakeTileProps} />
        </div>
        <div className="flex flex-wrap">
          <Tile state="visible" {...fakeTileProps} mineCount={0} />
          <Tile state="visible" {...fakeTileProps} mineCount={1} />
          <Tile state="visible" {...fakeTileProps} mineCount={2} />
          <Tile state="visible" {...fakeTileProps} mineCount={3} />
          <Tile state="visible" {...fakeTileProps} mineCount={4} />
          <Tile state="visible" {...fakeTileProps} mineCount={5} />
          <Tile state="visible" {...fakeTileProps} mineCount={6} />
          <Tile state="visible" {...fakeTileProps} mineCount={7} />
          <Tile state="visible" {...fakeTileProps} mineCount={8} />
        </div>
      </section>
      <section className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h2>Basics</h2>
        <div>
          <button className="block" onClick={reset}>Reset</button>
          <button className="block" onClick={() => setMode(mode => mode === 'reveal' ? 'flag' : 'reveal')}>Toggle Mode: {mode}</button>
        </div>
        {ready ? <Section store={store} mode={mode} /> : null}
      </section>
      <section className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h2>Infinite Load</h2>
        <div>
        </div>
        <Layout createSection={createSection} minX={minX} maxX={maxX} minY={minY} maxY={maxY} />
      </section>
    </main>
  )
}
