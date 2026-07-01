'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

export interface TrendPoint {
  label: string;
  passRate: number;
}

/** Línea de tendencia del % de éxito a lo largo de las últimas corridas. */
export function TrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: -16 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
          <XAxis dataKey="label" stroke="#64748b" fontSize={12} />
          <YAxis domain={[0, 100]} stroke="#64748b" fontSize={12} unit="%" />
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
            formatter={(v: number) => [`${v}%`, '% éxito']}
          />
          <Line
            type="monotone"
            dataKey="passRate"
            stroke="#38bdf8"
            strokeWidth={2}
            dot={{ r: 4, fill: '#38bdf8' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
