export interface Token {
  type: 'keyword' | 'identifier' | 'string' | 'number' | 'operator' | 'punctuation' | 'comment' | 'unknown';
  value: string;
  line: number;
  column: number;
}

export interface ScanIssue {
  id: string;
  line: number;
  column: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  ruleId: string;
}

export interface ScanMetrics {
  loc: number;
  totalTokens: number;
  commentLines: number;
  complexityEstimate: number;
}

export interface ScanResult {
  tokens: Token[];
  issues: ScanIssue[];
  metrics: ScanMetrics;
}

export class Scanner {
  private source: string;

  constructor(source: string) {
    this.source = source || '';
  }

  public scan(): ScanResult {
    const lines = this.source.split('\n');
    const tokens: Token[] = [];
    const issues: ScanIssue[] = [];

    let commentLines = 0;
    let complexityEstimate = 1;

    // Standard JavaScript/TypeScript keywords
    const keywords = new Set([
      'const', 'let', 'var', 'function', 'return', 'if', 'else',
      'for', 'while', 'import', 'export', 'default', 'class', 'extends',
      'try', 'catch', 'throw', 'async', 'await', 'switch', 'case'
    ]);

    // Simple analysis pass over each line
    lines.forEach((lineText, lineIdx) => {
      const lineNum = lineIdx + 1;
      const trimmed = lineText.trim();

      if (!trimmed) return;

      // Track comments
      if (trimmed.startsWith('//') || trimmed.startsWith('/*') || trimmed.startsWith('*')) {
        commentLines++;
        tokens.push({
          type: 'comment',
          value: trimmed,
          line: lineNum,
          column: lineText.indexOf(trimmed) + 1
        });
        return;
      }

      // Basic complexity estimator (decision keywords)
      if (/\b(if|else|for|while|case|catch|\?\?|\?)\b/.test(trimmed)) {
        complexityEstimate++;
      }

      // Simple linting rules
      if (trimmed.includes('console.log')) {
        issues.push({
          id: `console-log-${lineNum}`,
          line: lineNum,
          column: lineText.indexOf('console.log') + 1,
          message: 'Avoid leaving console.log statements in production code.',
          severity: 'warning',
          ruleId: 'no-console'
        });
      }

      if (trimmed.includes('debugger')) {
        issues.push({
          id: `debugger-${lineNum}`,
          line: lineNum,
          column: lineText.indexOf('debugger') + 1,
          message: 'Unexpected debugger statement.',
          severity: 'error',
          ruleId: 'no-debugger'
        });
      }

      if (/\bvar\b/.test(trimmed)) {
        issues.push({
          id: `no-var-${lineNum}`,
          line: lineNum,
          column: lineText.indexOf('var') + 1,
          message: 'Unexpected var, use let or const instead.',
          severity: 'warning',
          ruleId: 'no-var'
        });
      }

      // Simple tokenizer pass on space-delimited words
      const words = trimmed.split(/\s+/);
      words.forEach((word) => {
        if (keywords.has(word)) {
          tokens.push({
            type: 'keyword',
            value: word,
            line: lineNum,
            column: lineText.indexOf(word) + 1
          });
        } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(word)) {
          tokens.push({
            type: 'identifier',
            value: word,
            line: lineNum,
            column: lineText.indexOf(word) + 1
          });
        } else if (!isNaN(Number(word))) {
          tokens.push({
            type: 'number',
            value: word,
            line: lineNum,
            column: lineText.indexOf(word) + 1
          });
        }
      });
    });

    return {
      tokens,
      issues,
      metrics: {
        loc: lines.length,
        totalTokens: tokens.length,
        commentLines,
        complexityEstimate
      }
    };
  }
}