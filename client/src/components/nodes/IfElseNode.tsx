import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function IfElseNode(props: NodeProps) {
  return <BaseNode {...props} icon="🔀" color="#d97706" bgColor="#fffbeb" textColor="#92400e" hasOutputTrue hasOutputFalse><div className="space-y-1.5"><p className="text-xs text-slate-500 font-mono truncate">{props.data.condition || 'condition'}</p><div className="flex justify-between text-xs"><span className="text-emerald-600">✓ True</span><span className="text-red-500">✗ False</span></div></div></BaseNode>
});
