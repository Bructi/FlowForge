import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function FilterNode(props: NodeProps) {
  return <BaseNode {...props} icon="🔽" color="#d97706" bgColor="#fffbeb" textColor="#92400e"><p className="text-xs text-slate-400 font-mono truncate">{props.data.condition || 'filter expression'}</p></BaseNode>
});
