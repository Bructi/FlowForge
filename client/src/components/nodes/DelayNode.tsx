import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function DelayNode(props: NodeProps) {
  return <BaseNode {...props} icon="⏱️" color="#d97706" bgColor="#fffbeb" textColor="#92400e"><p className="text-xs text-slate-400">{props.data.delaySeconds ?? 1}s delay</p></BaseNode>
});
