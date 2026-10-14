import React, { useState, useEffect } from 'react';
import {
  Calculator,
  FileSpreadsheet,
  TrendingUp,
  Settings,
  Wrench,
  Percent,
  RefreshCw,
  Clock,
  Check,
  BookOpen
} from 'lucide-react';
import CalculatorTab from './components/CalculatorTab';
import PriceListTab from './components/PriceListTab';
import AnalyticsTab from './components/AnalyticsTab';
import SettingsTab from './components/SettingsTab';
import KnowledgeBaseTab from './components/KnowledgeBaseTab';

import {
  getStoredPrices,
  saveStoredPrices,
  getStoredSettings,
  saveStoredSettings,
  getStoredHistory,
  saveStoredHistory,
  getStoredKnowledgeBase,
  saveStoredKnowledgeBase,
  resetAllToDefaults
} from './utils/storage';

import {
  getTimeSinceLastSync,
  getTimeUntilNextSync,
  syncWithGoogleSheets,
  GOOGLE_SHEET_URL
} from './utils/googleSync';

import {
  isSupabaseConnected,
  fetchArticlesFromCloud,
  subscribeToKnowledgeBaseSupabase,
  seedArticlesToCloud
} from './services/supabase';

export default function App() {
  // Clear deprecated v1-v5 storage cache if present
  useEffect(() => {
    ['v1', 'v2', 'v3', 'v4', 'v5'].forEach((v) => {
      localStorage.removeItem(`service_prices_${v}`);
      localStorage.removeItem(`service_settings_${v}`);
      localStorage.removeItem(`service_history_${v}`);
    });
  }, []);

  const [activeTab, setActiveTab] = useState('calculator');
  const [prices, setPrices] = useState(getStoredPrices);
  const [settings, setSettings] = useState(getStoredSettings);
  const [history, setHistory] = useState(getStoredHistory);
  const [knowledgeArticles, setKnowledgeArticles] = useState(getStoredKnowledgeBase);

  // State to hold data passed from PriceList -> Calculator
  const [prefilledData, setPrefilledData] = useState(null);

  const [isSyncing, setIsSyncing] = useState(false);
  const [syncToast, setSyncToast] = useState(false);
  const [, setTimerTick] = useState(0);

  // Sync to LocalStorage on state changes
  useEffect(() => {
    saveStoredPrices(prices);
  }, [prices]);

  useEffect(() => {
    saveStoredSettings(settings);
  }, [settings]);

  useEffect(() => {
    saveStoredHistory(history);
  }, [history]);

  useEffect(() => {
    saveStoredKnowledgeBase(knowledgeArticles);
  }, [knowledgeArticles]);

  // Supabase Cloud sync & Realtime listener
  const [isCloudConnected, setIsCloudConnected] = useState(isSupabaseConnected);

  useEffect(() => {
    let isMounted = true;
    if (!isSupabaseConnected()) return;

    const initCloud = async () => {
      try {
        const cloudArticles = await fetchArticlesFromCloud();
        if (!isMounted) return;
        if (cloudArticles && cloudArticles.length > 0) {
          setKnowledgeArticles(cloudArticles);
          setIsCloudConnected(true);
        } else if (cloudArticles && cloudArticles.length === 0) {
          // Table exists but is empty -> Seed initial articles to Supabase!
          const current = getStoredKnowledgeBase();
          await seedArticlesToCloud(current);
          setIsCloudConnected(true);
        }
      } catch (err) {
        console.error('Cloud articles init error:', err);
      }
    };

    initCloud();

    const unsubscribe = subscribeToKnowledgeBaseSupabase((freshArticles) => {
      if (isMounted && freshArticles && freshArticles.length > 0) {
        setKnowledgeArticles(freshArticles);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  // Live timer tick every 30s to update counters
  useEffect(() => {
    const interval = setInterval(() => {
      setTimerTick((t) => t + 1);

      const lastSync = new Date(settings.lastSyncTimestamp || 0).getTime();
      const intervalMs = (settings.autoSyncIntervalHours || 2) * 3600 * 1000;
      if (Date.now() - lastSync >= intervalMs) {
        handleManualSync(true); // Silent auto sync
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [settings.lastSyncTimestamp, settings.autoSyncIntervalHours]);

  // Sync with Google Sheets
  const handleManualSync = async (isAuto = false) => {
    setIsSyncing(true);
    const result = await syncWithGoogleSheets();
    if (result && result.success) {
      setPrices(result.prices);
      const updatedSettings = {
        ...settings,
        lastSyncTimestamp: result.timestamp,
      };
      setSettings(updatedSettings);
      
      if (!isAuto) {
        setSyncToast(true);
        setTimeout(() => setSyncToast(false), 3000);
      }
    }
    setIsSyncing(false);
  };

  // Handler when manager clicks "Выбрать" in PriceListTab
  const handleSelectPriceForCalculator = (item) => {
    // Force a fresh object reference so useEffect triggers even if selecting same service twice
    setPrefilledData({ ...item, _trigger: Date.now() });
    setActiveTab('calculator');
  };

  const handleSaveToHistory = (record) => {
    setHistory((prev) => [record, ...prev]);
  };

  const handleResetAllData = () => {
    if (window.confirm('Сбросить ВСЕ данные приложения к исходным?')) {
      resetAllToDefaults();
      window.location.reload();
    }
  };

  return (
    <div className="app-container">
      {/* Top Header */}
      <header className="app-header">
        <div className="logo-area">
          <div className="logo-icon">
            <Wrench size={24} />
          </div>
          <div>
            <h1 className="logo-title">{settings.shopName || 'Сервисный Центр'}</h1>
            <p className="logo-subtitle">Калькулятор ремонта • Прайс-лист ({prices.length} поз.) • Валовая прибыль</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          {/* Google Sheets Sync Badge & Timer */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              background: 'rgba(16, 185, 129, 0.08)',
              border: '1px solid rgba(16, 185, 129, 0.3)',
              padding: '6px 14px',
              borderRadius: '999px',
              fontSize: '0.84rem',
            }}
          >
            <Clock size={16} style={{ color: '#10b981' }} />
            <div>
              <span style={{ color: 'var(--text-muted)' }}>Сверено с Google Таблицей: </span>
              <strong style={{ color: '#10b981' }}>{getTimeSinceLastSync(settings.lastSyncTimestamp)}</strong>
              <span style={{ color: 'var(--text-dim)', marginLeft: '6px', fontSize: '0.78rem' }}>
                (Авто каждые {settings.autoSyncIntervalHours || 2} ч: до следующей {getTimeUntilNextSync(settings.lastSyncTimestamp, settings.autoSyncIntervalHours)})
              </span>
            </div>
            
            <button
              className="btn btn-secondary btn-sm"
              style={{ padding: '4px 10px', fontSize: '0.78rem' }}
              onClick={() => handleManualSync(false)}
              disabled={isSyncing}
              title="Сверить сейчас с Google Таблицей"
            >
              {syncToast ? <Check size={14} style={{ color: '#10b981' }} /> : <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />}
              {syncToast ? 'Сверено!' : isSyncing ? 'Сверка...' : 'Сверить сейчас'}
            </button>
          </div>

          <div className="margin-badge">
            <Percent size={18} />
            Наценка: {settings.marginPercent}%
          </div>
        </div>
      </header>

      {/* Primary Navigation Tabs */}
      <nav className="nav-tabs">
        <button
          className={`nav-btn ${activeTab === 'calculator' ? 'active' : ''}`}
          onClick={() => setActiveTab('calculator')}
        >
          <Calculator size={18} />
          Калькулятор
        </button>

        <button
          className={`nav-btn ${activeTab === 'pricelist' ? 'active' : ''}`}
          onClick={() => setActiveTab('pricelist')}
        >
          <FileSpreadsheet size={18} />
          Прайс-лист работ ({prices.length})
        </button>

        <button
          className={`nav-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          <TrendingUp size={18} />
          Валовая прибыль и история ({history.length})
        </button>

        <button
          className={`nav-btn ${activeTab === 'knowledge' ? 'active' : ''}`}
          onClick={() => setActiveTab('knowledge')}
        >
          <BookOpen size={18} />
          База знаний ({knowledgeArticles.length})
        </button>

        <button
          className={`nav-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <Settings size={18} />
          Настройки & Гугл Сверка
        </button>
      </nav>

      {/* Main Content Area: Renders using display none/block to preserve React states on tab changes */}
      <main>
        <div style={{ display: activeTab === 'calculator' ? 'block' : 'none' }}>
          <CalculatorTab
            prices={prices}
            settings={settings}
            prefilledData={prefilledData}
            clearPrefilledData={() => setPrefilledData(null)}
            onSaveToHistory={handleSaveToHistory}
          />
        </div>

        <div style={{ display: activeTab === 'pricelist' ? 'block' : 'none' }}>
          <PriceListTab
            prices={prices}
            setPrices={setPrices}
            currency={settings.currency}
            onManualSync={() => handleManualSync(false)}
            isSyncing={isSyncing}
            onSelectForCalculator={handleSelectPriceForCalculator}
          />
        </div>

        <div style={{ display: activeTab === 'analytics' ? 'block' : 'none' }}>
          <AnalyticsTab
            history={history}
            setHistory={setHistory}
            currency={settings.currency}
          />
        </div>

        <div style={{ display: activeTab === 'knowledge' ? 'block' : 'none' }}>
          <KnowledgeBaseTab
            articles={knowledgeArticles}
            setArticles={setKnowledgeArticles}
            isCloudConnected={isCloudConnected}
          />
        </div>

        <div style={{ display: activeTab === 'settings' ? 'block' : 'none' }}>
          <SettingsTab
            settings={settings}
            setSettings={setSettings}
            onResetAll={handleResetAllData}
            onManualSync={() => handleManualSync(false)}
            isSyncing={isSyncing}
          />
        </div>
      </main>
    </div>
  );
}
