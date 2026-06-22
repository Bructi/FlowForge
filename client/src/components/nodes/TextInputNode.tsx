import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function TextInputNode(props: NodeProps) {
  return <BaseNode {...props} icon="📝" color="#2563eb" bgColor="#eff6ff" textColor="#1e40af" hasInput={false}><p className="text-slate-400 text-xs truncate">{props.data.placeholder || props.data.value || 'Text input node'}</p></BaseNode>
});
