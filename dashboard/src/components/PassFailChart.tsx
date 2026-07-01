'use client';

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

interface Props {
  passed: number;
  failed: number;
  skipped: number;
  flaky: number;
}

const COLORS = {
  Pasados: '#22c55e',
  Fallidos: '#ef4444',
  Flaky: '#f59e0b',
  Skipped: '#9ca3af',
};

/** Donut de distribución de resultados de la última corrida. */
export function PassFailChart({ passed, failed, skipped, flaky }: Props) {
  const data = [
    { name: 'Pasados', value: passed },
    { name: 'Fallidos', value: failed },
    { name: 'Flaky', value: flaky },
    { name: 'Skipped', value: skipped },
  ].filter((d) => d.value > 0);

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
          >
            {data.map((entry) => (
              <Cell key={entry.name} fill={COLORS[entry.name as keyof typeof COLORS]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: '#0f172a',
              border: '1px solid #1e293b',
              borderRadius: 8,
              color: '#e2e8f0',
            }}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
