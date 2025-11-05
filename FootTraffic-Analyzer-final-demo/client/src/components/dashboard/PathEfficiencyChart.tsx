import React, { useMemo } from 'react';

interface PathData {
  source: string;
  target: string;
  value: number;
}

interface PathEfficiencyChartProps {
  locations: Array<{
    name: string;
    color: string;
    trafficValues: number[];
    dwellTimeValues: number[];
  }>;
  timeLabels: string[];
}

const PathEfficiencyChart: React.FC<PathEfficiencyChartProps> = ({ 
  locations
}) => {
  // Compute summary metrics from latest values
  const metrics = useMemo(() => {
    const latest = locations.map(loc => ({
      name: loc.name,
      color: loc.color,
      traffic: loc.trafficValues[loc.trafficValues.length - 1] || 0,
      dwell: loc.dwellTimeValues[loc.dwellTimeValues.length - 1] || 0
    }));
    const totalTraffic = latest.reduce((s, l) => s + l.traffic, 0);
    const avgDwell = latest.length ? Math.round(latest.reduce((s,l)=>s+l.dwell,0)/latest.length) : 0;
    const top = [...latest].sort((a,b)=>b.traffic-a.traffic)[0];
    const efficiency = totalTraffic > 0 ? Math.min(100, Math.max(0, (avgDwell / 180) * 100)).toFixed(1) : '0.0';
    return {
      totalTraffic,
      avgDwell,
      topLocation: top?.name || 'N/A',
      efficiency
    };
  }, [locations]);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold flex items-center">
            <span className="material-icons mr-2 text-primary">account_tree</span>
            Path Efficiency Summary
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="rounded-lg border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">Efficiency</div>
            <div className="mt-1 text-2xl font-bold text-green-600">{metrics.efficiency}%</div>
          </div>
          <div className="rounded-lg border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">Total Traffic</div>
            <div className="mt-1 text-2xl font-bold text-blue-600">{metrics.totalTraffic}</div>
          </div>
          <div className="rounded-lg border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">Avg Dwell Time</div>
            <div className="mt-1 text-2xl font-bold text-purple-600">{metrics.avgDwell} s</div>
          </div>
          <div className="rounded-lg border p-4 bg-gray-50">
            <div className="text-xs text-gray-500">Top Location</div>
            <div className="mt-1 text-base font-semibold text-gray-800">{metrics.topLocation}</div>
          </div>
        </div>

        {/* Insight connected to summary metrics */}
        <div className="mt-3 text-sm text-gray-600">
          <span className="material-icons text-xs mr-1 align-middle text-amber-500">insights</span>
          Higher average dwell times tend to reduce efficiency. Focus on {metrics.topLocation} to sustain the current {metrics.efficiency}% efficiency.
        </div>

        {/* Compute pseudo paths from latest values and list top/bottom 5 by efficiency */}
        <PathLists locations={locations} />
      </div>
    </div>
  );
};

export default PathEfficiencyChart;

// Helper sub-component: builds path list from latest values
const PathLists: React.FC<{ locations: PathEfficiencyChartProps['locations'] }> = ({ locations }) => {
  const pairs = useMemo(() => {
    const latest = locations.map(loc => ({
      name: loc.name,
      color: loc.color,
      traffic: loc.trafficValues[loc.trafficValues.length - 1] || 0,
      dwell: loc.dwellTimeValues[loc.dwellTimeValues.length - 1] || 0
    }));

    const results: Array<{ label: string; score: number; color: string }> = [];
    for (let i = 0; i < latest.length; i++) {
      for (let j = 0; j < latest.length; j++) {
        if (i === j) continue;
        const flow = Math.min(latest[i].traffic, latest[j].traffic);
        const eff = latest[j].dwell > 0 ? flow / latest[j].dwell : 0; // more flow with lower dwell is efficient
        results.push({ label: `${latest[i].name} → ${latest[j].name}`, score: eff, color: latest[i].color });
      }
    }
    results.sort((a, b) => b.score - a.score);
    return {
      best: results.slice(0, 5),
      worst: results.slice(-5).reverse()
    };
  }, [locations]);

  return (
    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-2 flex items-center">
          <span className="material-icons text-green-600 mr-2">trending_up</span>
          Top 5 Efficient Paths
        </div>
        <ul className="space-y-2 text-sm">
          {pairs.best.map((p, idx) => (
            <li key={`best-${idx}`} className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }}></span>
                {p.label}
              </span>
              <span className="font-medium text-green-700">{p.score.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-lg border p-4">
        <div className="font-semibold mb-2 flex items-center">
          <span className="material-icons text-red-600 mr-2">trending_down</span>
          Top 5 Inefficient Paths
        </div>
        <ul className="space-y-2 text-sm">
          {pairs.worst.map((p, idx) => (
            <li key={`worst-${idx}`} className="flex items-center justify-between">
              <span className="flex items-center">
                <span className="w-2 h-2 rounded-full mr-2" style={{ backgroundColor: p.color }}></span>
                {p.label}
              </span>
              <span className="font-medium text-red-700">{p.score.toFixed(2)}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

