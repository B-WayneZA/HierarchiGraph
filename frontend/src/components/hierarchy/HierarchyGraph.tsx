import React, { useState, useEffect, useCallback } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import axios from 'axios';
import { ZoomIn, ZoomOut, RotateCcw, Download } from 'lucide-react';

interface Node {
  id: string;
  name: string;
  position: string;
  department: string;
  avatar: string;
  val: number;
  x?: number;
  y?: number;
}

interface Link {
  source: string;
  target: string;
}

interface GraphData {
  nodes: Node[];
  links: Link[];
}

const HierarchyGraph: React.FC = () => {
  const [graphData, setGraphData] = useState<GraphData>({ nodes: [], links: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);

  useEffect(() => {
    fetchHierarchyData();
  }, []);

  const fetchHierarchyData = async () => {
    try {
      const response = await axios.get('/api/employees/hierarchy/tree');
      const employees = response.data;
      
      const nodes: Node[] = [];
      const links: Link[] = [];

      // Convert tree data to graph format
      const processEmployee = (employee: any, level: number = 0) => {
        nodes.push({
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employee.position,
          department: employee.department,
          avatar: employee.gravatarUrl,
          val: Math.max(20 - level * 2, 8) // Size based on hierarchy level
        });

        if (employee.children) {
          employee.children.forEach((child: any) => {
            links.push({
              source: employee._id,
              target: child._id
            });
            processEmployee(child, level + 1);
          });
        }
      };

      // Process all root employees (those without managers)
      employees.forEach((employee: any) => {
        if (!employee.managerId) {
          processEmployee(employee);
        }
      });

      setGraphData({ nodes, links });
    } catch (error) {
      console.error('Error fetching hierarchy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-6"></div>
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Organization Chart</h1>
        <p className="text-gray-600 mt-2">Visual representation of your organization's hierarchy</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  const fg = document.querySelector('canvas')?.parentElement?.querySelector('canvas');
                  if (fg) {
                    // Reset zoom
                    fg.style.transform = 'scale(1) translate(0px, 0px)';
                  }
                }}
                className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Reset
              </button>
            </div>
            
            <div className="text-sm text-gray-600">
              {graphData.nodes.length} employees, {graphData.links.length} relationships
            </div>
          </div>
        </div>

        <div className="relative h-96">
          <ForceGraph2D
            graphData={graphData}
            nodeLabel={(node: Node) => `
              <div style="background: white; padding: 8px; border-radius: 4px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
                <div style="font-weight: bold; margin-bottom: 4px;">${node.name}</div>
                <div style="font-size: 12px; color: #666;">${node.position}</div>
                <div style="font-size: 12px; color: #666;">${node.department}</div>
              </div>
            `}
            nodeCanvasObject={(node: Node, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12/globalScale;
              ctx.font = `${fontSize}px Inter`;
              const textWidth = ctx.measureText(label).width;
              const bckgDimensions = [textWidth, fontSize].map(n => n + fontSize * 0.2);

              // Draw avatar
              const img = new Image();
              img.src = node.avatar;
              ctx.save();
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
              ctx.closePath();
              ctx.clip();
              ctx.drawImage(img, node.x! - node.val, node.y! - node.val, node.val * 2, node.val * 2);
              ctx.restore();

              // Draw border
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
              ctx.strokeStyle = selectedNode?.id === node.id ? '#3b82f6' : '#e5e7eb';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Draw label background
              ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
              ctx.fillRect(
                node.x! - bckgDimensions[0] / 2,
                node.y! + node.val + 5,
                bckgDimensions[0],
                bckgDimensions[1]
              );

              // Draw label text
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillStyle = '#374151';
              ctx.fillText(
                label,
                node.x!,
                node.y! + node.val + 5 + bckgDimensions[1] / 2
              );
            }}
            linkColor={() => '#d1d5db'}
            linkWidth={1}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
            cooldownTicks={100}
            nodeRelSize={6}
            d3VelocityDecay={0.3}
          />
        </div>

        {selectedNode && (
          <div className="p-4 border-t border-gray-200 bg-gray-50">
            <div className="flex items-center space-x-4">
              <img
                src={selectedNode.avatar}
                alt={selectedNode.name}
                className="w-12 h-12 rounded-full border-2 border-gray-200"
              />
              <div>
                <h3 className="font-semibold text-gray-900">{selectedNode.name}</h3>
                <p className="text-sm text-gray-600">{selectedNode.position}</p>
                <p className="text-sm text-gray-500">{selectedNode.department}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HierarchyGraph;
