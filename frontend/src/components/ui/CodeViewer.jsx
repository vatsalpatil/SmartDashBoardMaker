import CodeMirror from '@uiw/react-codemirror';
import { sql, StandardSQL } from '@codemirror/lang-sql';
import { editorTheme, syntaxExtension } from '../../lib/editorTheme';

export default function CodeViewer({ value, language = 'sql', height = 'auto', className = '' }) {
  const extensions = [];
  
  if (language === 'sql') {
    extensions.push(sql({ dialect: StandardSQL }));
  }
  
  extensions.push(editorTheme);
  extensions.push(syntaxExtension);

  return (
    <div className={`rounded-xl overflow-hidden border border-border-muted bg-bg-base/40 ${className}`}>
      <CodeMirror
        value={value}
        readOnly
        editable={false}
        height={height}
        extensions={extensions}
        basicSetup={{
          lineNumbers: true,
          highlightActiveLineGutter: false,
          highlightActiveLine: false,
          foldGutter: true,
          autocompletion: false,
        }}
        theme="none" // We use our custom theme
      />
    </div>
  );
}
