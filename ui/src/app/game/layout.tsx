import React, { useCallback, useMemo } from 'react';
import { FixedSizeGrid } from 'react-window';
import type { SectionStore } from '@/data/sectionStore';
import type { WorldStore } from '@/data/worldStore';
import Section from './section';
import Skeleton from './skeleton';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// TODO: Allow clicks while loading, defer them to when loading is done
// TODO: Capitalize constants throughout the code.
const size = 8;
const side = size * (24 + 8); // see CSS to for units (length + border)
const overload = 2;

type StoreData = {
  minX: number,
  maxX: number,
  minY: number,
  maxY: number,
  peek: (offsetX: number, offsetY: number) => SectionStore | undefined,
  request: (offsetX: number, offsetY: number) => void,
  process: () => void,
};

type Indexes = { columnIndex: number, rowIndex: number };
type Bounds = { minX: number, maxX: number, minY: number, maxY: number };

function fullItemKey({ columnIndex, rowIndex }: Indexes, { minX, minY }: Bounds): [string, number, number] {
  const offsetX = columnIndex + minX;
  const offsetY = rowIndex + minY;
  return [`${offsetX},${offsetY}`, offsetX, offsetY];
}

// TODO: Use Suspense for even smoother transitions
// TODO: Use the areEqual comparison to ignore identical styles
const ItemRenderer = React.memo(function InnerItemRenderer({ rowIndex, columnIndex, isScrolling, data, style }: Indexes & { isScrolling?: boolean; data: StoreData, style?: React.CSSProperties }) {
  const [key, offsetX, offsetY] = fullItemKey({ columnIndex, rowIndex }, data);
  const section = data.peek(offsetX, offsetY);

  return (
    <div style={style} key={key}>
      { !section ? (
        <Skeleton size={size} />
      ) : (
        <Section store={section} mode="reveal" />
      )}
    </div>
  );
});

export default function Layout({
  store,
}: { store: WorldStore } ) {
  const data = useStore(store, useShallow(state => ({
    minX: state.minX,
    maxX: state.maxX,
    minY: state.minY,
    maxY: state.maxY,
    request: state.request,
    process: state.process,
    peek: state.peek,
    rowIndexToColumn: (rowIndex: number) => rowIndex + data.minY,
    columnIndexToColumn: (colmnIndex: number) => colmnIndex + data.minX,
  })));

  let columns = data.maxX - data.minX + 1;
  let rows = data.maxY - data.minY + 1;

  const itemKey = useCallback((indexes: Indexes) => fullItemKey(indexes, data)[0], [data]);

  const onItemsRendered = useCallback(({
    overscanColumnStartIndex,
    overscanColumnStopIndex,
    overscanRowStartIndex,
    overscanRowStopIndex,
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
    // TODO: Allow scrolling left - AKA zoolander mode
    for (let x = data.columnIndexToColumn(overscanColumnStartIndex); x <= data.columnIndexToColumn(overscanColumnStopIndex); x++) {
      for (let y = data.rowIndexToColumn(overscanRowStartIndex); y <= data.rowIndexToColumn(overscanRowStopIndex); y++) {
        data.request(x, y);
      }
    }
    data.process();
  }, [data]);

  return (
      <FixedSizeGrid
        itemKey={itemKey}
        initialScrollTop={3 * side}
        initialScrollLeft={3 * side}
        itemData={data}
        useIsScrolling
        height={600}
        width={800}
        columnCount={columns + overload}
        rowCount={rows + overload}
        columnWidth={side}
        rowHeight={side}
        onItemsRendered={onItemsRendered}
      >
        {ItemRenderer}
    </FixedSizeGrid>
  );
}
