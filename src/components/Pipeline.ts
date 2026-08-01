import { Scanner, ScanIssue, ScanResult, Token } from './Scanner';

export interface VirtualFile {
  id?: string;
  name: string;
  language: string;
  content: string;
}

export interface PipelineMetrics {
  maintainabilityIndex: number; // 0 - 100
  totalLines: number;
  totalTokens: number;
  totalIssues: number;
  complexityScore: number;
  commentRatio: number;
}

export interface PipelineStepLog {
  step: 'Scanning' | 'Linting' | 'Metric Analysis' | 'Bundling';
  status: 'passed' | 'warning' | 'failed';
  durationMs: number;
  details: string;
}

export interface PipelineOutput {
  success: boolean;
  bundleUrl: string | null;
  htmlPayload: string;
  issues: ScanIssue[];
  metrics: PipelineMetrics;
  logs: PipelineStepLog[];
  tokens: Token[];
}

export class Pipeline {
  private files: VirtualFile[];

  constructor(files: VirtualFile[]) {
    this.files = files;
  }

  /**
   * Executes the full pipeline: Scan -> Lint -> Compute Metrics -> Bundle Payload.
   */
  public execute(): PipelineOutput {
    const logs: PipelineStepLog[] = [];
    const allIssues: ScanIssue[] = [];
    let allTokens: Token[] = [];
    
    let totalLines = 0;
    let totalTokensCount = 0;
    let totalCommentLines = 0;
    let maxComplexity = 1;

    const startTime = performance.now();

    // 1. Lexical Analysis & Linting Step
    const jsFiles = this.files.filter(f => f.name.endsWith('.js') || f.name.endsWith('.ts') || f.language === 'javascript');
    
    jsFiles.forEach(file => {
      const scanStart = performance.now();
      const scanner = new Scanner(file.content);
      const scanResult: ScanResult = scanner.scan();

      allTokens = allTokens.concat(scanResult.tokens);
      allIssues.push(...scanResult.issues);

      totalLines += scanResult.metrics.loc;
      totalTokensCount += scanResult.metrics.totalTokens;
      totalCommentLines += scanResult.metrics.commentLines;
      maxComplexity = Math.max(maxComplexity, scanResult.metrics.complexityEstimate);

      logs.push({
        step: 'Scanning',
        status: scanResult.issues.some(i => i.severity === 'error') ? 'failed' : 'passed',
        durationMs: Math.round((performance.now() - scanStart) * 100) / 100,
        details: `Scanned ${file.name}: ${scanResult.tokens.length} tokens, ${scanResult.issues.length} issues detected.`
      });
    });

    // 2. Compute Health Index & Metrics
    const metricsStart = performance.now();
    const commentRatio = totalLines > 0 ? (totalCommentLines / totalLines) * 100 : 0;
    const maintainabilityIndex = this.calculateMaintainability(totalLines, maxComplexity, allIssues);

    const metrics: PipelineMetrics = {
      maintainabilityIndex,
      totalLines,
      totalTokens: totalTokensCount,
      totalIssues: allIssues.length,
      complexityScore: maxComplexity,
      commentRatio: Math.round(commentRatio * 10) / 10
    };

    logs.push({
      step: 'Metric Analysis',
      status: maintainabilityIndex > 70 ? 'passed' : 'warning',
      durationMs: Math.round((performance.now() - metricsStart) * 100) / 100,
      details: `Health Index: ${maintainabilityIndex}/100 | Complexity: ${maxComplexity}`
    });

    // 3. In-Memory Bundling Step
    const bundleStart = performance.now();
    const htmlPayload = this.assembleBundle();
    let bundleUrl: string | null = null;

    try {
      const blob = new Blob([htmlPayload], { type: 'text/html;charset=utf-8' });
      bundleUrl = URL.createObjectURL(blob);

      logs.push({
        step: 'Bundling',
        status: 'passed',
        durationMs: Math.round((performance.now() - bundleStart) * 100) / 100,
        details: `Payload compiled successfully (${new Blob([htmlPayload]).size} bytes).`
      });
    } catch (err) {
      logs.push({
        step: 'Bundling',
        status: 'failed',
        durationMs: Math.round((performance.now() - bundleStart) * 100) / 100,
        details: `Bundling error: ${(err as Error).message}`
      });
    }

    const hasErrors = allIssues.some(i => i.severity === 'error');

    return {
      success: !hasErrors,
      bundleUrl,
      htmlPayload,
      issues: allIssues,
      metrics,
      logs,
      tokens: allTokens
    };
  }

  /**
   * Calculates a maintainability index score from 0 (poor) to 100 (excellent).
   */
  private calculateMaintainability(loc: number, complexity: number, issues: ScanIssue[]): number {
    if (loc === 0) return 100;

    const penaltyFromLoc = Math.min(25, loc * 0.1);
    const penaltyFromComplexity = Math.min(30, (complexity - 1) * 5);
    const penaltyFromIssues = issues.reduce((acc, issue) => {
      return acc + (issue.severity === 'error' ? 15 : issue.severity === 'warning' ? 5 : 1);
    }, 0);

    const rawScore = 100 - (penaltyFromLoc + penaltyFromComplexity + penaltyFromIssues);
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }

  /**
   * Assembles the virtual files into a single standalone HTML execution document with live console hooks.
   */
  private assembleBundle(): string {
    const htmlFile = this.files.find(f => f.name.endsWith('.html'))?.content || '<div>No HTML entry point provided.</div>';
    const jsContent = this.files
      .filter(f => f.name.endsWith('.js') || f.language === 'javascript')
      .map(f => f.content)
      .join('\n\n');

    const consoleHook = `
    <script>
      (function() {
        const sendLog = (type, args) => {
          try {
            const formatted = Array.from(args).map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
            window.parent.postMessage({ type: 'LOG', level: type, msg: formatted }, '*');
          } catch(e) {}
        };
        const _log = console.log, _warn = console.warn, _error = console.error;
        console.log = function(...a) { sendLog('info', a); _log.apply(console, a); };
        console.warn = function(...a) { sendLog('warn', a); _warn.apply(console, a); };
        console.error = function(...a) { sendLog('error', a); _error.apply(console, a); };

        window.onerror = function(msg, url, line) {
          sendLog('error', ['Uncaught Error: ' + msg + ' (Line ' + line + ')']);
          return false;
        };
      })();
    </script>`;

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  ${consoleHook}
</head>
<body>
  ${htmlFile}
  <script>
    try {
      ${jsContent}
    } catch(err) {
      console.error(err.message);
    }
  </script>
</body>
</html>`;
  }
}