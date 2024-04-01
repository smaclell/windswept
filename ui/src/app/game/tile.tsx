import clsx from 'clsx';
import { TileState } from '@/data/types';

const content: Record<TileState, string> = {
  unknown: '',
  visible: ':(',
  flag: '🚩',
  mine: '💣',
  explosion: '💥',
};

// TODO: Consider using a memo here since it is pure
export default function Tile({
  state,
  mineCount = 0,
  edgeCount = 0,
  x,
  y,
  onClick
}: {
  state: TileState,
  mineCount: number,
  edgeCount: number,
  x: number,
  y: number,
  onClick: (x: number, y: number) => void,
}) {
  // TODO: Accessibilty
  // Hide the contents if there are still edges to reveal
  if (edgeCount && state === 'visible') {
    state = 'unknown';
  }

  let inside = content[state];
  if (state === 'visible') {
    inside = mineCount > 0 ? `${mineCount}` : '';
  }

  return (
    <div
      className={clsx('tile', state, edgeCount > 0 && 'edge')}
      data-x={x} data-y={y}
      data-count={process.env.NODE_ENV === 'development' || state === 'visible' ? mineCount : undefined}
      data-edges={process.env.NODE_ENV === 'development' ? edgeCount : undefined}
      onClick={state === 'flag' || state === 'unknown' ? () => onClick(x, y) : undefined}
    >
      {inside}
    </div>
  );
}