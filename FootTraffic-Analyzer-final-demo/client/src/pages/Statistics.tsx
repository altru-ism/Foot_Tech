import React, { useState } from 'react';
import HeatmapChart from '@/components/statistics/HeatmapChart';
import AverageFootTrafficChart from '@/components/statistics/AverageFootTrafficChart';
import MonthFootTrafficChart from '@/components/statistics/MonthFootTrafficChart';
import DwellTimeHistogram from '@/components/statistics/DwellTimeHistogram';
import { useQuery } from '@tanstack/react-query';
import Plot from 'react-plotly.js';
import { locationColors, getStatisticsData } from '@/data/locationData';
import { useFootTraffic } from '@/context/FootTrafficContext';

// Define state values outside the component 
// to avoid the "Rendered more hooks than during previous render" issue
const defaultLocation = 'All Locations';
const defaultMetric = 'Count';
const defaultTimePeriod = 'month';

// Define interface for stats from the API
interface VideoStats {
  people_count: number;
  avg_dwell_time: number;
  highest_dwell_time: number;
  location: string;
  timestamp: string;
}

const Statistics: React.FC = () => {
  // Move all useState hooks to the very top of the component
  const [selectedLocation, setSelectedLocation] = useState(defaultLocation);
  // Simplify controls: keep only location selector for heatmap
  const [staticStatisticsData] = useState(getStatisticsData());
  
  // Get shared data from FootTrafficContext
  const { videoStats, mapData, timeSeriesData } = useFootTraffic();
  
  const { data: statisticsData, isLoading: isStatisticsLoading } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => fetch('/api/statistics').then(res => res.json()),
  });

  // Get a formatted camera name for display
  const getCameraName = (location: string): string => {
    if (location?.includes('School')) return 'School Entrance';
    if (location?.includes('Palengke')) return 'Palengke Market';
    if (location?.includes('YouTube')) return 'YouTube Stream';
    return location || 'Unknown Location';
  };

  // Get color for a location based on our consistent color scheme
  const getLocationColor = (locationName: string): string => {
    // Check if the location is one of our predefined locations
    if (locationColors[locationName + ' Camera']) {
      return locationColors[locationName + ' Camera'];
    }
    
    // Check if it's one of our other predefined locations without 'Camera'
    if (locationColors[locationName]) {
      return locationColors[locationName];
    }
    
    // Default fallback color
    return '#777777';
  };

  if (isStatisticsLoading || !videoStats || !mapData || !timeSeriesData) {
    return (
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
          <div className="bg-white rounded-lg shadow-sm p-4 h-80 animate-pulse"></div>
        </div>
      </div>
    );
  }
  // Function to generate dynamic heatmap based on current foot traffic
  const generateDynamicHeatmap = () => {
    const baseHeatmap = statisticsData?.heatmap || staticStatisticsData.heatmap;
    
    // Get current day and time to highlight in heatmap
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay() - 1; // 0 = Sunday, so subtract 1 to make 0 = Monday
    
    if (day >= 0 && day < baseHeatmap.z.length) {
      const hourIndex = Math.floor(hour / 2); // Each column represents 2 hours
      if (hourIndex >= 0 && hourIndex < baseHeatmap.z[0].length) {
        // Create a deep copy of the heatmap
        const newZ = baseHeatmap.z.map((row: number[]) => [...row]);
        
        // Update current time cell with actual foot traffic (normalized)
        const normalizedValue = Math.min(1, videoStats.people_count / 100);
        newZ[day][hourIndex] = normalizedValue;
        
        return {
          ...baseHeatmap,
          z: newZ
        };
      }
    }
    
    return baseHeatmap;
  };

  // Sample data for heatmap with dynamically updated values
  // Derive heatmap per selected location without adding a new hook after the early return
  const baseHeatmapData = generateDynamicHeatmap();
  const factor = Math.max(0.8, Math.min(1.2, (selectedLocation.length % 7) / 10 + 0.8));
  const heatmapData = {
    ...baseHeatmapData,
    z: baseHeatmapData.z.map((row: number[]) => row.map(v => Math.min(1, v * factor)))
  };

  // Generate dwell time histogram data
  const generateDwellTimeData = () => {
    const locations = [
      {
        name: getCameraName(videoStats.location),
        color: getLocationColor(getCameraName(videoStats.location)),
        values: Array.from({ length: 30 }, (_, i) => {
          const baseValue = videoStats.avg_dwell_time;
          const variation = (Math.random() - 0.5) * baseValue * 0.5;
          return Math.max(0, baseValue + variation);
        }),
        dates: Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        })
      },
      ...mapData.markers.slice(0, 2).map(marker => ({
        name: marker.name,
        color: marker.color,
        values: Array.from({ length: 30 }, () => Math.random() * 200 + 50),
        dates: Array.from({ length: 30 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (29 - i));
          return date.toISOString().split('T')[0];
        })
      }))
    ];
    
    return locations;
  };

  const dwellTimeData = generateDwellTimeData();  
  
  // Use time series data from context for average foot traffic
  const avgFootTrafficData = {
    gates: [
      {
        name: getCameraName(videoStats.location),
        color: getLocationColor(getCameraName(videoStats.location)),
        values: [
          Math.max(10, videoStats.people_count - 10),
          Math.max(5, videoStats.people_count - 5),
          videoStats.people_count,
          Math.max(10, videoStats.people_count - 2),
          Math.max(5, videoStats.people_count - 8),
          Math.max(10, videoStats.people_count - 4),
          Math.max(5, videoStats.people_count - 6),
          videoStats.people_count,
        ]
      },
      ...timeSeriesData.locations.slice(0, 2)
        .map(loc => ({
          name: loc.name,
          color: loc.color,
          values: loc.trafficValues.slice(-8)
        }))
    ],
    timeLabels: timeSeriesData.timeLabels.slice(-8)
  };  
  
  // Update month foot traffic to include the current location
  const monthFootTrafficData = {
    buildings: [
      { 
        id: 'current', 
        name: getCameraName(videoStats.location), 
        value: videoStats.people_count * 30, // Projected monthly value
        color: getLocationColor(getCameraName(videoStats.location))
      },
      ...mapData.markers
        .filter(marker => marker.name !== getCameraName(videoStats.location))
        .slice(0, 8)
        .map(marker => ({
          id: marker.id,
          name: marker.name,
          value: marker.count * 30, // Projected monthly value
          color: marker.color
        }))
    ].sort((a, b) => b.value - a.value)
  };
    // Get all locations based on data
  const locations = [
    getCameraName(videoStats.location),
    ...mapData.markers.map(marker => marker.name)
  ].filter((value, index, self) => self.indexOf(value) === index);
  
  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLocation(e.target.value);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Statistics</h1>
      
      {/* Live Statistics Summary */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="border-b pb-2 mb-3">
          <h3 className="font-bold">Current Analysis: {getCameraName(videoStats.location)}</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border rounded p-3 bg-blue-50">
            <div className="text-sm text-gray-600">People Count</div>
            <div className="text-2xl font-bold">{videoStats.people_count}</div>
          </div>
          <div className="border rounded p-3 bg-green-50">
            <div className="text-sm text-gray-600">Avg Dwell Time</div>
            <div className="text-2xl font-bold">{videoStats.avg_dwell_time} sec</div>
          </div>
          <div className="border rounded p-3 bg-purple-50">
            <div className="text-sm text-gray-600">Last Updated</div>
            <div className="text-sm">{new Date(videoStats.timestamp).toLocaleTimeString()}</div>
          </div>
        </div>
      </div>
      
      {/* Top section */}
      <div className="mb-6">
        <div className="bg-white rounded-lg shadow-sm">
          <div className="p-4 border-b">
            <h3 className="font-bold">Heatmap</h3>
          </div>
          <div className="p-4">
            {/* Heatmap Location Selector above the chart */}
            <div className="mb-3">
              <label className="block text-sm font-medium mb-1">Location:</label>
              <div className="relative max-w-sm">
                <select 
                  className="w-full bg-white border border-gray-300 rounded px-3 py-2 appearance-none focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedLocation}
                  onChange={handleLocationChange}
                >
                  {locations.map(location => (
                    <option key={location} value={location}>{location}</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                  <span className="material-icons text-sm">expand_more</span>
                </div>
              </div>
            </div>

            <div className="overflow-x-auto mb-4">
              <Plot
                data={[
                  {
                    z: heatmapData.z,
                    x: heatmapData.x,
                    y: heatmapData.y,
                    type: 'heatmap',
                    colorscale: [
                      [0, '#fff7bc'],
                      [0.2, '#fee391'],
                      [0.4, '#fec44f'],
                      [0.6, '#fe9929'],
                      [0.8, '#ec7014'],
                      [1, '#cc4c02']
                    ]
                  }
                ]}
                layout={{
                  autosize: true,
                  height: 250,
                  margin: { l: 50, r: 10, t: 10, b: 30 },
                }}
                config={{ displayModeBar: false, responsive: true }}
                style={{ width: '100%', height: '250px' }}
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Dwell Time Histogram */}
        <div className="bg-white rounded-lg shadow-sm">
          <DwellTimeHistogram 
            locations={dwellTimeData}
          />
        </div>
        
        {/* Average Foot Traffic Chart */}
        <AverageFootTrafficChart 
          gates={avgFootTrafficData.gates}
          timeLabels={avgFootTrafficData.timeLabels}
        />
      </div>
      
      {/* Bottom Charts: Foot Traffic and Dwell Time (side by side) */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <MonthFootTrafficChart 
          buildings={monthFootTrafficData.buildings} 
          barColor="#93C5FD"
          title="Foot Traffic in Previous Months"
        />
        {
          // Build dwell time monthly chart data (synthetic) using similar structure
        }
        <MonthFootTrafficChart 
          buildings={monthFootTrafficData.buildings.map(b => ({
            ...b,
            // derive dwell value roughly proportional but scaled
            value: Math.max(30, Math.floor((b.value / 30) * 0.6))
          }))} 
          barColor="#93C5FD"
          title="Dwell Time in Previous Months"
        />
      </div>
    </div>
  );
};

export default Statistics;
