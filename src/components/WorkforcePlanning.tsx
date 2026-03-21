import React from 'react';
import { useAppContext } from '../context/AppContext';
import { getDayCountsInMonth, calculatePredictions, calculateRequiredStaff, calculateMonthsOpen, calculateBudgetBasedPredictions } from '../utils/calculations';
import { Users, Calendar, Calculator, CheckCircle, Plus, Trash2, TrendingUp, Copy } from 'lucide-react';
import { StoreWorkforcePlan, StaffWorkforceDetail } from '../types';

interface WorkforcePlanningProps {
  currentYearMonth: string;
  setCurrentYearMonth: (ym: string) => void;
}

export const WorkforcePlanning: React.FC<WorkforcePlanningProps> = ({ currentYearMonth, setCurrentYearMonth }) => {
  const { stores, staffs, visitors, factors, allocations, setAllocations, storeWorkforcePlans, setStoreWorkforcePlans, staffWorkforceDetails, setStaffWorkforceDetails, budgets, setBudgets } = useAppContext();

  const dayCounts = getDayCountsInMonth(currentYearMonth);

  const handleStorePlanChange = (storeId: string, field: keyof StoreWorkforcePlan, value: number) => {
    setStoreWorkforcePlans(prev => {
      const existing = prev.find(p => p.storeId === storeId && p.yearMonth === currentYearMonth);
      if (existing) {
        return prev.map(p => p.storeId === storeId && p.yearMonth === currentYearMonth ? { ...p, [field]: value } : p);
      } else {
        return [...prev, {
          storeId, yearMonth: currentYearMonth,
          mondayCount: 0, tuesdayCount: 0, wednesdayCount: 0, thursdayCount: 0, fridayCount: 0, saturdayCount: 0, sundayHolidayCount: 0,
          [field]: value
        }];
      }
    });
  };

  const handleStaffDetailChange = (staffId: string, field: keyof StaffWorkforceDetail, value: number) => {
    setStaffWorkforceDetails(prev => {
      const existing = prev.find(p => p.staffId === staffId && p.yearMonth === currentYearMonth);
      if (existing) {
        return prev.map(p => p.staffId === staffId && p.yearMonth === currentYearMonth ? { ...p, [field]: value } : p);
      } else {
        return [...prev, {
          staffId, yearMonth: currentYearMonth,
          extraWorkDays: 0, paidLeaveDays: 0, supportDays: 0, trainingDays: 0,
          [field]: value
        }];
      }
    });
  };

  const handleAddStaffToStore = (storeId: string, staffId: string) => {
    if (!staffId) return;
    setAllocations(prev => {
      const existing = prev.find(a => a.storeId === storeId && a.yearMonth === currentYearMonth);
      if (existing) {
        return prev.map(a => a.storeId === storeId && a.yearMonth === currentYearMonth ? { ...a, slots: [...a.slots, staffId] } : a);
      } else {
        return [...prev, { storeId, yearMonth: currentYearMonth, slots: [staffId] }];
      }
    });
  };

  const handleRemoveStaffFromStore = (storeId: string, staffId: string) => {
    setAllocations(prev => {
      return prev.map(a => {
        if (a.storeId === storeId && a.yearMonth === currentYearMonth) {
          const newSlots = [...a.slots];
          const index = newSlots.indexOf(staffId);
          if (index > -1) newSlots.splice(index, 1);
          return { ...a, slots: newSlots };
        }
        return a;
      });
    });
  };

  const handleBudgetChange = (storeId: string, value: number) => {
    setBudgets(prev => {
      const existing = prev.find(b => b.storeId === storeId && b.yearMonth === currentYearMonth);
      if (existing) {
        return prev.map(b => b.storeId === storeId && b.yearMonth === currentYearMonth ? { ...b, budget: value } : b);
      } else {
        return [...prev, { storeId, yearMonth: currentYearMonth, budget: value }];
      }
    });
  };

  const handleAddPartTimeStaff = (storeId: string) => {
    setStoreWorkforcePlans(prev => {
      const existing = prev.find(p => p.storeId === storeId && p.yearMonth === currentYearMonth);
      const newStaff = { id: Date.now().toString(), name: '', days: 0 };
      if (existing) {
        return prev.map(p => p.storeId === storeId && p.yearMonth === currentYearMonth ? { ...p, partTimeStaff: [...(p.partTimeStaff || []), newStaff] } : p);
      } else {
        return [...prev, {
          storeId, yearMonth: currentYearMonth,
          mondayCount: 0, tuesdayCount: 0, wednesdayCount: 0, thursdayCount: 0, fridayCount: 0, saturdayCount: 0, sundayHolidayCount: 0,
          partTimeStaff: [newStaff]
        }];
      }
    });
  };

  const handlePartTimeStaffChange = (storeId: string, staffId: string, field: 'name' | 'days', value: string | number) => {
    setStoreWorkforcePlans(prev => {
      return prev.map(p => {
        if (p.storeId === storeId && p.yearMonth === currentYearMonth) {
          const newPartTimeStaff = (p.partTimeStaff || []).map(s => s.id === staffId ? { ...s, [field]: value } : s);
          return { ...p, partTimeStaff: newPartTimeStaff };
        }
        return p;
      });
    });
  };

  const handleRemovePartTimeStaff = (storeId: string, staffId: string) => {
    setStoreWorkforcePlans(prev => {
      return prev.map(p => {
        if (p.storeId === storeId && p.yearMonth === currentYearMonth) {
          const newPartTimeStaff = (p.partTimeStaff || []).filter(s => s.id !== staffId);
          return { ...p, partTimeStaff: newPartTimeStaff };
        }
        return p;
      });
    });
  };

  const handleCopyFromPreviousMonth = () => {
    const [year, month] = currentYearMonth.split('-').map(Number);
    const prevDate = new Date(year, month - 2, 1);
    const prevYearMonth = `${prevDate.getFullYear()}-${String(prevDate.getMonth() + 1).padStart(2, '0')}`;

    // Copy allocations
    const prevAllocations = allocations.filter(a => a.yearMonth === prevYearMonth);
    if (prevAllocations.length > 0) {
      setAllocations(prev => {
        const currentFiltered = prev.filter(a => a.yearMonth !== currentYearMonth);
        const newAllocations = prevAllocations.map(a => ({ ...a, yearMonth: currentYearMonth }));
        return [...currentFiltered, ...newAllocations];
      });
    }

    // Copy store plans
    const prevStorePlans = storeWorkforcePlans.filter(p => p.yearMonth === prevYearMonth);
    if (prevStorePlans.length > 0) {
      setStoreWorkforcePlans(prev => {
        const currentFiltered = prev.filter(p => p.yearMonth !== currentYearMonth);
        const newPlans = prevStorePlans.map(p => ({ ...p, yearMonth: currentYearMonth }));
        return [...currentFiltered, ...newPlans];
      });
    }

    // Copy staff details
    const prevStaffDetails = staffWorkforceDetails.filter(d => d.yearMonth === prevYearMonth);
    if (prevStaffDetails.length > 0) {
      setStaffWorkforceDetails(prev => {
        const currentFiltered = prev.filter(d => d.yearMonth !== currentYearMonth);
        const newDetails = prevStaffDetails.map(d => ({ ...d, yearMonth: currentYearMonth }));
        return [...currentFiltered, ...newDetails];
      });
    }

    // Copy budgets
    const prevBudgets = budgets.filter(b => b.yearMonth === prevYearMonth);
    if (prevBudgets.length > 0) {
      setBudgets(prev => {
        const currentFiltered = prev.filter(b => b.yearMonth !== currentYearMonth);
        const newBudgets = prevBudgets.map(b => ({ ...b, yearMonth: currentYearMonth }));
        return [...currentFiltered, ...newBudgets];
      });
    }
    
    alert(`${prevYearMonth}のデータをコピーしました。`);
  };

  // Calculate summaries
  let totalStaffCount = 0;
  let totalNetManDaysAll = 0;
  let totalRecommendedManDaysAll = 0;
  let totalPlannedManDaysAll = 0;
  let totalShortageAll = 0;
  let totalCapacityAll = 0;
  let totalPredictedVisitorsAll = 0;
  let totalCapacityShortageAll = 0;

  const storeRows = stores.map(store => {
    const allocation = allocations.find(a => a.storeId === store.id && a.yearMonth === currentYearMonth);
    const staffIds = Array.from(new Set((allocation?.slots || []).filter(s => s !== null)));
    const staffsInStore = staffIds.map(id => staffs.find(s => s.id === id)).filter(Boolean) as typeof staffs;
    
    const staffCount = staffsInStore.length;
    const totalManDays = staffCount * dayCounts.total;
    const totalDaysOff = staffsInStore.reduce((sum, s) => sum + s.daysOff, 0);
    const netManDays = totalManDays - totalDaysOff;

    const totalCapacity = staffsInStore.reduce((sum, s) => sum + ((dayCounts.total - s.daysOff) * s.capacity), 0);
    const averageCapacity = staffsInStore.length > 0 ? Math.round(staffsInStore.reduce((sum, s) => sum + s.capacity, 0) / staffsInStore.length) : 0;

    const monthsOpen = calculateMonthsOpen(store.openDate, currentYearMonth);
    const preds = calculatePredictions(visitors, factors, store.id, currentYearMonth);
    
    const budgetObj = budgets.find(b => b.storeId === store.id && b.yearMonth === currentYearMonth);
    const budget = budgetObj ? budgetObj.budget : 0;

    const weekdayDays = dayCounts.monday + dayCounts.tuesday + dayCounts.wednesday + dayCounts.thursday + dayCounts.friday;
    const weekendDays = dayCounts.saturday + dayCounts.sundayHoliday;

    // AI Base
    const aiPredictedW = preds.predictedW;
    const aiPredictedH = preds.predictedH;
    const aiMonthlyPredictedVisitors = Math.round((aiPredictedW * weekdayDays) + (aiPredictedH * weekendDays));
    const aiReqs = calculateRequiredStaff(store, aiPredictedW, aiPredictedH, monthsOpen);
    const aiRecommendedW = aiReqs.requiredW;
    const aiRecommendedH = aiReqs.requiredH;
    const aiRecommendedManDays = (aiRecommendedW * weekdayDays) + (aiRecommendedH * weekendDays);

    // Budget Base
    let budgetPredictedW = 0;
    let budgetPredictedH = 0;
    let budgetMonthlyPredictedVisitors = budget;
    let budgetRecommendedW = 0;
    let budgetRecommendedH = 0;
    let budgetRecommendedManDays = 0;

    if (budget > 0) {
      const budgetPreds = calculateBudgetBasedPredictions(budget, weekdayDays, weekendDays, 1.25);
      budgetPredictedW = budgetPreds.predictedW;
      budgetPredictedH = budgetPreds.predictedH;
      const budgetReqs = calculateRequiredStaff(store, budgetPredictedW, budgetPredictedH, monthsOpen);
      budgetRecommendedW = budgetReqs.requiredW;
      budgetRecommendedH = budgetReqs.requiredH;
      budgetRecommendedManDays = (budgetRecommendedW * weekdayDays) + (budgetRecommendedH * weekendDays);
    }

    // Active values (use Budget if entered, otherwise AI)
    const activePredictedW = budget > 0 ? budgetPredictedW : aiPredictedW;
    const activePredictedH = budget > 0 ? budgetPredictedH : aiPredictedH;
    const activeMonthlyPredictedVisitors = budget > 0 ? budgetMonthlyPredictedVisitors : aiMonthlyPredictedVisitors;
    const activeRecommendedW = budget > 0 ? budgetRecommendedW : aiRecommendedW;
    const activeRecommendedH = budget > 0 ? budgetRecommendedH : aiRecommendedH;
    const activeRecommendedManDays = budget > 0 ? budgetRecommendedManDays : aiRecommendedManDays;

    const shortage = netManDays - activeRecommendedManDays;
    const capacityShortage = totalCapacity - activeMonthlyPredictedVisitors;

    const plan = storeWorkforcePlans.find(p => p.storeId === store.id && p.yearMonth === currentYearMonth) || {
      storeId: store.id, yearMonth: currentYearMonth,
      mondayCount: 0, tuesdayCount: 0, wednesdayCount: 0, thursdayCount: 0, fridayCount: 0, saturdayCount: 0, sundayHolidayCount: 0,
      partTimeStaff: []
    };

    const partTimeStaff = plan.partTimeStaff || [];
    const partTimeTotal = partTimeStaff.reduce((sum, s) => sum + (s.days || 0), 0);

    const monMD = plan.mondayCount * dayCounts.monday;
    const tueMD = plan.tuesdayCount * dayCounts.tuesday;
    const wedMD = plan.wednesdayCount * dayCounts.wednesday;
    const thuMD = plan.thursdayCount * dayCounts.thursday;
    const friMD = plan.fridayCount * dayCounts.friday;
    const satMD = plan.saturdayCount * dayCounts.saturday;
    const sunMD = plan.sundayHolidayCount * dayCounts.sundayHoliday;
    const totalPlanned = monMD + tueMD + wedMD + thuMD + friMD + satMD + sunMD;

    totalStaffCount += staffCount;
    totalNetManDaysAll += netManDays;
    totalRecommendedManDaysAll += activeRecommendedManDays;
    totalPlannedManDaysAll += totalPlanned;
    totalShortageAll += (shortage + partTimeTotal);
    totalCapacityAll += totalCapacity;
    totalPredictedVisitorsAll += activeMonthlyPredictedVisitors;
    totalCapacityShortageAll += capacityShortage;

    return {
      store,
      staffsInStore,
      staffCount,
      totalManDays,
      totalDaysOff,
      netManDays,
      totalCapacity,
      averageCapacity,
      recommendedManDays: activeRecommendedManDays,
      shortage,
      monthlyPredictedVisitors: activeMonthlyPredictedVisitors,
      capacityShortage,
      plan,
      monMD, tueMD, wedMD, thuMD, friMD, satMD, sunMD, totalPlanned,
      preds,
      recommendedW: activeRecommendedW,
      recommendedH: activeRecommendedH,
      partTimeStaff,
      partTimeTotal,
      aiMonthlyPredictedVisitors,
      aiRecommendedManDays,
      budgetMonthlyPredictedVisitors,
      budgetRecommendedManDays,
      aiRecommendedW,
      budgetRecommendedW
    };
  });

  return (
    <div className="p-6 max-w-[1800px] mx-auto space-y-8">
      <div className="flex justify-between items-end mb-6">
        <div>
          <h2 className="text-2xl font-bold text-neutral-900 mb-2">稼働計画・人工数計算</h2>
          <p className="text-neutral-600">店舗ごとのスタッフ配置と、曜日別の稼働計画を入力します。ダッシュボードの配置にも反映されます。</p>
        </div>
        <div className="flex items-center space-x-4">
          <button 
            onClick={handleCopyFromPreviousMonth}
            className="flex items-center space-x-2 bg-white px-4 py-2 rounded-lg border border-neutral-200 shadow-sm hover:bg-neutral-50 text-neutral-700 transition-colors"
          >
            <Copy size={18} />
            <span className="font-medium text-sm">前月からコピー</span>
          </button>
          <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-neutral-200 shadow-sm">
            <Calendar size={20} className="text-neutral-500" />
            <input 
              type="month" 
              value={currentYearMonth}
              onChange={(e) => setCurrentYearMonth(e.target.value)}
              className="border-none bg-transparent font-bold text-neutral-700 focus:ring-0 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-lg"><Users size={24} /></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">総スタッフ数</p>
            <p className="text-2xl font-bold text-neutral-900">{totalStaffCount}<span className="text-sm font-normal text-neutral-500 ml-1">人</span></p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg"><CheckCircle size={24} /></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">確保人工数 / 必要人工数</p>
            <p className="text-2xl font-bold text-neutral-900">
              {totalNetManDaysAll} <span className="text-sm font-normal text-neutral-500">/ {totalRecommendedManDaysAll} 日</span>
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${totalShortageAll < 0 ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">応援必要数 (過不足)</p>
            <p className={`text-2xl font-bold ${totalShortageAll < 0 ? 'text-red-600' : 'text-blue-600'}`}>
              {totalShortageAll > 0 ? `+${totalShortageAll}` : totalShortageAll}<span className="text-sm font-normal ml-1">日</span>
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg"><Calculator size={24} /></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">確保総能力 / 予測客数</p>
            <p className="text-2xl font-bold text-neutral-900">
              {totalCapacityAll} <span className="text-sm font-normal text-neutral-500">/ {totalPredictedVisitorsAll} 人</span>
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4">
          <div className={`p-3 rounded-lg ${totalCapacityShortageAll < 0 ? 'bg-red-100 text-red-600' : 'bg-indigo-100 text-indigo-600'}`}><TrendingUp size={24} /></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">能力 過不足</p>
            <p className={`text-2xl font-bold ${totalCapacityShortageAll < 0 ? 'text-red-600' : 'text-indigo-600'}`}>
              {totalCapacityShortageAll > 0 ? `+${totalCapacityShortageAll}` : totalCapacityShortageAll}<span className="text-sm font-normal ml-1">人</span>
            </p>
          </div>
        </div>
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-200 flex items-center space-x-4">
          <div className="p-3 bg-yellow-100 text-yellow-600 rounded-lg"><Calendar size={24} /></div>
          <div>
            <p className="text-sm text-neutral-500 font-medium">計画人工数 (入力値)</p>
            <p className="text-2xl font-bold text-neutral-900">{totalPlannedManDaysAll}<span className="text-sm font-normal text-neutral-500 ml-1">日</span></p>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-300">
                <th rowSpan={2} className="p-1 border-r border-neutral-300 sticky left-0 bg-neutral-100 z-20 min-w-[80px]">店舗名</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 sticky left-[80px] bg-neutral-100 z-20 min-w-[100px]">月間客数<br/><span className="text-[10px] font-normal">(AI/予算)</span></th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 sticky left-[180px] bg-neutral-100 z-20 min-w-[100px]">氏名</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">公休</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">出勤<br/>可能</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">1日<br/>能力</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">月間<br/>能力</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">月</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">火</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">水</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">木</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">金</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">土</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center min-w-[40px]">日祝</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center bg-yellow-100">計画計</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">公出</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">有休</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">応援</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center">研修</th>
                <th rowSpan={2} className="p-1 border-r border-neutral-300 text-center bg-yellow-100 font-bold">過不足</th>
                <th colSpan={3} className="p-1 border-r border-neutral-300 text-center">時短パート</th>
                <th rowSpan={2} className="p-1 text-center bg-yellow-100 font-bold text-red-600">応援<br/>必要数</th>
              </tr>
              <tr className="bg-neutral-100 text-neutral-700 border-b border-neutral-300">
                <th className="p-1 border-r border-neutral-300 text-center min-w-[80px]">氏名</th>
                <th className="p-1 border-r border-neutral-300 text-center min-w-[40px]">日数</th>
                <th className="p-1 border-r border-neutral-300 text-center min-w-[40px]">計</th>
              </tr>
            </thead>
            <tbody>
              {storeRows.map((row) => {
                const numStaffRows = row.staffsInStore.length;
                const numPartTimeRows = row.partTimeStaff.length;
                const totalRows = Math.max(numStaffRows + 2, numPartTimeRows + 2);
                const rowSpan = totalRows;
                const budgetObj = budgets.find(b => b.storeId === row.store.id && b.yearMonth === currentYearMonth);
                const budgetValue = budgetObj ? budgetObj.budget : '';

                return (
                  <React.Fragment key={row.store.id}>
                    {Array.from({ length: totalRows }).map((_, i) => {
                      const isSummaryRow = i === 0;
                      const isAddStaffRow = i === numStaffRows + 1;
                      const staffIndex = i - 1;
                      const staff = staffIndex >= 0 && staffIndex < numStaffRows ? row.staffsInStore[staffIndex] : null;
                      
                      const partTimeIndex = i - 1;
                      const partTime = partTimeIndex >= 0 && partTimeIndex < numPartTimeRows ? row.partTimeStaff[partTimeIndex] : null;

                      return (
                        <tr key={i} className={`border-b border-neutral-200 hover:bg-neutral-50 ${isAddStaffRow ? 'border-b-2 border-neutral-400 bg-neutral-50' : ''}`}>
                          {isSummaryRow && (
                            <>
                              <td rowSpan={rowSpan} className="p-1 border-r border-neutral-300 font-bold bg-white sticky left-0 z-10 align-top">{row.store.name}</td>
                              <td rowSpan={rowSpan} className="p-1 border-r border-neutral-300 bg-white sticky left-[80px] z-10 align-top">
                                <div className="flex flex-col space-y-1">
                                  <div className="text-[10px] text-neutral-500">AI予測: {row.aiMonthlyPredictedVisitors}人</div>
                                  <div className="flex items-center space-x-1">
                                    <span className="text-[10px] text-neutral-500">予算:</span>
                                    <input 
                                      type="number" 
                                      min="0" 
                                      value={budgetValue} 
                                      onChange={e => handleBudgetChange(row.store.id, Number(e.target.value))} 
                                      className="w-16 p-1 border rounded text-xs"
                                      placeholder="未入力"
                                    />
                                  </div>
                                </div>
                              </td>
                            </>
                          )}

                          {isSummaryRow ? (
                            <>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50 sticky left-[180px] z-10 text-neutral-500 text-xs text-center align-middle">
                                店舗集計<br/>
                                <span className="text-[10px] text-neutral-400">({row.staffCount}名)</span>
                              </td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50 text-center text-xs text-neutral-500 align-middle">
                                人工数<br/>
                                <span className={`font-bold ${row.shortage < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                  {row.shortage > 0 ? `+${row.shortage}` : row.shortage}
                                </span>
                              </td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50 text-center align-middle">
                                <div className="text-xs text-blue-600 font-bold">{row.netManDays}</div>
                                <div className="text-[10px] text-neutral-400 border-t border-neutral-200 mt-1 pt-1">必:{row.recommendedManDays}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50 text-center align-middle">
                                <div className="text-xs text-indigo-600 font-bold">平:{row.averageCapacity}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50 text-center align-middle">
                                <div className="text-xs text-indigo-600 font-bold">{row.totalCapacity}</div>
                                <div className="text-[10px] text-neutral-400 border-t border-neutral-200 mt-1 pt-1">予:{row.monthlyPredictedVisitors}</div>
                              </td>
                              
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedW} / 予算: ${row.budgetRecommendedW}`}>推:{row.recommendedW}</div>
                                <input type="number" min="0" value={row.plan.mondayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'mondayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.monMD}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedW} / 予算: ${row.budgetRecommendedW}`}>推:{row.recommendedW}</div>
                                <input type="number" min="0" value={row.plan.tuesdayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'tuesdayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.tueMD}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedW} / 予算: ${row.budgetRecommendedW}`}>推:{row.recommendedW}</div>
                                <input type="number" min="0" value={row.plan.wednesdayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'wednesdayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.wedMD}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedW} / 予算: ${row.budgetRecommendedW}`}>推:{row.recommendedW}</div>
                                <input type="number" min="0" value={row.plan.thursdayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'thursdayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.thuMD}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedW} / 予算: ${row.budgetRecommendedW}`}>推:{row.recommendedW}</div>
                                <input type="number" min="0" value={row.plan.fridayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'fridayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.friMD}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedH} / 予算: ${row.budgetRecommendedH}`}>推:{row.recommendedH}</div>
                                <input type="number" min="0" value={row.plan.saturdayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'saturdayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.satMD}</div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 align-top bg-white">
                                <div className="text-[10px] text-neutral-400 text-center mb-1" title={`AI予測: ${row.aiRecommendedH} / 予算: ${row.budgetRecommendedH}`}>推:{row.recommendedH}</div>
                                <input type="number" min="0" value={row.plan.sundayHolidayCount || ''} onChange={e => handleStorePlanChange(row.store.id, 'sundayHolidayCount', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                                <div className="text-[10px] text-blue-600 text-center mt-1 font-bold">{row.sunMD}</div>
                              </td>
                              
                              <td className="p-1 border-r border-neutral-300 text-center font-bold bg-yellow-100 align-middle">{row.totalPlanned}</td>
                              
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50"></td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50"></td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50"></td>
                              <td className="p-1 border-r border-neutral-300 bg-neutral-50"></td>
                            </>
                          ) : staff ? (
                            <>
                              <td className="p-1 border-r border-neutral-300 sticky left-[180px] bg-white z-10 flex items-center justify-between">
                                <div className="flex items-center space-x-1">
                                  {staff.isTrainee && <span className="text-[10px] bg-red-100 text-red-600 px-1 rounded font-bold" title="研修生">研</span>}
                                  <span className="truncate max-w-[80px]" title={staff.name}>{staff.name}</span>
                                </div>
                                <button onClick={() => handleRemoveStaffFromStore(row.store.id, staff.id)} className="text-neutral-400 hover:text-red-500 ml-1" title="店舗から外す">
                                  <Trash2 size={14} />
                                </button>
                              </td>
                              <td className="p-1 border-r border-neutral-300 text-center text-neutral-600">{staff.daysOff}</td>
                              <td className="p-1 border-r border-neutral-300 text-center text-neutral-900">{dayCounts.total - staff.daysOff}</td>
                              <td className="p-1 border-r border-neutral-300 text-center text-neutral-600">{staff.capacity}</td>
                              <td className="p-1 border-r border-neutral-300 text-center text-neutral-900">{(dayCounts.total - staff.daysOff) * staff.capacity}</td>
                              
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300 bg-yellow-50"></td>
                              
                              <td className="p-1 border-r border-neutral-300 text-center">
                                <input type="number" min="0" value={(staffWorkforceDetails.find(d => d.staffId === staff.id && d.yearMonth === currentYearMonth)?.extraWorkDays) || ''} onChange={e => handleStaffDetailChange(staff.id, 'extraWorkDays', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                              </td>
                              <td className="p-1 border-r border-neutral-300 text-center">
                                <input type="number" min="0" value={(staffWorkforceDetails.find(d => d.staffId === staff.id && d.yearMonth === currentYearMonth)?.paidLeaveDays) || ''} onChange={e => handleStaffDetailChange(staff.id, 'paidLeaveDays', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                              </td>
                              <td className="p-1 border-r border-neutral-300 text-center">
                                <input type="number" min="0" value={(staffWorkforceDetails.find(d => d.staffId === staff.id && d.yearMonth === currentYearMonth)?.supportDays) || ''} onChange={e => handleStaffDetailChange(staff.id, 'supportDays', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                              </td>
                              <td className="p-1 border-r border-neutral-300 text-center">
                                <input type="number" min="0" value={(staffWorkforceDetails.find(d => d.staffId === staff.id && d.yearMonth === currentYearMonth)?.trainingDays) || ''} onChange={e => handleStaffDetailChange(staff.id, 'trainingDays', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                              </td>
                            </>
                          ) : isAddStaffRow ? (
                            <>
                              <td className="p-1 border-r border-neutral-300 sticky left-[180px] bg-neutral-50 z-10">
                                <select 
                                  className="w-full p-1 border rounded text-xs bg-white"
                                  onChange={(e) => {
                                    handleAddStaffToStore(row.store.id, e.target.value);
                                    e.target.value = ""; // reset
                                  }}
                                  defaultValue=""
                                >
                                  <option value="" disabled>+ 追加</option>
                                  {staffs.filter(s => !row.staffsInStore.find(inStore => inStore.id === s.id)).map(s => (
                                    <option key={s.id} value={s.id}>{s.name}</option>
                                  ))}
                                </select>
                              </td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300 bg-yellow-50"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                            </>
                          ) : (
                            <>
                              <td className="p-1 border-r border-neutral-300 sticky left-[180px] bg-white z-10"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300 bg-yellow-50"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                            </>
                          )}

                          {/* Right side columns */}
                          {isSummaryRow && (
                            <td rowSpan={rowSpan} className="p-1 border-r border-neutral-300 text-center font-bold bg-yellow-100 align-middle">
                              <span className={row.shortage < 0 ? 'text-red-600' : ''}>{row.shortage}</span>
                            </td>
                          )}

                          {isSummaryRow ? (
                            <td colSpan={2} className="p-1 border-r border-neutral-300 text-center bg-neutral-50">
                              <button onClick={() => handleAddPartTimeStaff(row.store.id)} className="text-[10px] text-blue-600 hover:text-blue-800 font-medium">+ 時短パート追加</button>
                            </td>
                          ) : partTime ? (
                            <>
                              <td className="p-1 border-r border-neutral-300">
                                <div className="flex items-center">
                                  <input type="text" value={partTime.name} onChange={e => handlePartTimeStaffChange(row.store.id, partTime.id, 'name', e.target.value)} className="w-full p-1 border rounded text-xs" placeholder="氏名" />
                                  <button onClick={() => handleRemovePartTimeStaff(row.store.id, partTime.id)} className="text-neutral-400 hover:text-red-500 ml-1"><Trash2 size={14} /></button>
                                </div>
                              </td>
                              <td className="p-1 border-r border-neutral-300 text-center">
                                <input type="number" min="0" value={partTime.days || ''} onChange={e => handlePartTimeStaffChange(row.store.id, partTime.id, 'days', Number(e.target.value))} className="w-8 p-1 border rounded text-center mx-auto block text-xs" />
                              </td>
                            </>
                          ) : (
                            <>
                              <td className="p-1 border-r border-neutral-300"></td>
                              <td className="p-1 border-r border-neutral-300"></td>
                            </>
                          )}

                          {isSummaryRow && (
                            <>
                              <td rowSpan={rowSpan} className="p-1 border-r border-neutral-300 text-center align-middle font-bold bg-white">
                                {row.partTimeTotal > 0 ? row.partTimeTotal : ''}
                              </td>
                              <td rowSpan={rowSpan} className={`p-1 text-center font-bold bg-yellow-100 align-middle text-base ${row.shortage + row.partTimeTotal < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                {row.shortage + row.partTimeTotal > 0 ? `+${row.shortage + row.partTimeTotal}` : row.shortage + row.partTimeTotal}
                              </td>
                            </>
                          )}
                        </tr>
                      );
                    })}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
