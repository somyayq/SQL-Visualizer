import { useState, useRef } from "react";

interface SqlEditorProps {
  query: string;
  setQuery: (query: string) => void;
  onRun: (query: string) => void;
  onOptimize: (query: string) => void;
  isLoading?: boolean;
  isOptimizing?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errorDetails?: any;
}

export const SqlEditor = ({ query, setQuery, onRun, onOptimize, isLoading, isOptimizing, errorDetails }: SqlEditorProps) => {
  const [cursorPos, setCursorPos] = useState(0);
  const [isFocused, setIsFocused] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleCursorMove = () => {
    if (textareaRef.current) {
      setCursorPos(textareaRef.current.selectionStart);
    }
  };

  const highlightAndInjectCursor = (code: string) => {
    let injectedCode = code;
    
    let startIndex = -1;
    let endIndex = -1;
    
    if (errorDetails?.location) {
      const { start, end } = errorDetails.location;
      
      const getOffset = (pos: { line: number, column: number }) => {
        const lines = code.split("\n");
        const prevLines = lines.slice(0, pos.line - 1).join("\n");
        return (prevLines ? prevLines.length + 1 : 0) + pos.column - 1;
      };
      
      startIndex = getOffset(start);
      endIndex = getOffset(end);
      
      if (endIndex < startIndex || startIndex < 0 || endIndex > code.length) {
         startIndex = -1;
      }
      
      // Expand endIndex to cover the rest of the invalid word for better UX
      if (startIndex >= 0) {
        while (endIndex < code.length && /[a-zA-Z0-9_]/.test(code.charAt(endIndex))) {
          endIndex++;
        }
      }
    }

    const markers: { index: number, text: string }[] = [];
    if (isFocused) markers.push({ index: cursorPos, text: "🟢" });
    
    if (startIndex >= 0) {
      markers.push({ index: startIndex, text: "🔴" });
      markers.push({ index: endIndex, text: "🔵" });
    }

    markers.sort((a, b) => b.index - a.index);
    for (const m of markers) {
       injectedCode = injectedCode.slice(0, m.index) + m.text + injectedCode.slice(m.index);
    }
    
    const safeCode = injectedCode
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");

    const keywords = [
      "SELECT", "FROM", "JOIN", "ON", "WHERE", "AND", "OR",
      "ORDER BY", "LIMIT", "DESC", "ASC", "LEFT JOIN", "GROUP BY"
    ];

    const regex = new RegExp(`\\b(${keywords.join("|")})\\b`, "gi");

    let highlighted = safeCode.replace(regex, (matched) => {
      return `<span class="text-primary font-bold">${matched}</span>`;
    });

    highlighted = highlighted.replace(/'(.*?)'/g, '<span class="text-green-400">\'$1\'</span>');

    const cursorHtml = `<span class="inline-block w-0.5 h-[1.1em] bg-primary shadow-[0_0_12px_#FF8C00] align-middle animate-pulse mx-px"></span>`;
    const errStartHtml = `<span class="underline decoration-red-500 decoration-wavy decoration-2 bg-red-500/10">`;
    const errEndHtml = `</span>`;

    highlighted = highlighted.replace("🟢", cursorHtml);
    if (startIndex >= 0) {
      highlighted = highlighted.replace("🔴", errStartHtml);
      highlighted = highlighted.replace("🔵", errEndHtml);
    }
    
    return highlighted;
  };

  return (
    <div className="bg-surface-container rounded-lg overflow-hidden flex flex-col shadow-2xl border border-surface-bright/5">
      {/* Editor Header */}
      <div className="px-4 py-3 bg-surface-high/30 flex justify-between items-center border-b border-surface-bright/10">
        <div className="flex items-center gap-2">
           <div className="flex gap-1.5 mr-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-500/20 border border-red-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20 border border-yellow-500/40" />
              <div className="w-2.5 h-2.5 rounded-full bg-green-500/20 border border-green-500/40" />
           </div>
           <span className="font-mono text-[10px] text-on-surface-variant/40 tracking-[0.2em]">QUERY_EDITOR.SQL</span>
        </div>
      </div>

      {/* Editor Surface */}
      <div 
        className="bg-surface-lowest p-6 min-h-75 font-mono text-sm relative group cursor-text"
        onClick={() => textareaRef.current?.focus()}
      >
        <div className="flex gap-6 h-full min-h-62.5">
          {/* Line Numbers */}
          <div className="text-on-surface-variant/20 select-none text-right w-5 leading-6 border-r border-surface-bright/10 pr-4 italic">
            {query.split("\n").map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          <div className="relative flex-1 leading-6">
            {/* Display Layer */}
            <div
              className="absolute inset-0 pointer-events-none whitespace-pre-wrap wrap-break-words text-white/90 z-10"
              dangerouslySetInnerHTML={{
                __html: highlightAndInjectCursor(query),
              }}
            />

            {/* Input Layer */}
            <textarea
              ref={textareaRef}
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setCursorPos(e.target.selectionStart);
              }}
              onKeyUp={handleCursorMove}
              onClick={handleCursorMove}
              onSelect={handleCursorMove}
              onFocus={() => setIsFocused(true)}
              onBlur={() => setIsFocused(false)}
              spellCheck={false}
              className="absolute inset-0 bg-transparent text-transparent caret-transparent outline-none resize-none w-full h-full whitespace-pre-wrap wrap-break-words z-20 overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Error Details Pane */}
      {errorDetails && errorDetails.error && (
        <div className="bg-red-950/40 p-4 border-t border-red-500/20 flex flex-col gap-1">
          <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase tracking-wider">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            Syntax Error
          </div>
          <p className="text-red-300/80 text-sm font-mono mt-1 whitespace-pre-wrap wrap-break-words">Invalid SQL syntax. Check your query and try again.</p>
        </div>
      )}

      {/* Action Bar */}
      <div className="p-4 flex flex-col gap-4 bg-background/40 backdrop-blur-sm border-t border-surface-bright/10">
        <div className="flex justify-between items-center">
          <div className="flex gap-4">
            <button
              onClick={() => onRun(query)}
              disabled={isLoading || isOptimizing}
              className={`min-w-40 bg-linear-to-r from-primary to-primary-container text-black font-bold py-2.5 rounded uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${(isLoading || isOptimizing) ? "opacity-50 cursor-not-allowed" : "hover:shadow-[0_0_20px_rgba(255,140,0,0.3)]"}`}
            >
              {isLoading ? <span className="animate-spin">◌</span> : <><span>▶</span> RUN QUERY</>}
            </button>
            <button
              onClick={() => onOptimize(query)}
              disabled={isLoading || isOptimizing}
              className={`min-w-40 bg-surface-high border border-primary/30 text-primary font-bold py-2.5 rounded uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98] ${(isLoading || isOptimizing) ? "opacity-50 cursor-not-allowed" : "hover:bg-primary/10"}`}
            >
              {isOptimizing ? <span className="animate-spin">◌</span> : <> OPTIMIZE</>}
            </button>
          </div>
        </div>
        <p className="text-[13px] text-on-surface-variant/40 italic flex items-center gap-2">
          <span className="text-primary opacity-60">TIP:</span> Use standard SQL syntax. The visualizer supports JOINs and WHERE clauses.
        </p>
      </div>
    </div>
  );
};

export default SqlEditor;