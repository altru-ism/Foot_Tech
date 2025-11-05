import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface BuildingData {
  id: string;
  name: string;
  value: number;
  color?: string;
}

interface MonthFootTrafficChartProps {
  buildings: BuildingData[];
  barColor?: string;
  title?: string;
}

const MonthFootTrafficChart: React.FC<MonthFootTrafficChartProps> = ({ buildings, barColor = '#3B82F6', title = 'Foot Traffic in Previous Months' }) => {
  const [selectedMonth, setSelectedMonth] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  // Generate month options (last 12 months)
  const monthOptions = React.useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
      options.push({ value, label });
    }
    return options;
  }, []);

  // Generate data for selected month with some variation
  const generateMonthData = (month: string) => {
    const baseMultiplier = Math.random() * 0.5 + 0.75; // 0.75 to 1.25 variation
    return buildings.map(building => ({
      ...building,
      value: Math.floor(building.value * baseMultiplier * (0.8 + Math.random() * 0.4))
    }));
  };

  const [monthData, setMonthData] = useState<BuildingData[]>(() => generateMonthData(selectedMonth));

  useEffect(() => {
    setMonthData(generateMonthData(selectedMonth));
  }, [selectedMonth, buildings]);

  // Create enhanced data array for Plotly
  const plotlyData = [
    {
      x: monthData.map(b => b.name),
      y: monthData.map(b => b.value),
      type: 'bar',
      marker: {
        color: barColor,
        line: {
          color: 'white',
          width: 2
        },
        gradient: {
          color: 'rgba(59, 130, 246, 0.1)',
          type: 'vertical'
        }
      },
      hovertemplate: '<b>%{x}</b><br>Foot Traffic: %{y:,}<extra></extra>',
      text: monthData.map(b => b.value.toLocaleString()),
      textposition: 'outside',
      textfont: {
        size: 12,
        color: '#374151'
      }
    }
  ];

  const layout = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      title: 'Locations',
      titlefont: { size: 12, color: '#6B7280' },
      showgrid: true,
      gridcolor: 'rgba(209, 213, 219, 0.3)',
      zeroline: false,
      tickangle: -45,
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
    height: 300,
    margin: { l: 60, r: 20, t: 20, b: 80 },
    font: {
      family: 'Inter, system-ui, sans-serif'
    }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  const handleMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMonth(e.target.value);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">calendar_month</span>
            {title}
          </h3>
          
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">Month:</label>
            <select
              value={selectedMonth}
              onChange={handleMonthChange}
              className="text-sm px-3 py-1.5 rounded-lg border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {monthOptions.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
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
          Historical foot traffic data for the selected month
        </div>
      </div>
    </div>
  );
};

export default MonthFootTrafficChart;
