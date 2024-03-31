import { useCallback, Fragment } from "react";
import { useStore } from "zustand";
import type { Mode, SectionStore } from "@/store";
import Tile from "./tile";

export default function Section({ store, mode }: { store: SectionStore, mode: Mode }) {
  const { size, tile, update } = useStore(store);
  const bound = useCallback((x: number, y: number) => update(mode, x, y), [mode, update]);

  return (
    <section className="section" data-size={size}>
      {[...Array(size)].map((_, x) => (
        <Fragment key={x}>
          {[...Array(size)].map((_, y) => {
            const key = `${x},${y}`;
            const data = tile(x, y);
            const { state, mineCount } = data;
            return (
              <Tile key={key} state={state} mineCount={mineCount} x={x} y={y} onClick={bound} />
            );
          })}
        </Fragment>
      ))}
    </section>
  );
}