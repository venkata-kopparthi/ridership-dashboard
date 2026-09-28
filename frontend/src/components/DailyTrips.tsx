import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint, Rider } from "../types";
import { fmt, shortDay } from "../format";

export function DailyTrips({ data, rider }: { data: DailyPoint[]; rider: Rider }) {
  return (
    <ResponsiveContainer width="100%" height={260}>
      <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -8 }}>
        <CartesianGrid vertical={false} stroke="var(--rule)" />
        <XAxis dataKey="day" tickFormatter={shortDay} minTickGap={32} tickLine={false} axisLine={false} />
        <YAxis tickFormatter={fmt} tickLine={false} axisLine={false} width={48} />
        <Tooltip labelFormatter={(d) => shortDay(String(d))} formatter={(v) => fmt(Number(v))} />
        {rider !== "casual" && (
          <Area
            type="monotone"
            dataKey="member"
            name="Members"
            stackId="1"
            stroke="var(--member)"
            fill="var(--member)"
            fillOpacity={0.85}
          />
        )}
        {rider !== "member" && (
          <Area
            type="monotone"
            dataKey="casual"
            name="Casual"
            stackId="1"
            stroke="var(--casual-line)"
            fill="var(--casual)"
            fillOpacity={0.9}
          />
        )}
      </AreaChart>
    </ResponsiveContainer>
  );
}
