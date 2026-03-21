import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { getDaysInMonth } from '../utils/calculations';
import { RotateCcw, Database } from 'lucide-react';
import { DataManagement } from './DataManagement';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stores' | 'staffs' | 'visitors' | 'factors'>('stores');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const { resetAllData } = useAppContext();

  const handleReset = () => {
    if (window.confirm('すべてのデータを初期状態にリセットしますか？この操作は取り消せません。')) {
      resetAllData();
    }
  };

  return (
    <div className="p-6 bg-neutral-100 min-h-screen">
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">マスタ設定</h1>
        <div className="flex space-x-3">
          <button 
            onClick={() => setIsDataModalOpen(true)}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 transition-colors shadow-sm"
          >
            <Database className="w-4 h-4 text-indigo-600" />
            <span>JSONコード入力・出力</span>
          </button>
          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>オールリセット</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-neutral-50">
          <button onClick={() => setActiveTab('stores')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'stores' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>店舗マスタ</button>
          <button onClick={() => setActiveTab('staffs')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'staffs' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>スタッフマスタ</button>
          <button onClick={() => setActiveTab('visitors')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'visitors' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>日別客数カレンダー</button>
          <button onClick={() => setActiveTab('factors')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'factors' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>外部要因</button>
        </div>

        <div className="p-6 overflow-x-auto">
          {activeTab === 'stores' && <StoreSettings />}
          {activeTab === 'staffs' && <StaffSettings />}
          {activeTab === 'visitors' && <VisitorSettings />}
          {activeTab === 'factors' && <FactorSettings />}
        </div>
      </div>
      {isDataModalOpen && <DataManagement onClose={() => setIsDataModalOpen(false)} />}
    </div>
  );
};

const StoreSettings = () => {
  const { stores, setStores } = useAppContext();

  const handleChange = (index: number, field: keyof typeof stores[0], value: string | number) => {
    const newStores = [...stores];
    newStores[index] = { ...newStores[index], [field]: value };
    setStores(newStores);
  };

  const handleAddStore = () => {
    const newId = `S${String(stores.length + 1).padStart(2, '0')}`;
    setStores([...stores, { id: newId, name: '新店舗', hoursW: 10, hoursH: 10, seats: 10, openDate: new Date().toISOString().split('T')[0] }]);
  };

  return (
    <div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-100 text-neutral-600 text-xs uppercase tracking-wider">
            <th className="p-3">ID</th>
            <th className="p-3">店舗名</th>
            <th className="p-3">平日営業時間</th>
            <th className="p-3">休日営業時間</th>
            <th className="p-3">席数</th>
            <th className="p-3">オープン日</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {stores.map((store, i) => (
            <tr key={store.id}>
              <td className="p-3 font-mono text-sm">{store.id}</td>
              <td className="p-3"><input type="text" value={store.name} onChange={e => handleChange(i, 'name', e.target.value)} className="border p-1 rounded w-full" /></td>
              <td className="p-3"><input type="number" value={store.hoursW} onChange={e => handleChange(i, 'hoursW', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
              <td className="p-3"><input type="number" value={store.hoursH} onChange={e => handleChange(i, 'hoursH', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
              <td className="p-3"><input type="number" value={store.seats} onChange={e => handleChange(i, 'seats', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
              <td className="p-3"><input type="date" value={store.openDate || ''} onChange={e => handleChange(i, 'openDate', e.target.value)} className="border p-1 rounded w-full" /></td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddStore} className="mt-4 bg-neutral-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-neutral-800 transition-colors">
        ＋ 店舗を追加
      </button>
    </div>
  );
};

const StaffSettings = () => {
  const { staffs, setStaffs } = useAppContext();

  const handleChange = (index: number, field: keyof typeof staffs[0], value: string | number) => {
    const newStaffs = [...staffs];
    newStaffs[index] = { ...newStaffs[index], [field]: value };
    setStaffs(newStaffs);
  };

  const handleAddStaff = () => {
    const newId = `ST${String(staffs.length + 1).padStart(2, '0')}`;
    setStaffs([...staffs, { id: newId, name: '新スタッフ', capacity: 20, daysOff: 8 }]);
  };

  const handleCapacityPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const values = text.split(/\t|,|\s+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length > 0) {
      // 貼り付けられた数値の単純平均を「個体能力（出勤1日あたりの能力）」として採用
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      handleChange(index, 'capacity', Math.round(avg * 10) / 10);
      e.currentTarget.value = ''; // clear input after paste
    }
  };

  return (
    <div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-100 text-neutral-600 text-xs uppercase tracking-wider">
            <th className="p-3">ID</th>
            <th className="p-3">氏名</th>
            <th className="p-3">研修生</th>
            <th className="p-3">個体能力</th>
            <th className="p-3">契約公休数</th>
            <th className="p-3">過去実績ペースト (自動計算)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {staffs.map((staff, i) => (
            <tr key={staff.id}>
              <td className="p-3 font-mono text-sm">{staff.id}</td>
              <td className="p-3"><input type="text" value={staff.name} onChange={e => handleChange(i, 'name', e.target.value)} className="border p-1 rounded w-full" /></td>
              <td className="p-3 text-center"><input type="checkbox" checked={staff.isTrainee || false} onChange={e => handleChange(i, 'isTrainee', e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" /></td>
              <td className="p-3"><input type="number" value={staff.capacity} onChange={e => handleChange(i, 'capacity', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
              <td className="p-3"><input type="number" value={staff.daysOff} onChange={e => handleChange(i, 'daysOff', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
              <td className="p-3">
                <input 
                  type="text" 
                  placeholder="Excelからペースト..." 
                  onPaste={(e) => handleCapacityPaste(i, e)} 
                  className="border p-1 rounded w-full text-xs bg-neutral-50" 
                  title="過去の対応人数をタブ区切りでペーストすると平均値を自動計算します"
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddStaff} className="mt-4 bg-neutral-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-neutral-800 transition-colors">
        ＋ スタッフを追加
      </button>
    </div>
  );
};

const VisitorSettings = () => {
  const { visitors, setVisitors, stores } = useAppContext();
  const [selectedStore, setSelectedStore] = useState(stores[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const storeVisitors = visitors.filter(v => v.storeId === selectedStore && v.date.startsWith(selectedMonth)).sort((a, b) => a.date.localeCompare(b.date));

  const handleChange = (date: string, field: 'visitors' | 'isHoliday', value: number | boolean) => {
    setVisitors(prev => {
      const newVisitors = [...prev];
      const index = newVisitors.findIndex(v => v.storeId === selectedStore && v.date === date);
      if (index >= 0) {
        newVisitors[index] = { ...newVisitors[index], [field]: value };
      } else {
        newVisitors.push({ date, storeId: selectedStore, visitors: field === 'visitors' ? value as number : 0, isHoliday: field === 'isHoliday' ? value as boolean : false });
      }
      return newVisitors;
    });
  };

  const handlePasteVisitors = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const values = text.split(/\t|,/).map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
    
    if (values.length === 0) return;

    const daysInMonth = getDaysInMonth(selectedMonth);
    setVisitors(prev => {
      // Remove existing entries for this month/store
      const newVisitors = prev.filter(v => !(v.storeId === selectedStore && v.date.startsWith(selectedMonth)));
      
      for (let i = 0; i < Math.min(values.length, daysInMonth); i++) {
        const day = String(i + 1).padStart(2, '0');
        const dateStr = `${selectedMonth}-${day}`;
        const d = new Date(dateStr);
        const isHoliday = d.getDay() === 0 || d.getDay() === 6;
        newVisitors.push({
          date: dateStr,
          storeId: selectedStore,
          visitors: values[i],
          isHoliday
        });
      }
      return newVisitors;
    });
    
    e.currentTarget.value = ''; // clear textarea after paste
  };

  return (
    <div className="space-y-6">
      <div className="flex space-x-4">
        <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border p-2 rounded">
          {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border p-2 rounded" />
      </div>
      
      <div className="bg-neutral-50 p-4 rounded-lg border border-neutral-200">
        <label className="block text-sm font-bold text-neutral-700 mb-2">Excelから一括入力 (横列データをペースト)</label>
        <textarea 
          placeholder="Excelの横列データ（タブ区切り）をここにペーストしてください..." 
          onPaste={handlePasteVisitors} 
          className="w-full border border-neutral-300 p-3 rounded text-sm h-20 resize-none focus:ring-2 focus:ring-neutral-400 focus:border-transparent outline-none" 
        />
        <p className="text-xs text-neutral-500 mt-2">※ペーストすると、選択中の月の1日から順に客数が上書きされます。</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-neutral-100 text-neutral-600 text-xs uppercase tracking-wider">
              <th className="p-3">日付</th>
              <th className="p-3">客数</th>
              <th className="p-3">休日フラグ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-200">
            {storeVisitors.map((v) => (
              <tr key={v.date}>
                <td className="p-3 font-mono text-sm">{v.date}</td>
                <td className="p-3"><input type="number" value={v.visitors} onChange={e => handleChange(v.date, 'visitors', Number(e.target.value))} className="border p-1 rounded w-32" /></td>
                <td className="p-3"><input type="checkbox" checked={v.isHoliday} onChange={e => handleChange(v.date, 'isHoliday', e.target.checked)} className="w-5 h-5" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const FactorSettings = () => {
  const { factors, setFactors, stores } = useAppContext();
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

  const monthFactors = stores.map(store => {
    const existing = factors.find(f => f.storeId === store.id && f.yearMonth === selectedMonth);
    return existing || { yearMonth: selectedMonth, storeId: store.id, adSpend: 0, competitorFlg: 0 as 0 | 1 };
  });

  const handleChange = (storeId: string, field: 'adSpend' | 'competitorFlg', value: number) => {
    setFactors(prev => {
      const newFactors = [...prev];
      const index = newFactors.findIndex(f => f.storeId === storeId && f.yearMonth === selectedMonth);
      if (index >= 0) {
        newFactors[index] = { ...newFactors[index], [field]: value };
      } else {
        newFactors.push({ yearMonth: selectedMonth, storeId, adSpend: field === 'adSpend' ? value : 0, competitorFlg: field === 'competitorFlg' ? value as 0 | 1 : 0 });
      }
      return newFactors;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex space-x-4">
        <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="border p-2 rounded" />
      </div>

      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-100 text-neutral-600 text-xs uppercase tracking-wider">
            <th className="p-3">店舗</th>
            <th className="p-3">広告費</th>
            <th className="p-3">競合出店フラグ (0 or 1)</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {monthFactors.map((f) => {
            const store = stores.find(s => s.id === f.storeId);
            return (
              <tr key={f.storeId}>
                <td className="p-3 font-medium">{store?.name}</td>
                <td className="p-3"><input type="number" value={f.adSpend} onChange={e => handleChange(f.storeId, 'adSpend', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
                <td className="p-3">
                  <select value={f.competitorFlg} onChange={e => handleChange(f.storeId, 'competitorFlg', Number(e.target.value))} className="border p-1 rounded w-full">
                    <option value={0}>0 (なし)</option>
                    <option value={1}>1 (あり)</option>
                  </select>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
