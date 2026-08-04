"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const currency = new Intl.NumberFormat("es-PE", { style: "currency", currency: "PEN" });

export function FinanceChart({
  ingresos,
  extras,
  gastos,
  balance,
}: {
  ingresos: number;
  extras: number;
  gastos: number;
  balance: number;
}) {
  const data = [
    { name: "Ingreso", monto: ingresos },
    { name: "Extra", monto: extras },
    { name: "Gasto", monto: gastos },
    { name: "Balance", monto: balance },
  ];

  return (
    <div className="h-48 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
          <XAxis dataKey="name" stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted)" fontSize={12} tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              color: "var(--foreground)",
            }}
            formatter={(value) => [currency.format(Number(value)), "Monto"]}
          />
          <Bar dataKey="monto" fill="var(--accent)" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
