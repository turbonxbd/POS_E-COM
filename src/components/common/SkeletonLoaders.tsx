import React from 'react';

/**
 * Zero-CLS Skeleton Loaders for Data Tables, Dashboard Metric Cards, and Storefront Grids.
 */

export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="w-full bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs animate-pulse select-none">
      <div className="bg-slate-100 p-3 border-b border-slate-200 flex gap-4">
        {Array.from({ length: columns }).map((_, idx) => (
          <div key={idx} className="h-4 bg-slate-200 rounded flex-1" />
        ))}
      </div>
      <div className="divide-y divide-slate-100">
        {Array.from({ length: rows }).map((_, rIdx) => (
          <div key={rIdx} className="p-3.5 flex gap-4">
            {Array.from({ length: columns }).map((_, cIdx) => (
              <div key={cIdx} className="h-3.5 bg-slate-100 rounded flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 4 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 select-none">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="p-4 bg-white border border-slate-200 rounded-xl shadow-xs animate-pulse space-y-2"
        >
          <div className="h-3 bg-slate-200 rounded w-2/3" />
          <div className="h-6 bg-slate-300 rounded w-1/2" />
          <div className="h-2.5 bg-slate-100 rounded w-full" />
        </div>
      ))}
    </div>
  );
};

export const ProductGridSkeleton: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 select-none">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs animate-pulse space-y-3 p-3"
        >
          <div className="w-full h-40 bg-slate-200 rounded-lg" />
          <div className="h-4 bg-slate-200 rounded w-3/4" />
          <div className="h-3 bg-slate-100 rounded w-1/2" />
          <div className="flex justify-between items-center pt-2">
            <div className="h-5 bg-slate-300 rounded w-1/3" />
            <div className="h-8 bg-blue-100 rounded w-1/3" />
          </div>
        </div>
      ))}
    </div>
  );
};
