import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function WebhookNode(props: NodeProps) {
  return <BaseNode {...props} icon="🔗" color="#059669" bgColor="#f0fdf4" textColor="#065f46" hasInput={false}><p className="text-slate-400 text-xs font-mono truncate">POST /webhooks/{props.data.path || 'trigger'}</p></BaseNode>
});
