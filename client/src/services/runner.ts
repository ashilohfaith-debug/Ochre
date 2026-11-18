export interface LogEntry {
  type: 'log' | 'info' | 'warn' | 'error' | 'result';
  text: string;
  timestamp: string;
}

export interface ExecutionResult {
  mode: 'console' | 'preview';
  logs: LogEntry[];
  htmlContent?: string;
  durationMs: number;
}

// Languages that are executed on the server (require compiler/runtime)
const SERVER_SIDE_LANGUAGES = new Set(['java', 'c', 'cpp', 'python', 'javascript', 'typescript']);

// Maps file extension → language id
const EXT_TO_LANGUAGE: Record<string, string> = {
  py: 'python',
  js: 'javascript',
  mjs: 'javascript',
  cjs: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  java: 'java',
  c: 'c',
  cpp: 'cpp',
  cc: 'cpp',
  cxx: 'cpp',
  html: 'html',
  htm: 'html',
  css: 'css',
};

export function getLanguageFromExtension(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase() ?? '';
  return EXT_TO_LANGUAGE[ext] ?? 'plaintext';
}

function makeLog(type: LogEntry['type'], text: string): LogEntry {
  return { type, text, timestamp: new Date().toLocaleTimeString() };
}

// ─── CSS live preview ────────────────────────────────────────────────────────
function runCss(code: string, filename: string): ExecutionResult {
  const html = `<!DOCTYPE html>
<html><head>
  <meta charset="UTF-8"/>
  <style>${code}</style>
</head><body>
  <div style="padding:24px;font-family:sans-serif;color:#555;">
    <h2 style="margin:0 0 8px">CSS Live Preview</h2>
    <p style="font-size:13px">Apply this stylesheet to HTML elements to see styles in action.</p>
    <div class="demo-box" style="margin-top:16px;padding:16px;border:1px dashed #ccc;border-radius:6px;">
      <p class="demo-text">Demo text — styles from <strong>${filename}</strong> are active.</p>
      <button class="demo-btn">Demo Button</button>
    </div>
  </div>
</body></html>`;
  return {
    mode: 'preview',
    logs: [makeLog('info', `Rendering CSS preview for ${filename}`)],
    htmlContent: html,
    durationMs: 0
  };
}

// ─── HTML live preview ────────────────────────────────────────────────────────
function runHtml(code: string, filename: string): ExecutionResult {
  return {
    mode: 'preview',
    logs: [makeLog('info', `Rendering live web preview for ${filename}`)],
    htmlContent: code,
    durationMs: 0
  };
}

// ─── JavaScript / TypeScript (client-side sandboxed) ─────────────────────────
function runJsClient(code: string, filename: string): ExecutionResult {
  const start = performance.now();
  const logs: LogEntry[] = [];
  logs.push(makeLog('info', `Executing ${filename} (client sandbox)...`));

  try {
    // Strip basic TS annotations for in-browser execution
    let jsCode = code
      .replace(/:\s*(string|number|boolean|any|void|object|unknown|never|null|undefined)\b\??(\[\])?/g, '')
      .replace(/interface\s+\w+\s*\{[\s\S]*?\}/g, '')
      .replace(/type\s+\w+\s*=[\s\S]*?;/g, '')
      .replace(/<[A-Z][A-Za-z0-9]*>/g, '');

    const customConsole = {
      log: (...args: any[]) => logs.push(makeLog('log', args.map(formatArg).join(' '))),
      info: (...args: any[]) => logs.push(makeLog('info', args.map(formatArg).join(' '))),
      warn: (...args: any[]) => logs.push(makeLog('warn', args.map(formatArg).join(' '))),
      error: (...args: any[]) => logs.push(makeLog('error', args.map(formatArg).join(' '))),
    };

    // eslint-disable-next-line no-new-func
    const fn = new Function('console', jsCode);
    const ret = fn(customConsole);
    if (ret !== undefined) {
      logs.push(makeLog('result', `Return value: ${formatArg(ret)}`));
    }
    const durationMs = Math.round(performance.now() - start);
    logs.push(makeLog('info', `Done in ${durationMs}ms.`));
    return { mode: 'console', logs, durationMs };
  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    logs.push(makeLog('error', `Runtime Error: ${err.message}`));
    return { mode: 'console', logs, durationMs };
  }
}

function formatArg(arg: any): string {
  return typeof arg === 'object' && arg !== null ? JSON.stringify(arg, null, 2) : String(arg);
}

// ─── Server-side execution (Python, Java, C, C++, TS with compiler) ──────────
async function runOnServer(code: string, language: string, filename: string): Promise<ExecutionResult> {
  const start = performance.now();
  const logs: LogEntry[] = [];
  logs.push(makeLog('info', `Sending ${filename} to server for execution...`));

  try {
    const apiBase = window.location.port === '5173'
      ? 'http://localhost:5000'
      : window.location.origin;

    const res = await fetch(`${apiBase}/api/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code, language, filename })
    });

    const data = await res.json();

    if (!res.ok) {
      logs.push(makeLog('error', data.error || 'Server execution failed'));
      return { mode: 'console', logs, durationMs: Math.round(performance.now() - start) };
    }

    if (data.stdout) {
      data.stdout.split('\n').forEach((line: string) => {
        if (line.trim()) logs.push(makeLog('log', line));
      });
    }

    if (data.stderr) {
      data.stderr.split('\n').forEach((line: string) => {
        if (line.trim()) {
          // Distinguish compiler errors from runtime errors
          const isCompilerError = line.match(/error:|warning:|undefined reference/i);
          logs.push(makeLog(isCompilerError ? 'error' : 'warn', line));
        }
      });
    }

    if (data.exitCode === 0 && !data.stdout && !data.stderr) {
      logs.push(makeLog('info', 'Program exited with code 0 (no output).'));
    } else if (data.exitCode !== 0 && data.exitCode !== undefined) {
      logs.push(makeLog('error', `Process exited with code ${data.exitCode}`));
    }

    const durationMs = data.durationMs ?? Math.round(performance.now() - start);
    logs.push(makeLog('info', `Finished in ${durationMs}ms.`));
    return { mode: 'console', logs, durationMs };

  } catch (err: any) {
    const durationMs = Math.round(performance.now() - start);
    // Server unreachable — fall back for JS/TS only
    if (language === 'javascript' || language === 'typescript') {
      logs.push(makeLog('warn', `Server unavailable, running in client sandbox...`));
      const clientResult = runJsClient(code, filename);
      return {
        ...clientResult,
        logs: [...logs, ...clientResult.logs]
      };
    }
    logs.push(makeLog('error', `Cannot reach execution server: ${err.message}`));
    logs.push(makeLog('warn', `Make sure the Ochre server is running (npm run dev in /server).`));
    return { mode: 'console', logs, durationMs };
  }
}

// ─── Main entry point ─────────────────────────────────────────────────────────
export async function runCode(code: string, filename: string): Promise<ExecutionResult> {
  const language = getLanguageFromExtension(filename);

  if (language === 'html' || language === 'htm') {
    return runHtml(code, filename);
  }

  if (language === 'css') {
    return runCss(code, filename);
  }

  // JavaScript and TypeScript: prefer client sandbox for speed, fall back to server if complex
  if (language === 'javascript') {
    return runJsClient(code, filename);
  }

  // For languages that need a real compiler/interpreter, use the server
  if (SERVER_SIDE_LANGUAGES.has(language)) {
    return runOnServer(code, language, filename);
  }

  // Unknown extension — try client sandbox
  return {
    mode: 'console',
    logs: [makeLog('warn', `No executor found for file: ${filename}. Language: ${language}.`)],
    durationMs: 0
  };
}
