import { useState } from "react";
import { Database, Settings2, Save, Wifi, WifiOff, Loader2, AlertCircle, Plus, Trash2 } from "lucide-react";
import { type DatabaseConfig, type ConnectionStatus } from "../../hooks/useDatabaseConfig";

interface DatabaseConfigProps {
  config: DatabaseConfig;
  onSaveConfig: (config: DatabaseConfig) => void;
  deleteConfig: (id: string) => void;
  savedConfigs: DatabaseConfig[];
  setConfig: (config: DatabaseConfig) => void;
  status: ConnectionStatus;
  errorMessage?: string;
}

export const DatabaseConfigPanel = ({ config, onSaveConfig, deleteConfig, savedConfigs, setConfig, status, errorMessage }: DatabaseConfigProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [localConfig, setLocalConfig] = useState<DatabaseConfig>(config);

  const handleSave = () => {
    onSaveConfig(localConfig);
    setIsEditing(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setLocalConfig({ ...localConfig, [e.target.name]: e.target.value });
  };

  return (
    <div className="h-full w-full flex flex-col min-h-0">
      <div className="flex justify-between items-center mb-6 shrink-0">
        <h3 className="font-display uppercase text-[10px] tracking-[0.3em] text-white/40 flex items-center gap-2">
          <Database size={14} />
          Database Connection
        </h3>
        <button 
          onClick={() => {
            if (!isEditing) setLocalConfig(config);
            setIsEditing(!isEditing);
          }}
          className="text-primary hover:text-primary-container transition-colors"
          title="Configure Database"
        >
          <Settings2 size={14} />
        </button>
      </div>

      {!isEditing ? (
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 flex flex-col gap-2">
            {savedConfigs.map(c => (
              <div 
                key={c.id} 
                onClick={() => setConfig(c)}
                className={`cursor-pointer bg-surface-lowest p-3 rounded-md border transition-all ${
                  config.id === c.id 
                    ? 'border-primary shadow-[0_0_10px_rgba(var(--color-primary),0.1)]' 
                    : 'border-surface-bright/10 hover:border-primary/50'
                }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <p className="text-white font-display text-sm truncate pr-2">
                    {c.name || c.database || 'Database'}
                  </p>
                  {config.id !== c.id && (
                    <button 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        deleteConfig(c.id!); 
                      }} 
                      className="text-white/20 hover:text-red-400 transition-colors"
                      title="Delete Connection"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
                <p className="text-[10px] font-mono opacity-40">
                  {c.host}:{c.port} ({c.type})
                </p>
              </div>
            ))}
          </div>

          <button 
            onClick={() => { 
              setLocalConfig({ host: 'localhost', port: '5432', user: 'postgres', password: '', database: '', type: 'postgres' }); 
              setIsEditing(true); 
            }} 
            className="shrink-0 w-full flex justify-center items-center gap-1.5 text-[10px] uppercase font-mono py-2 border border-dashed border-surface-bright/20 rounded hover:border-primary/50 text-white/40 hover:text-primary transition-colors mt-1"
          >
            <Plus size={12} /> New Connection
          </button>
          {/* Connection status */}
          <div className="flex items-center gap-2 mt-1 shrink-0">
            {status === 'connecting' && (
              <span className="flex items-center gap-1.5 text-yellow-500 font-mono text-xs">
                <Loader2 size={12} className="animate-spin" /> Connecting...
              </span>
            )}
            {status === 'connected' && (
              <span className="flex items-center gap-1.5 text-green-400 font-mono text-xs">
                <Wifi size={12} /> Connected
              </span>
            )}
            {status === 'disconnected' && (
              <span className="flex items-center gap-1.5 text-white/40 font-mono text-xs">
                <WifiOff size={12} /> Disconnected
              </span>
            )}
            {status === 'error' && (
              <span className="flex items-center gap-1.5 text-red-400 font-mono text-xs" title={errorMessage}>
                <AlertCircle size={12} /> Connection Failed
              </span>
            )}
          </div>
          {status === 'error' && errorMessage && (
            <p className="shrink-0 text-[10px] font-mono text-red-400/85 mt-1 max-w-full break-words bg-red-500/5 p-2 rounded border border-red-500/10">
              {errorMessage}
            </p>
          )}
          <p className="shrink-0 text-[10px] text-white/30 italic text-center mt-2">
            Using connection for realistic query plans.
          </p>
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3 font-mono text-[11px] flex flex-col gap-2">
          <div className="flex flex-col gap-1">
            <label className="text-white/40">Name (Optional)</label>
            <input 
              name="name" 
              value={localConfig.name || ''} 
              onChange={handleChange}
              className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1.5 text-white outline-none focus:border-primary/50"
              placeholder="My Production DB"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white/40">Type</label>
            <select 
              name="type" 
              value={localConfig.type} 
              onChange={handleChange}
              className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1.5 text-white outline-none focus:border-primary/50"
            >
              <option value="postgres">PostgreSQL</option>
              <option value="mysql">MySQL</option>
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-white/40">Host</label>
              <input 
                name="host" 
                value={localConfig.host} 
                onChange={handleChange}
                className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1 text-white outline-none focus:border-primary/50"
                placeholder="localhost"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/40">Port</label>
              <input 
                name="port" 
                value={localConfig.port} 
                onChange={handleChange}
                className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1 text-white outline-none focus:border-primary/50"
                placeholder="5432"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-white/40">Database</label>
            <input 
              name="database" 
              value={localConfig.database} 
              onChange={handleChange}
              className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1 text-white outline-none focus:border-primary/50"
              placeholder="postgres"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-white/40">User</label>
              <input 
                name="user" 
                value={localConfig.user} 
                onChange={handleChange}
                className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1 text-white outline-none focus:border-primary/50"
                placeholder="postgres"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-white/40">Password</label>
              <input 
                name="password" 
                type="password"
                value={localConfig.password} 
                onChange={handleChange}
                className="bg-surface-lowest border border-surface-bright/10 rounded px-2 py-1 text-white outline-none focus:border-primary/50"
                placeholder="secret"
              />
            </div>
          </div>

          <div className="flex gap-2 mt-2">
            <button 
              onClick={() => setIsEditing(false)}
              className="flex-1 bg-surface-lowest border border-surface-bright/10 text-white/60 hover:text-white font-bold py-1.5 rounded transition-colors flex items-center justify-center uppercase tracking-wider text-[10px]"
            >
              Cancel
            </button>
            <button 
              onClick={handleSave}
              className="flex-1 bg-primary/20 text-primary hover:bg-primary hover:text-black font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-1.5 uppercase tracking-wider text-[10px]"
            >
              <Save size={12} /> Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
