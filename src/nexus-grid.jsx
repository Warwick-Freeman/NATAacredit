import React from 'react';
import { AgGridReact } from 'ag-grid-react';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

/**
 * NexusGrid — thin AG Grid Community wrapper that inherits the app's CSS
 * variable palette (all four themes) automatically.
 *
 * Props:
 *   rowData       array of row objects
 *   columnDefs    AG Grid column definition array
 *   onRowClicked  optional (params) => void — sets pointer cursor when provided
 *   domLayout     'autoHeight' (default) | 'normal'
 *   height        used when domLayout='normal', e.g. "400px"
 *   ...rest       passed directly to AgGridReact
 */
const NexusGrid = ({
  rowData,
  columnDefs,
  onRowClicked,
  domLayout = 'autoHeight',
  height,
  ...rest
}) => (
  <div
    className={`ag-theme-quartz nexus-grid${onRowClicked ? ' nexus-grid--clickable' : ''}`}
    style={domLayout === 'normal' ? { height: height ?? 400 } : undefined}
  >
    <AgGridReact
      rowData={rowData}
      columnDefs={columnDefs}
      defaultColDef={{
        sortable: true,
        resizable: false,
        suppressMovable: true,
        autoHeight: true,
        wrapText: true,
      }}
      suppressCellFocus
      domLayout={domLayout}
      onRowClicked={onRowClicked}
      {...rest}
    />
  </div>
);

export default NexusGrid;
