import { memo, ReactNode } from 'react'
import { Handle, Position, NodeProps } from 'reactflow'
import { clsx } from 'clsx'

interface BaseNodeProps extends NodeProps {
  icon: string
  color: string
  bgColor: string
  textColor: string
  hasInput?: boolean
  hasOutput?: boolean
  hasOutputTrue?: boolean
  hasOutputFalse?: boolean
  children?: ReactNode
  compact?: boolean
}

const BaseNode = memo(function BaseNode({
  data, selected, icon, color, bgColor, textColor,
  hasInput = true, hasOutput = true, hasOutputTrue, hasOutputFalse,
  children, compact
}: BaseNodeProps) {
  return (
    <div
      className={clsx(
        'flow-node min-w-[180px]',
        selected && 'selected',
      )}
      style={{ borderColor: selected ? color : undefined }}
    >
      {hasInput && (
        <Handle
          type="target"
          position={Position.Left}
          style={{ background: color, left: -6 }}
        />
      )}

      {/* Header */}
      <div
        className="flow-node-header"
        style={{ background: bgColor, color: textColor }}
      >
        <span className="text-base leading-none">{icon}</span>
        <span className="truncate flex-1 text-xs">{data.label || 'Node'}</span>
      </div>

      {/* Body */}
      {!compact && children && (
        <div className="flow-node-body">
          {children}
        </div>
      )}

      {hasOutput && !hasOutputTrue && !hasOutputFalse && (
        <Handle
          type="source"
          position={Position.Right}
          style={{ background: color, right: -6 }}
        />
      )}
      {hasOutputTrue && (
        <Handle
          id="true"
          type="source"
          position={Position.Right}
          style={{ background: '#059669', right: -6, top: '35%' }}
        />
      )}
      {hasOutputFalse && (
        <Handle
          id="false"
          type="source"
          position={Position.Right}
          style={{ background: '#dc2626', right: -6, top: '65%' }}
        />
      )}
    </div>
  )
})

export default BaseNode
