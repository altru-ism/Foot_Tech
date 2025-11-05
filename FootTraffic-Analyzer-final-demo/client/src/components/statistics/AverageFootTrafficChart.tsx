import React from 'react';
import Plot from 'react-plotly.js';

interface GateData {
  name: string;
  color: string;
  values: number[];
}

interface AverageFootTrafficChartProps {
  gates: GateData[];
  timeLabels: string[];
}

const AverageFootTrafficChart: React.FC<AverageFootTrafficChartProps> = ({ gates, timeLabels }) => {
  // Create enhanced data array for Plotly
  const plotlyData = gates.map(gate => ({
    x: timeLabels,
    y: gate.values,
    type: 'scatter',
    mode: 'lines+markers',
    name: gate.name,
    line: { 
      color: gate.color, 
      width: 3,
      shape: 'spline'
    },
    marker: {
      color: gate.color,
      size: 6,
      line: {
        color: 'white',
        width: 2
      }
    },
    hovertemplate: `<b>${gate.name}</b><br>Time: %{x}<br>Traffic: %{y}<extra></extra>`,
    fill: 'tonexty',
    fillcolor: gate.color + '20'
  }));

  const layout = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      title: 'Time',
      titlefont: { size: 12, color: '#6B7280' },
      showgrid: true,
      gridcolor: 'rgba(209, 213, 219, 0.3)',
      zeroline: false,
      tickfont: { size: 11, color: '#374151' }
    },
    yaxis: {
      title: 'Foot Traffic Count',
      titlefont: { size: 12, color: '#6B7280' },
      showgrid: true,
      gridcolor: 'rgba(209, 213, 219, 0.3)',
      zeroline: false,
      tickfont: { size: 11, color: '#374151' }
    },
    legend: {
      orientation: 'h',
      y: 1.05,
      x: 0.5,
      xanchor: 'center',
      font: { size: 12, color: '#374151' }
    },
    height: 300,
    margin: { l: 60, r: 20, t: 40, b: 60 },
    font: {
      family: 'Inter, system-ui, sans-serif'
    }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">timeline</span>
            Average Foot Traffic by Hour
          </h3>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <Plot
            data={plotlyData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '300px' }}
          />
        </div>

        <div className="flex items-center text-xs text-gray-500 mt-2">
          <span className="material-icons text-xs mr-1">info</span>
          Hourly traffic patterns across different locations
        </div>
      </div>
    </div>
  );
};

export default AverageFootTrafficChart;
