// eslint-disable-next-line @typescript-eslint/no-explicit-any
import React from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface Column<T = any> {
  key:     string;
  label:   string;
  render?: (row: T, index?: number) => React.ReactNode;
  align?:  'left' | 'center' | 'right';
  width?:  string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
interface TableProps<T = any> {
  columns:      Column<T>[];
  data:         T[];
  loading?:     boolean;
  total?:       number;
  page?:        number;
  limit?:       number;
  onPageChange?: (page: number) => void;
  onRowClick?:  (row: T) => void;
  emptyText?:   string;
  keyField?:    string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function Table<T = any>({
  columns, data, loading, total = 0, page = 1, limit = 20,
  onPageChange, onRowClick, emptyText = 'Sem registos', keyField = 'id',
}: TableProps<T>) {
  const totalPages = Math.ceil(total / limit);

  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`px-4 py-3 text-gray-500 border-b border-gray-100 text-${col.align ?? 'left'}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <Loader2 className="animate-spin mx-auto text-indigo-500" size={32} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="py-12 text-center text-gray-400 text-sm">
                  {emptyText}
                </td>
              </tr>
            ) : (
              data.map((row, i) => (
                <tr
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  key={String((row as any)[keyField] ?? i)}
                  className={`border-b border-gray-50 transition
                    ${onRowClick ? 'cursor-pointer hover:bg-indigo-50/50' : 'hover:bg-gray-50/70'}`}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 text-sm text-gray-700 text-${col.align ?? 'left'}`}
                    >
                      {col.render ? col.render(row) : String(row[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginação */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <span className="text-xs text-gray-500">
            {total} registos · página {page} de {totalPages}
          </span>
          <div className="flex gap-1">
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center
                hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft size={14} />
            </button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
              return (
                <button
                  key={p}
                  onClick={() => onPageChange?.(p)}
                  className={`w-8 h-8 rounded-lg border text-xs font-medium transition
                    ${p === page
                      ? 'bg-grad-brand text-white border-transparent'
                      : 'border-gray-200 hover:bg-indigo-50 hover:border-indigo-300'}`}
                >
                  {p}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center
                hover:bg-indigo-50 hover:border-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
