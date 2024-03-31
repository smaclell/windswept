import clsx from 'clsx';
import { TileState } from '@/store';

const content: Record<TileState, string> = {
  unknown: '',
  visible: ':(',
  flag: '🚩',
  mine: '💣',
  explosion: '💥',
};

// TODO: Consider using a memo here since it is pure
export function Tile({
  state,
  mineCount = 0,
  x,
  y,
  onClick
}: {
  state: TileState,
  mineCount: number,
  x: number,
  y: number,
  onClick: (x: number, y: number) => void,
}) {
  // TODO: Accessibilty
  let inside = content[state];
  if (state === 'visible') {
    inside = mineCount > 0 ? `${mineCount}` : '';
  }

  return (
    <div
      className={clsx('tile', state)}
      data-x={x} data-y={y}
      data-count={state === 'visible' ? mineCount : undefined}
      onClick={state === 'flag' || state === 'unknown' ? () => onClick(x, y) : undefined}
    >
      {inside}
    </div>
  );
}