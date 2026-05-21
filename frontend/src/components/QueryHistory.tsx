import { History, Trash2, Clock, Database, Activity } from "lucide-react";
import { type HistoryItem } from "../hooks/useQueryHistory";

interface QueryHistoryProps {
  history: HistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
}

export const QueryHistory = ({ history, onSelectQuery, onClearHistory }: QueryHistoryProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="bg-surface-low rounded-xl p-6 border border-surface-bright/5 max-h-125 flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <h3 className="font-display uppercase text-[10px] tracking-[0.3em] text-white/40 flex items-center gap-2">
          <History size={14} />
          Query History
        </h3>
        {history.length > 0 && (
          <button 
            onClick={onClearHistory}
            className="text-white/20 hover:text-red-400 transition-colors"
            title="Clear History"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-xs font-mono italic">
            No queries in history
          </div>
        ) : (
          history.map((item) => (
            <div 
              key={item.id}
              onClick={() => onSelectQuery(item.query)}
              className="bg-surface-lowest p-3 rounded-md border-l-2 border-primary/50 hover:border-primary hover:bg-surface-lowest/80 cursor-pointer transition-all group"
            >
              <p className="text-white/80 font-mono text-xs line-clamp-3 break-all group-hover:text-white">
                {item.query}
              </p>
              <div className="mt-2 flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-[9px] font-mono opacity-40">
                  <Clock size={10} />
                  <span>{formatTime(item.timestamp)}</span>
                </div>
                {(item.rows !== undefined || item.cost !== undefined) && (
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    {item.rows !== undefined && (
                      <span className="flex items-center gap-1 text-primary opacity-80" title="Rows">
                        <Database size={10} /> {item.rows.toLocaleString()}
                      </span>
                    )}
                    {item.cost !== undefined && (
                      <span className="flex items-center gap-1 text-green-400 opacity-80" title="Cost">
                        <Activity size={10} /> {item.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
