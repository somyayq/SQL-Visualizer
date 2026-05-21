import { QueryHistory } from "./QueryHistory";
import { DatabaseConfigPanel } from "./RightSidebar/DatabaseConfigPanel";
import { type HistoryItem } from "../hooks/useQueryHistory";
import { type DatabaseConfig } from "../hooks/useDatabaseConfig";

interface RightSidebarProps {
  history: HistoryItem[];
  onSelectQuery: (query: string) => void;
  onClearHistory: () => void;
  dbConfig: DatabaseConfig;
  onSaveDbConfig: (config: DatabaseConfig) => void;
}

export const RightSidebar = ({ history, onSelectQuery, onClearHistory, dbConfig, onSaveDbConfig }: RightSidebarProps) => {
  return (
    <div className="col-span-4 flex flex-col gap-6">
      {/* Query History */}
      <QueryHistory 
        history={history} 
        onSelectQuery={onSelectQuery} 
        onClearHistory={onClearHistory} 
      />

      {/* Database Connection Config */}
      <DatabaseConfigPanel 
        config={dbConfig} 
        onSaveConfig={onSaveDbConfig} 
      />
    </div>
  );
};
