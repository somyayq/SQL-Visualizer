import { memo } from "react";
import { Handle, Position, type NodeProps } from "reactflow";
import { Database, Filter, GitMerge, Scan, Search, Flame } from "lucide-react";

export interface PlanNodeData {
  label?: string;
  type?: string;
  rows?: number | string;
  cost?: number | string;
  isBottleneck?: boolean;
}

const getNodeConfig = (type: string) => {
  const t = type?.toLowerCase() || '';
  if (t.includes('join')) return { border: 'border-purple-500', bg: 'bg-purple-500/10', text: 'text-purple-400', icon: GitMerge };
  if (t.includes('scan')) return { border: 'border-green-500', bg: 'bg-green-500/10', text: 'text-green-400', icon: Scan };
  if (t.includes('filter')) return { border: 'border-orange-500', bg: 'bg-orange-500/10', text: 'text-orange-400', icon: Filter };
  if (t.includes('select')) return { border: 'border-blue-500', bg: 'bg-blue-500/10', text: 'text-blue-400', icon: Search };
  return { border: 'border-surface-bright/20', bg: 'bg-surface-low', text: 'text-white/60', icon: Database };
};

const PlanNode = ({ data }: NodeProps<PlanNodeData>) => {
  const config = getNodeConfig(data.label || data.type || '');
  const Icon = config.icon;
  const isBottleneck = data.isBottleneck;
  
  return (
    <div className={`px-4 py-3 rounded-xl border min-w-50 flex flex-col gap-3 backdrop-blur-md shadow-lg transition-transform hover:scale-[1.02] relative ${isBottleneck ? 'border-red-500/80 bg-red-950/40 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.3)]' : `${config.border} ${config.bg}`}`}>
      
      {isBottleneck && (
        <div className="absolute -top-3 -right-3 bg-red-500 text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded-full flex items-center gap-1 shadow-lg animate-bounce">
          <Flame size={10} /> Bottleneck
        </div>
      )}

      <Handle type="target" position={Position.Top} className={`w-3 h-3 bg-background border-2 ${isBottleneck ? 'border-red-500' : 'border-primary'}`} />
      
      <div className={`flex items-center justify-center gap-2 font-display font-bold text-sm tracking-wide ${isBottleneck ? 'text-red-400' : config.text} uppercase text-center`}>
        <Icon size={16} className="opacity-80" />
        {data.label || data.type || 'Node'}
      </div>
      
      <div className={`flex justify-between items-center px-3 py-2 rounded-md text-[11px] font-mono border ${isBottleneck ? 'bg-red-950/60 border-red-500/20' : 'bg-background/50 border-white/5'}`}>
        <span className={isBottleneck ? 'text-red-300/60' : 'text-white/40'}>EST. ROWS: <strong className={isBottleneck ? 'text-red-300' : 'text-white/80'}>{data.rows ?? '-'}</strong></span>
        <span className={isBottleneck ? 'text-red-300/60' : 'text-white/40'}>EST. COST: <strong className={isBottleneck ? 'text-red-300' : 'text-white/80'}>{data.cost ?? '-'}</strong></span>
      </div>

      <Handle type="source" position={Position.Bottom} className={`w-3 h-3 bg-background border-2 ${isBottleneck ? 'border-red-500' : 'border-primary'}`} />
    </div>
  );
};

export default memo(PlanNode);
