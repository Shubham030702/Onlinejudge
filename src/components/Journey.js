import React, { useEffect, useState, useMemo } from 'react';
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  Handle,
  Position,
  MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import { useNavigate } from 'react-router-dom';
import Loader from './loader';
import './Journey.css';

const API_URL = process.env.REACT_APP_API_URL || (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' ? 'http://localhost:5000' : 'https://onlinejudge-2.onrender.com');

// Custom Node Component
const ProblemNode = ({ data }) => {
  const { label, difficulty, status, onClick } = data;

  const difficultyClass = useMemo(() => {
    if (difficulty === 'Easy') return 'diff-easy';
    if (difficulty === 'Medium') return 'diff-medium';
    return 'diff-hard';
  }, [difficulty]);

  return (
    <div
      className={`custom-problem-node node-${status}`}
      onClick={status !== 'locked' ? onClick : undefined}
    >
      <Handle type="target" position={Position.Top} className="flow-handle" />
      <div className="node-glow" />
      <div className="node-content-wrap">
        <div className="node-top-bar">
          <span className={`journey-status-badge badge-${status}`}>
            {status === 'completed' ? 'Solved' : status === 'unlocked' ? 'Available' : 'Locked'}
          </span>
          <span className={`journey-diff-pill ${difficultyClass}`}>
            {difficulty}
          </span>
        </div>
        <div className="node-title" title={label}>{label}</div>
        <div className="node-footer">
          <span className="node-action-text">
            {status === 'locked' ? 'Complete prerequisites to unlock' : status === 'completed' ? 'Review solution →' : 'Solve challenge →'}
          </span>
        </div>
      </div>
      <Handle type="source" position={Position.Bottom} className="flow-handle" />
    </div>
  );
};

const nodeTypes = { problemNode: ProblemNode };

function Journey() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [errorMsg, setErrorMsg] = useState(null);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  useEffect(() => {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/reactflow@11.11.4/dist/style.css';
    link.id = 'react-flow-cdn-style';
    if (!document.getElementById('react-flow-cdn-style')) {
      document.head.appendChild(link);
    }
  }, []);

  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.15 });
      }, 150);
    }
  }, [reactFlowInstance, nodes]);

  useEffect(() => {
    const fetchJourneyData = async () => {
      try {
        setLoading(true);
        setErrorMsg(null);
        const response = await fetch(`${API_URL}/api/problems`, {
          method: 'GET',
          credentials: 'include',
        });
        if (!response.ok) {
          if (response.status === 401) {
            navigate('/');
            return;
          } else {
            throw new Error(`Server returned status ${response.status}`);
          }
        }
        const data = await response.json();
        const allProblems = data.problems || [];
        const easySubset = allProblems.filter(p => p.difficulty === 'Easy').slice(0, 8);
        const medSubset = allProblems.filter(p => p.difficulty === 'Medium').slice(0, 12);
        const hardSubset = allProblems.filter(p => p.difficulty === 'Hard').slice(0, 8);
        const problems = [...easySubset, ...medSubset, ...hardSubset];
        const solved = (data.solved || []).map(id => id.toString());

        // Build dynamic hierarchical layout
        const adj = {};
        const inDegree = {};
        problems.forEach(p => {
          adj[p._id] = [];
          inDegree[p._id] = 0;
        });

        problems.forEach(p => {
          if (p.prerequisites) {
            p.prerequisites.forEach(prereqId => {
              if (prereqId) {
                const source = prereqId.toString();
                if (adj[source]) {
                  adj[source].push(p._id);
                  inDegree[p._id]++;
                }
              }
            });
          }
        });

        const levels = {};
        const queue = [];
        problems.forEach(p => {
          if (!inDegree[p._id] || inDegree[p._id] === 0) {
            queue.push(p._id);
            levels[p._id] = 0;
          }
        });

        const visited = new Set();
        while (queue.length > 0) {
          const curr = queue.shift();
          if (visited.has(curr)) continue;
          visited.add(curr);

          const currLevel = levels[curr] || 0;

          if (adj[curr]) {
            adj[curr].forEach(neighbor => {
              levels[neighbor] = Math.max(levels[neighbor] || 0, currLevel + 1);
              queue.push(neighbor);
            });
          }
        }

        const levelGroups = {};
        problems.forEach(p => {
          const lvl = levels[p._id] || 0;
          if (!levelGroups[lvl]) levelGroups[lvl] = [];
          levelGroups[lvl].push(p._id);
        });

        const calculatedPositions = {};
        Object.keys(levelGroups).forEach(lvl => {
          const group = levelGroups[lvl];
          const maxNodesPerRow = 5;
          const numRows = Math.ceil(group.length / maxNodesPerRow);
          
          group.forEach((id, index) => {
            const row = Math.floor(index / maxNodesPerRow);
            const col = index % maxNodesPerRow;
            
            const rowCount = (row === numRows - 1) ? (group.length % maxNodesPerRow || maxNodesPerRow) : maxNodesPerRow;
            const rowWidth = rowCount * 280;
            
            const x = (col * 280) - (rowWidth / 2) + 140;
            const y = lvl * 220 + row * 150 + 40;
            calculatedPositions[id] = { x, y };
          });
        });

        // Map nodes
        const flowNodes = problems.map(prob => {
          if (!prob || !prob._id) return null;
          let status = 'unlocked';
          if (solved.includes(prob._id.toString())) {
            status = 'completed';
          } else if (prob.prerequisites && prob.prerequisites.length > 0) {
            const allSolved = prob.prerequisites.every(preId => preId && solved.includes(preId.toString()));
            if (!allSolved) status = 'locked';
          }

          // Handle node click redirection to problem description
          const handleNodeClick = async () => {
            try {
              setLoading(true);
              const res = await fetch(`${API_URL}/api/problem/${prob._id}`, {
                method: 'GET',
                credentials: 'include'
              });
              if (res.ok) {
                const problemData = await res.json();
                navigate(`/problems/${prob._id}`, { state: { problemData } });
              }
            } catch (err) {
              console.error(err);
            } finally {
              setLoading(false);
            }
          };

          const position = (prob.coordinates && (prob.coordinates.x !== 0 || prob.coordinates.y !== 0))
            ? prob.coordinates
            : calculatedPositions[prob._id] || { x: 0, y: 0 };

          return {
            id: prob._id,
            type: 'problemNode',
            data: { 
              label: prob.problemName, 
              difficulty: prob.difficulty,
              status, 
              onClick: handleNodeClick 
            },
            position
          };
        });

        // Map edges
        const flowEdges = [];
        problems.forEach(prob => {
          if (prob && prob._id && prob.prerequisites) {
            prob.prerequisites.forEach(prereqId => {
              if (prereqId) {
                const prereqStr = prereqId.toString();
                const isSourceCompleted = solved.includes(prereqStr);

                flowEdges.push({
                  id: `e-${prereqStr}-${prob._id}`,
                  source: prereqStr,
                  target: prob._id,
                  type: 'smoothstep',
                  animated: isSourceCompleted,
                  style: {
                    stroke: isSourceCompleted ? '#10b981' : '#64748b',
                    strokeWidth: 2.5
                  },
                  markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: isSourceCompleted ? '#10b981' : '#64748b'
                  }
                });
              }
            });
          }
        });

        setNodes(flowNodes.filter(Boolean));
        setEdges(flowEdges);

      } catch (error) {
        console.error('Error fetching journey flow:', error);
        setErrorMsg(error.message || "Failed to load journey map");
      } finally {
        setLoading(false);
      }
    };

    fetchJourneyData();
  }, [navigate]);

  const completedCount = useMemo(
    () => nodes.filter(n => n.data?.status === 'completed').length,
    [nodes]
  );

  return (
    <div className="journey-wrapper">
      {loading && <Loader messages={["Constructing Skill Tree...", "Connecting paths...", "Glow mapping..."]} />}
      
      <div className="journey-header">
        <div className="journey-header-left">
          <h1>Learn Journey</h1>
          <p>Unlock problems step-by-step. Solve highlighted nodes to advance along paths.</p>
          {errorMsg && <p style={{ color: '#ef4444', marginTop: '8px', fontWeight: 'bold' }}>⚠️ Error: {errorMsg}</p>}
        </div>

        <div className="journey-legend">
          <span className="legend-progress">{completedCount} / {nodes.length} Solved</span>
          <span className="legend-item"><span className="legend-dot completed" />Solved</span>
          <span className="legend-item"><span className="legend-dot unlocked" />Available</span>
          <span className="legend-item"><span className="legend-dot locked" />Locked</span>
        </div>
      </div>

      <div className="journey-flow-container">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onInit={setReactFlowInstance}
          style={{ width: '100%', height: '100%' }}
          proOptions={{ hideAttribution: true }}
          minZoom={0.25}
          maxZoom={1.5}
          fitView
          fitViewOptions={{ padding: 0.12 }}
        >
          <Background variant="dots" gap={22} size={1.5} color="#30363d" />
          <Controls position="bottom-left" showInteractive={false} />
          <MiniMap
            position="bottom-right"
            pannable
            zoomable
            nodeColor={(node) => {
              if (node.data?.status === 'completed') return '#10b981';
              if (node.data?.status === 'unlocked') return '#38bdf8';
              return '#484f58';
            }}
            maskColor="rgba(13, 17, 23, 0.75)"
          />
        </ReactFlow>
      </div>
    </div>
  );
}

export default Journey;
