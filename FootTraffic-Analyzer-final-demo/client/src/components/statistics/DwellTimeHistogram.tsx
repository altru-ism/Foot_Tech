import React, { useState } from 'react';
import Plot from 'react-plotly.js';

interface DwellTimeData {
  name: string;
  color: string;
  values: number[];
  dates: string[];
}

interface DwellTimeHistogramProps {
  locations: DwellTimeData[];
  onDateRangeChange?: (startDate: string, endDate: string) => void;
}

const DwellTimeHistogram: React.FC<DwellTimeHistogramProps> = ({ 
  locations,
  onDateRangeChange 
}) => {
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set(locations.map(loc => loc.name)));
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>(() => {
    // Initialize with the last 30 days
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);
    
    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  });

  // Filter data based on selected date range
  const filterDataByDateRange = (data: DwellTimeData[]) => {
    return data.map(loc => {
      const filteredIndices = loc.dates
        .map((date, index) => ({ date, index }))
        .filter(({ date }) => {
          const dataDate = new Date(date);
          const startDate = new Date(dateRange.start);
          const endDate = new Date(dateRange.end);
          return dataDate >= startDate && dataDate <= endDate;
        })
        .map(({ index }) => index);

      return {
        ...loc,
        values: filteredIndices.map(index => loc.values[index]),
        dates: filteredIndices.map(index => loc.dates[index])
      };
    });
  };

  const filteredData = filterDataByDateRange(locations);

  // Create histogram data with locations on X-axis
  const plotlyData = [{
    x: filteredData.map(loc => loc.name),
    y: filteredData.map(loc => {
      // Calculate average dwell time for each location
      return loc.values.length > 0 
        ? (loc.values.reduce((sum, val) => sum + val, 0) / loc.values.length)
        : 0;
    }),
    type: 'bar',
    marker: { 
      color: filteredData.map(loc => loc.color),
      opacity: 0.8,
      line: {
        width: 2,
        color: 'white'
      }
    },
    hovertemplate: `<b>%{x}</b><br>Average Dwell Time: %{y:.1f} seconds<extra></extra>`,
  }];

  const layout = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: {
      title: 'Locations',
      titlefont: { size: 12, color: '#777' },
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false,
      tickangle: -45
    },
    yaxis: {
      title: 'Average Dwell Time (seconds)',
      titlefont: { size: 12, color: '#777' },
      showgrid: true,
      gridcolor: 'rgba(211, 211, 211, 0.3)',
      zeroline: false
    },
    showlegend: false,
    barmode: 'group',
    height: 300,
    margin: { l: 50, r: 20, t: 60, b: 60 }
  };

  const config = {
    displayModeBar: false,
    responsive: true
  };

  // Handle legend click
  const handleLegendClick = (locationName: string) => {
    setSelectedLocations(prev => {
      const newSelection = new Set(prev);
      if (newSelection.has(locationName)) {
        if (newSelection.size > 1) {
          newSelection.delete(locationName);
        }
      } else {
        newSelection.add(locationName);
      }
      return newSelection;
    });
  };

  // Handle date range change
  const handleDateRangeChange = (type: 'start' | 'end', value: string) => {
    const newRange = { ...dateRange, [type]: value };
    setDateRange(newRange);
    if (onDateRangeChange) {
      onDateRangeChange(newRange.start, newRange.end);
    }
  };

  // Calculate statistics for each location
  const locationStats = filteredData.map(loc => {
    const values = loc.values;
    const avg = values.length > 0 ? (values.reduce((sum, val) => sum + val, 0) / values.length).toFixed(1) : '0.0';
    const max = values.length > 0 ? Math.max(...values).toFixed(1) : '0.0';
    const min = values.length > 0 ? Math.min(...values).toFixed(1) : '0.0';
    
    return {
      name: loc.name,
      avg,
      max,
      min,
      color: loc.color,
      count: values.length
    };
  });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">bar_chart</span>
            Dwell Time Distribution
          </h2>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => handleDateRangeChange('start', e.target.value)}
                className="text-xs px-2 py-1 rounded border border-gray-200"
                max={dateRange.end}
              />
              <span className="text-xs text-gray-500">to</span>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => handleDateRangeChange('end', e.target.value)}
                className="text-xs px-2 py-1 rounded border border-gray-200"
                min={dateRange.start}
                max={new Date().toISOString().split('T')[0]}
              />
            </div>
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
          Historical distribution of dwell times for selected date range
        </div>
      </div>
    </div>
  );
};

export default DwellTimeHistogram;
