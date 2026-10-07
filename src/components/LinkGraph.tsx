import React, { useState, useRef, useEffect } from 'react';
import { Network, Plus, Trash2, ZoomIn, ZoomOut, RefreshCw, Layers, Shield, User, Globe, Mail, Phone, Search } from 'lucide-react';
import { LinkNode, LinkEdge } from '../types/osint';

interface LinkGraphProps {
  nodes: LinkNode[];
  edges: LinkEdge[];
  onAddNode: (node: LinkNode) => void;
  onRemoveNode: (id: string) => void;
}

export const LinkGraph: React.FC<LinkGraphProps> = ({ nodes, edges, onAddNode, onRemoveNode }) => {
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [newNodeLabel, setNewNodeLabel] = useState<string>('');
  const [newNodeType, setNewNodeType] = useState<LinkNode['type']>('DOMAIN');
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Position nodes radially or in grid if positions are not assigned
  const [positionedNodes, setPositionedNodes] = useState<Array<LinkNode & { x: number; y: number }>>([]);

  useEffect(() => {
    const width = 800;
    const height = 450;
    const center = { x: width / 2, y: height / 2 };

    const computed = nodes.map((n, idx) => {
      if (n.x !== undefined && n.y !== undefined) return { ...n, x: n.x, y: n.y };
      if (idx === 0) return { ...n, x: center.x, y: center.y };

      const angle = ((idx - 1) / Math.max(1, nodes.length - 1)) * 2 * Math.PI;
      const radius = 160 + (idx % 2) * 40;
      return {
        ...n,
        x: center.x + radius * Math.cos(angle),
        y: center.y + radius * Math.sin(angle),
      };
    });

    setPositionedNodes(computed);
  }, [nodes]);

  // Draw network graph on Canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw grid background
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 0.5;
    const gridSize = 30 * zoomLevel;
    for (let x = 0; x < canvas.width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
    }
    for (let y = 0; y < canvas.height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(canvas.width, y);
      ctx.stroke();
    }

    // Map nodes for lookup
    const nodeMap = new Map<string, { x: number; y: number; label: string; type: string }>();
    positionedNodes.forEach((n) => nodeMap.set(n.id, n));

    // Draw Edges
    edges.forEach((edge) => {
      const src = nodeMap.get(edge.source);
      const tgt = nodeMap.get(edge.target);
      if (src && tgt) {
        ctx.beginPath();
        ctx.moveTo(src.x, src.y);
        ctx.lineTo(tgt.x, tgt.y);
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 1.5;
        ctx.setLineDash([4, 4]);
        ctx.stroke();
        ctx.setLineDash([]);

        if (edge.label) {
          const midX = (src.x + tgt.x) / 2;
          const midY = (src.y + tgt.y) / 2;
          ctx.font = '10px monospace';
          ctx.fillStyle = '#94a3b8';
          ctx.fillText(edge.label, midX, midY - 4);
        }
      }
    });

    // Draw Nodes
    positionedNodes.forEach((node) => {
      const isSelected = selectedNodeId === node.id;

      ctx.beginPath();
      ctx.arc(node.x, node.y, isSelected ? 20 : 16, 0, 2 * Math.PI);

      let fillColor = '#0f172a';
      let strokeColor = '#38bdf8';

      if (node.type === 'TARGET') { fillColor = '#0284c7'; strokeColor = '#38bdf8'; }
      else if (node.type === 'DOMAIN') { fillColor = '#0369a1'; strokeColor = '#0284c7'; }
      else if (node.type === 'IP') { fillColor = '#15803d'; strokeColor = '#22c55e'; }
      else if (node.type === 'EMAIL') { fillColor = '#b45309'; strokeColor = '#f59e0b'; }
      else if (node.type === 'USERNAME') { fillColor = '#6d28d9'; strokeColor = '#a855f7'; }
      else if (node.type === 'DORK') { fillColor = '#b91c1c'; strokeColor = '#ef4444'; }

      ctx.fillStyle = fillColor;
      ctx.fill();
      ctx.strokeStyle = isSelected ? '#38bdf8' : strokeColor;
      ctx.lineWidth = isSelected ? 3 : 2;
      ctx.stroke();

      // Label below node
      ctx.font = `${isSelected ? 'bold 11px' : '10px'} monospace`;
      ctx.fillStyle = isSelected ? '#38bdf8' : '#e2e8f0';
      ctx.textAlign = 'center';
      ctx.fillText(node.label, node.x, node.y + 30);
    });
  }, [positionedNodes, edges, selectedNodeId, zoomLevel]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const clickX = (e.clientX - rect.left) * (canvas.width / rect.width);
    const clickY = (e.clientY - rect.top) * (canvas.height / rect.height);

    const hit = positionedNodes.find((n) => {
      const dx = n.x - clickX;
      const dy = n.y - clickY;
      return Math.sqrt(dx * dx + dy * dy) <= 22;
    });

    if (hit) setSelectedNodeId(hit.id);
    else setSelectedNodeId(null);
  };

  const handleCreateNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeLabel.trim()) return;

    const newId = `node-${Date.now()}`;
    const newNode: LinkNode = {
      id: newId,
      label: newNodeLabel.trim(),
      type: newNodeType,
    };

    onAddNode(newNode);
    setNewNodeLabel('');
  };

  const selectedNode = positionedNodes.find((n) => n.id === selectedNodeId);

  return (
    <div className="space-y-6">
      <div className="border border-slate-800 bg-slate-900/60 rounded-lg p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-5 h-5 text-cyan-400" />
            <span>Interactive Visual Link Analysis Graph</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Map relational dependencies across target domains, resolved IP addresses, email accounts, username footprint nodes, and dork vulnerabilities.
          </p>
        </div>

        {/* Add Node Form */}
        <form onSubmit={handleCreateNode} className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={newNodeLabel}
            onChange={(e) => setNewNodeLabel(e.target.value)}
            placeholder="New Node Label..."
            className="bg-slate-950 border border-slate-700 rounded-md px-2.5 py-1.5 text-xs font-mono text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-36"
          />
          <select
            value={newNodeType}
            onChange={(e) => setNewNodeType(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 rounded-md px-2 py-1.5 text-xs font-mono text-cyan-400 focus:outline-none"
          >
            <option value="DOMAIN">DOMAIN</option>
            <option value="IP">IP ADDRESS</option>
            <option value="EMAIL">EMAIL</option>
            <option value="USERNAME">USERNAME</option>
            <option value="DORK">DORK VULN</option>
            <option value="LOCATION">LOCATION</option>
          </select>
          <button
            type="submit"
            className="px-3 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold rounded text-xs flex items-center gap-1 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Node</span>
          </button>
        </form>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Canvas Graph */}
        <div className="lg:col-span-8 border border-slate-800 bg-slate-950 rounded-lg p-2 relative">
          <div className="absolute top-4 right-4 flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded p-1 z-10">
            <button
              onClick={() => setZoomLevel((z) => Math.min(2, z + 0.1))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Zoom In"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.1))}
              className="p-1 hover:bg-slate-800 text-slate-300 rounded"
              title="Zoom Out"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
          </div>

          <canvas
            ref={canvasRef}
            width={800}
            height={450}
            onClick={handleCanvasClick}
            className="w-full h-[450px] cursor-crosshair rounded bg-slate-950"
          />
        </div>

        {/* Selected Node Details Side Panel */}
        <div className="lg:col-span-4 border border-slate-800 bg-slate-900/80 rounded-lg p-4 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono border-b border-slate-800 pb-2">
            Node Detail Inspector
          </h3>

          {selectedNode ? (
            <div className="space-y-3 font-mono text-xs">
              <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
                <span className="text-[10px] text-slate-500 uppercase block">Node ID & Type</span>
                <span className="text-cyan-400 font-bold text-sm block">{selectedNode.label}</span>
                <span className="text-slate-400 text-[11px] block">{selectedNode.type} NODE</span>
              </div>

              {selectedNode.details && (
                <div className="bg-slate-950 border border-slate-800 p-3 rounded space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase block">OSINT Context Payload</span>
                  <p className="text-slate-300 text-[11px] leading-relaxed">{selectedNode.details}</p>
                </div>
              )}

              <button
                onClick={() => { onRemoveNode(selectedNode.id); setSelectedNodeId(null); }}
                className="w-full px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/30 rounded text-xs flex items-center justify-center gap-1 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Remove Node from Graph</span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-slate-500 text-xs font-mono">
              Click any node in the relationship canvas to view or manage parameters.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
