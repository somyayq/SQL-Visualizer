import {
  History,
  Trash2,
  Clock,
  Database,
  Activity,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { type HistoryItem } from "../hooks/useQueryHistory";
import { type DatabaseConfig } from "../hooks/useDatabaseConfig";

export interface QueryHistoryProps {
  history: HistoryItem[];
  savedConfigs: DatabaseConfig[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
  activeQuery?: string;
  // FIX 1: Renamed from onImportWorkspace to onImportHistory to match parent components
  onImportHistory?: (imported: HistoryItem[]) => void; 
}

export const QueryHistory = ({
  history,
  onSelectQuery,
  onClearHistory,
  activeQuery, 
}: QueryHistoryProps) => {
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-display uppercase text-[10px] tracking-[0.3em] text-white/40 flex items-center gap-2">
          <History size={14} />
          Query History
        </h3>
        <div className="flex items-center gap-3">
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
      </div>
      <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
        {history.length === 0 ? (
          <div className="text-center py-8 text-white/20 text-xs font-mono italic">
            No queries in history
          </div>
        ) : (
          history.map((item) => {
            const isActive = activeQuery?.trim() === item.query?.trim();
            return (
              <div
                key={item.id}
                onClick={() => onSelectQuery(item.query)}
                className={`bg-surface-lowest p-3 rounded-md border-l-2 transition-all group cursor-pointer ${
                  isActive
                    ? "border-primary bg-surface-lowest/90 shadow-[0_0_15px_rgba(var(--color-primary-rgb,0,242,254),0.15)]"
                    : "border-primary/20 hover:border-primary/60 hover:bg-surface-lowest/80"
                }`}
              >
                <p
                  className={`font-mono text-xs line-clamp-3 break-all transition-colors ${
                    isActive
                      ? "text-primary font-medium"
                      : "text-white/80 group-hover:text-white"
                  }`}
                >
                  {item.query}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-[9px] font-mono opacity-40">
                    <Clock size={10} />
                    <span>{formatTime(item.timestamp)}</span>
                  </div>
                  <div className="flex items-center gap-3 text-[9px] font-mono">
                    {item.status === "success" && (
                      <span
                        className="flex items-center gap-1 text-green-400"
                        title="Success"
                      >
                        <CheckCircle2 size={10} /> Success
                      </span>
                    )}
                    {item.status === "error" && (
                      <span
                        className="flex items-center gap-1 text-red-400"
                        title={item.errorMessage || "Error"}
                      >
                        <AlertCircle size={10} /> Error
                      </span>
                    )}
                    {item.rows !== undefined && (
                      <span
                        className="flex items-center gap-1 text-primary opacity-80"
                        title="Rows"
                      >
                        <Database size={10} /> {item.rows.toLocaleString()}
                      </span>
                    )}
                    {item.cost !== undefined && (
                      <span
                        className="flex items-center gap-1 text-green-400 opacity-80"
                        title="Cost"
                      >
                        <Activity size={10} /> {item.cost.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};