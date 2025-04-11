import React, { useRef, useState } from 'react';
import { 
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import ForceGraph2D from 'react-force-graph-2d';

interface VisualizationPanelProps {
  data: {
    graph: {
      nodes: Array<{
        id: string;
        type: string;
        data: any;
      }>;
      edges: Array<{
        source: string;
        target: string;
        type: string;
        weight: number;
      }>;
    };
    performance: {
      timestamps: number[];
      ratings: number[];
      average_ratings: number[];
      accuracy: number[];
      rating_distribution: Record<string, number>;
      recent_average_rating: number[];
    };
    topics: Record<string, {
      ratings: number[];
      timestamps: number[];
      average_ratings: number[];
    }>;
    agent_version?: number; // Add agent version timestamp (optional)
  };
}

const VisualizationPanel: React.FC<VisualizationPanelProps> = ({ data }) => {
  const graphRef = useRef<any>(null);
  const [selectedNode, setSelectedNode] = useState<any | null>(null);
  const [showNodeDetails, setShowNodeDetails] = useState(false);

  // RL training state
  const [training, setTraining] = useState(false);
  const [trainResult, setTrainResult] = useState<any | null>(null);

  // Format timestamps for display
  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp * 1000);
    return `${date.getHours()}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  // Prepare performance data for charts
  const performanceData = data.performance.timestamps.map((timestamp, index) => ({
    time: formatTimestamp(timestamp),
    rating: data.performance.ratings[index],
    average: data.performance.average_ratings[index],
  }));

  // Prepare topic data for pie chart
  const topicData = Object.entries(data.topics).map(([topic, data]) => {
    const averageRating = data.average_ratings.length > 0 
      ? data.average_ratings[data.average_ratings.length - 1] 
      : 0;
    
    return {
      name: topic,
      value: data.ratings.length,
      averageRating
    };
  });

  // Colors for pie chart
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d'];

  // Prepare graph data for force graph
  const graphData = {
    nodes: data.graph.nodes.map(node => ({
      id: node.id,
      type: node.type,
      ...node.data
    })),
    links: data.graph.edges.map(edge => ({
      source: edge.source,
      target: edge.target,
      type: edge.type,
      value: edge.weight
    }))
  };

  // Find node details and relationships
  const nodeDetails = selectedNode
    ? data.graph.nodes.find(n => n.id === selectedNode.id)
    : null;
  const nodeIncoming = selectedNode
    ? data.graph.edges.filter(e => e.target === selectedNode.id)
    : [];
  const nodeOutgoing = selectedNode
    ? data.graph.edges.filter(e => e.source === selectedNode.id)
    : [];

  // RL training handler
  const handleTrainAgent = async () => {
    setTraining(true);
    setTrainResult(null);
    try {
      const res = await fetch('/api/train_agent', { method: 'POST' });
      const result = await res.json();
      setTrainResult(result);
    } catch (err) {
      setTrainResult({ status: 'error', error: String(err) });
    }
    setTraining(false);
  };

  // Format agent version timestamp
  const formatVersionTimestamp = (timestamp?: number) => {
    if (!timestamp) return "Base Model (Not Trained Yet)";
    const date = new Date(timestamp * 1000);
    return `Trained: ${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  return (
    <div className="space-y-8">
      {/* Agent Version Display */}
      <div className="text-sm text-gray-600 font-medium text-center border-b pb-2 mb-4">
        Agent Version: {formatVersionTimestamp(data.agent_version)}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Learning Graph</h3>
        {/* Graph Controls */}
        <div className="w-full flex justify-end gap-2 p-2 mb-2">
          <button
            type="button"
            className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs"
            onClick={() => {
              if (graphRef.current) {
                graphRef.current.zoomToFit(400, 40);
              }
            }}
          >
            Zoom to Fit
          </button>
          <button
            type="button"
            className="px-3 py-1 bg-primary-600 text-white rounded hover:bg-primary-700 text-xs"
            onClick={() => {
              if (graphRef.current) {
                graphRef.current.centerAt(0, 0, 400);
              }
            }}
          >
            Center Graph
          </button>
        </div>
        <div className="h-96 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
          {data.graph.nodes.length > 0 ? (
            <div className="w-full h-full flex items-center justify-center">
              <ForceGraph2D
                ref={graphRef}
                graphData={graphData}
                width={384}
                height={384}
                nodeAutoColorBy="type"
                nodeLabel={(node: any) => `${node.type}: ${node.id}`}
                linkWidth={(link: any) => link.value}
                linkDirectionalArrowLength={3.5}
                linkDirectionalArrowRelPos={1}
                linkCurvature={0.25}
                onNodeClick={(node: any) => {
                  setSelectedNode(node);
                  setShowNodeDetails(true);
                }}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full w-full">
              <p className="text-gray-500">No graph data available yet</p>
            </div>
          )}
        </div>
        {/* Node Details Dropdown */}
        {selectedNode && (
          <div className="mt-2">
            <button
              className="text-primary-600 underline text-sm"
              onClick={() => setShowNodeDetails(v => !v)}
            >
              {showNodeDetails ? 'Hide' : 'Show'} Node Details
            </button>
            {showNodeDetails && (
              <div className="mt-2 p-4 border border-gray-200 rounded bg-gray-50">
                <div className="mb-2">
                  <span className="font-semibold">Node ID:</span> {selectedNode.id}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Type:</span> {selectedNode.type}
                </div>
                {nodeDetails?.data?.user_input && (
                  <div className="mb-2">
                    <span className="font-semibold">User Message:</span>
                    <span className="ml-2">{nodeDetails.data.user_input}</span>
                  </div>
                )}
                {nodeDetails?.data?.agent_response && (
                  <div className="mb-2">
                    <span className="font-semibold">Agent Response:</span>
                    <span className="ml-2">{nodeDetails.data.agent_response}</span>
                  </div>
                )}
                {nodeDetails?.data?.topics && (
                  <div className="mb-2">
                    <span className="font-semibold">Topics:</span>
                    <span className="ml-2">{Array.isArray(nodeDetails.data.topics) ? nodeDetails.data.topics.join(', ') : nodeDetails.data.topics}</span>
                  </div>
                )}
                {nodeDetails?.data?.tool && (
                  <div className="mb-2">
                    <span className="font-semibold">Tool:</span>
                    <span className="ml-2">{nodeDetails.data.tool}</span>
                  </div>
                )}
                {/* Display feedback tags if it's a feedback node */}
                {nodeDetails?.type === 'feedback' && nodeDetails?.data?.text && (
                  <div className="mb-2">
                    <span className="font-semibold">Feedback Tags:</span>
                    <span className="ml-2 italic text-gray-700">{nodeDetails.data.text}</span>
                  </div>
                )}
                <div className="mb-2">
                  <span className="font-semibold">Raw Data:</span>
                  <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(nodeDetails?.data, null, 2)}</pre>
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Incoming Relationships:</span>
                  <ul className="list-disc ml-6">
                    {nodeIncoming.length === 0 && <li className="text-gray-500">None</li>}
                    {nodeIncoming.map((edge, idx) => (
                      <li key={idx}>
                        from <span className="font-mono">{edge.source}</span> ({edge.type}, weight: {edge.weight})
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="font-semibold">Outgoing Relationships:</span>
                  <ul className="list-disc ml-6">
                    {nodeOutgoing.length === 0 && <li className="text-gray-500">None</li>}
                    {nodeOutgoing.map((edge, idx) => (
                      <li key={idx}>
                        to <span className="font-mono">{edge.target}</span> ({edge.type}, weight: {edge.weight})
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* RL Training Controls */}
      <div>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm mb-2"
          onClick={handleTrainAgent}
          disabled={training}
        >
          {training ? "Training Agent..." : "Train Agent (PPO)"}
        </button>
        {trainResult && (
          <div className="mt-2 p-4 border border-green-300 rounded bg-green-50">
            <div className="font-semibold mb-1">Training Result: {trainResult.status}</div>
            {trainResult.error && <div className="text-red-600">{trainResult.error}</div>}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-semibold">Before Training</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(trainResult.before_metrics, null, 2)}</pre>
              </div>
              <div>
                <div className="font-semibold">After Training</div>
                <pre className="bg-gray-100 rounded p-2 text-xs overflow-x-auto">{JSON.stringify(trainResult.after_metrics, null, 2)}</pre>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <h3 className="text-lg font-semibold mb-2">Performance Over Time</h3>
        <div className="h-64 border border-gray-200 rounded-lg">
          {performanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={performanceData}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 5]} />
                <Tooltip />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="rating" 
                  stroke="#8884d8" 
                  name="Individual Ratings" 
                  dot={{ r: 4 }} 
                />
                <Line 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#82ca9d" 
                  name="Average Rating" 
                  strokeWidth={2} 
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-gray-500">No performance data available yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Agent Performance / Evals */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Agent Performance / Evals</h3>
        <div className="border border-gray-200 rounded-lg p-6 bg-white shadow-sm">
          {performanceData.length > 0 ? (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="flex flex-wrap gap-6 justify-between items-center border-b border-gray-100 pb-4">
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs text-gray-500">Latest Rating</span>
                  <span className="font-bold text-lg">{data.performance.ratings.length > 0 ? `${data.performance.ratings[data.performance.ratings.length - 1]} / 5` : 'N/A'}</span>
                </div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs text-gray-500">Avg Rating (All)</span>
                  <span className="font-bold text-lg">{data.performance.average_ratings.length > 0 ? `${data.performance.average_ratings[data.performance.average_ratings.length - 1].toFixed(2)} / 5` : 'N/A'}</span>
                </div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs text-gray-500">Avg Rating (Last 10)</span>
                  <span className="font-bold text-lg">{data.performance.recent_average_rating.length > 0 ? `${data.performance.recent_average_rating[data.performance.recent_average_rating.length - 1].toFixed(2)} / 5` : 'N/A'}</span>
                </div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs text-gray-500">Accuracy (4+ Stars)</span>
                  <span className="font-bold text-lg">{data.performance.accuracy.length > 0 ? `${data.performance.accuracy[data.performance.accuracy.length - 1].toFixed(1)}%` : 'N/A'}</span>
                </div>
                <div className="flex flex-col items-center min-w-[120px]">
                  <span className="text-xs text-gray-500">Total Evals</span>
                  <span className="font-bold text-lg">{data.performance.ratings.length}</span>
                </div>
              </div>
              {/* Rating Distribution */}
              <div className="border-b border-gray-100 pb-4">
                <h4 className="text-xs font-semibold mb-2 text-gray-600">Rating Distribution</h4>
                <div className="flex space-x-4 justify-center">
                  {Object.entries(data.performance.rating_distribution).map(([rating, count]) => (
                    <div key={rating} className="flex flex-col items-center">
                      <div className={`w-8 h-6 flex items-end justify-center`}>
                        <div
                          className="bg-primary-500 rounded"
                          style={{
                            height: `${Math.max(8, count * 12)}px`,
                            width: '18px',
                            minHeight: '8px'
                          }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-500 mt-1">{rating}★</span>
                      <span className="text-xs">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
              {/* Eval History Table */}
              <div className="h-48 overflow-y-auto border border-gray-100 rounded bg-gray-50">
                <table className="min-w-full divide-y divide-gray-200 text-xs">
                  <thead className="bg-gray-100 sticky top-0 z-10">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Time</th>
                      <th className="px-4 py-2 text-left font-medium text-gray-600 uppercase tracking-wider">Rating</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {performanceData.slice().reverse().map((evalItem, index) => (
                      <tr key={index}>
                        <td className="px-4 py-2 whitespace-nowrap">{evalItem.time}</td>
                        <td className="px-4 py-2 whitespace-nowrap">{evalItem.rating} / 5</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-48">
              <p className="text-gray-500">No eval data available yet</p>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-lg font-semibold mb-2">Topics Distribution</h3>
          <div className="h-64 border border-gray-200 rounded-lg">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={topicData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  >
                    {topicData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value, name, props) => [`${value} interactions`, props.payload.name]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No topic data available yet</p>
              </div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Topic Performance</h3>
          <div className="h-64 border border-gray-200 rounded-lg">
            {topicData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={topicData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="name" 
                    angle={-45} 
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis domain={[0, 5]} />
                  <Tooltip />
                  <Legend />
                  <Bar 
                    dataKey="averageRating" 
                    name="Average Rating" 
                    fill="#8884d8" 
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full">
                <p className="text-gray-500">No topic performance data available yet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualizationPanel;
