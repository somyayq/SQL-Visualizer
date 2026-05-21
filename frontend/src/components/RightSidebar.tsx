import { QueryHistory } from "./QueryHistory";
import { DatabaseConfigPanel } from "./RightSidebar/DatabaseConfigPanel";
import { type HistoryItem } from "../hooks/useQueryHistory";
import { type DatabaseConfig, type ConnectionStatus } from "../hooks/useDatabaseConfig";

interface RightSidebarProps {
  history: HistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
  dbConfig: DatabaseConfig;
  onSaveDbConfig: (config: DatabaseConfig) => void;
  dbStatus: ConnectionStatus;
  dbErrorMessage?: string;
  activeQuery?: string;
  onImportHistory?: (imported: HistoryItem[]) => void;
}

export const RightSidebar = ({ 
  history, 
  onSelectQuery, 
  onClearHistory, 
  dbConfig, 
  onSaveDbConfig,
  dbStatus,
  dbErrorMessage,
  activeQuery,
  onImportHistory
}: RightSidebarProps) => {
  return (
    <div className="col-span-5 flex flex-col gap-6">
      {/* Database Connection Config */}
      <DatabaseConfigPanel 
        config={dbConfig} 
        onSaveConfig={onSaveDbConfig} 
        status={dbStatus}
        errorMessage={dbErrorMessage}
      />

      {/* Query History */}
      <QueryHistory 
        history={history} 
        onSelectQuery={onSelectQuery} 
        onClearHistory={onClearHistory} 
        activeQuery={activeQuery}
        onImportHistory={onImportHistory}
      />
    </div>
  );
};
