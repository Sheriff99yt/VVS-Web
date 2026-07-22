/**
 * Fast, lightweight fuzzy match utility for settings search.
 * Scores matches based on word boundaries, consecutive characters, and substring position.
 */
export interface FuzzyMatchResult {
  score: number;
}

export function fuzzyMatch(query: string, target: string): FuzzyMatchResult | null {
  const q = query.trim().toLowerCase();
  const t = target.toLowerCase();

  if (!q) return { score: 1 };
  if (t === q) return { score: 100 };
  if (t.includes(q)) return { score: 80 + (q.length / t.length) * 10 };

  // Word boundary / multi-word matching (e.g., "node dim" -> "Dim unsupported nodes")
  const words = q.split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    const allMatched = words.every((word) => t.includes(word));
    if (allMatched) return { score: 70 };
  }

  // Subsequence matching
  let qIdx = 0;
  let score = 0;
  let consecutive = 0;

  for (let tIdx = 0; tIdx < t.length && qIdx < q.length; tIdx++) {
    if (t[tIdx] === q[qIdx]) {
      qIdx++;
      consecutive++;
      score += 10 + consecutive * 5;
      // Bonus for start of word
      if (tIdx === 0 || t[tIdx - 1] === ' ' || t[tIdx - 1] === '-' || t[tIdx - 1] === '_') {
        score += 15;
      }
    } else {
      consecutive = 0;
    }
  }

  if (qIdx === q.length) {
    return { score };
  }

  return null;
}

/** Check if any target string fuzzy matches the query */
export function fuzzyMatchAny(query: string, targets: (string | undefined)[]): boolean {
  if (!query.trim()) return true;
  return targets.some((t) => (t ? fuzzyMatch(query, t) !== null : false));
}
