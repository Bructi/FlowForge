import { useCallback, useEffect, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import ReactFlow, {
  Background, Controls, MiniMap, Panel,
  addEdge, useNodesState, useEdgesState,
  Connection, ReactFlowProvider, Node, Edge, BackgroundVariant,
} from 'reactflow'
import 'reactflow/dist/style.css'
import { useQuery, useMutation } from '@tanstack/react-query'
import toast from 'react-hot-toast'
import { workflowsApi, executionsApi } from '../api'
import { useWorkflowStore } from '../store/workflowStore'
import NodePanel from '../components/builder/NodePanel'
import PropertiesPanel from '../components/builder/PropertiesPanel'
import BuilderToolBar from '../components/builder/BuilderToolBar'
import ExecutionDrawer from '../components/builder/ExecutionDrawer'

// Custom node types
import TextInputNode from '../components/nodes/TextInputNode'
import ChatInputNode from '../components/nodes/ChatInputNode'
import FileUploadNode from '../components/nodes/FileUploadNode'
import WebhookNode from '../components/nodes/WebhookNode'
import AINode from '../components/nodes/AINode'
import IfElseNode from '../components/nodes/IfElseNode'
import SwitchNode from '../components/nodes/SwitchNode'
import FilterNode from '../components/nodes/FilterNode'
import LoopNode from '../components/nodes/LoopNode'
import DelayNode from '../components/nodes/DelayNode'
import FormatterNode from '../components/nodes/FormatterNode'
import JSONParserNode from '../components/nodes/JSONParserNode'
import RegexNode from '../components/nodes/RegexNode'
import TextCleanerNode from '../components/nodes/TextCleanerNode'
import CalculatorNode from '../components/nodes/CalculatorNode'
import SQLiteQueryNode from '../components/nodes/SQLiteQueryNode'
import RESTAPINode from '../components/nodes/RESTAPINode'
import SMTPNode from '../components/nodes/SMTPNode'
import TextOutputNode from '../components/nodes/TextOutputNode'
import JSONOutputNode from '../components/nodes/JSONOutputNode'
import NotificationNode from '../components/nodes/NotificationNode'

const NODE_TYPES = {
  textInput: TextInputNode,
  chatInput: ChatInputNode,
  fileUpload: FileUploadNode,
  webhook: WebhookNode,
  apiInput: TextInputNode,
  aiNode: AINode,
  ifElse: IfElseNode,
  switchNode: SwitchNode,
  filter: FilterNode,
  loop: LoopNode,
  delay: DelayNode,
  scheduler: DelayNode,
  formatter: FormatterNode,
  jsonParser: JSONParserNode,
  regex: RegexNode,
  textCleaner: TextCleanerNode,
  calculator: CalculatorNode,
  sqliteQuery: SQLiteQueryNode,
  sqliteInsert: SQLiteQueryNode,
  sqliteUpdate: SQLiteQueryNode,
  sqliteDelete: SQLiteQueryNode,
  restAPI: RESTAPINode,
  graphQL: RESTAPINode,
  smtp: SMTPNode,
  gmail: SMTPNode,
  textOutput: TextOutputNode,
  jsonOutput: JSONOutputNode,
  fileOutput: TextOutputNode,
  notification: NotificationNode,
}

function WorkflowBuilderInner() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const reactFlowWrapper = useRef<HTMLDivElement>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<any>(null)
  const [showExecution, setShowExecution] = useState(false)

  const { setWorkflow, setSelectedNodeId, selectedNodeId, setIsSaving, setExecutionId, setIsExecuting, executionId, isExecuting } = useWorkflowStore()

  const [nodes, setNodes, onNodesChange] = useNodesState([])
  const [edges, setEdges, onEdgesChange] = useEdgesState([])

  // Load workflow
  const { data: workflowData } = useQuery({
    queryKey: ['workflow', id],
    queryFn: () => workflowsApi.get(id!),
    enabled: !!id,
  })

  useEffect(() => {
    if (workflowData?.data?.data?.workflow) {
      const wf = workflowData.data.data.workflow
      const graph = wf.graph || { nodes: [], edges: [] }
      setNodes(graph.nodes || [])
      setEdges(graph.edges || [])
      setWorkflow(wf.id, wf.name, graph.nodes || [], graph.edges || [])
    }
  }, [workflowData])

  // Auto-save
  const saveMutation = useMutation({
    mutationFn: () => workflowsApi.update(id!, { graph: { nodes, edges } }),
    onSuccess: () => { setIsSaving(false) },
    onError: () => { setIsSaving(false); toast.error('Failed to save') },
  })

  const saveTimeoutRef = useRef<any>(null)
  const triggerAutoSave = useCallback(() => {
    setIsSaving(true)
    clearTimeout(saveTimeoutRef.current)
    saveTimeoutRef.current = setTimeout(() => saveMutation.mutate(), 2000)
  }, [nodes, edges])

  // Run workflow
  const runMutation = useMutation({
    mutationFn: () => executionsApi.run(id!),
    onSuccess: (res) => {
      setExecutionId(res.data.data.executionId)
      setIsExecuting(true)
      setShowExecution(true)
      toast.success('Workflow started!')
    },
    onError: (e: any) => toast.error(e.response?.data?.error?.message || 'Failed to run'),
  })

  // Drag and drop
  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
  }, [])

  const onDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    const type = event.dataTransfer.getData('application/reactflow-type')
    const label = event.dataTransfer.getData('application/reactflow-label')
    if (!type || !reactFlowInstance || !reactFlowWrapper.current) return

    const bounds = reactFlowWrapper.current.getBoundingClientRect()
    const position = reactFlowInstance.project({
      x: event.clientX - bounds.left,
      y: event.clientY - bounds.top,
    })

    const newNode: Node = {
      id: `node_${Date.now()}`,
      type,
      position,
      data: { label, provider: 'ollama', model: 'llama3.2', temperature: 0.7, maxTokens: 2000 },
    }

    setNodes((nds) => [...nds, newNode])
    triggerAutoSave()
  }, [reactFlowInstance, triggerAutoSave])

  const onConnect = useCallback((connection: Connection) => {
    setEdges((eds) => addEdge({ ...connection, animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } }, eds))
    triggerAutoSave()
  }, [triggerAutoSave])

  const onNodeClick = useCallback((_: any, node: Node) => {
    setSelectedNodeId(node.id)
  }, [])

  const onPaneClick = useCallback(() => setSelectedNodeId(null), [])

  return (
    <div className="flex h-[calc(100vh-56px)] overflow-hidden bg-[#f8f9ff]">
      {/* Left panel — Node palette */}
      <NodePanel />

      {/* Canvas */}
      <div className="flex-1 relative" ref={reactFlowWrapper}>
        <BuilderToolBar
          onSave={() => saveMutation.mutate()}
          onRun={() => runMutation.mutate()}
          onShowExecution={() => setShowExecution(true)}
          isRunning={isExecuting}
          isSaving={saveMutation.isPending}
        />

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={(changes) => { onNodesChange(changes); triggerAutoSave() }}
          onEdgesChange={(changes) => { onEdgesChange(changes); triggerAutoSave() }}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onNodeClick={onNodeClick}
          onPaneClick={onPaneClick}
          nodeTypes={NODE_TYPES}
          snapToGrid
          snapGrid={[16, 16]}
          fitView
          fitViewOptions={{ padding: 0.2 }}
          proOptions={{ hideAttribution: true }}
          defaultEdgeOptions={{ animated: true, style: { stroke: '#7c3aed', strokeWidth: 2 } }}
        >
          <Background variant={BackgroundVariant.Dots} gap={24} size={1} color="#e2e8f0" />
          <Controls className="shadow-sm" />
          <MiniMap
            style={{ width: 160, height: 100 }}
            nodeColor={(n) => {
              if (n.type?.includes('Output') || n.type === 'textOutput' || n.type === 'jsonOutput') return '#059669'
              if (n.type === 'aiNode') return '#7c3aed'
              if (n.type === 'ifElse' || n.type === 'switchNode') return '#d97706'
              return '#3b82f6'
            }}
          />
          <Panel position="top-center">
            {isExecuting && (
              <div className="bg-blue-600 text-white text-xs px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
                Workflow is running...
              </div>
            )}
          </Panel>
        </ReactFlow>
      </div>

      {/* Right panel — Properties */}
      {selectedNodeId && (
        <PropertiesPanel
          nodeId={selectedNodeId}
          nodes={nodes}
          onUpdate={(id, data) => {
            setNodes((nds) => nds.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n))
            triggerAutoSave()
          }}
          onDelete={(id) => {
            setNodes((nds) => nds.filter((n) => n.id !== id))
            setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id))
            setSelectedNodeId(null)
            triggerAutoSave()
          }}
        />
      )}

      {/* Execution drawer */}
      {showExecution && (
        <ExecutionDrawer executionId={executionId} onClose={() => setShowExecution(false)} />
      )}
    </div>
  )
}

export default function WorkflowBuilderPage() {
  return (
    <ReactFlowProvider>
      <WorkflowBuilderInner />
    </ReactFlowProvider>
  )
}
