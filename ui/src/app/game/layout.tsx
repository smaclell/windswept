import React, { useCallback, useMemo } from 'react';
import { FixedSizeGrid } from 'react-window';
import type { SectionStore } from '@/data/sectionStore';
import type { WorldStore } from '@/data/worldStore';
import Section from './section';
import Skeleton from './skeleton';
import { useStore } from 'zustand';
import { useShallow } from 'zustand/react/shallow';

// TODO: You ran out of brain power!
// Implement the loading for the world. Apply neighbours. Have "peek" to try to get the next one

// TODO: Allow clicks while loading, defer them to when loading is done

const size = 8;
const side = size * (24 + 8); // see CSS to for units (length + border)

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
  if (!section && !isScrolling) {
    data.request(offsetX, offsetY);
  }

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
    /*
    for (let x = data.columnIndexToColumn(visibleColumnStartIndex); x <= data.columnIndexToColumn(visibleColumnStopIndex); x++) {
      for (let y = data.rowIndexToColumn(visibleRowStartIndex); y <= data.rowIndexToColumn(visibleRowStopIndex); y++) {
        data.request(x, y);
      }
    }
    */
    data.process();
  }, [data]);

  return (
      <FixedSizeGrid
        itemKey={itemKey}
        initialScrollTop={side * (0 - data.minX + 1)}
        initialScrollLeft={side * (0 - data.minY + 1)}
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
