export type ThreeWayMergeResult =
  | { ok: true; text: string }
  | { ok: false; reason: 'conflict' };

function normalizeNewlines(text: string): string {
  return text.replace(/\r\n/g, '\n');
}

function splitLines(text: string): { lines: string[]; endedWithNl: boolean } {
  const norm = normalizeNewlines(text);
  const endedWithNl = norm.endsWith('\n');
  const body = endedWithNl ? norm.slice(0, -1) : norm;
  if (body.length === 0) return { lines: [], endedWithNl };
  return { lines: body.split('\n'), endedWithNl };
}

function joinLines(lines: string[], endedWithNl: boolean): string {
  if (lines.length === 0) return endedWithNl ? '\n' : '';
  return lines.join('\n') + (endedWithNl ? '\n' : '');
}

interface Hunk {
  baseStart: number;
  baseEnd: number;
  lines: string[];
}

function lcsTable(a: string[], b: string[]): number[][] {
  const n = a.length;
  const m = b.length;
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array<number>(m + 1).fill(0));
  for (let i = 1; i <= n; i++) {
    const ai = a[i - 1];
    const row = dp[i];
    const prev = dp[i - 1];
    for (let j = 1; j <= m; j++) {
      row[j] = ai === b[j - 1] ? prev[j - 1] + 1 : Math.max(prev[j], row[j - 1]);
    }
  }
  return dp;
}

function hunksFrom(base: string[], side: string[]): Hunk[] {
  const dp = lcsTable(base, side);
  const hunks: Hunk[] = [];
  let i = base.length;
  let j = side.length;
  const equals: { baseIdx: number; sideIdx: number }[] = [];
  while (i > 0 && j > 0) {
    if (base[i - 1] === side[j - 1] && dp[i][j] === dp[i - 1][j - 1] + 1) {
      equals.push({ baseIdx: i - 1, sideIdx: j - 1 });
      i -= 1;
      j -= 1;
    } else if (dp[i - 1][j] >= dp[i][j - 1]) {
      i -= 1;
    } else {
      j -= 1;
    }
  }
  equals.reverse();

  let basePos = 0;
  let sidePos = 0;
  for (const eq of equals) {
    if (basePos < eq.baseIdx || sidePos < eq.sideIdx) {
      hunks.push({
        baseStart: basePos,
        baseEnd: eq.baseIdx,
        lines: side.slice(sidePos, eq.sideIdx),
      });
    }
    basePos = eq.baseIdx + 1;
    sidePos = eq.sideIdx + 1;
  }
  if (basePos < base.length || sidePos < side.length) {
    hunks.push({
      baseStart: basePos,
      baseEnd: base.length,
      lines: side.slice(sidePos),
    });
  }
  return hunks;
}

function sameLines(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

function takeReplacement(
  hunks: Hunk[],
  from: number,
  to: number,
  base: string[],
  start: number,
  end: number
): string[] {
  const out: string[] = [];
  let cursor = start;
  for (let k = from; k < to; k++) {
    const h = hunks[k];
    if (!h) continue;
    if (h.baseStart > cursor) out.push(...base.slice(cursor, h.baseStart));
    out.push(...h.lines);
    cursor = h.baseEnd;
  }
  if (cursor < end) out.push(...base.slice(cursor, end));
  return out;
}

function mergeHunks(base: string[], ours: Hunk[], theirs: Hunk[]): string[] | null {
  const result: string[] = [];
  let pos = 0;
  let i = 0;
  let j = 0;
  while (i < ours.length || j < theirs.length) {
    const a = ours[i];
    const b = theirs[j];
    if (a && (!b || a.baseEnd <= b.baseStart)) {
      result.push(...base.slice(pos, a.baseStart), ...a.lines);
      pos = a.baseEnd;
      i += 1;
      continue;
    }
    if (b && (!a || b.baseEnd <= a.baseStart)) {
      result.push(...base.slice(pos, b.baseStart), ...b.lines);
      pos = b.baseEnd;
      j += 1;
      continue;
    }
    if (!a || !b) break;
    let start = Math.min(a.baseStart, b.baseStart);
    let end = Math.max(a.baseEnd, b.baseEnd);
    let oi = i;
    let tj = j;
    let grown = true;
    while (grown) {
      grown = false;
      while (oi < ours.length && ours[oi] && ours[oi].baseStart < end) {
        end = Math.max(end, ours[oi].baseEnd);
        start = Math.min(start, ours[oi].baseStart);
        oi += 1;
        grown = true;
      }
      while (tj < theirs.length && theirs[tj] && theirs[tj].baseStart < end) {
        end = Math.max(end, theirs[tj].baseEnd);
        start = Math.min(start, theirs[tj].baseStart);
        tj += 1;
        grown = true;
      }
    }
    const ourSlice = takeReplacement(ours, i, oi, base, start, end);
    const theirSlice = takeReplacement(theirs, j, tj, base, start, end);
    if (!sameLines(ourSlice, theirSlice)) return null;
    result.push(...base.slice(pos, start), ...ourSlice);
    pos = end;
    i = oi;
    j = tj;
  }
  result.push(...base.slice(pos));
  return result;
}

/**
 * Line-based three-way merge (base / ours / theirs).
 * Clean hunks combine; overlapping different hunks are a conflict (no markers).
 */
export function threeWayMerge(base: string, ours: string, theirs: string): ThreeWayMergeResult {
  const b = splitLines(base);
  const o = splitLines(ours);
  const t = splitLines(theirs);
  if (sameLines(o.lines, t.lines) && o.endedWithNl === t.endedWithNl) {
    return { ok: true, text: normalizeNewlines(ours) };
  }
  if (sameLines(o.lines, b.lines) && o.endedWithNl === b.endedWithNl) {
    return { ok: true, text: normalizeNewlines(theirs) };
  }
  if (sameLines(t.lines, b.lines) && t.endedWithNl === b.endedWithNl) {
    return { ok: true, text: normalizeNewlines(ours) };
  }
  const merged = mergeHunks(b.lines, hunksFrom(b.lines, o.lines), hunksFrom(b.lines, t.lines));
  if (merged === null) return { ok: false, reason: 'conflict' };
  const endedWithNl = o.endedWithNl || t.endedWithNl || b.endedWithNl;
  return { ok: true, text: joinLines(merged, endedWithNl) };
}
