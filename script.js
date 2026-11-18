/* ==========================================================================
   NOIR — application logic
   Sections:
     1. Constants & storage helpers
     2. Monaco bootstrap (lazy loaded)
     3. Editor creation + custom theme
     4. File operations (new / open / save / drag-drop)
     5. Autosave + session restore
     6. Toolbar / status bar wiring
     7. Responsive overflow menu
   ========================================================================== */

(() => {
  'use strict';

  /* -------------------------------------------------------------------- *
   * 1. CONSTANTS & STORAGE
   * -------------------------------------------------------------------- */

  const STORAGE_KEY = 'noir-editor-session-v1';

  // Extension -> Monaco language id. Used for auto-detection on open/drop
  // and to keep the language <select> in sync with the active file.
  const EXT_LANG_MAP = {
    js: 'javascript', jsx: 'javascript', mjs: 'javascript', cjs: 'javascript',
    ts: 'typescript', tsx: 'typescript',
    json: 'json', jsonc: 'json',
    html: 'html', htm: 'html', vue: 'html',
    css: 'css', scss: 'scss', less: 'less',
    py: 'python', pyw: 'python',
    java: 'java', kt: 'kotlin', kts: 'kotlin',
    c: 'c', h: 'c', cpp: 'cpp', cc: 'cpp', cxx: 'cpp', hpp: 'cpp',
    cs: 'csharp', go: 'go', rs: 'rust', rb: 'ruby', php: 'php',
    sql: 'sql', sh: 'shell', bash: 'shell', zsh: 'shell',
    yaml: 'yaml', yml: 'yaml', xml: 'xml', md: 'markdown', markdown: 'markdown',
    txt: 'plaintext', swift: 'swift', dart: 'dart', lua: 'lua',
    r: 'r', pl: 'perl', scala: 'scala', groovy: 'groovy',
    dockerfile: 'dockerfile', graphql: 'graphql', gql: 'graphql',
    ini: 'ini', toml: 'ini', bat: 'bat', ps1: 'powershell',
  };

  const DEFAULT_CONTENT =
`// Welcome to Noir
// A lightweight code editor running entirely in your browser, powered by Monaco.
//
//  • Ctrl/Cmd + S   save & download
//  • Ctrl/Cmd + O   open a local file
//  • Ctrl/Cmd + F   find      Ctrl/Cmd + H   replace
//  • F1             command palette
//  • Ctrl + scroll  zoom font size
//  • Alt + click    add a cursor
//
// Your work is auto-saved to this browser's local storage as you type.

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log(fibonacci(10));
`;

  function loadSession() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      console.warn('Noir: could not read saved session', e);
      return null;
    }
  }

  function saveSession(partial) {
    try {
      const current = loadSession() || {};
      const merged = Object.assign(current, partial);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
    } catch (e) {
      console.warn('Noir: could not persist session (storage full or blocked)', e);
    }
  }

  function debounce(fn, ms) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), ms);
    };
  }

  function guessLanguageFromName(name) {
    const clean = name.toLowerCase().trim();
    if (clean === 'dockerfile') return 'dockerfile';
    const ext = clean.includes('.') ? clean.split('.').pop() : '';
    return EXT_LANG_MAP[ext] || 'plaintext';
  }

  /* -------------------------------------------------------------------- *
   * 2. MONACO BOOTSTRAP (lazy-loaded via AMD loader from index.html)
   * -------------------------------------------------------------------- */

  const appEl = document.getElementById('app');
  const bootEl = document.getElementById('boot-screen');

  // require + loader.min.js were pulled in by <script> tags in index.html.
  // The actual editor bundle (~2-3MB) is only fetched here, after first paint,
  // so the toolbar/shell renders instantly.
  window.require.config({
    paths: { vs: 'https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.49.0/min/vs' },
  });

  window.require(['vs/editor/editor.main'], function onMonacoReady() {
    initApp(window.monaco);
  });

  /* -------------------------------------------------------------------- *
   * 3. EDITOR CREATION
   * -------------------------------------------------------------------- */

  function initApp(monaco) {
    // A pure-black theme derived from vs-dark, tuned so backgrounds (editor,
    // gutter, minimap, line-highlight) are all true #000, matching the shell.
    monaco.editor.defineTheme('noir-black', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a6a75', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'b39dff' },
        { token: 'string', foreground: '9fe6a0' },
        { token: 'number', foreground: 'f4c669' },
        { token: 'type', foreground: '5fd0f3' },
        { token: 'function', foreground: 'd8c5ff' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#e7e7ec',
        'editorGutter.background': '#000000',
        'minimap.background': '#000000',
        'editor.lineHighlightBackground': '#ffffff0a',
        'editor.lineHighlightBorder': '#00000000',
        'editorLineNumber.foreground': '#4a4a52',
        'editorLineNumber.activeForeground': '#c9c9d1',
        'editorCursor.foreground': '#7c5cff',
        'editor.selectionBackground': '#7c5cff33',
        'editor.inactiveSelectionBackground': '#7c5cff1a',
        'editorIndentGuide.background': '#ffffff0f',
        'editorIndentGuide.activeBackground': '#ffffff26',
        'editorWhitespace.foreground': '#ffffff14',
        'editorBracketMatch.background': '#7c5cff26',
        'editorBracketMatch.border': '#7c5cff80',
        'scrollbarSlider.background': '#ffffff1a',
        'scrollbarSlider.hoverBackground': '#ffffff2a',
        'editorWidget.background': '#0d0d10',
        'editorWidget.border': '#ffffff14',
        'editorSuggestWidget.background': '#0d0d10',
        'editorHoverWidget.background': '#0d0d10',
        'editor.findMatchBackground': '#7c5cff55',
        'editor.findMatchHighlightBackground': '#7c5cff2a',
        'input.background': '#151518',
        'input.border': '#ffffff14',
      },
    });

    const session = loadSession();
    const settings = Object.assign(
      { fontSize: 14, fontFamily: "'JetBrains Mono', 'Fira Code', monospace", wordWrap: 'off', minimap: true, tabSize: 2 },
      (session && session.settings) || {}
    );

    const editor = monaco.editor.create(document.getElementById('editor-container'), {
      value: (session && typeof session.content === 'string') ? session.content : DEFAULT_CONTENT,
      language: (session && session.language) || 'javascript',
      theme: 'noir-black',
      fontSize: settings.fontSize,
      fontFamily: settings.fontFamily,
      fontLigatures: true,
      wordWrap: settings.wordWrap,
      minimap: { enabled: settings.minimap },
      automaticLayout: true,
      smoothScrolling: true,
      cursorSmoothCaretAnimation: 'on',
      cursorBlinking: 'expand',
      mouseWheelZoom: true,               // Ctrl/Cmd + wheel to zoom font size
      bracketPairColorization: { enabled: true },
      matchBrackets: 'always',
      autoClosingBrackets: 'languageDefined',
      autoClosingQuotes: 'languageDefined',
      autoIndent: 'full',
      folding: true,
      foldingHighlight: true,
      renderLineHighlight: 'all',
      tabSize: settings.tabSize,
      insertSpaces: true,
      scrollBeyondLastLine: false,
      padding: { top: 14 },
      lineNumbersMinChars: 3,
      multiCursorModifier: 'alt',
      renderWhitespace: 'selection',
      overviewRulerBorder: false,
      guides: { bracketPairs: true, indentation: true },
    });

    editor.focus();

    const state = {
      monaco, editor,
      fileName: (session && session.fileName) || 'untitled.js',
      dirty: false,
      baselineContent: (session && typeof session.content === 'string') ? session.content : DEFAULT_CONTENT,
      settings,
    };

    populateLanguageSelect(monaco, state);
    wireToolbar(monaco, editor, state);
    wireStatusBar(monaco, editor, state);
    wireFileOps(monaco, editor, state);
    wireAutosave(editor, state);
    wireDragDrop(monaco, editor, state);

    // Reveal the shell now that Monaco has painted; fade the boot screen out.
    requestAnimationFrame(() => {
      appEl.classList.add('ready');
      appEl.setAttribute('aria-busy', 'false');
      bootEl.classList.add('hidden');
      setTimeout(() => bootEl.remove(), 550);
    });
  }

  /* -------------------------------------------------------------------- *
   * 4 & 5. TOOLBAR, STATUS BAR, FILE OPS, AUTOSAVE (helpers used above)
   * -------------------------------------------------------------------- */

  function populateLanguageSelect(monaco, state) {
    const select = document.getElementById('language-select');
    const languages = monaco.languages.getLanguages()
      .filter(l => l.id !== 'plaintext')
      .map(l => ({ id: l.id, label: (l.aliases && l.aliases[0]) || l.id }))
      .sort((a, b) => a.label.localeCompare(b.label));

    const frag = document.createDocumentFragment();
    const plain = document.createElement('option');
    plain.value = 'plaintext';
    plain.textContent = 'Plain Text';
    frag.appendChild(plain);
    languages.forEach(({ id, label }) => {
      const opt = document.createElement('option');
      opt.value = id;
      opt.textContent = label;
      frag.appendChild(opt);
    });
    select.appendChild(frag);
    select.value = state.editor.getModel().getLanguageId();

    select.addEventListener('change', () => {
      monaco.editor.setModelLanguage(state.editor.getModel(), select.value);
      updateStatusLanguage(select.value);
    });
  }

  function updateStatusLanguage(langId) {
    const label = document.getElementById('language-select').selectedOptions[0]?.textContent || langId;
    document.getElementById('status-language').textContent = label;
  }

  function markDirty(state, isDirty) {
    state.dirty = isDirty;
    document.getElementById('unsaved-dot').hidden = !isDirty;
  }

  function setFileName(state, name) {
    state.fileName = name;
    document.getElementById('file-name').textContent = name;
    document.title = `${name} — Noir`;
  }

  function wireToolbar(monaco, editor, state) {
    const $ = (id) => document.getElementById(id);

    // Word wrap toggle
    $('btn-wrap').addEventListener('click', () => {
      const next = editor.getOption(monaco.editor.EditorOption.wordWrap) === 'off' ? 'on' : 'off';
      editor.updateOptions({ wordWrap: next });
      $('btn-wrap').setAttribute('aria-pressed', String(next === 'on'));
      state.settings.wordWrap = next;
      saveSession({ settings: state.settings });
    });

    // Minimap toggle
    $('btn-minimap').addEventListener('click', () => {
      const enabled = !editor.getOption(monaco.editor.EditorOption.minimap).enabled;
      editor.updateOptions({ minimap: { enabled } });
      $('btn-minimap').setAttribute('aria-pressed', String(enabled));
      state.settings.minimap = enabled;
      saveSession({ settings: state.settings });
    });

    // Command palette (Monaco ships this built in — F1 by default)
    $('btn-palette').addEventListener('click', () => {
      editor.focus();
      editor.getAction('editor.action.quickCommand').run();
    });

    // Font size controls
    const fontDisplay = $('font-size-display');
    function setFontSize(size) {
      const clamped = Math.max(9, Math.min(40, size));
      editor.updateOptions({ fontSize: clamped });
      fontDisplay.textContent = clamped;
      state.settings.fontSize = clamped;
      saveSession({ settings: state.settings });
    }
    $('btn-font-inc').addEventListener('click', () => setFontSize(editor.getOption(monaco.editor.EditorOption.fontSize) + 1));
    $('btn-font-dec').addEventListener('click', () => setFontSize(editor.getOption(monaco.editor.EditorOption.fontSize) - 1));

    // Keep the toolbar font-size number in sync when the user zooms with Ctrl+wheel
    editor.onDidChangeConfiguration((e) => {
      if (e.hasChanged(monaco.editor.EditorOption.fontSize)) {
        fontDisplay.textContent = editor.getOption(monaco.editor.EditorOption.fontSize);
      }
    });

    // Font family select
    $('font-family-select').value = state.settings.fontFamily;
    $('font-family-select').addEventListener('change', (e) => {
      editor.updateOptions({ fontFamily: e.target.value });
      state.settings.fontFamily = e.target.value;
      saveSession({ settings: state.settings });
    });

    // Reflect restored settings into the toolbar controls
    fontDisplay.textContent = state.settings.fontSize;
    $('btn-wrap').setAttribute('aria-pressed', String(state.settings.wordWrap === 'on'));
    $('btn-minimap').setAttribute('aria-pressed', String(state.settings.minimap));

    // Overflow menu (small screens)
    const menuBtn = $('btn-menu');
    const menu = $('overflow-menu');
    menuBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const willShow = menu.hidden;
      menu.hidden = !willShow;
      menuBtn.setAttribute('aria-expanded', String(willShow));
    });
    document.addEventListener('click', (e) => {
      if (!menu.hidden && !menu.contains(e.target)) {
        menu.hidden = true;
        menuBtn.setAttribute('aria-expanded', 'false');
      }
    });
    menu.addEventListener('click', (e) => {
      const action = e.target.dataset.action;
      if (!action) return;
      menu.hidden = true;
      ({
        new: () => $('btn-new').click(),
        open: () => $('btn-open').click(),
        save: () => $('btn-save').click(),
        wrap: () => $('btn-wrap').click(),
        minimap: () => $('btn-minimap').click(),
        palette: () => $('btn-palette').click(),
        clear: () => { localStorage.removeItem(STORAGE_KEY); location.reload(); },
      })[action]?.();
    });
  }

  function wireStatusBar(monaco, editor, state) {
    const posEl = document.getElementById('status-position');
    const indentEl = document.getElementById('status-indent');

    function refreshPosition() {
      const pos = editor.getPosition();
      if (pos) posEl.textContent = `Ln ${pos.lineNumber}, Col ${pos.column}`;
    }
    function refreshIndent() {
      const opts = editor.getModel().getOptions();
      indentEl.textContent = `${opts.insertSpaces ? 'Spaces' : 'Tabs'}: ${opts.tabSize}`;
    }

    editor.onDidChangeCursorPosition(refreshPosition);
    editor.onDidChangeModel(() => { refreshPosition(); refreshIndent(); });
    refreshPosition();
    refreshIndent();
    updateStatusLanguage(editor.getModel().getLanguageId());

    // Clicking the tab-size indicator cycles common sizes — a small, useful affordance.
    indentEl.addEventListener('click', () => {
      const opts = editor.getModel().getOptions();
      const sizes = [2, 4, 8];
      const next = sizes[(sizes.indexOf(opts.tabSize) + 1) % sizes.length];
      editor.getModel().updateOptions({ tabSize: next });
      state.settings.tabSize = next;
      saveSession({ settings: state.settings });
      refreshIndent();
    });
  }

  function wireFileOps(monaco, editor, state) {
    const $ = (id) => document.getElementById(id);
    const fileInput = $('file-input');

    // New file
    $('btn-new').addEventListener('click', () => {
      if (state.dirty && !confirm('Discard unsaved changes and start a new file?')) return;
      editor.setValue('');
      monaco.editor.setModelLanguage(editor.getModel(), 'plaintext');
      document.getElementById('language-select').value = 'plaintext';
      updateStatusLanguage('plaintext');
      setFileName(state, 'untitled.txt');
      state.baselineContent = '';
      markDirty(state, false);
      saveSession({ content: '', fileName: state.fileName, language: 'plaintext' });
      editor.focus();
    });

    // Open — via hidden <input type=file>
    $('btn-open').addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (file) openFile(monaco, editor, state, file);
      fileInput.value = '';
    });

    // Save — download current buffer as a file
    $('btn-save').addEventListener('click', () => downloadCurrentFile(editor, state));

    // Keyboard shortcuts beyond Monaco's own (find/replace/undo/redo are native)
    window.addEventListener('keydown', (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key.toLowerCase() === 's') {
        e.preventDefault();
        downloadCurrentFile(editor, state);
      } else if (mod && e.key.toLowerCase() === 'o') {
        e.preventDefault();
        fileInput.click();
      } else if (mod && e.altKey && e.key.toLowerCase() === 'n') {
        e.preventDefault();
        $('btn-new').click();
      }
    });
  }

  function openFile(monaco, editor, state, file) {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      const lang = guessLanguageFromName(file.name);
      editor.setValue(text);
      monaco.editor.setModelLanguage(editor.getModel(), lang);
      document.getElementById('language-select').value = lang;
      updateStatusLanguage(lang);
      setFileName(state, file.name);
      state.baselineContent = text;
      markDirty(state, false);
      saveSession({ content: text, fileName: file.name, language: lang });
      editor.focus();
    };
    reader.onerror = () => alert('Could not read that file.');
    reader.readAsText(file);
  }

  function downloadCurrentFile(editor, state) {
    const blob = new Blob([editor.getValue()], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = state.fileName || 'untitled.txt';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    state.baselineContent = editor.getValue();
    markDirty(state, false);
  }

  function wireAutosave(editor, state) {
    const persist = debounce(() => {
      const content = editor.getValue();
      saveSession({
        content,
        fileName: state.fileName,
        language: editor.getModel().getLanguageId(),
        settings: state.settings,
      });
    }, 400);

    editor.onDidChangeModelContent(() => {
      markDirty(state, editor.getValue() !== state.baselineContent);
      persist();
    });
  }

  function wireDragDrop(monaco, editor, state) {
    const overlay = document.getElementById('dropzone-overlay');
    let dragCounter = 0;

    window.addEventListener('dragenter', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      dragCounter++;
      overlay.classList.add('active');
    });
    window.addEventListener('dragover', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
    });
    window.addEventListener('dragleave', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      dragCounter = Math.max(0, dragCounter - 1);
      if (dragCounter === 0) overlay.classList.remove('active');
    });
    window.addEventListener('drop', (e) => {
      if (!e.dataTransfer?.types?.includes('Files')) return;
      e.preventDefault();
      dragCounter = 0;
      overlay.classList.remove('active');
      const file = e.dataTransfer.files[0];
      if (file) openFile(monaco, editor, state, file);
    });
  }
})();
