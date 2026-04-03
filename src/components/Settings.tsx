import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import { getDaysInMonth, calculatePredictions, isPublicHoliday } from '../utils/calculations';
import { RotateCcw, Database, Trash2, GripVertical, LayoutGrid, List, ChevronLeft, ChevronRight, BarChart3, FileUp, ClipboardPaste } from 'lucide-react';
import { DataManagement } from './DataManagement';
import { ConfirmModal } from './ConfirmModal';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { StoreMaster, DailyVisitor } from '../types';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'stores' | 'staffs' | 'visitors'>('stores');
  const [isDataModalOpen, setIsDataModalOpen] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const { resetAllData } = useAppContext();

  const handleReset = () => {
    setIsConfirmModalOpen(true);
  };

  const confirmReset = () => {
    resetAllData();
  };

  return (
    <div className="p-6 bg-neutral-100 min-h-screen">
      <div className="max-w-7xl mx-auto mb-6 flex justify-between items-center">
        <h1 className="text-2xl font-bold text-neutral-900">マスタ設定</h1>
        <div className="flex space-x-3">

          <button 
            onClick={handleReset}
            className="flex items-center space-x-2 px-4 py-2 bg-white border border-red-200 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-colors shadow-sm"
          >
            <RotateCcw className="w-4 h-4" />
            <span>全データ削除</span>
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="flex border-b border-neutral-200 bg-neutral-50">
          <button onClick={() => setActiveTab('stores')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'stores' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>店舗マスタ</button>
          <button onClick={() => setActiveTab('staffs')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'staffs' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>スタッフマスタ</button>
          <button onClick={() => setActiveTab('visitors')} className={`px-6 py-4 text-sm font-bold uppercase tracking-wider ${activeTab === 'visitors' ? 'border-b-2 border-red-600 text-red-600' : 'text-neutral-500 hover:text-neutral-900'}`}>日別客数カレンダー</button>
        </div>

        <div className="p-6 overflow-x-auto">
          {activeTab === 'stores' && <StoreSettings />}
          {activeTab === 'staffs' && <StaffSettings />}
          {activeTab === 'visitors' && <VisitorSettings />}
        </div>
      </div>
      {isDataModalOpen && <DataManagement onClose={() => setIsDataModalOpen(false)} />}
      <ConfirmModal 
        isOpen={isConfirmModalOpen}
        message="すべてのデータを削除して空にしますか？この操作は取り消せません。"
        onConfirm={confirmReset}
        onCancel={() => setIsConfirmModalOpen(false)}
      />
    </div>
  );
};

const StoreSettings = () => {
  const { stores, setStores, setAllocations, setStoreWorkforcePlans, setVisitors } = useAppContext();
  const [storeToDelete, setStoreToDelete] = useState<string | null>(null);

  const handleChange = (index: number, field: keyof typeof stores[0], value: string | number) => {
    const newStores = [...stores];
    newStores[index] = { ...newStores[index], [field]: value };
    setStores(newStores);
  };

  const handleAddStore = () => {
    const newId = `S_${Date.now().toString(36)}`;
    const maxOrder = stores.length > 0 ? Math.max(...stores.map(s => s.order ?? 0)) : -1;
    setStores([...stores, { id: newId, name: '新店舗', hoursW: 10, hoursH: 10, seats: 10, openDate: new Date().toISOString().split('T')[0], area: '未設定', order: maxOrder + 1 }]);
  };

  const handleDeleteStore = (id: string) => {
    setStoreToDelete(id);
  };

  const confirmDeleteStore = () => {
    if (storeToDelete) {
      setStores(stores.filter(s => s.id !== storeToDelete));
      setAllocations(prev => prev.filter(a => a.storeId !== storeToDelete));
      setStoreWorkforcePlans(prev => prev.filter(p => p.storeId !== storeToDelete));
      setVisitors(prev => prev.filter(v => v.storeId !== storeToDelete));
      setStoreToDelete(null);
    }
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;

    const items = Array.from(stores);
    const [reorderedItem] = items.splice(result.source.index, 1);
    if (!reorderedItem) return;
    items.splice(result.destination.index, 0, reorderedItem);

    // Update order property
    const updatedItems = items.map((item, index) => ({
      ...(item as StoreMaster),
      order: index
    }));

    setStores(updatedItems);
  };

  // Sort stores by order before rendering
  const sortedStores = [...stores].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  return (
    <div>
      <DragDropContext onDragEnd={handleDragEnd}>
        <Droppable droppableId="stores">
          {(provided) => (
            <table className="w-full text-left border-collapse" {...provided.droppableProps} ref={provided.innerRef}>
              <thead>
                <tr className="bg-neutral-100 text-neutral-600 text-xs uppercase tracking-wider">
                  <th className="p-3 w-10"></th>
                  <th className="p-3">ID</th>
                  <th className="p-3">エリア</th>
                  <th className="p-3">店舗名</th>
                  <th className="p-3">平日営業時間</th>
                  <th className="p-3">休日営業時間</th>
                  <th className="p-3">席数</th>
                  <th className="p-3">オープン日</th>
                  <th className="p-3 w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {sortedStores.map((store, i) => (
                  // @ts-ignore
                  <Draggable key={store.id} draggableId={store.id} index={i}>
                    {(provided) => (
                      <tr ref={provided.innerRef} {...provided.draggableProps} className="bg-white">
                        <td className="p-3" {...provided.dragHandleProps}>
                          <GripVertical className="w-5 h-5 text-neutral-400 cursor-grab" />
                        </td>
                        <td className="p-3 font-mono text-sm">{store.id}</td>
                        <td className="p-3"><input type="text" value={store.area || ''} onChange={e => handleChange(i, 'area', e.target.value)} className="border p-1 rounded w-full" placeholder="エリア" /></td>
                        <td className="p-3"><input type="text" value={store.name} onChange={e => handleChange(i, 'name', e.target.value)} className="border p-1 rounded w-full" /></td>
                        <td className="p-3"><input type="number" value={store.hoursW} onChange={e => handleChange(i, 'hoursW', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
                        <td className="p-3"><input type="number" value={store.hoursH} onChange={e => handleChange(i, 'hoursH', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
                        <td className="p-3"><input type="number" value={store.seats} onChange={e => handleChange(i, 'seats', Number(e.target.value))} className="border p-1 rounded w-full" /></td>
                        <td className="p-3"><input type="date" value={store.openDate || ''} onChange={e => handleChange(i, 'openDate', e.target.value)} className="border p-1 rounded w-full" /></td>
                        <td className="p-3">
                          <button onClick={() => handleDeleteStore(store.id)} className="text-red-500 hover:text-red-700 p-1">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </tbody>
            </table>
          )}
        </Droppable>
      </DragDropContext>
      <button onClick={handleAddStore} className="mt-4 bg-neutral-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-neutral-800 transition-colors">
        ＋ 店舗を追加
      </button>
      <ConfirmModal 
        isOpen={!!storeToDelete}
        message="この店舗を削除してもよろしいですか？"
        onConfirm={confirmDeleteStore}
        onCancel={() => setStoreToDelete(null)}
      />
    </div>
  );
};

const StaffSettings = () => {
  const { staffs, setStaffs, setAllocations, setStaffWorkforceDetails } = useAppContext();
  const [staffToDelete, setStaffToDelete] = useState<string | null>(null);

  const handleChange = (index: number, field: keyof typeof staffs[0], value: string | number) => {
    const newStaffs = [...staffs];
    newStaffs[index] = { ...newStaffs[index], [field]: value };
    setStaffs(newStaffs);
  };

  const handleAddStaff = () => {
    const newId = `ST_${Date.now().toString(36)}`;
    const maxOrder = staffs.length > 0 ? Math.max(...staffs.map(s => s.order ?? 0)) : -1;
    setStaffs([...staffs, { id: newId, name: '新スタッフ', capacity: 20, daysOff: 8, skillLevel: 'standard', order: maxOrder + 1 }]);
  };

  const handleDeleteStaff = (id: string) => {
    setStaffToDelete(id);
  };

  const confirmDeleteStaff = () => {
    if (staffToDelete) {
      setStaffs(staffs.filter(s => s.id !== staffToDelete));
      setAllocations(prev => prev.map(a => ({
        ...a,
        slots: a.slots.filter(s => s !== staffToDelete)
      })));
      setStaffWorkforceDetails(prev => prev.filter(d => d.staffId !== staffToDelete));
      setStaffToDelete(null);
    }
  };

  const handleCapacityPaste = (index: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    const values = text.split(/\t|,|\s+/).map(v => parseFloat(v.trim())).filter(v => !isNaN(v));
    if (values.length > 0) {
      // 貼り付けられた数値の単純平均を(30.5 - 契約公休数)で割り、「個体能力（出勤1日あたりの能力）」として採用
      const avg = values.reduce((a, b) => a + b, 0) / values.length;
      const staff = staffs[index];
      const divisor = 30.5 - (staff.daysOff || 0);
      const dailyCapacity = divisor > 0 ? avg / divisor : 0;
      handleChange(index, 'capacity', Math.round(dailyCapacity * 10) / 10);
      e.currentTarget.value = ''; // clear input after paste
    }
  };

  const applySkillLevel = (index: number, level: 'trainee' | 'standard' | 'leader') => {
    // 基準となる実働時間（例: 10時間 - 1.5時間 = 8.5時間）で計算
    const multipliers = { trainee: 2.5, standard: 3.5, leader: 4.0 };
    const baseHours = 10; // 基準営業時間
    const activeHours = baseHours - 1.5;
    const capacity = Math.round(activeHours * multipliers[level] * 10) / 10;
    
    const newStaffs = [...staffs];
    newStaffs[index] = { ...newStaffs[index], skillLevel: level, capacity };
    setStaffs(newStaffs);
  };

  return (
    <div>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-neutral-100 text-neutral-600 text-xs uppercase tracking-wider">
            <th className="p-3">ID</th>
            <th className="p-3">氏名</th>
            <th className="p-3">スキルマーク</th>
            <th className="p-3">個体能力</th>
            <th className="p-3">契約公休数</th>
            <th className="p-3">過去実績ペースト (自動計算)</th>
            <th className="p-3 w-10"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {staffs.map((staff, i) => (
            <tr key={staff.id}>
              <td className="p-3 font-mono text-sm">{staff.id}</td>
              <td className="p-3"><input type="text" value={staff.name} onChange={e => handleChange(i, 'name', e.target.value)} className="border p-1 rounded w-full" /></td>
              <td className="p-3">
                <select 
                  value={staff.skillLevel || 'standard'} 
                  onChange={e => applySkillLevel(i, e.target.value as any)}
                  className="border p-1 rounded w-full text-sm"
                >
                  <option value="trainee">新人 (2.5)</option>
                  <option value="standard">標準 (3.5)</option>
                  <option value="leader">指導者 (4.0)</option>
                </select>
              </td>
              <td className="p-3">
                <input type="number" value={staff.capacity} onChange={e => handleChange(i, 'capacity', Number(e.target.value))} className="border p-1 rounded w-full" />
              </td>
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
              <td className="p-3">
                <button onClick={() => handleDeleteStaff(staff.id)} className="text-red-500 hover:text-red-700 p-1">
                  <Trash2 className="w-4 h-4" />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <button onClick={handleAddStaff} className="mt-4 bg-neutral-900 text-white px-4 py-2 rounded text-sm font-medium hover:bg-neutral-800 transition-colors">
        ＋ スタッフを追加
      </button>
      <ConfirmModal 
        isOpen={!!staffToDelete}
        message="このスタッフを削除してもよろしいですか？"
        onConfirm={confirmDeleteStaff}
        onCancel={() => setStaffToDelete(null)}
      />
    </div>
  );
};

const VisitorSettings = () => {
  const { visitors, setVisitors, stores } = useAppContext();
  const [selectedStore, setSelectedStore] = useState(stores[0]?.id || '');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');

  const [visitorToDelete, setVisitorToDelete] = useState<string | null>(null);
  const [isClearMonthModalOpen, setIsClearMonthModalOpen] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDayOfMonth = new Date(`${selectedMonth}-01`).getDay(); // 0: Sun, 1: Mon, ...

  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const day = String(i + 1).padStart(2, '0');
    return `${selectedMonth}-${day}`;
  });

  const storeVisitorsMap = useMemo(() => {
    const map = new Map<string, DailyVisitor>();
    visitors.filter(v => v.storeId === selectedStore && v.date.startsWith(selectedMonth)).forEach(v => {
      map.set(v.date, v);
    });
    return map;
  }, [visitors, selectedStore, selectedMonth]);

  const stats = useMemo(() => {
    const currentMonthVisitors = Array.from(storeVisitorsMap.values()) as DailyVisitor[];
    if (currentMonthVisitors.length === 0) return null;

    let total = 0;
    let weekdayTotal = 0;
    let weekendTotal = 0;
    let weekdayCount = 0;
    let weekendCount = 0;

    currentMonthVisitors.forEach(v => {
      const visitors = v.visitors || 0;
      total += visitors;
      if (v.isHoliday) {
        weekendTotal += visitors;
        weekendCount++;
      } else {
        weekdayTotal += visitors;
        weekdayCount++;
      }
    });

    const avg = Math.round(total / currentMonthVisitors.length);
    const weekdayAvg = weekdayCount > 0 ? Math.round(weekdayTotal / weekdayCount) : 0;
    const weekendAvg = weekendCount > 0 ? Math.round(weekendTotal / weekendCount) : 0;

    return { total, avg, weekdayAvg, weekendAvg, count: currentMonthVisitors.length };
  }, [storeVisitorsMap]);

  const handleChange = (date: string, field: 'visitors' | 'isHoliday', value: number | boolean | null) => {
    setVisitors(prev => {
      const newVisitors = [...prev];
      const index = newVisitors.findIndex(v => v.storeId === selectedStore && v.date === date);
      
      if (field === 'visitors' && value === null) {
        if (index >= 0) {
          newVisitors.splice(index, 1);
        }
        return newVisitors;
      }

      if (index >= 0) {
        newVisitors[index] = { ...newVisitors[index], [field]: value };
      } else {
        const d = new Date(date);
        const isHolidayDefault = d.getDay() === 0 || d.getDay() === 6 || isPublicHoliday(d);
        newVisitors.push({ 
          date, 
          storeId: selectedStore, 
          visitors: field === 'visitors' ? value as number : 0, 
          isHoliday: field === 'isHoliday' ? value as boolean : isHolidayDefault 
        });
      }
      return newVisitors;
    });
  };

  const processImportedData = (data: any[]) => {
    const newEntries: DailyVisitor[] = [];
    if (data.length === 0) return;

    // Detect Matrix Format (e.g. Store in rows, Dates in columns)
    let isMatrix = false;
    let matrixHeaders: string[] = [];
    
    // Check if it's an array of arrays (from paste) or array of objects (from XLSX)
    if (Array.isArray(data[0])) {
      const firstRow = data[0].map(h => String(h));
      const dateLikeCount = firstRow.filter(h => 
        h.match(/^\d{1,2}\/\d{1,2}$/) || 
        h.match(/^\d{4}-\d{2}-\d{2}$/) ||
        h.match(/^\d{1,2}月\d{1,2}日$/) ||
        h.match(/^\d{4}年\d{1,2}月\d{1,2}日$/)
      ).length;
      if (dateLikeCount > 5) {
        isMatrix = true;
        matrixHeaders = firstRow;
      }
    } else if (typeof data[0] === 'object') {
      const keys = Object.keys(data[0]);
      const dateLikeCount = keys.filter(k => 
        k.match(/^\d{1,2}\/\d{1,2}$/) || 
        k.match(/^\d{4}-\d{2}-\d{2}$/) ||
        k.match(/^\d{1,2}月\d{1,2}日$/) ||
        k.match(/^\d{4}年\d{1,2}月\d{1,2}日$/)
      ).length;
      if (dateLikeCount > 5) {
        isMatrix = true;
        matrixHeaders = keys;
      }
    }

    if (isMatrix) {
      const rowsToProcess = Array.isArray(data[0]) ? data.slice(1) : data;
      rowsToProcess.forEach(row => {
        let storeIdVal = selectedStore;
        let rowData: any[] = [];
        let rowObj: any = {};

        if (Array.isArray(row)) {
          rowData = row;
          const sVal = String(row[0]);
          const foundStore = stores.find(s => s.id === sVal || s.name === sVal);
          if (foundStore) storeIdVal = foundStore.id;
        } else {
          rowObj = row;
          const storeKey = Object.keys(row).find(k => k.toLowerCase().includes('store') || k.toLowerCase().includes('店舗') || k.toLowerCase().includes('店'));
          if (storeKey) {
            const val = String(row[storeKey]);
            const foundStore = stores.find(s => s.id === val || s.name === val);
            if (foundStore) storeIdVal = foundStore.id;
          }
        }

        matrixHeaders.forEach((header, colIdx) => {
          if (header.toLowerCase().includes('store') || header.toLowerCase().includes('店舗') || header.toLowerCase().includes('店')) return;
          
          let dateStr = header;
          let visitorsVal = 0;

          if (Array.isArray(row)) {
            visitorsVal = parseInt(String(row[colIdx]), 10);
          } else {
            visitorsVal = parseInt(String(row[header]), 10);
          }

          if (!isNaN(visitorsVal)) {
            if (dateStr.match(/^\d{1,2}\/\d{1,2}$/)) {
              const [m, d] = dateStr.split('/');
              const year = selectedMonth.split('-')[0];
              dateStr = `${year}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else if (dateStr.match(/^\d{1,2}月\d{1,2}日$/)) {
              const match = dateStr.match(/^(\d{1,2})月(\d{1,2})日$/);
              if (match) {
                const year = selectedMonth.split('-')[0];
                dateStr = `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
              }
            } else if (dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)) {
              const match = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
              if (match) {
                dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
              }
            }

            const d = new Date(dateStr);
            if (!isNaN(d.getTime())) {
              const formattedDate = d.toISOString().split('T')[0];
              const isHoliday = d.getDay() === 0 || d.getDay() === 6 || isPublicHoliday(d);
              newEntries.push({
                date: formattedDate,
                storeId: storeIdVal,
                visitors: visitorsVal,
                isHoliday
              });
            }
          }
        });
      });
    } else {
      // List Format
      data.forEach((row, index) => {
        let dateStr = '';
        let visitorsVal = 0;
        let storeIdVal = selectedStore;

        if (Array.isArray(row)) {
          if (row.length >= 3) {
            const sVal = String(row[0]);
            const foundStore = stores.find(s => s.id === sVal || s.name === sVal);
            if (foundStore) storeIdVal = foundStore.id;
            dateStr = String(row[1]);
            visitorsVal = parseInt(String(row[2]), 10);
          } else if (row.length === 2) {
            dateStr = String(row[0]);
            visitorsVal = parseInt(String(row[1]), 10);
          } else if (row.length === 1) {
            const day = String(index + 1).padStart(2, '0');
            dateStr = `${selectedMonth}-${day}`;
            visitorsVal = parseInt(String(row[0]), 10);
          }
        } else if (typeof row === 'object') {
          const keys = Object.keys(row);
          const dateKey = keys.find(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('日付'));
          const visitorKey = keys.find(k => k.toLowerCase().includes('visitor') || k.toLowerCase().includes('客数') || k.toLowerCase().includes('count'));
          const storeKey = keys.find(k => k.toLowerCase().includes('store') || k.toLowerCase().includes('店舗') || k.toLowerCase().includes('店'));
          
          if (storeKey) {
            const val = String(row[storeKey]);
            const foundStore = stores.find(s => s.id === val || s.name === val);
            if (foundStore) storeIdVal = foundStore.id;
          }

          if (dateKey && visitorKey) {
            dateStr = String(row[dateKey]);
            visitorsVal = parseInt(String(row[visitorKey]), 10);
          } else if (visitorKey) {
            const day = String(index + 1).padStart(2, '0');
            dateStr = `${selectedMonth}-${day}`;
            visitorsVal = parseInt(String(row[visitorKey]), 10);
          }
        }

        if (dateStr && !isNaN(visitorsVal)) {
          if (dateStr.length <= 2 && !isNaN(parseInt(dateStr, 10))) {
            dateStr = `${selectedMonth}-${dateStr.padStart(2, '0')}`;
          } else if (dateStr.match(/^\d{1,2}月\d{1,2}日$/)) {
            const match = dateStr.match(/^(\d{1,2})月(\d{1,2})日$/);
            if (match) {
              const year = selectedMonth.split('-')[0];
              dateStr = `${year}-${match[1].padStart(2, '0')}-${match[2].padStart(2, '0')}`;
            }
          } else if (dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/)) {
            const match = dateStr.match(/^(\d{4})年(\d{1,2})月(\d{1,2})日$/);
            if (match) {
              dateStr = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
            }
          }
          const d = new Date(dateStr);
          if (!isNaN(d.getTime())) {
            const formattedDate = d.toISOString().split('T')[0];
            const isHoliday = d.getDay() === 0 || d.getDay() === 6 || isPublicHoliday(d);
            newEntries.push({
              date: formattedDate,
              storeId: storeIdVal,
              visitors: visitorsVal,
              isHoliday
            });
          }
        }
      });
    }

    if (newEntries.length > 0) {
      setVisitors(prev => {
        const newVisitors = [...prev];
        newEntries.forEach(entry => {
          const idx = newVisitors.findIndex(v => v.storeId === entry.storeId && v.date === entry.date);
          if (idx >= 0) {
            newVisitors[idx] = entry;
          } else {
            newVisitors.push(entry);
          }
        });
        return newVisitors;
      });
      setImportError(null);
    } else {
      setImportError('有効なデータが見つかりませんでした。形式を確認してください。');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    const extension = file.name.split('.').pop()?.toLowerCase();

    if (extension === 'csv') {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          processImportedData(results.data);
        }
      });
    } else if (extension === 'xlsx' || extension === 'xls') {
      reader.onload = (evt) => {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);
        processImportedData(data);
      };
      reader.readAsBinaryString(file);
    }
    // Reset input
    e.target.value = '';
  };

  const handlePasteVisitors = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    e.preventDefault();
    const text = e.clipboardData.getData('text');
    
    // Try to parse as CSV-like structure from clipboard
    const rows = text.trim().split(/\r?\n/);
    const parsedData = rows.map(row => row.split(/\t/));
    
    processImportedData(parsedData);
  };

  const handlePasteOnInput = (date: string, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData('text');
    const values = text.split(/\t|,|\n|\s+/).map(v => parseInt(v.trim(), 10)).filter(v => !isNaN(v));
    if (values.length <= 1) return;

    e.preventDefault();
    const startDate = new Date(date);
    const startDay = startDate.getDate();
    
    setVisitors(prev => {
      const newVisitors = [...prev];
      for (let i = 0; i < values.length; i++) {
        const currentDay = startDay + i;
        if (currentDay > daysInMonth) break;
        
        const currentDateStr = `${selectedMonth}-${String(currentDay).padStart(2, '0')}`;
        const index = newVisitors.findIndex(v => v.storeId === selectedStore && v.date === currentDateStr);
        
        if (index >= 0) {
          newVisitors[index] = { ...newVisitors[index], visitors: values[i] };
        } else {
          const d = new Date(currentDateStr);
          const isHolidayDefault = d.getDay() === 0 || d.getDay() === 6 || isPublicHoliday(d);
          newVisitors.push({
            date: currentDateStr,
            storeId: selectedStore,
            visitors: values[i],
            isHoliday: isHolidayDefault
          });
        }
      }
      return newVisitors;
    });
  };

  const handleKeyDown = (date: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    const day = parseInt(date.split('-')[2], 10);
    let nextDay = day;

    if (e.key === 'ArrowDown' || e.key === 'Enter') {
      e.preventDefault();
      nextDay = day + (viewMode === 'calendar' ? 7 : 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      nextDay = day - (viewMode === 'calendar' ? 7 : 1);
    } else if (e.key === 'ArrowRight') {
      nextDay = day + 1;
    } else if (e.key === 'ArrowLeft') {
      nextDay = day - 1;
    } else {
      return;
    }

    if (nextDay >= 1 && nextDay <= daysInMonth) {
      const nextDateStr = `${selectedMonth}-${String(nextDay).padStart(2, '0')}`;
      const nextInput = document.querySelector(`input[data-date="${nextDateStr}"]`) as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  };

  const downloadTemplate = () => {
    const data: any[] = [];
    stores.forEach(store => {
      const row: any = { '店舗名': store.name };
      allDays.forEach(date => {
        const d = new Date(date);
        const dateLabel = `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
        row[dateLabel] = '';
      });
      data.push(row);
    });
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, `visitor_template_matrix_${selectedMonth}.xlsx`);
  };

  const changeMonth = (delta: number) => {
    const d = new Date(`${selectedMonth}-01`);
    d.setMonth(d.getMonth() + delta);
    setSelectedMonth(d.toISOString().slice(0, 7));
  };

  const confirmDeleteVisitor = () => {
    if (visitorToDelete) {
      setVisitors(prev => prev.filter(v => !(v.storeId === selectedStore && v.date === visitorToDelete)));
      setVisitorToDelete(null);
    }
  };

  const confirmClearMonth = () => {
    setVisitors(prev => prev.filter(v => !(v.storeId === selectedStore && v.date.startsWith(selectedMonth))));
    setIsClearMonthModalOpen(false);
  };

  const calendarGrid = useMemo(() => {
    const grid = [];
    // Padding
    for (let i = 0; i < firstDayOfMonth; i++) {
      grid.push(null);
    }
    // Days
    allDays.forEach(date => grid.push(date));
    return grid;
  }, [allDays, firstDayOfMonth]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center space-x-2">
          <select value={selectedStore} onChange={e => setSelectedStore(e.target.value)} className="border p-2 rounded bg-white shadow-sm focus:ring-2 focus:ring-red-500 outline-none">
            {stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <div className="flex items-center bg-white border rounded shadow-sm">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-neutral-100 border-r"><ChevronLeft size={18} /></button>
            <input type="month" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)} className="p-2 border-none focus:ring-0 font-bold" />
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-neutral-100 border-l"><ChevronRight size={18} /></button>
          </div>
        </div>

        <div className="flex items-center space-x-2 bg-neutral-100 p-1 rounded-lg">
          <button 
            onClick={() => setViewMode('calendar')} 
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-red-600' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            <LayoutGrid size={16} />
            <span>カレンダー</span>
          </button>
          <button 
            onClick={() => setViewMode('list')} 
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-red-600' : 'text-neutral-500 hover:text-neutral-700'}`}
          >
            <List size={16} />
            <span>リスト</span>
          </button>
        </div>

        <div className="flex space-x-2">
          <button onClick={() => setIsClearMonthModalOpen(true)} className="bg-white text-red-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-50 border border-red-200 transition-colors">
            一括削除
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2 text-neutral-700">
              <FileUp size={20} className="text-blue-500" />
              <span className="font-bold">Excel / CSV ファイルをアップロード</span>
            </div>
          </div>
          <div className="border-2 border-dashed border-neutral-200 rounded-lg p-8 text-center hover:border-blue-400 transition-colors relative group">
            <input 
              type="file" 
              accept=".csv, .xlsx, .xls" 
              onChange={handleFileUpload}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
            />
            <div className="space-y-2">
              <div className="mx-auto w-12 h-12 bg-blue-50 rounded-full flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                <FileUp className="text-blue-500 w-6 h-6" />
              </div>
              <p className="text-sm font-medium text-neutral-600">クリックまたはドラッグ＆ドロップ</p>
              <p className="text-xs text-neutral-400">.xlsx, .xls, .csv 形式に対応</p>
            </div>
          </div>
          <button 
            onClick={downloadTemplate}
            className="mt-4 w-full text-xs text-blue-600 hover:underline flex items-center justify-center space-x-1"
          >
            <span>テンプレートをダウンロード (.xlsx)</span>
          </button>
          {importError && <p className="text-xs text-red-500 mt-2 font-bold">{importError}</p>}
        </div>

        <div className="bg-white p-6 rounded-xl border border-neutral-200 shadow-sm">
          <div className="flex items-center space-x-2 mb-4 text-neutral-700">
            <ClipboardPaste size={20} className="text-green-500" />
            <span className="font-bold">Excelからコピー＆ペースト</span>
          </div>
          <textarea 
            placeholder="Excelのデータをここに貼り付け..." 
            onPaste={handlePasteVisitors} 
            className="w-full border border-neutral-200 p-4 rounded-lg text-sm h-32 resize-none focus:ring-2 focus:ring-green-500 outline-none bg-neutral-50 transition-all" 
          />
          <div className="mt-3 flex items-start space-x-2 text-[10px] text-neutral-400">
            <div className="mt-0.5">•</div>
            <p>「店舗名」「日付」「客数」の3列データ、または「日付」「客数」の2列データに対応しています。</p>
          </div>
          <div className="flex items-start space-x-2 text-[10px] text-neutral-400">
            <div className="mt-0.5">•</div>
            <p>日付が「2026-04-01」形式であれば、他の月や店舗のデータも一括で取り込めます。</p>
          </div>
          <div className="flex items-start space-x-2 text-[10px] text-neutral-400">
            <div className="mt-0.5">•</div>
            <p>1行目に日付（2025年5月1日など）、1列目に店舗名が並ぶ「マトリックス形式」にも対応しています。</p>
          </div>
        </div>
      </div>

      {stats && (
        <div className="bg-neutral-900 text-white p-4 rounded-xl shadow-lg flex flex-wrap gap-8 items-center">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-white/10 rounded-lg"><BarChart3 size={20} className="text-red-400" /></div>
            <div>
              <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">月間合計客数</p>
              <p className="text-xl font-black">{stats.total.toLocaleString()}<span className="text-xs ml-1 font-normal">名</span></p>
            </div>
          </div>
          <div className="h-8 w-px bg-white/10 hidden md:block"></div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">日平均</p>
            <p className="text-lg font-bold">{stats.avg.toLocaleString()}<span className="text-xs ml-1 font-normal">名</span></p>
          </div>
          <div>
            <p className="text-[10px] text-neutral-400 uppercase font-bold tracking-wider">平日平均</p>
            <p className="text-lg font-bold text-neutral-300">{stats.weekdayAvg.toLocaleString()}<span className="text-xs ml-1 font-normal">名</span></p>
          </div>
          <div>
            <p className="text-[10px] text-red-400 uppercase font-bold tracking-wider">休日平均</p>
            <p className="text-lg font-bold text-red-400">{stats.weekendAvg.toLocaleString()}<span className="text-xs ml-1 font-normal">名</span></p>
          </div>
          <div className="ml-auto text-[10px] text-neutral-500 italic">
            入力済み: {stats.count} / {daysInMonth} 日
          </div>
        </div>
      )}

      {viewMode === 'calendar' ? (
        <div className="bg-white p-4 rounded-xl border border-neutral-200 shadow-sm">
          <div className="grid grid-cols-7 gap-1 bg-neutral-100 p-1 rounded-lg">
            {['日', '月', '火', '水', '木', '金', '土'].map((d, i) => (
              <div key={d} className={`p-2 text-center text-xs font-black ${i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-neutral-500'}`}>
                {d}
              </div>
            ))}
            {calendarGrid.map((date, i) => {
              if (!date) return <div key={`empty-${i}`} className="bg-neutral-50/30 rounded-md h-24"></div>;
              
              const v = storeVisitorsMap.get(date);
              const d = new Date(date);
              const defaultIsHoliday = d.getDay() === 0 || d.getDay() === 6 || isPublicHoliday(d);
              const isHoliday = v ? v.isHoliday : defaultIsHoliday;
              const dayNum = date.split('-')[2];

              return (
                <div key={date} className={`h-24 p-2 rounded-md border transition-all flex flex-col group relative ${isHoliday ? 'bg-red-50/30 border-red-100' : 'bg-white border-neutral-100 hover:border-neutral-300'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-xs font-black ${isHoliday ? 'text-red-500' : 'text-neutral-400'}`}>{parseInt(dayNum, 10)}</span>
                    <input 
                      type="checkbox" 
                      checked={isHoliday} 
                      onChange={e => handleChange(date, 'isHoliday', e.target.checked)} 
                      className="w-3.5 h-3.5 cursor-pointer rounded border-neutral-300 text-red-600 focus:ring-red-500"
                    />
                  </div>
                  <div className="flex-grow flex items-center justify-center">
                    <input 
                      type="number" 
                      data-date={date}
                      value={v ? v.visitors : ''} 
                      onChange={e => handleChange(date, 'visitors', e.target.value === '' ? null : Number(e.target.value))}
                      onPaste={e => handlePasteOnInput(date, e)}
                      onKeyDown={e => handleKeyDown(date, e)}
                      className="w-full bg-transparent border-none focus:ring-0 p-0 text-lg font-black text-center outline-none transition-all placeholder:text-neutral-200" 
                      placeholder="-"
                    />
                  </div>
                  {v && (
                    <button 
                      onClick={() => setVisitorToDelete(date)} 
                      className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 text-neutral-300 hover:text-red-500 transition-opacity"
                    >
                      <Trash2 size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-neutral-50 text-neutral-600 text-xs uppercase tracking-wider border-b">
                <th className="p-4">日付</th>
                <th className="p-4">客数</th>
                <th className="p-4">休日フラグ</th>
                <th className="p-4 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {allDays.map((date) => {
                const v = storeVisitorsMap.get(date);
                const d = new Date(date);
                const defaultIsHoliday = d.getDay() === 0 || d.getDay() === 6 || isPublicHoliday(d);
                const isHoliday = v ? v.isHoliday : defaultIsHoliday;
                
                return (
                  <tr key={date} className={isHoliday ? 'bg-red-50/10' : 'hover:bg-neutral-50/50 transition-colors'}>
                    <td className="p-4 font-mono text-sm font-bold text-neutral-600">{date}</td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        data-date={date}
                        value={v ? v.visitors : ''} 
                        onChange={e => handleChange(date, 'visitors', e.target.value === '' ? null : Number(e.target.value))} 
                        onPaste={e => handlePasteOnInput(date, e)}
                        onKeyDown={e => handleKeyDown(date, e)}
                        className="border border-neutral-200 p-2 rounded-lg w-32 focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none font-bold" 
                        placeholder="未入力"
                      />
                    </td>
                    <td className="p-4">
                      <input 
                        type="checkbox" 
                        checked={isHoliday} 
                        onChange={e => handleChange(date, 'isHoliday', e.target.checked)} 
                        className="w-5 h-5 rounded border-neutral-300 text-red-600 focus:ring-red-500" 
                      />
                    </td>
                    <td className="p-4">
                      {v && (
                        <button onClick={() => setVisitorToDelete(date)} className="text-neutral-300 hover:text-red-500 p-1 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <ConfirmModal 
        isOpen={!!visitorToDelete}
        message="この日の客数データを削除してもよろしいですか？"
        onConfirm={() => {
          if (visitorToDelete) {
            setVisitors(prev => prev.filter(v => !(v.storeId === selectedStore && v.date === visitorToDelete)));
            setVisitorToDelete(null);
          }
        }}
        onCancel={() => setVisitorToDelete(null)}
      />
      <ConfirmModal 
        isOpen={isClearMonthModalOpen}
        message={`${selectedMonth}の客数データをすべて削除してもよろしいですか？`}
        onConfirm={confirmClearMonth}
        onCancel={() => setIsClearMonthModalOpen(false)}
      />
    </div>
  );
};

