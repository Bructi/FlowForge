import { memo } from 'react'
import { NodeProps } from 'reactflow'
import BaseNode from './BaseNode'

const PROVIDER_ICONS: Record<string, string> = {
  ollama: '🦙', openai: '🤖', gemini: '✨', claude: '🧠', deepseek: '🔍', groq: '⚡',
}

export default memo(function AINode(props: NodeProps) {
  const { data } = props
  const icon = PROVIDER_ICONS[data.provider] || '🤖'
  return (
    <BaseNode {...props} icon={icon} color="#7c3aed" bgColor="#f5f3ff" textColor="#5b21b6">
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Provider</span>
          <span className="font-medium text-slate-700">{data.provider || 'ollama'}</span>
        </div>
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Model</span>
          <span className="font-medium text-slate-700 font-mono truncate max-w-[80px]">{data.model || 'llama3.2'}</span>
        </div>
        {data.systemPrompt && (
          <div className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {data.systemPrompt}
          </div>
        )}
      </div>
    </BaseNode>
  )
})
