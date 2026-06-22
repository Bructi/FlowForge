import { create } from 'zustand'
import { Node, Edge } from 'reactflow'

interface WorkflowState {
  nodes: Node[]
  edges: Edge[]
  workflowId: string | null
  workflowName: string
  isDirty: boolean
  isLoading: boolean
  isSaving: boolean
  selectedNodeId: string | null
  executionId: string | null
  isExecuting: boolean

  setWorkflow: (id: string, name: string, nodes: Node[], edges: Edge[]) => void
  setNodes: (nodes: Node[]) => void
  setEdges: (edges: Edge[]) => void
  addNode: (node: Node) => void
  updateNodeData: (id: string, data: Partial<Node['data']>) => void
  deleteNode: (id: string) => void
  setSelectedNodeId: (id: string | null) => void
  setDirty: (v: boolean) => void
  setIsSaving: (v: boolean) => void
  setExecutionId: (id: string | null) => void
  setIsExecuting: (v: boolean) => void
  reset: () => void
}

export const useWorkflowStore = create<WorkflowState>((set) => ({
  nodes: [],
  edges: [],
  workflowId: null,
  workflowName: 'Untitled Workflow',
  isDirty: false,
  isLoading: false,
  isSaving: false,
  selectedNodeId: null,
  executionId: null,
  isExecuting: false,

  setWorkflow: (id, name, nodes, edges) => set({ workflowId: id, workflowName: name, nodes, edges, isDirty: false }),
  setNodes: (nodes) => set({ nodes, isDirty: true }),
  setEdges: (edges) => set({ edges, isDirty: true }),
  addNode: (node) => set((s) => ({ nodes: [...s.nodes, node], isDirty: true })),
  updateNodeData: (id, data) => set((s) => ({
    nodes: s.nodes.map((n) => n.id === id ? { ...n, data: { ...n.data, ...data } } : n),
    isDirty: true,
  })),
  deleteNode: (id) => set((s) => ({
    nodes: s.nodes.filter((n) => n.id !== id),
    edges: s.edges.filter((e) => e.source !== id && e.target !== id),
    isDirty: true,
    selectedNodeId: s.selectedNodeId === id ? null : s.selectedNodeId,
  })),
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setDirty: (v) => set({ isDirty: v }),
  setIsSaving: (v) => set({ isSaving: v }),
  setExecutionId: (id) => set({ executionId: id }),
  setIsExecuting: (v) => set({ isExecuting: v }),
  reset: () => set({ nodes: [], edges: [], workflowId: null, isDirty: false, selectedNodeId: null }),
}))
