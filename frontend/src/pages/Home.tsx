import { useState, useRef } from "react";
import { SqlEditor } from "../components/Editor/SqlEditor";
import PlanGraph from "../components/Graph/PlanGraph";
import { getPlan, optimizeQuery } from "../services/api";
import { transformPlan } from "../utils/transform";
import { Maximize, Minimize, Copy, FileJson, CheckCircle2, AlertCircle, Upload, Download, Monitor } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { PerformanceHud } from "../components/PerformanceHud";
import { DatabaseConfigPanel } from "../components/RightSidebar/DatabaseConfigPanel";
import { QueryHistory } from "../components/QueryHistory";
import { useQueryHistory } from "../hooks/useQueryHistory";
import { useDatabaseConfig } from "../hooks/useDatabaseConfig";

const Home = () => {
  // Editor state
  const [query, setQuery] = useState("");

  // Graph state
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [graph, setGraph] = useState<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [optimizedGraph, setOptimizedGraph] = useState<any>(null);
  const [optimizedQueryText, setOptimizedQueryText] = useState("");
  const [activeTab, setActiveTab] = useState<"original" | "optimized">("original");
  // Status state
  const [loading, setLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [errorDetails, setErrorDetails] = useState<any>(null);
  const [isFullScreen, setIsFullScreen] = useState(false);

  // History & DB Config
  const { history, saveToHistory, clearHistory, setHistoryList } = useQueryHistory();
  const { config: dbConfig, setConfig: setDbConfig, saveConfig, deleteConfig, importConfigs, savedConfigs, status: dbStatus, errorMessage: dbErrorMessage } = useDatabaseConfig();

  // Toast notifications state
  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = (message: string, type: Toast['type'] = 'info') => {
    const id = Date.now().toString();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  };

  const handleImportWorkspace = (data: any) => {
    let importedHistory = 0;
    let importedConfigs = 0;
    
    if (data.history && Array.isArray(data.history)) {
      setHistoryList(data.history);
      importedHistory = data.history.length;
    }
    if (data.savedConfigs && Array.isArray(data.savedConfigs)) {
      importConfigs(data.savedConfigs);
      importedConfigs = data.savedConfigs.length;
    }
    showToast(`Imported ${importedHistory} queries and ${importedConfigs} connections!`, 'success');
  };

  const graphRef = useRef<HTMLDivElement>(null);

  const handleRun = async (q: string) => {
    if (!q.trim()) return;
    setLoading(true);
    setErrorDetails(null);
    setOptimizedGraph(null);
    setActiveTab("original");
    saveToHistory(q);
    try {
      const plan = await getPlan(q, dbConfig);
      const transformed = transformPlan(plan);
      setGraph(transformed);
      saveToHistory(q, plan.nodes[0]?.rows, plan.nodes[0]?.cost, 'success');
      showToast("Query executed and plan fetched successfully!", "success");

      // Auto-scroll to graph with slight delay to ensure it renders first
      setTimeout(() => {
        graphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error: any) {
      console.error("Query failed", error);
      setErrorDetails(error);
      saveToHistory(q, undefined, undefined, 'error', error?.message || String(error));
      showToast(error?.message || "Failed to fetch query execution plan.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async (q: string) => {
    if (!q.trim()) return;
    setIsOptimizing(true);
    setErrorDetails(null);
    saveToHistory(q);
    try {
      // We first run it normally to get the original graph, just in case it wasn't run yet
      const plan = await getPlan(q, dbConfig);
      setGraph(transformPlan(plan));
      saveToHistory(q, plan.nodes[0]?.rows, plan.nodes[0]?.cost, 'success');

      // Then we get the optimized plan
      const optResult = await optimizeQuery(q, dbConfig);
      setOptimizedQueryText(optResult.optimizedQuery);
      setOptimizedGraph(transformPlan(optResult.plan));
      setActiveTab("optimized");
      showToast("Query optimized successfully!", "success");

      setTimeout(() => {
        graphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error: any) {
      console.error("Optimization failed", error);
      setErrorDetails(error);
      saveToHistory(q, undefined, undefined, 'error', error?.message || String(error));
      showToast(error?.message || "Query optimization failed.", "error");
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSelectHistory = (q: string) => {
    setQuery(q);
  };

  const currentGraph = activeTab === "original" ? graph : (optimizedGraph || graph);

  const handleCopyMermaid = () => {
    if (!currentGraph) {
      showToast("No execution plan to export!", "error");
      return;
    }
    try {
      let mermaidStr = "graph TD\n";
      currentGraph.nodes.forEach((node: any) => {
        const label = node.data?.label || node.id;
        const rows = node.data?.rows !== undefined ? `\\nEst. Rows: ${node.data.rows}` : '';
        const cost = node.data?.cost !== undefined ? `\\nEst. Cost: ${node.data.cost}` : '';
        const safeLabel = `${label}${rows}${cost}`.replace(/"/g, '\\"');
        mermaidStr += `  ${node.id}["${safeLabel}"]\n`;
      });
      currentGraph.edges.forEach((edge: any) => {
        mermaidStr += `  ${edge.source} --> ${edge.target}\n`;
      });
      navigator.clipboard.writeText(mermaidStr);
      showToast("Copied plan as Mermaid diagram to clipboard!", "success");
    } catch (err) {
      showToast("Failed to copy Mermaid plan", "error");
    }
  };

  const handleExportPlanJson = () => {
    if (!currentGraph) {
      showToast("No execution plan to export!", "error");
      return;
    }
    try {
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(currentGraph, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `sql_plan_${Date.now()}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
      showToast("Plan JSON downloaded successfully!", "success");
    } catch (err) {
      showToast("Failed to export plan JSON", "error");
    }
  };

  const handleExportWorkspace = () => {
    if (history.length === 0 && savedConfigs.length === 0) return;
    const workspace = { history, savedConfigs };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(workspace, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `sql_visualizer_workspace_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleImportWorkspaceClick = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const imported = JSON.parse(event.target?.result as string);
          if (Array.isArray(imported)) {
            const isValid = imported.every((item) => item && typeof item.query === "string");
            if (isValid) {
              handleImportWorkspace({ history: imported, savedConfigs: [] });
            } else {
              showToast("Invalid file format.", "error");
            }
          } else if (imported && typeof imported === 'object') {
            handleImportWorkspace(imported);
          } else {
            showToast("Invalid workspace file format.", "error");
          }
        } catch (err) {
          showToast("Failed to parse workspace file.", "error");
        }
      };
      reader.readAsText(file);
    };
    input.click();
  };

  return (
    <div className="max-w-[1600px] mx-auto min-h-screen px-5 py-8 flex flex-col gap-10">
      {/* 1. APP HEADER */}
      <Navbar />

      {/* 2. PERFORMANCE HUD */}
      <PerformanceHud />

      <div className="flex flex-col gap-8">
        {/* TOP ROW: Responsive Editor and Combined Sidebar */}
        <div className="grid grid-cols-1 md:grid-cols-[1fr_350px] xl:grid-cols-[1fr_max-content] gap-8 items-start md:h-[500px]">
          
          <div className="flex flex-col h-[500px]">
            <SqlEditor 
              query={query} 
              setQuery={setQuery} 
              onRun={handleRun} 
              onOptimize={handleOptimize}
              isLoading={loading} 
              isOptimizing={isOptimizing}
              errorDetails={errorDetails} 
            />
          </div>
          
          {/* COMBINED SIDEBAR PANEL */}
          <div className="bg-surface-low rounded-xl p-6 border border-surface-bright/5 flex flex-col h-[800px] md:h-[500px] w-full xl:w-auto">
            {/* Unified Header */}
            <div className="flex justify-between items-center shrink-0 border-b border-surface-bright/10 pb-4 mb-6">
              <h3 className="font-display uppercase text-[10px] tracking-[0.3em] text-white/40 flex items-center gap-2">
                <Monitor size={14} />
                Workspace
              </h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={handleImportWorkspaceClick}
                  className="text-white/20 hover:text-primary transition-colors"
                  title="Import Workspace (History & DB Connections)"
                >
                  <Upload size={14} />
                </button>
                {(history.length > 0 || savedConfigs.length > 0) && (
                  <button
                    onClick={handleExportWorkspace}
                    className="text-white/20 hover:text-primary transition-colors"
                    title="Export Workspace (History & DB Connections)"
                  >
                    <Download size={14} />
                  </button>
                )}
              </div>
            </div>

            {/* Layout Preserved Grid inside Workspace */}
            <div className="grid grid-cols-1 xl:grid-cols-[350px_350px] gap-8 flex-1 min-h-0 overflow-hidden md:grid-rows-[minmax(0,1fr)_minmax(0,1fr)] xl:grid-rows-1">
              <div className="flex flex-col h-full min-h-0 overflow-hidden">
                <DatabaseConfigPanel 
                  config={dbConfig} 
                  onSaveConfig={saveConfig} 
                  deleteConfig={deleteConfig}
                  savedConfigs={savedConfigs}
                  setConfig={setDbConfig}
                  status={dbStatus}
                  errorMessage={dbErrorMessage}
                />
              </div>

              <div className="flex flex-col h-full min-h-0 overflow-hidden">
                <QueryHistory 
                  history={history} 
                  savedConfigs={savedConfigs}
                  onSelectQuery={handleSelectHistory} 
                  onClearHistory={clearHistory} 
                  activeQuery={query}
                  onImportHistory={handleImportWorkspace}
                />
              </div>
            </div>
          </div>
        </div>

        {/* BOTTOM ROW: Graph */}
        <div className="w-full">
          <div 
            ref={graphRef}
            className={`${isFullScreen ? 'fixed inset-4 z-50 flex flex-col bg-[#0b0c10] shadow-[0_0_100px_rgba(0,0,0,0.8)]' : 'bg-surface-low w-full'} rounded-xl p-8 border border-surface-bright/5 transition-all duration-300`}
          >
            <div className="flex flex-wrap justify-between items-start gap-4 mb-8">
              <div className="flex flex-col gap-2 min-w-0 shrink">
                <h3 className="font-display uppercase text-[16px] tracking-[0.3em] text-white/40 truncate">
                  Execution Visualizer
                </h3>
                {optimizedGraph && (
                  <div className="flex gap-2">
                    <button 
                      onClick={() => setActiveTab("original")} 
                      className={`px-3 py-1 text-xs uppercase tracking-wider rounded border ${activeTab === 'original' ? 'bg-primary/20 text-primary border-primary/50' : 'bg-surface-lowest border-surface-bright/10 text-white/40 hover:text-white'}`}
                    >
                      Original
                    </button>
                    <button 
                      onClick={() => setActiveTab("optimized")} 
                      className={`px-3 py-1 text-xs uppercase tracking-wider rounded border ${activeTab === 'optimized' ? 'bg-green-500/20 text-green-400 border-green-500/50' : 'bg-surface-lowest border-surface-bright/10 text-white/40 hover:text-white'}`}
                    >
                      Optimized ✨
                    </button>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <span className={`font-mono text-[13px] ${activeTab === 'optimized' ? 'text-green-400' : 'text-primary'}`}>
                  NODES: {currentGraph ? currentGraph.nodes.length : "0"}
                </span>
                
                {currentGraph && (
                  <>
                    <button
                      onClick={handleCopyMermaid}
                      className="text-white/40 hover:text-primary transition-colors flex items-center gap-1.5 bg-surface-lowest/50 px-2.5 py-1.5 rounded-md border border-surface-bright/10"
                      title="Copy Plan as Mermaid Diagram"
                    >
                      <Copy size={13} />
                      <span className="text-[10px] uppercase tracking-wider hidden lg:inline">Mermaid</span>
                    </button>
                    <button
                      onClick={handleExportPlanJson}
                      className="text-white/40 hover:text-primary transition-colors flex items-center gap-1.5 bg-surface-lowest/50 px-2.5 py-1.5 rounded-md border border-surface-bright/10"
                      title="Export Plan JSON"
                    >
                      <FileJson size={13} />
                      <span className="text-[10px] uppercase tracking-wider hidden lg:inline">JSON</span>
                    </button>
                  </>
                )}

                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="text-white/40 hover:text-primary transition-colors flex items-center gap-1.5 bg-surface-lowest/50 px-2.5 py-1.5 rounded-md border border-surface-bright/10"
                >
                  {isFullScreen ? <Minimize size={14} /> : <Maximize size={14} />}
                  <span className="text-[10px] uppercase tracking-wider">{isFullScreen ? 'Exit' : 'Full'}</span>
                </button>
              </div>
            </div>

            {/* If optimized tab is active, show the suggested query */}
            {activeTab === "optimized" && optimizedQueryText && (
              <div className="mb-4 bg-green-950/20 p-4 rounded border border-green-500/20">
                <p className="text-green-400 text-xs font-bold uppercase tracking-wider mb-2">Suggested Optimized Query:</p>
                <code className="text-white/80 font-mono text-sm whitespace-pre-wrap">{optimizedQueryText}</code>
              </div>
            )}

            {/* Graph Container */}
            <div className={`bg-surface-lowest/50 rounded-lg ${isFullScreen ? 'flex-1 min-h-0' : 'h-125 w-full'} relative border border-surface-bright/10 overflow-hidden`}>
              {currentGraph ? (
                <PlanGraph {...currentGraph} />
              ) : (
                <p className="font-mono text-xs opacity-20 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                  AWAITING QUERY...
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-100 flex flex-col gap-3 pointer-events-none max-w-sm">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto px-4 py-3 rounded-xl border backdrop-blur-md shadow-2xl transition-all duration-300 flex items-center gap-3 animate-slide-in ${
              toast.type === 'success' 
                ? 'bg-green-500/10 border-green-500/20 text-green-400 shadow-green-500/5' 
                : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/20 text-red-400 shadow-red-500/5'
                : 'bg-primary/10 border-primary/20 text-primary shadow-primary/5'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={16} className="shrink-0" />}
            {toast.type === 'error' && <AlertCircle size={16} className="shrink-0" />}
            <span className="font-sans text-xs font-medium tracking-wide">{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;
