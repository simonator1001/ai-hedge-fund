import * as React from 'react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  TableCaption,
} from "./ui/table";
import { Badge } from "./ui/badge";
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
  analyst: string;
  ticker: string;
  action: string;
  confidence: number;
  price?: number;
  reasoning: string;
  [key: string]: any;
}

interface SimulationResultsTableProps {
  data: RowData[];
}

export function SimulationResultsTable({ data }: SimulationResultsTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [globalFilter, setGlobalFilter] = React.useState('');

  // Find all unique extra fields
  const extraFields = React.useMemo(() => {
    const core = new Set(['analyst', 'ticker', 'action', 'confidence', 'price', 'reasoning']);
    const fields = new Set<string>();
    data.forEach(row => {
      Object.keys(row).forEach(k => {
        if (!core.has(k)) fields.add(k);
      });
    });
    return Array.from(fields);
  }, [data]);

  const columns = React.useMemo<ColumnDef<RowData, any>[]>(
    () => [
      { accessorKey: 'analyst', header: 'Analyst' },
      { accessorKey: 'ticker', header: 'Ticker' },
      {
        accessorKey: 'action',
        header: 'Action',
        cell: info => (
          <Badge variant={
            info.getValue() === 'buy' || info.getValue() === 'long' || info.getValue() === 'bullish'
              ? 'default'
              : info.getValue() === 'sell' || info.getValue() === 'short' || info.getValue() === 'bearish'
              ? 'destructive'
              : 'secondary'
          }>
            {info.getValue()}
          </Badge>
        ),
      },
      {
        accessorKey: 'confidence',
        header: 'Confidence',
        cell: info => {
          const value = info.getValue();
          let variant: any = 'secondary';
          if (value >= 80) variant = 'default';
          else if (value >= 50) variant = 'outline';
          else variant = 'destructive';
          return (
            <Badge variant={variant}>{value !== undefined ? value + '%' : ''}</Badge>
          );
        },
      },
      {
        accessorKey: 'price',
        header: 'Price',
        cell: info => info.getValue() !== undefined && info.getValue() !== null ? `$${info.getValue()}` : <span className="text-muted-foreground">-</span>,
      },
      ...extraFields.map(field => ({
        accessorKey: field,
        header: field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        cell: (info: any) => {
          const v = info.getValue();
          if (typeof v === 'number') return v;
          if (typeof v === 'string' && v.length > 60) return <span className="whitespace-pre-wrap text-xs text-muted-foreground">{v}</span>;
          if (typeof v === 'object') return <span className="whitespace-pre-wrap text-xs text-muted-foreground">{JSON.stringify(v, null, 2)}</span>;
          return v ?? <span className="text-muted-foreground">-</span>;
        },
      })),
      {
        accessorKey: 'reasoning',
        header: 'Reasoning',
        cell: info => <span className="whitespace-pre-wrap max-w-xs block text-xs text-muted-foreground">{info.getValue()}</span>,
      },
    ],
    [extraFields]
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
    <div className="overflow-x-auto rounded-2xl border border-gray-700 bg-gradient-to-br from-zinc-900 to-zinc-800 shadow-2xl p-4">
      <div className="flex items-center gap-2 mb-4">
        <input
          value={globalFilter ?? ''}
          onChange={e => setGlobalFilter(e.target.value)}
          placeholder="Filter results..."
          className="px-4 py-2 rounded-lg bg-zinc-800 text-white border border-gray-600 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none w-64 shadow"
        />
      </div>
      <Table>
        <TableHeader>
          {table.getHeaderGroups().map(headerGroup => (
            <TableRow key={headerGroup.id} className="sticky top-0 z-20 bg-zinc-900/95 shadow-md rounded-t-xl">
              {headerGroup.headers.map(header => (
                <TableHead
                  key={header.id}
                  className="font-bold uppercase tracking-wide text-xs border-b border-gray-700 bg-zinc-900/95 cursor-pointer select-none whitespace-nowrap px-6 py-4 first:rounded-tl-xl last:rounded-tr-xl"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(header.column.columnDef.header, header.getContext())}
                  {header.column.getIsSorted() === 'asc' ? ' ▲' : header.column.getIsSorted() === 'desc' ? ' ▼' : ''}
                </TableHead>
              ))}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} className="text-center py-8 text-muted-foreground">
                No results found.
              </TableCell>
            </TableRow>
          ) : (
            table.getRowModel().rows.map((row, i) => (
              <TableRow
                key={row.id}
                className={
                  `transition-colors ${i % 2 === 0 ? 'bg-zinc-900/80' : 'bg-zinc-800/80'} hover:bg-indigo-950/80 focus-within:bg-indigo-900/80` +
                  (i === 0 ? ' first:rounded-t-xl' : '') +
                  (i === table.getRowModel().rows.length - 1 ? ' last:rounded-b-xl' : '')
                }
              >
                {row.getVisibleCells().map(cell => (
                  <TableCell key={cell.id} className="px-6 py-4 border-b border-gray-700 align-top">
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
} 