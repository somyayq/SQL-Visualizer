import { useState, useRef } from "react";
import { SqlEditor } from "../components/Editor/SqlEditor";
import PlanGraph from "../components/Graph/PlanGraph";
import { getPlan, optimizeQuery } from "../services/api";
import { transformPlan } from "../utils/transform";
import { Maximize, Minimize } from "lucide-react";
import { Navbar } from "../components/Navbar";
import { PerformanceHud } from "../components/PerformanceHud";
import { RightSidebar } from "../components/RightSidebar";
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
  const { history, saveToHistory, clearHistory } = useQueryHistory();
  const { config: dbConfig, setConfig: setDbConfig } = useDatabaseConfig();

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
      saveToHistory(q, plan.nodes[0]?.rows, plan.nodes[0]?.cost);
      
      // Auto-scroll to graph with slight delay to ensure it renders first
      setTimeout(() => {
        graphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      console.error("Query failed", error);
      setErrorDetails(error);
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
      saveToHistory(q, plan.nodes[0]?.rows, plan.nodes[0]?.cost);

      // Then we get the optimized plan
      const optResult = await optimizeQuery(q, dbConfig);
      setOptimizedQueryText(optResult.optimizedQuery);
      setOptimizedGraph(transformPlan(optResult.plan));
      setActiveTab("optimized");
      
      setTimeout(() => {
        graphRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 100);
    } catch (error) {
      console.error("Optimization failed", error);
      setErrorDetails(error);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleSelectHistory = (q: string) => {
    setQuery(q);
  };

  const currentGraph = activeTab === "original" ? graph : (optimizedGraph || graph);

  return (
    <div className="max-w-350 mx-auto min-h-screen p-8 flex flex-col gap-10">
      {/* 1. APP HEADER */}
      <Navbar />

      {/* 2. PERFORMANCE HUD */}
      <PerformanceHud />

      <div className="grid grid-cols-12 gap-8 items-start">
        {/* LEFT: Editor & Visualizer */}
        <div className="col-span-8 flex flex-col gap-8">
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
            <div className="flex justify-between items-center mb-8">
              <div className="flex flex-col gap-2">
                <h3 className="font-display uppercase text-[20px] tracking-[0.4em] text-white/40">
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

              <div className="flex items-center gap-4">
                <span className={`font-mono text-[15px] ${activeTab === 'optimized' ? 'text-green-400' : 'text-primary'}`}>
                  NODES: {currentGraph ? currentGraph.nodes.length : "0"}
                </span>
                <button 
                  onClick={() => setIsFullScreen(!isFullScreen)}
                  className="text-white/40 hover:text-primary transition-colors flex items-center gap-2 bg-surface-lowest/50 px-3 py-1.5 rounded-md border border-surface-bright/10"
                >
                  {isFullScreen ? <Minimize size={16} /> : <Maximize size={16} />}
                  <span className="text-xs uppercase tracking-wider">{isFullScreen ? 'Minimize' : 'Fullscreen'}</span>
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

        {/* RIGHT: Sidebar */}
        <RightSidebar 
          history={history} 
          onSelectQuery={handleSelectHistory} 
          onClearHistory={clearHistory} 
          dbConfig={dbConfig}
          onSaveDbConfig={setDbConfig}
        />
      </div>
    </div>
  );
};

export default Home;
