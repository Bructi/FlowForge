import { memo } from 'react'; import { NodeProps } from 'reactflow'; import BaseNode from './BaseNode';
export default memo(function FileUploadNode(props: NodeProps) {
  return <BaseNode {...props} icon="📁" color="#7c3aed" bgColor="#f5f3ff" textColor="#5b21b6" hasInput={false}><p className="text-slate-400 text-xs">{props.data.accept || 'Any file type'}</p></BaseNode>
});
