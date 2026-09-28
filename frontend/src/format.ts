const number = new Intl.NumberFormat("en-US");

export const fmt = (n: number) => number.format(n);
export const pct = (n: number) => `${Math.round(n * 100)}%`;

export function shortDay(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function hourLabel(h: number) {
  if (h === 0) return "12a";
  if (h === 12) return "12p";
  return h < 12 ? `${h}a` : `${h - 12}p`;
}
