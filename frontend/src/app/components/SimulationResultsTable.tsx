import * as React from 'react';
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  ColumnDef,
  SortingState,
} from '@tanstack/react-table';

interface RowData {
  ticker: string;
  action: string;
  quantity: number;
  confidence: number;
  reasoning: string;
}

interface SimulationResultsTableProps {
  data: RowData[];
}

export function SimulationResultsTable({ data }: SimulationResultsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  const columns = React.useMemo<ColumnDef<RowData, any>[]>(
    () => [
      { accessorKey: 'ticker', header: 'Ticker' },
      { accessorKey: 'action', header: 'Action' },
      { accessorKey: 'quantity', header: 'Quantity' },
      { accessorKey: 'confidence', header: 'Confidence', cell: info => info.getValue() + '%' },
      { accessorKey: 'reasoning', header: 'Reasoning', cell: info => <span className="whitespace-pre-wrap max-w-xs block">{info.getValue()}</span> },
    ],
    []
  );

  const table = useReactTable({
    data,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    globalFilterFn: 'includesString',
    debugTable: false,
  });

  return (
    <div className="overflow-x-auto rounded-lg border border-gray-700 bg-zinc-900">
      <div className="flex items-center gap-2 p-2">
        <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Filter results..."
          className="px-2 py-1 rounded bg-gray-800 text-white border border-gray-600"
        />
      </div>
      <table className="min-w-full text-sm text-left text-gray-200">
        <thead className="sticky top-0 bg-zinc-900 z-10">
          {table.getHeaderGroups().map(headerGroup => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map(header => (
                <th
                  key={header.id}
                  className="px-4 py-3 font-semibold cursor-pointer select-none border-b border-gray-700"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : ''}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map(row => (
            <tr key={row.id} className="hover:bg-gray-800">
              {row.getVisibleCells().map(cell => (
                <td key={cell.id} className="px-4 py-2 border-b border-gray-700">
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
} 