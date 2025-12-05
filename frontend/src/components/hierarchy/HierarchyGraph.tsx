import React, { useState, useEffect, useCallback, useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { RotateCcw } from 'lucide-react';
import * as d3 from 'd3';


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
  const [ graphData, setGraphData ] = useState<GraphData>({ nodes: [], links: [] });
  const [ isLoading, setIsLoading ] = useState(true);
  const [ selectedNode, setSelectedNode ] = useState<Node | null>(null);

  const graphRef = useRef<any>(null);

  useEffect(() => {
    mockFetchHierarchyData();
  }, []);

  // -------------------------
  // MOCKED EMPLOYEE HIERARCHY
  // -------------------------
  const MOCK_DATA = [
    {
      _id: "ceo1",
      firstName: "Alice",
      lastName: "Johnson",
      position: "CEO",
      department: "Executive",
      gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000001",
      children: [
        {
          _id: "mgr1",
          firstName: "Bob",
          lastName: "Smith",
          position: "Head of Engineering",
          department: "Engineering",
          gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000002",
          children: [
            {
              _id: "dev1",
              firstName: "Charlie",
              lastName: "Brown",
              position: "Software Engineer",
              department: "Engineering",
              gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000003",
              children: []
            },
            {
              _id: "dev2",
              firstName: "Diana",
              lastName: "Taylor",
              position: "Software Engineer",
              department: "Engineering",
              gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000004",
              children: []
            }
          ]
        },
        {
          _id: "mgr2",
          firstName: "Ethan",
          lastName: "Williams",
          position: "Head of HR",
          department: "Human Resources",
          gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000005",
          children: [
            {
              _id: "hr1",
              firstName: "Fiona",
              lastName: "Adams",
              position: "HR Consultant",
              department: "Human Resources",
              gravatarUrl: "https://www.gravatar.com/avatar/00000000000000000000000000000006",
              children: []
            }
          ]
        }
      ]
    }
  ];

  const mockFetchHierarchyData = async () => {
    try {
      const employees = MOCK_DATA;

      const nodes: Node[] = [];
      const links: Link[] = [];
      const levelMap: Record<number, Node[]> = {};

      // Build nodes & links, track hierarchy levels
      const processEmployee = (employee: any, level: number = 0) => {
        const node: Node = {
          id: employee._id,
          name: `${employee.firstName} ${employee.lastName}`,
          position: employee.position,
          department: employee.department,
          avatar: employee.gravatarUrl,
          val: 12
        };

        nodes.push(node);
        levelMap[ level ] = levelMap[ level ] || [];
        levelMap[ level ].push(node);

        if (employee.children) {
          employee.children.forEach((child: any) => {
            links.push({ source: employee._id, target: child._id });
            processEmployee(child, level + 1);
          });
        }
      };

      employees.forEach(root => processEmployee(root));

      // ------------------------------
      // FORCE TRUE HIERARCHY POSITION
      // ------------------------------
      const VERTICAL_GAP = 150;
      const HORIZONTAL_GAP = 180;

      Object.keys(levelMap).forEach(levelStr => {
        const level = Number(levelStr);
        const row = levelMap[ level ];

        const totalWidth = (row.length - 1) * HORIZONTAL_GAP;

        row.forEach((node, index) => {
          node.x = index * HORIZONTAL_GAP - totalWidth / 2;
          node.y = level * VERTICAL_GAP;
        });
      });


      setGraphData({ nodes, links });
    } catch (error) {
      console.error("Mock fetch error:", error);
    } finally {
      setIsLoading(false);
    }
  };


  useEffect(() => {
    if (!graphRef.current) return;

    const fg = graphRef.current;

    fg.d3Force("charge", d3.forceManyBody().strength(-60));

    fg.d3Force(
      "link",
      d3.forceLink()
        .distance(90)
        .strength(0.7)
    );

    fg.d3Force(
      "y",
      d3.forceY((node: Node, i: number, data: Node[]) => node.y ?? 0).strength(0.05)
    );

    fg.d3Force(
      "x",
      d3.forceX((node: Node, i: number, data: Node[]) => node.x ?? 0).strength(0.02)
    );
  }, [ ]);


  const handleNodeClick = useCallback((node: Node) => {
    setSelectedNode(node);
  }, []);

  const handleBackgroundClick = useCallback(() => {
    setSelectedNode(null);
  }, []);

  if (isLoading) {
    return <div className="p-6 text-gray-700">Loading mock data...</div>;
  }

  // Apply forces

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Organization Chart (Mocked)</h1>
        <p className="text-gray-600 mt-2">This version uses mocked employee hierarchy data.</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center justify-between">
            <button
              onClick={() => {
                const fg = document.querySelector('canvas')?.parentElement?.querySelector('canvas');
                if (fg) fg.style.transform = 'scale(1) translate(0px, 0px)';
              }}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-900"
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Reset
            </button>

            <div className="text-sm text-gray-600">
              {graphData.nodes.length} employees, {graphData.links.length} relationships
            </div>
          </div>
        </div>

        <div className="relative h-96">
          <ForceGraph2D
            graphData={graphData}

            // Smooth physics
            d3AlphaDecay={0.01}
            d3VelocityDecay={0.3}

            // Soft repulsion is set using graphRef below; no need for d3Force here

            nodeRelSize={6}
            enableNodeDrag={true}
            cooldownTicks={200}
            onEngineStop={() => console.log("settled")}
            nodeLabel={(node: Node) => `
              <div style="background: blueviolet; padding: 8px; border-radius: 4px;">
                <strong>${node.name}</strong><br/>
                <span>${node.position}</span><br/>
                <span>${node.department}</span>
              </div>
            `}
            nodeCanvasObject={(node: Node, ctx, globalScale) => {
              const label = node.name;
              const fontSize = 12 / globalScale;
              ctx.font = `${fontSize}px Inter`;

              // Draw avatar
              const img = new Image();
              img.src = node.avatar;
              ctx.save();
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
              ctx.clip();
              ctx.drawImage(img, node.x! - node.val, node.y! - node.val, node.val * 2, node.val * 2);
              ctx.restore();

              // Border
              ctx.beginPath();
              ctx.arc(node.x!, node.y!, node.val, 0, 2 * Math.PI);
              ctx.strokeStyle = selectedNode?.id === node.id ? '#3b82f6' : '#e5e7eb';
              ctx.lineWidth = 2;
              ctx.stroke();

              // Name label
              ctx.textAlign = "center";
              ctx.fillStyle = "#000";
              ctx.fillText(label, node.x!, node.y! + node.val + 12);
            }}
            linkColor={() => '#d1d5db'}
            linkWidth={1}
            onNodeClick={handleNodeClick}
            onBackgroundClick={handleBackgroundClick}
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
