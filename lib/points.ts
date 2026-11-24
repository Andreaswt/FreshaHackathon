import type { Catch } from "./types";

/** 100 points for a mission catch, 50 for a bonus catch. */
export const catchPoints = (c: Catch) => (c.bonus ? 50 : 100);

const isToday = (iso: string) => new Date(iso).toDateString() === new Date().toDateString();

/** Points per player for catches made today. */
export function todaysTotals(catches: Catch[]): Map<string, number> {
  const totals = new Map<string, number>();
  for (const c of catches) {
    if (!c.player || !isToday(c.at)) continue;
    totals.set(c.player, (totals.get(c.player) ?? 0) + catchPoints(c));
  }
  return totals;
}

export function todaysTop(catches: Catch[]): { name: string; points: number } | null {
  const best = [...todaysTotals(catches)].sort((a, b) => b[1] - a[1])[0];
  return best ? { name: best[0], points: best[1] } : null;
}

export type Scope = "today" | "all";
export type Standing = { name: string; points: number; catches: number };

const inScope = (c: Catch, scope: Scope) => !!c.player && (scope === "all" || isToday(c.at));

/** Players ranked by points (then catches, then name) for today or all time. */
export function standings(catches: Catch[], scope: Scope): Standing[] {
  const rows = new Map<string, Standing>();
  for (const c of catches) {
    if (!inScope(c, scope)) continue;
    const r = rows.get(c.player!) ?? { name: c.player!, points: 0, catches: 0 };
    r.points += catchPoints(c);
    r.catches += 1;
    rows.set(c.player!, r);
  }
  return [...rows.values()].sort((a, b) => b.points - a.points || b.catches - a.catches || a.name.localeCompare(b.name));
}

export const catchesInScope = (catches: Catch[], scope: Scope) => catches.filter((c) => inScope(c, scope));

/** The mission catch that took the fewest messages (most recent wins ties). */
export function sneakiest(catches: Catch[], scope: Scope): Catch | null {
  const pool = catchesInScope(catches, scope).filter((c) => c.messages.length);
  const best = pool.filter((c) => !c.bonus).length ? pool.filter((c) => !c.bonus) : pool;
  return [...best].sort((a, b) => a.messages.length - b.messages.length || b.at.localeCompare(a.at))[0] ?? null;
}
