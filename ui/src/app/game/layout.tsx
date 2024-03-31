import React, { useCallback, useMemo } from 'react';
import { FixedSizeGrid } from 'react-window';
import Section from './section';
import Skeleton from './skeleton';
import { SectionStore } from '@/store';

// TODO: You ran out of brain power!
// Implement the loading for the world. Apply neighbours. Have "peek" to try to get the next one

// TODO: Allow clicks while loading, defer them to when loading is done

const size = 8;
const side = size * (24 + 8); // see CSS to for units (length + border)

type Indexes = { columnIndex: number, rowIndex: number };
type Bounds = { minX: number, maxX: number, minY: number, maxY: number };
type Props = Bounds & {
  // TODO: Make this async
  createSection: (offsetX: number, offsetY: number) => SectionStore;
};

function fullItemKey({ columnIndex, rowIndex }: Indexes, { minX, minY }: Bounds): [string, number, number] {
  const offsetX = columnIndex + minX;
  const offsetY = rowIndex + minY;
  return [`${offsetX},${offsetY}`, offsetX, offsetY];
}

const sections = new Map<string, SectionStore>();

const ItemRenderer = React.memo(function InnerItemRenderer({ rowIndex, columnIndex, isScrolling, data, style }: Indexes & { isScrolling?: boolean; data: Props, style?: React.CSSProperties }) {
  const [key, offsetX, offsetY] = fullItemKey({ columnIndex, rowIndex }, data);
  if (!sections.has(key)) {
    sections.set(key, data.createSection(offsetX, offsetY));
  }

  const store = sections.get(key);
  return (
    <div style={style} key={key}>
      { isScrolling || !store ? (
        <Skeleton size={size} />
      ) : (
        <Section store={store} mode="reveal" />
      )}
    </div>
  );
});

export default function Layout({
  minX,
  maxX,
  minY,
  maxY,
  createSection,
}: Props) {
  let columns = maxX - minX + 1;
  let rows = maxY - minY + 1;

  const data: Props = useMemo(() => ({
    minX,
    maxX,
    minY,
    maxY,
    createSection,
  }), [minX, maxX, minY, maxY, createSection]);

  const itemKey = useCallback((indexes: Indexes) => fullItemKey(indexes, data)[0], [data]);

  // TODO: Use this to trigger loading on the left and right
  const onItemsRendered = useCallback(({
    overscanColumnStartIndex,
    overscanColumnStopIndex,
    overscanRowStartIndex,
    overscanRowStopIndex,
    visibleColumnStartIndex,
    visibleColumnStopIndex,
    visibleRowStartIndex,
    visibleRowStopIndex
  }: {
    overscanColumnStartIndex: number;
    overscanColumnStopIndex: number;
    overscanRowStartIndex: number;
    overscanRowStopIndex: number;
    visibleColumnStartIndex: number;
    visibleColumnStopIndex: number;
    visibleRowStartIndex: number;
    visibleRowStopIndex: number;
  }) => {
    // All index params are numbers.
  }, []);

  return (
      <FixedSizeGrid
        itemKey={itemKey}
        initialScrollTop={side * (0 - minX + 1)}
        initialScrollLeft={side * (0 - minY + 1)}
        itemData={data}
        useIsScrolling
        height={600}
        width={800}
        columnCount={columns + 4}
        rowCount={rows + 4}
        columnWidth={side}
        rowHeight={side}
        onItemsRendered={onItemsRendered}
      >
        {ItemRenderer}
    </FixedSizeGrid>
  );
}
