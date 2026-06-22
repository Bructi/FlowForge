import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function JSONParserNode(props: NodeProps) {
  return <BaseNode {...props} icon="{ }" color="#059669" bgColor="#f0fdf4" textColor="#065f46"><p className="text-xs text-slate-400">Parse/Stringify JSON</p></BaseNode>
});
