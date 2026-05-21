import { useState, useRef } from "react";
import { SqlEditor } from "../components/Editor/SqlEditor";
import PlanGraph from "../components/Graph/PlanGraph";
import { getPlan, optimizeQuery } from "../services/api";
import { transformPlan } from "../utils/transform";
import { Maximize, Minimize, Copy, FileJson, CheckCircle2, AlertCircle } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { PerformanceHud } from "../components/PerformanceHud";
import { RightSidebar } from "../components/RightSidebar";
import { useQueryHistory } from "../hooks/useQueryHistory";
import { useDatabaseConfig, type DatabaseConfig } from "../hooks/useDatabaseConfig";

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
  const { config: dbConfig, setConfig: setDbConfig, status: dbStatus, errorMessage: dbErrorMessage } = useDatabaseConfig();

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



  const handleSaveDbConfig = (newConfig: DatabaseConfig) => {
    setDbConfig(newConfig);
  };

  const handleImportHistory = (importedHistory: any[]) => {
    setHistoryList(importedHistory);
    showToast(`Successfully imported ${importedHistory.length} query history items!`, 'success');
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

  return (
    <div className="max-w-350 mx-auto min-h-screen p-8 flex flex-col gap-10">
      {/* 1. APP HEADER */}
      <Navbar />

      {/* 2. PERFORMANCE HUD */}
      <PerformanceHud />

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT: Editor & Visualizer (decreased to 7 columns to accommodate sidebar's 5 columns) */}
        <div className="col-span-7 flex flex-col gap-8">
          <SqlEditor 
            query={query} 
            setQuery={setQuery} 
            onRun={handleRun} 
            onOptimize={handleOptimize}
            isLoading={loading} 
            isOptimizing={isOptimizing}
            errorDetails={errorDetails} 
          />

          <div 
            ref={graphRef}
            className={`${isFullScreen ? 'fixed inset-4 z-50 flex flex-col bg-[#0b0c10] shadow-[0_0_100px_rgba(0,0,0,0.8)]' : 'bg-surface-low'} rounded-xl p-8 border border-surface-bright/5 transition-all duration-300`}
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

        {/* RIGHT: Sidebar (increased to 5 columns) */}
        <RightSidebar 
          history={history} 
          onSelectQuery={handleSelectHistory} 
          onClearHistory={clearHistory} 
          dbConfig={dbConfig}
          onSaveDbConfig={handleSaveDbConfig}
          dbStatus={dbStatus}
          dbErrorMessage={dbErrorMessage}
          activeQuery={query}
          onImportHistory={handleImportHistory}
        />
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
