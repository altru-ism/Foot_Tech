import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';

interface LocationData {
  name: string;
  color: string;
  trafficValues: number[];
  dwellTimeValues: number[];
}

interface LocationWithForecast extends LocationData {
  trafficForecast?: number[];
  dwellTimeForecast?: number[];
}

interface TrafficDwellRatioChartProps {
  locations: LocationData[];
  timeLabels: string[];
  forecastLabels?: string[];
}

const TrafficDwellRatioChart: React.FC<TrafficDwellRatioChartProps> = ({ 
  locations, 
  timeLabels,
  forecastLabels = [] 
}) => {  
  const [selectedLocations, setSelectedLocations] = useState<Set<string>>(new Set(locations.map(loc => loc.name)));
  const [chartData, setChartData] = useState<LocationData[]>(() => {
    return locations.map(loc => ({
      ...loc,
      trafficValues: loc.trafficValues.slice(-10),
      dwellTimeValues: loc.dwellTimeValues.slice(-10)
    }));
  });
  const [currentLabels, setCurrentLabels] = useState<string[]>(() => timeLabels.slice(-10));
  const [showForecast, setShowForecast] = useState<boolean>(true);
  const [timeRange, setTimeRange] = useState<{ start: number; end: number}>(() => {
    const last10Labels = timeLabels.slice(-10);
    const [firstTimeStr, firstPeriod] = last10Labels[0].split(' ');
    const [lastTimeStr, lastPeriod] = last10Labels[last10Labels.length - 1].split(' ');
    
    let startHour = parseInt(firstTimeStr);
    if (firstPeriod === 'PM' && startHour !== 12) startHour += 12;
    if (firstPeriod === 'AM' && startHour === 12) startHour = 0;
    
    let endHour = parseInt(lastTimeStr);
    if (lastPeriod === 'PM' && endHour !== 12) endHour += 12;
    if (lastPeriod === 'AM' && endHour === 12) endHour = 0;
    
    return { start: startHour, end: endHour };
  });
  const [isSorting, setIsSorting] = useState<boolean>(false);

  // Generate time range options based on available data
  const timeRangeOptions = React.useMemo(() => {
    const availableHours = new Set(
      timeLabels.map(label => {
        const [timeStr, period] = label.split(' ');
        let hour = parseInt(timeStr);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour;
      })
    );
    return Array.from({ length: 24 }, (_, i) => {
      const hour12 = i % 12 || 12;
      const ampm = i >= 12 ? 'PM' : 'AM';
      return {
        value: i,
        label: `${hour12} ${ampm}`,
        available: availableHours.has(i)
      };
    }).filter(option => option.available);
  }, [timeLabels]);

  // Reset time range to show last 10 hours + forecast
  const resetTimeRange = () => {
    if (timeRangeOptions.length > 0) {
      const last10Labels = timeLabels.slice(-10);
      const [lastTimeStr, lastPeriod] = last10Labels[last10Labels.length - 1].split(' ');
      let lastHour = parseInt(lastTimeStr);
      if (lastPeriod === 'PM' && lastHour !== 12) lastHour += 12;
      if (lastPeriod === 'AM' && lastHour === 12) lastHour = 0;
      
      const [firstTimeStr, firstPeriod] = last10Labels[0].split(' ');
      let firstHour = parseInt(firstTimeStr);
      if (firstPeriod === 'PM' && firstHour !== 12) firstHour += 12;
      if (firstPeriod === 'AM' && firstHour === 12) firstHour = 0;
      
      setTimeRange({
        start: firstHour,
        end: lastHour
      });
      
      setChartData(locations.map(loc => ({
        ...loc,
        trafficValues: loc.trafficValues.slice(-10),
        dwellTimeValues: loc.dwellTimeValues.slice(-10)
      })));
      setCurrentLabels(last10Labels);
      setShowForecast(true);
      setIsSorting(false);
    }
  };

  // Filter data based on selected time range
  const filterDataByTimeRange = (data: LocationData[], labels: string[]) => {
    return data.map(loc => ({
      ...loc,
      trafficValues: loc.trafficValues.filter((_, index) => {
        const [timeStr, period] = labels[index].split(' ');
        let hour = parseInt(timeStr);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour >= timeRange.start && hour <= timeRange.end;
      }),
      dwellTimeValues: loc.dwellTimeValues.filter((_, index) => {
        const [timeStr, period] = labels[index].split(' ');
        let hour = parseInt(timeStr);
        if (period === 'PM' && hour !== 12) hour += 12;
        if (period === 'AM' && hour === 12) hour = 0;
        return hour >= timeRange.start && hour <= timeRange.end;
      })
    }));
  };

  // Filter labels based on selected time range
  const filterLabelsByTimeRange = (labels: string[]) => {
    return labels.filter(label => {
      const [timeStr, period] = label.split(' ');
      let hour = parseInt(timeStr);
      if (period === 'PM' && hour !== 12) hour += 12;
      if (period === 'AM' && hour === 12) hour = 0;
      return hour >= timeRange.start && hour <= timeRange.end;
    });
  };

  // Handle time range selection changes
  const handleTimeRangeChange = (type: 'start' | 'end', value: number) => {
    setTimeRange(prev => ({ ...prev, [type]: value }));
    setIsSorting(true);
    setShowForecast(false);
  };

  // Update chart data only when time range changes and we're not in real-time mode
  useEffect(() => {
    if (!isSorting) return;
    
    const filteredLabels = filterLabelsByTimeRange(timeLabels);
    const filteredData = filterDataByTimeRange(locations, timeLabels);
    setChartData(filteredData);
    setCurrentLabels(filteredLabels);
  }, [timeRange]);

  // Update only the latest data point when props change to simulate real-time updates
  useEffect(() => {
    if (isSorting) return;

    if (!chartData.length || !currentLabels.length) {
      const filteredLabels = filterLabelsByTimeRange(timeLabels.slice(-10));
      const filteredData = filterDataByTimeRange(
        locations.map(loc => ({
          ...loc,
          trafficValues: loc.trafficValues.slice(-10),
          dwellTimeValues: loc.dwellTimeValues.slice(-10)
        })), 
        timeLabels.slice(-10)
      );
      setChartData(filteredData);
      setCurrentLabels(filteredLabels);
      return;
    }

    if (locations.length > 0 && timeLabels.length > 0) {
      const latestTimeLabel = timeLabels[timeLabels.length - 1];
      const currentLatestLabel = currentLabels[currentLabels.length - 1];

      if (latestTimeLabel !== currentLatestLabel) {
        setCurrentLabels(prev => [...prev.slice(1), latestTimeLabel]);
        
        setChartData(prev => 
          prev.map(loc => {
            const matchingLocation = locations.find(l => l.name === loc.name);
            if (!matchingLocation) return loc;
            
            return {
              ...loc,
              trafficValues: [
                ...loc.trafficValues.slice(1), 
                matchingLocation.trafficValues[matchingLocation.trafficValues.length - 1]
              ],
              dwellTimeValues: [
                ...loc.dwellTimeValues.slice(1), 
                matchingLocation.dwellTimeValues[matchingLocation.dwellTimeValues.length - 1]
              ]
            };
          })
        );
      } else {
        setChartData(prev => 
          prev.map(loc => {
            const matchingLocation = locations.find(l => l.name === loc.name);
            if (!matchingLocation) return loc;
            
            const latestTrafficValue = matchingLocation.trafficValues[matchingLocation.trafficValues.length - 1];
            const latestDwellValue = matchingLocation.dwellTimeValues[matchingLocation.dwellTimeValues.length - 1];
            
            if (loc.trafficValues[loc.trafficValues.length - 1] === latestTrafficValue && 
                loc.dwellTimeValues[loc.dwellTimeValues.length - 1] === latestDwellValue) return loc;
            
            return {
              ...loc,
              trafficValues: [
                ...loc.trafficValues.slice(0, -1),
                latestTrafficValue
              ],
              dwellTimeValues: [
                ...loc.dwellTimeValues.slice(0, -1),
                latestDwellValue
              ]
            };
          })
        );
      }
    }
  }, [locations, timeLabels, isSorting, chartData.length, currentLabels.length]);

  // Calculate ratio and stats for each location
  const locationStats = chartData.map(loc => {
    const ratios = loc.trafficValues.map((traffic, index) => {
      const dwell = loc.dwellTimeValues[index];
      return dwell > 0 ? (traffic / dwell).toFixed(2) : '0.00';
    });
    
    const currentRatio = ratios[ratios.length - 1] || '0.00';
    const avgRatio = (ratios.reduce((sum, ratio) => sum + parseFloat(ratio), 0) / ratios.length).toFixed(2);
    
    return {
      name: loc.name,
      currentRatio,
      avgRatio,
      color: loc.color,
      currentTraffic: loc.trafficValues[loc.trafficValues.length - 1] || 0,
      currentDwell: loc.dwellTimeValues[loc.dwellTimeValues.length - 1] || 0
    };
  });

  // Filter locations based on selection
  const filteredLocations = chartData.filter(loc => selectedLocations.has(loc.name));

  // Build bubble data: one bubble per location using latest values
  const latestBubbles = filteredLocations.map(location => {
    const xVal = location.trafficValues[location.trafficValues.length - 1] || 0; // Traffic
    const yVal = location.dwellTimeValues[location.dwellTimeValues.length - 1] || 0; // Dwell
    const stat = locationStats.find(s => s.name === location.name);
    const label = stat ? `${location.name} • ${stat.currentRatio}` : location.name;
    return { name: location.name, color: location.color, x: xVal, y: yVal, label };
  });
  const maxTraffic = Math.max(1, ...latestBubbles.map(b => b.x));
  const plotlyData = [{
    x: latestBubbles.map(b => b.x),
    y: latestBubbles.map(b => b.y),
    mode: 'markers',
    type: 'scatter',
    marker: {
      color: latestBubbles.map(b => b.color),
      size: latestBubbles.map(b => Math.max(40, Math.min(110, (b.x / maxTraffic) * 70 + 30))),
      sizemode: 'diameter',
      opacity: 0.9,
      line: { width: 1, color: '#ffffff' }
    },
    text: latestBubbles.map(b => b.name),
    hovertemplate: `<b>%{text}</b><br>Traffic: %{x}<br>Dwell Time: %{y} sec<extra></extra>`
  }];

  const layout = {
    autosize: true,
    paper_bgcolor: 'rgba(0,0,0,0)',
    plot_bgcolor: 'rgba(0,0,0,0)',
    xaxis: { title: 'Foot Traffic (people)', showgrid: true, gridcolor: 'rgba(211,211,211,0.3)', zeroline: false },
    yaxis: { title: 'Dwell Time (sec)', showgrid: true, gridcolor: 'rgba(211,211,211,0.3)', zeroline: false },
    showlegend: false,
    height: 300,
    margin: { l: 50, r: 20, t: 50, b: 40 }
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

  // Toggle forecast visibility
  const toggleForecast = () => {
    setShowForecast(prev => !prev);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">compare_arrows</span>
            Traffic vs Dwell Time Ratio
          </h2>
        </div>

        <div className="mb-4 flex flex-wrap gap-2">
          {locationStats.map((loc) => (
            <button
              key={loc.name}
              onClick={() => handleLegendClick(loc.name)}
              className={`inline-flex items-center rounded-full px-3 py-1 text-sm transition-all duration-200 ${
                selectedLocations.has(loc.name)
                  ? 'bg-gray-50 border border-gray-200 shadow-sm'
                  : 'bg-gray-100 opacity-50'
              }`}
            >
              <div 
                className="w-3 h-3 rounded-full mr-2" 
                style={{ 
                  backgroundColor: loc.color,
                  boxShadow: selectedLocations.has(loc.name) ? '0 0 0 1px rgba(0,0,0,0.1)' : 'none'
                }}
              ></div>
              <span className="font-medium">{loc.name}</span>
              <span className="ml-1 text-gray-500">Ratio: {loc.currentRatio}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-gray-100 pt-3">
          <Plot
            data={plotlyData}
            layout={layout}
            config={config}
            style={{ width: '100%', height: '360px' }}
          />
        </div>

        {/* Legend removed; labels are rendered inside bubbles */}
      </div>
    </div>
  );
};

export default TrafficDwellRatioChart;

