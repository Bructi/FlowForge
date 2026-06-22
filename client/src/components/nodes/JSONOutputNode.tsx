import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function JSONOutputNode(props: NodeProps) {
  return <BaseNode {...props} icon="{ }" color="#374151" bgColor="#f8fafc" textColor="#334155" hasOutput={false}><p className="text-xs text-slate-400">Final JSON Output</p></BaseNode>
});
