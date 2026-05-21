import { useState } from "react";
import { Database, Settings2, Save, Wifi, WifiOff, Loader2, AlertCircle } from "lucide-react";
import { type DatabaseConfig, type ConnectionStatus } from "../../hooks/useDatabaseConfig";

interface DatabaseConfigProps {
  config: DatabaseConfig;
  onSaveConfig: (config: DatabaseConfig) => void;
  status: ConnectionStatus;
  errorMessage?: string;
}

export const DatabaseConfigPanel = ({ config, onSaveConfig, status, errorMessage }: DatabaseConfigProps) => {
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
    <div className="bg-surface-low rounded-xl p-6 border border-surface-bright/5">
      <div className="flex justify-between items-center mb-6">
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
        <div className="space-y-3">
          <div className="bg-surface-lowest p-4 rounded-md border-l-2 border-primary">
            <p className="text-white font-display text-sm">
              {config.database || 'No Database'}
            </p>
            <p className="text-[10px] font-mono opacity-40">
              {config.host}:{config.port} ({config.type})
            </p>
          </div>
          {/* Connection status */}
          <div className="flex items-center gap-2 mt-1">
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
            <p className="text-[10px] font-mono text-red-400/85 mt-1 max-w-full break-words bg-red-500/5 p-2 rounded border border-red-500/10">
              {errorMessage}
            </p>
          )}
          <p className="text-[10px] text-white/30 italic text-center mt-2">
            Using connection for realistic query plans.
          </p>
        </div>
      ) : (
        <div className="space-y-3 font-mono text-[11px] flex flex-col gap-2">
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

          <button 
            onClick={handleSave}
            className="mt-2 w-full bg-primary/20 text-primary hover:bg-primary hover:text-black font-bold py-1.5 rounded transition-colors flex items-center justify-center gap-2 uppercase tracking-wider text-[10px]"
          >
            <Save size={12} /> Save Config
          </button>
        </div>
      )}
    </div>
  );
};
