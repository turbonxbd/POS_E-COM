import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { SalesChartPoint, TimeframeType } from '../../types/merchant-dashboard.types';

export interface SalesChartProps {
  data: SalesChartPoint[];
  selectedTimeframe: TimeframeType;
  onTimeframeChange: (tf: TimeframeType) => void;
  isLoading?: boolean;
}

export const SalesChart: React.FC<SalesChartProps> = ({
  data,
  selectedTimeframe,
  onTimeframeChange,
  isLoading,
}) => {
  const timeframes: { label: string; value: TimeframeType }[] = [
    { label: 'Today', value: 'TODAY' },
    { label: '7 Days', value: 'THIS_WEEK' },
    { label: 'This Month', value: 'THIS_MONTH' },
    { label: 'This Year', value: 'THIS_YEAR' },
  ];

  const maxSales = Math.max(...data.map((d) => d.totalSales), 1000);

  return (
    <Card className="ag-sales-chart-card">
      <CardHeader style={{ paddingBottom: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <CardTitle style={{ fontSize: '1.25rem' }}>Sales & Revenue Trends</CardTitle>
            <span style={{ fontSize: '0.8125rem', color: 'var(--muted-foreground)' }}>
              Channel breakdown (Online Web Storefront vs. POS Counter)
            </span>
          </div>

          {/* Timeframe Toggles */}
          <div style={{ display: 'flex', gap: '0.375rem', backgroundColor: 'var(--muted)', padding: '0.25rem', borderRadius: 'var(--border-radius)' }}>
            {timeframes.map((tf) => (
              <button
                key={tf.value}
                type="button"
                className={`ag-btn ag-btn-sm ${selectedTimeframe === tf.value ? 'ag-btn-primary' : 'ag-btn-ghost'}`}
                onClick={() => onTimeframeChange(tf.value)}
                style={{ fontSize: '0.75rem', padding: '0.25rem 0.625rem' }}
              >
                {tf.label}
              </button>
            ))}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Split Legend */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1.5rem', fontSize: '0.8125rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: 'var(--primary)' }} />
            <span>Online Web Sales</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ width: '0.75rem', height: '0.75rem', borderRadius: '50%', backgroundColor: '#10b981' }} />
            <span>POS Counter Sales</span>
          </div>
        </div>

        {/* Visual Bar Graph Visualization */}
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', height: '14rem', gap: '1rem', paddingTop: '1rem', borderBottom: '1px solid var(--border)' }}>
          {isLoading ? (
            <div style={{ width: '100%', textAlign: 'center', color: 'var(--muted-foreground)' }}>Loading chart data...</div>
          ) : (
            data.map((pt, idx) => {
              const onlineHeight = Math.round((pt.onlineSales / maxSales) * 100);
              const posHeight = Math.round((pt.posSales / maxSales) * 100);

              return (
                <div key={idx} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end', gap: '0.5rem' }}>
                  <div style={{ width: '100%', maxWidth: '2rem', display: 'flex', flexDirection: 'column', gap: '2px', alignItems: 'stretch' }}>
                    {/* Online Bar */}
                    <div
                      title={`Online: ৳${pt.onlineSales.toLocaleString()}`}
                      style={{
                        height: `${onlineHeight}%`,
                        backgroundColor: 'var(--primary)',
                        borderRadius: '4px 4px 0 0',
                        minHeight: pt.onlineSales > 0 ? '4px' : '0',
                      }}
                    />
                    {/* POS Bar */}
                    <div
                      title={`POS: ৳${pt.posSales.toLocaleString()}`}
                      style={{
                        height: `${posHeight}%`,
                        backgroundColor: '#10b981',
                        borderRadius: '0 0 4px 4px',
                        minHeight: pt.posSales > 0 ? '4px' : '0',
                      }}
                    />
                  </div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>
                    {pt.timeLabel}
                  </span>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
};
