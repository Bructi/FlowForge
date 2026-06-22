import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function SQLiteQueryNode(props: NodeProps) {
  return <BaseNode {...props} icon="🗄️" color="#dc2626" bgColor="#fef2f2" textColor="#991b1b"><p className="text-xs text-slate-400">SQLite operation</p></BaseNode>
});
