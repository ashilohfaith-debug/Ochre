export function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py':
      return 'python';
    case 'c':
      return 'c';
    case 'cpp':
    case 'cc':
    case 'cxx':
    case 'h':
    case 'hpp':
      return 'cpp';
    case 'java':
      return 'java';
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return 'javascript';
    case 'html':
    case 'htm':
      return 'html';
    case 'css':
      return 'css';
    case 'ts':
      return 'typescript';
    case 'tsx':
      return 'typescript';
    case 'json':
      return 'json';
    case 'md':
      return 'markdown';
    default:
      return 'plaintext';
  }
}

export function getFileColor(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'py':
      return 'text-yellow-400';
    case 'c':
    case 'cpp':
      return 'text-blue-500';
    case 'java':
      return 'text-red-400';
    case 'js':
      return 'text-amber-300';
    case 'html':
      return 'text-orange-500';
    case 'css':
      return 'text-sky-400';
    case 'ts':
    case 'tsx':
      return 'text-blue-400';
    default:
      return 'text-matte-muted';
  }
}
