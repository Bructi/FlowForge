import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function RESTAPINode(props: NodeProps) {
  return <BaseNode {...props} icon="🌍" color="#0891b2" bgColor="#ecfeff" textColor="#155e75"><div className="space-y-1"><p className="text-xs font-semibold text-cyan-700">{props.data.method || 'GET'}</p><p className="text-xs text-slate-400 font-mono truncate max-w-[150px]">{props.data.url || 'API Endpoint'}</p></div></BaseNode>
});
