import * as Y from 'yjs';
import { MonacoBinding } from 'y-monaco';
import { WebsocketProvider } from 'y-websocket';
import * as monaco from 'monaco-editor';

export function bindMonacoToYjs(
  editor: monaco.editor.IStandaloneCodeEditor,
  doc: Y.Doc,
  provider: WebsocketProvider,
  yTextName: string
): MonacoBinding | null {
  const model = editor.getModel();
  if (!model) return null;

  const yText = doc.getText(yTextName);

  // Create y-monaco binding
  const binding = new MonacoBinding(
    yText,
    model,
    new Set([editor]),
    provider.awareness
  );

  // Listen to awareness changes to inject dynamic CSS for remote user colors & name labels
  const updateRemoteUserStyles = () => {
    const states = provider.awareness.getStates();
    let css = '';

    states.forEach((state, clientId) => {
      if (state.user && state.user.color) {
        const color = state.user.color;
        const name = state.user.name || 'Anonymous';
        
        css += `
          .yRemoteSelection-${clientId} {
            background-color: ${color}40 !important;
          }
          .yRemoteSelectionHead-${clientId} {
            border-left: 2px solid ${color} !important;
            border-top: 2px solid ${color} !important;
          }
          .yRemoteSelectionHead-${clientId}::after {
            content: "${name}" !important;
            background-color: ${color} !important;
            color: #ffffff !important;
          }
        `;
      }
    });

    let styleEl = document.getElementById('yjs-remote-styles');
    if (!styleEl) {
      styleEl = document.createElement('style');
      styleEl.id = 'yjs-remote-styles';
      document.head.appendChild(styleEl);
    }
    styleEl.innerHTML = css;
  };

  provider.awareness.on('change', updateRemoteUserStyles);
  updateRemoteUserStyles();

  return binding;
}
