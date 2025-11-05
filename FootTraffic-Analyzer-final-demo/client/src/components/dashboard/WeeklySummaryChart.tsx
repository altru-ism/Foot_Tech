import React from 'react';
import Plot from 'react-plotly.js';

interface WeeklySummaryProps {
  monday: number;
  tuesday: number;
  wednesday: number;
  thursday: number;
  friday: number;
  saturday: number;
  sunday: number;
  total: number;
}

const WeeklySummaryChart: React.FC<WeeklySummaryProps> = ({ 
  monday,
  tuesday,
  wednesday,
  thursday,
  friday,
  saturday,
  sunday,
  total 
}) => {
  const data = [
    {
      values: [monday, tuesday, wednesday, thursday, friday, saturday, sunday],
      labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      marker: {
        colors: ['#ef4444', '#f59e0b', '#3b82f6', '#10b981', '#8b5cf6', '#14b8a6', '#f97316']
      },
      type: 'pie',
      hole: 0.7,
      textinfo: 'none',
      hoverinfo: 'label+percent+value',
      hovertemplate: '<b>%{label}</b><br>Traffic: %{value}<br>Percentage: %{percent}<extra></extra>'
    }
  ];

  const layout = {
    autosize: true,
    showlegend: false,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    margin: { t: 10, b: 10, l: 10, r: 10 },
    height: 240,
    annotations: [
      {
        font: { 
          size: 24,
          family: 'Inter, sans-serif',
          color: '#1e293b',
          weight: 'bold'
        },
        showarrow: false,
        text: total.toString(),
        x: 0.5,
        y: 0.5
      },
      {
        font: { 
          size: 11,
          family: 'Inter, sans-serif',
          color: '#64748b'
        },
        showarrow: false,
        text: 'TOTAL',
        x: 0.5,
        y: 0.4
      }
    ]
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  // Calculate percentages for legend chips
  const dayValues = [monday, tuesday, wednesday, thursday, friday, saturday, sunday];
  const total100 = dayValues.reduce((s, v) => s + v, 0) || 1;
  const percents = dayValues.map(v => Math.round((v / total100) * 100));

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <h3 className="font-bold mb-3 flex items-center">
          <span className="material-icons mr-2 text-primary">pie_chart</span>
          Weekly Traffic Summary
        </h3>
 
        {/* Legends moved above the chart */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-3 text-sm">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map((label, idx) => (
            <div key={label} className="bg-gray-50 rounded-lg p-2">
              <div className="flex items-center mb-1">
                <div className="w-3 h-3 rounded-full mr-2" style={{backgroundColor: data[0].marker.colors[idx] as string}}></div>
                <span className="font-medium">{label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{dayValues[idx]}</span>
                <span className="font-bold" style={{color: data[0].marker.colors[idx] as string}}>{percents[idx]}%</span>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center">
          <Plot
            data={data}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '240px' }}
          />
        </div>
      </div>
    </div>
  );
};

export default WeeklySummaryChart;
