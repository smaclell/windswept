import clsx from 'clsx';
import { TileState } from '@/store';

const content: Record<TileState, string> = {
  unknown: '',
  visible: ':(',
  flag: '🚩',
  mine: '💣',
  explosion: '💥',
};

export function Tile({
  state,
  mineCount = 0,
}: {
  state: TileState,
  mineCount: number,
}) {
  // TODO: Accessibilty
  let inside = content[state];
  if (state === 'visible') {
    inside = mineCount > 0? `${mineCount}` : '';
  }

  return (
    <div className={clsx('tile', state)} data-count={state === 'visible' ? mineCount : undefined}>
      {inside}
    </div>
  );
}