/*
 * Forward rule engine for the expert system (lesson 2).
 * Each rule: IF the text contains any of these words THEN this outcome. Rules are checked top to
 * bottom; every rule that matches is reported, and the first one (highest priority) decides.
 */

export interface Rule<O extends string = string> {
  dept: O;
  words: string[];
}

export interface Firing<O extends string = string> {
  ruleIndex: number;
  dept: O;
  /** The keyword that matched, as the rule wrote it. */
  word: string;
}

export interface RuleResult<O extends string = string> {
  /** The decision, or null when no rule matched. */
  dept: O | null;
  fired: Firing<O>[];
  /** True when the matching rules disagree, so only their order decided. */
  conflict: boolean;
}

export function applyRules<O extends string>(rules: Rule<O>[], text: string): RuleResult<O> {
  const low = text.toLowerCase();
  const fired: Firing<O>[] = [];
  rules.forEach((rule, i) => {
    for (const raw of rule.words) {
      const w = raw.trim().toLowerCase();
      if (w && low.includes(w)) {
        fired.push({ ruleIndex: i, dept: rule.dept, word: raw.trim() });
        break;
      }
    }
  });
  return {
    dept: fired.length ? fired[0].dept : null,
    fired,
    conflict: new Set(fired.map((f) => f.dept)).size > 1,
  };
}
