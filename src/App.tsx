/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AppProvider } from './context/AppContext';
import { Header, TabType } from './components/Header';
import { Dashboard } from './components/Dashboard';
import { Settings } from './components/Settings';
import { Analytics } from './components/Analytics';
import { LogicExplanation } from './components/LogicExplanation';
import { WorkforcePlanning } from './components/WorkforcePlanning';

export default function App() {
  const [currentYearMonth, setCurrentYearMonth] = useState(new Date().toISOString().slice(0, 7));
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');

  return (
    <AppProvider>
      <div className="min-h-screen bg-neutral-100 font-sans text-neutral-900">
        <Header 
          currentYearMonth={currentYearMonth} 
          setCurrentYearMonth={setCurrentYearMonth}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
        <main>
          {activeTab === 'dashboard' && <Dashboard currentYearMonth={currentYearMonth} />}
          {activeTab === 'workforce' && <WorkforcePlanning currentYearMonth={currentYearMonth} setCurrentYearMonth={setCurrentYearMonth} />}
          {activeTab === 'settings' && <Settings />}
          {activeTab === 'analytics' && <Analytics currentYearMonth={currentYearMonth} />}
          {activeTab === 'logic' && <LogicExplanation />}
        </main>
      </div>
    </AppProvider>
  );
}

