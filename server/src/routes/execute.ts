import { Router, Request, Response } from 'express';
import { exec, spawn } from 'child_process';
import fs from 'fs';
import os from 'os';
import path from 'path';
import crypto from 'crypto';

const router = Router();

interface ExecuteRequest {
  code: string;
  language: string;
  filename?: string;
}

interface ExecuteResponse {
  stdout: string;
  stderr: string;
  exitCode: number;
  durationMs: number;
  error?: string;
}

// Unique temp directory per execution to isolate runs
function makeTempDir(): string {
  const id = crypto.randomBytes(8).toString('hex');
  const dir = path.join(os.tmpdir(), `ochre_exec_${id}`);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function cleanup(dir: string) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (_) {}
}

// Runs a shell command with a timeout and returns stdout/stderr/exitCode
function runCommand(
  cmd: string,
  args: string[],
  cwd: string,
  timeoutMs = 10000
): Promise<{ stdout: string; stderr: string; exitCode: number }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, shell: false });
    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (d: Buffer) => { stdout += d.toString(); });
    child.stderr?.on('data', (d: Buffer) => { stderr += d.toString(); });

    const timer = setTimeout(() => {
      child.kill('SIGKILL');
      resolve({ stdout, stderr: stderr + '\n[Execution timed out after 10 seconds]', exitCode: 124 });
    }, timeoutMs);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, exitCode: code ?? 1 });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      resolve({ stdout, stderr: err.message, exitCode: 1 });
    });
  });
}

// POST /api/execute
router.post('/', async (req: Request, res: Response) => {
  const { code, language, filename } = req.body as ExecuteRequest;

  if (!code || !language) {
    return res.status(400).json({ error: 'code and language are required' });
  }

  const start = Date.now();
  const tmpDir = makeTempDir();

  try {
    let result: { stdout: string; stderr: string; exitCode: number };

    // ─── Python ───────────────────────────────────────────────────
    if (language === 'python') {
      const file = path.join(tmpDir, 'main.py');
      fs.writeFileSync(file, code, 'utf-8');
      result = await runCommand('python3', [file], tmpDir);
      if (result.exitCode !== 0 && result.stderr.includes("can't open file")) {
        // fallback to python if python3 not available
        result = await runCommand('python', [file], tmpDir);
      }

    // ─── JavaScript / TypeScript (Node) ───────────────────────────
    } else if (language === 'javascript' || language === 'typescript') {
      const ext = language === 'typescript' ? 'ts' : 'js';
      const file = path.join(tmpDir, `main.${ext}`);
      fs.writeFileSync(file, code, 'utf-8');

      if (language === 'typescript') {
        // Compile with tsc then run
        const tsconfig = {
          compilerOptions: { target: 'ES2020', module: 'commonjs', strict: false, outDir: './out' }
        };
        fs.writeFileSync(path.join(tmpDir, 'tsconfig.json'), JSON.stringify(tsconfig), 'utf-8');
        const compileResult = await runCommand('npx', ['tsc', '--project', 'tsconfig.json'], tmpDir);
        if (compileResult.exitCode !== 0) {
          result = compileResult;
        } else {
          result = await runCommand('node', [path.join(tmpDir, 'out', 'main.js')], tmpDir);
        }
      } else {
        result = await runCommand('node', [file], tmpDir);
      }

    // ─── Java ─────────────────────────────────────────────────────
    } else if (language === 'java') {
      // Extract public class name from code or default to Main
      const classMatch = code.match(/public\s+class\s+(\w+)/);
      const className = classMatch ? classMatch[1] : 'Main';
      const file = path.join(tmpDir, `${className}.java`);
      fs.writeFileSync(file, code, 'utf-8');

      const compileResult = await runCommand('javac', [file], tmpDir);
      if (compileResult.exitCode !== 0) {
        result = compileResult;
      } else {
        result = await runCommand('java', ['-cp', tmpDir, className], tmpDir);
      }

    // ─── C ────────────────────────────────────────────────────────
    } else if (language === 'c') {
      const file = path.join(tmpDir, 'main.c');
      const outFile = path.join(tmpDir, 'main_out');
      fs.writeFileSync(file, code, 'utf-8');

      const compileResult = await runCommand('gcc', [file, '-o', outFile, '-lm'], tmpDir);
      if (compileResult.exitCode !== 0) {
        result = compileResult;
      } else {
        result = await runCommand(outFile, [], tmpDir);
      }

    // ─── C++ ──────────────────────────────────────────────────────
    } else if (language === 'cpp') {
      const file = path.join(tmpDir, 'main.cpp');
      const outFile = path.join(tmpDir, 'main_out');
      fs.writeFileSync(file, code, 'utf-8');

      const compileResult = await runCommand('g++', [file, '-o', outFile, '-std=c++17', '-lm'], tmpDir);
      if (compileResult.exitCode !== 0) {
        result = compileResult;
      } else {
        result = await runCommand(outFile, [], tmpDir);
      }

    // ─── Unsupported (client-side handled) ───────────────────────
    } else {
      cleanup(tmpDir);
      return res.json({
        stdout: '',
        stderr: `Server-side execution is not supported for "${language}". Use client-side execution.`,
        exitCode: 0,
        durationMs: 0
      } as ExecuteResponse);
    }

    cleanup(tmpDir);
    return res.json({
      stdout: result.stdout,
      stderr: result.stderr,
      exitCode: result.exitCode,
      durationMs: Date.now() - start
    } as ExecuteResponse);

  } catch (err: any) {
    cleanup(tmpDir);
    return res.status(500).json({
      stdout: '',
      stderr: err.message,
      exitCode: 1,
      durationMs: Date.now() - start,
      error: 'Internal execution error'
    } as ExecuteResponse);
  }
});

export default router;
