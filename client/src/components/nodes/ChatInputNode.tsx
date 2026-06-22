import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function ChatInputNode(props: NodeProps) {
  return <BaseNode {...props} icon="💬" color="#0284c7" bgColor="#f0f9ff" textColor="#0369a1" hasInput={false}><p className="text-slate-400 text-xs">Chat / user message input</p></BaseNode>
});
