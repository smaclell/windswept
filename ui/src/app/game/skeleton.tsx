import { Fragment } from "react";
import Tile from "./tile";

const empty = () => {};

export default function Skeleton({ size }: { size: number }) {
  return (
    <section className="section skeleton" data-size={size}>
      {[...Array(size)].map((_, x) => (
        <Fragment key={x}>
          {[...Array(size)].map((_, y) => {
            const key = `${x},${y}`;
            return (
              <Tile key={key} state="unknown" mineCount={0} x={x} y={y} onClick={empty} />
            );
          })}
        </Fragment>
      ))}
    </section>
  );
}