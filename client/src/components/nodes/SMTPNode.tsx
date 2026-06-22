import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function SMTPNode(props: NodeProps) {
  return <BaseNode {...props} icon="📨" color="#be185d" bgColor="#fdf2f8" textColor="#831843"><p className="text-xs text-slate-400">Send Email</p></BaseNode>
});
