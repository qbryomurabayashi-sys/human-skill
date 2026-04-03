
import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { 
  runForecastEngine, 
  buildExternalMultiplier, 
  explainForecast, 
  ExternalParams,
  ActionAdvice
} from '../utils/forecastEngine';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import { AlertTriangle, TrendingUp, Info, CloudRain, Calendar, Users, BarChart2, ChevronDown, ChevronUp } from 'lucide-react';

export const ForecastView: React.FC = () => {
  const { visitors, stores } = useAppContext();
  const [selectedStore, setSelectedStore] = useState(stores[0]?.id || '');
  const [forecastMonths, setForecastMonths] = useState(6);
  
  // External Parameters State
  const [externalParams, setExternalParams] = useState<ExternalParams>({
    avgTemp: 22,
    rainDays: 8,
    holidayCount: 2,
    weekendRatio: 40,
    newCompetitors: 0,
    reviewScore: 4.1,
    cpiYoY: 2.5,
    sentimentDI: 10,
  });

  const [showExternalParams, setShowExternalParams] = useState(false);

  // Aggregate historical data by month
  const historicalData = useMemo(() => {
    if (!selectedStore) return [];
    
    const storeVisitors = visitors.filter(v => v.storeId === selectedStore);
    const monthlyMap = new Map<string, number>();
    
    storeVisitors.forEach(v => {
      const ym = v.date.substring(0, 7);
      monthlyMap.set(ym, (monthlyMap.get(ym) || 0) + v.visitors);
    });
    
    return Array.from(monthlyMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([month, total]) => ({ month, total }));
  }, [visitors, selectedStore]);

  const rawSalesArray = useMemo(() => historicalData.map(d => d.total), [historicalData]);

  // Run Forecast Engine
  const forecastResult = useMemo(() => {
    if (rawSalesArray.length === 0) return null;
    return runForecastEngine(rawSalesArray, forecastMonths);
  }, [rawSalesArray, forecastMonths]);

  // Apply External Multiplier
  const adjustedForecast = useMemo(() => {
    if (!forecastResult) return null;
    const multiplier = buildExternalMultiplier(externalParams);
    
    return {
      ensemble: forecastResult.ensemble.map(v => Math.round(v * multiplier)),
      upper: forecastResult.upper.map(v => Math.round(v * multiplier)),
      lower: forecastResult.lower.map(v => Math.round(v * multiplier)),
      multiplier
    };
  }, [forecastResult, externalParams]);

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!forecastResult || !adjustedForecast) return [];
    
    const data: any[] = historicalData.map(d => ({
      name: d.month,
      actual: d.total,
      type: 'history'
    }));
    
    const lastMonth = historicalData[historicalData.length - 1]?.month || new Date().toISOString().slice(0, 7);
    const [year, month] = lastMonth.split('-').map(Number);
    
    adjustedForecast.ensemble.forEach((val, i) => {
      const d = new Date(year, month + i);
      const name = d.toISOString().slice(0, 7);
      data.push({
        name,
        forecast: val,
        upper: adjustedForecast.upper[i],
        lower: adjustedForecast.lower[i],
        type: 'forecast'
      });
    });
    
    return data;
  }, [historicalData, forecastResult, adjustedForecast]);

  // Explanation Data
  const explanation = useMemo(() => {
    if (!forecastResult) return [];
    return explainForecast(forecastResult.ensemble[0], externalParams);
  }, [forecastResult, externalParams]);

  if (stores.length === 0) {
    return <div className="p-8 text-center text-neutral-500">店舗が登録されていません。</div>;
  }

  if (historicalData.length < 3) {
    return (
      <div className="p-12 text-center space-y-4">
        <div className="mx-auto w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center">
          <BarChart2 className="w-8 h-8 text-neutral-400" />
        </div>
        <div className="space-y-2">
          <h3 className="text-lg font-bold text-neutral-800">データ不足</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            予測エンジンを稼働させるには、少なくとも3ヶ月分の実績データが必要です。
            「日別客数カレンダー」から過去のデータを入力してください。
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header & Store Selection */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select 
            value={selectedStore} 
            onChange={e => setSelectedStore(e.target.value)}
            className="border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-red-500 outline-none font-bold"
          >
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center space-x-2">
            <span className="text-sm text-neutral-500">予測期間:</span>
            <select 
              value={forecastMonths} 
              onChange={e => setForecastMonths(Number(e.target.value))}
              className="border p-1 rounded text-sm"
            >
              {[3, 6, 12, 18, 24].map(m => <option key={m} value={m}>{m}ヶ月</option>)}
            </select>
          </div>
        </div>

        {forecastResult && (
          <div className="flex items-center space-x-2">
            <span className="text-xs font-bold text-neutral-400 uppercase tracking-wider">Status:</span>
            <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
              forecastResult.mode === 'startup' ? 'bg-blue-100 text-blue-700' :
              forecastResult.mode === 'shift' ? 'bg-orange-100 text-orange-700' :
              forecastResult.mode === 'recovery' ? 'bg-green-100 text-green-700' :
              'bg-neutral-100 text-neutral-700'
            }`}>
              {forecastResult.mode}
            </span>
          </div>
        )}
      </div>

      {/* Main Forecast Chart */}
      <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-neutral-800 flex items-center space-x-2">
            <TrendingUp className="w-5 h-5 text-red-500" />
            <span>需要予測トレンド</span>
          </h3>
          <div className="flex items-center space-x-4 text-xs">
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-neutral-400 rounded-full"></div>
              <span>実績</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
              <span>予測</span>
            </div>
            <div className="flex items-center space-x-1">
              <div className="w-3 h-3 bg-red-100 rounded-full border border-red-200"></div>
              <span>80%信頼区間</span>
            </div>
          </div>
        </div>
        
        <div className="h-[400px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
              <XAxis 
                dataKey="name" 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#888'}} 
                dy={10}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{fontSize: 10, fill: '#888'}}
                tickFormatter={(val) => `${(val/10000).toFixed(1)}万`}
              />
              <Tooltip 
                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                formatter={(value: number) => [`${value.toLocaleString()}人`, '']}
              />
              <Area 
                type="monotone" 
                dataKey="actual" 
                stroke="#555" 
                fill="transparent" 
                strokeWidth={2} 
                dot={{ r: 4, fill: '#555' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="lower" 
                stroke="transparent" 
                fill="#fee2e2" 
                connectNulls
              />
              <Area 
                type="monotone" 
                dataKey="upper" 
                stroke="transparent" 
                fill="#fee2e2" 
                connectNulls
              />
              <Line 
                type="monotone" 
                dataKey="forecast" 
                stroke="#ef4444" 
                strokeWidth={3} 
                strokeDasharray="5 5"
                dot={{ r: 4, fill: '#ef4444' }}
                activeDot={{ r: 6 }}
                connectNulls
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Action Advisor */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-800 mb-4 flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              <span>アクション推奨</span>
            </h3>
            <div className="space-y-4">
              {forecastResult?.actions.map((action, i) => (
                <div key={i} className={`p-4 rounded-lg border flex items-start space-x-4 ${
                  action.type === 'A' ? 'bg-blue-50 border-blue-100' :
                  action.type === 'B' ? 'bg-orange-50 border-orange-100' :
                  action.type === 'C' ? 'bg-red-50 border-red-100' :
                  'bg-green-50 border-green-100'
                }`}>
                  <div className={`mt-1 p-1.5 rounded-full ${
                    action.type === 'A' ? 'bg-blue-200 text-blue-700' :
                    action.type === 'B' ? 'bg-orange-200 text-orange-700' :
                    action.type === 'C' ? 'bg-red-200 text-red-700' :
                    'bg-green-200 text-green-700'
                  }`}>
                    {action.type === 'ok' ? <BarChart2 size={16} /> : <Info size={16} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-neutral-900">{action.title}</h4>
                    <p className="text-sm text-neutral-600 mt-1 leading-relaxed">{action.message}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* External Factors Explanation */}
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <h3 className="text-lg font-bold text-neutral-800 mb-6 flex items-center space-x-2">
              <BarChart2 className="w-5 h-5 text-blue-500" />
              <span>外部要因による補正インパクト</span>
            </h3>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={explanation} layout="vertical" margin={{ left: 40 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#f0f0f0" />
                  <XAxis type="number" hide />
                  <YAxis dataKey="label" type="category" axisLine={false} tickLine={false} tick={{fontSize: 12, fontWeight: 'bold'}} />
                  <Tooltip 
                    cursor={{fill: '#f9f9f9'}}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    formatter={(value: number, name: string, props: any) => [`${value > 0 ? '+' : ''}${value.toLocaleString()}人 (${props.payload.pct}%)`, '補正量']}
                  />
                  <Bar dataKey="delta" radius={[0, 4, 4, 0]}>
                    {explanation.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.delta >= 0 ? '#10b981' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 p-4 bg-neutral-50 rounded-lg flex items-center justify-between">
              <span className="text-sm font-bold text-neutral-600">総合補正倍率:</span>
              <span className={`text-lg font-black ${adjustedForecast?.multiplier! >= 1 ? 'text-green-600' : 'text-red-600'}`}>
                {adjustedForecast?.multiplier.toFixed(2)}x
              </span>
            </div>
          </div>
        </div>

        {/* External Parameters Form */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
            <button 
              onClick={() => setShowExternalParams(!showExternalParams)}
              className="w-full flex items-center justify-between text-lg font-bold text-neutral-800 mb-4"
            >
              <div className="flex items-center space-x-2">
                <CloudRain className="w-5 h-5 text-blue-400" />
                <span>外部要因パラメータ</span>
              </div>
              {showExternalParams ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
            
            <div className={`space-y-4 transition-all duration-300 overflow-hidden ${showExternalParams ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}`}>
              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 flex items-center space-x-1">
                  <CloudRain size={12} />
                  <span>月平均気温 (°C)</span>
                </label>
                <input 
                  type="range" min="-10" max="40" step="1"
                  value={externalParams.avgTemp}
                  onChange={e => setExternalParams({...externalParams, avgTemp: Number(e.target.value)})}
                  className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
                />
                <div className="flex justify-between text-[10px] text-neutral-400">
                  <span>-10°C</span>
                  <span className="font-bold text-blue-600">{externalParams.avgTemp}°C</span>
                  <span>40°C</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 flex items-center space-x-1">
                  <CloudRain size={12} />
                  <span>月間降水日数</span>
                </label>
                <input 
                  type="number"
                  value={externalParams.rainDays}
                  onChange={e => setExternalParams({...externalParams, rainDays: Number(e.target.value)})}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 flex items-center space-x-1">
                  <Calendar size={12} />
                  <span>月間祝日数</span>
                </label>
                <input 
                  type="number"
                  value={externalParams.holidayCount}
                  onChange={e => setExternalParams({...externalParams, holidayCount: Number(e.target.value)})}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 flex items-center space-x-1">
                  <Users size={12} />
                  <span>競合新規出店数</span>
                </label>
                <input 
                  type="number"
                  value={externalParams.newCompetitors}
                  onChange={e => setExternalParams({...externalParams, newCompetitors: Number(e.target.value)})}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 flex items-center space-x-1">
                  <BarChart2 size={12} />
                  <span>口コミ平均スコア</span>
                </label>
                <input 
                  type="number" step="0.1" min="1" max="5"
                  value={externalParams.reviewScore}
                  onChange={e => setExternalParams({...externalParams, reviewScore: Number(e.target.value)})}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-neutral-500 flex items-center space-x-1">
                  <TrendingUp size={12} />
                  <span>景況感DI (-100〜+100)</span>
                </label>
                <input 
                  type="number"
                  value={externalParams.sentimentDI}
                  onChange={e => setExternalParams({...externalParams, sentimentDI: Number(e.target.value)})}
                  className="w-full border p-2 rounded text-sm"
                />
              </div>
            </div>
          </div>

          {/* Forecast Stats */}
          <div className="bg-neutral-900 text-white p-6 rounded-xl shadow-lg">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest mb-4">次月予測サマリー</h3>
            <div className="space-y-6">
              <div>
                <span className="text-xs text-neutral-500 block mb-1">予測客数</span>
                <div className="flex items-baseline space-x-2">
                  <span className="text-3xl font-black">{adjustedForecast?.ensemble[0].toLocaleString()}</span>
                  <span className="text-sm text-neutral-400">人</span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] text-neutral-500 block mb-1">下限 (80%)</span>
                  <span className="text-lg font-bold text-red-400">{adjustedForecast?.lower[0].toLocaleString()}</span>
                </div>
                <div>
                  <span className="text-[10px] text-neutral-500 block mb-1">上限 (80%)</span>
                  <span className="text-lg font-bold text-green-400">{adjustedForecast?.upper[0].toLocaleString()}</span>
                </div>
              </div>
              <div className="pt-4 border-t border-neutral-800">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-neutral-500">ボラティリティ (σ)</span>
                  <span className="font-mono">{forecastResult?.sigma.toFixed(1)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
