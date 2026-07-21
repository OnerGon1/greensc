import React, { useState } from 'react';
import { Settings, Percent, Store, ShieldAlert, Check, RefreshCw, Clock, ExternalLink, FileSpreadsheet } from 'lucide-react';
import { GOOGLE_SHEET_URL, getTimeSinceLastSync, getTimeUntilNextSync } from '../utils/googleSync';

export default function SettingsTab({ settings, setSettings, onResetAll, onManualSync, isSyncing }) {
  const [savedAlert, setSavedAlert] = useState(false);

  const handleChangeMargin = (val) => {
    const num = Math.max(0, Math.min(100, Number(val) || 0));
    setSettings({ ...settings, marginPercent: num });
    triggerSaved();
  };

  const handleChangeRounding = (val) => {
    setSettings({ ...settings, roundingRule: val });
    triggerSaved();
  };

  const handleChangeCurrency = (val) => {
    setSettings({ ...settings, currency: val });
    triggerSaved();
  };

  const handleChangeShopName = (val) => {
    setSettings({ ...settings, shopName: val });
    triggerSaved();
  };

  const handleChangeAutoSyncInterval = (val) => {
    setSettings({ ...settings, autoSyncIntervalHours: Number(val) || 2 });
    triggerSaved();
  };

  const triggerSaved = () => {
    setSavedAlert(true);
    setTimeout(() => setSavedAlert(false), 2000);
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* SECTION 1: Google Sheets Sync Settings */}
      <div
        className="glass-card"
        style={{
          background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.08), rgba(59, 130, 246, 0.08))',
          borderColor: 'rgba(16, 185, 129, 0.3)',
        }}
      >
        <div className="card-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#10b981' }}>
            <FileSpreadsheet size={24} />
            Сверка с Google Таблицами
          </div>
          <a
            href={GOOGLE_SHEET_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="btn btn-secondary btn-sm"
            style={{ fontSize: '0.82rem' }}
          >
            Открыть Гугл Таблицу <ExternalLink size={14} />
          </a>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Ваш сервис автоматически связан с Google Таблицей прайсов. Данные всех закладок (iPhone, Android, Ноутбуки) своряются и загружаются в калькулятор.
          </div>

          {/* Sync Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px 18px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Последняя успешная сверка:</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#10b981', marginTop: '2px' }}>
                {getTimeSinceLastSync(settings.lastSyncTimestamp)}
              </div>
            </div>

            <div style={{ background: 'rgba(0,0,0,0.2)', padding: '14px 18px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Следующая автосверка (каждые {settings.autoSyncIntervalHours || 2} ч):</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#60a5fa', marginTop: '2px' }}>
                через {getTimeUntilNextSync(settings.lastSyncTimestamp, settings.autoSyncIntervalHours)}
              </div>
            </div>
          </div>

          {/* Manual Sync Button & Interval dropdown */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px', alignItems: 'flex-end', marginTop: '6px' }}>
            <button
              className="btn btn-success"
              style={{ padding: '14px', fontSize: '1rem' }}
              onClick={onManualSync}
              disabled={isSyncing}
            >
              <RefreshCw size={20} className={isSyncing ? 'spin' : ''} />
              {isSyncing ? 'Выполняется сверка...' : 'Ручная сверка с Гугл Таблицами'}
            </button>

            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label">Интервал автосверки</label>
              <select
                className="select-control"
                value={settings.autoSyncIntervalHours || 2}
                onChange={(e) => handleChangeAutoSyncInterval(e.target.value)}
              >
                <option value="1">Каждый 1 час</option>
                <option value="2">Каждые 2 часа (По умолчанию)</option>
                <option value="4">Каждые 4 часа</option>
                <option value="6">Каждые 6 часов</option>
                <option value="12">Каждые 12 часов</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Margin & Shop Settings */}
      <div className="glass-card">
        <div className="card-title" style={{ justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Settings className="text-blue-400" size={24} />
            Настройки комиссии и приложения
          </div>
          {savedAlert && (
            <span style={{ fontSize: '0.85rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Check size={16} /> Изменения сохранены!
            </span>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Margin Percent Config Card */}
          <div style={{ background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '20px', borderRadius: '12px' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ color: '#f59e0b', fontSize: '1rem', fontWeight: 600 }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Percent size={20} /> Процент наценки (Комиссия сервиса)
                </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 800 }}>{settings.marginPercent}%</span>
              </label>

              <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginTop: '12px' }}>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  style={{ flex: 1, accentColor: '#f59e0b', cursor: 'pointer' }}
                  value={settings.marginPercent}
                  onChange={(e) => handleChangeMargin(e.target.value)}
                />
                <input
                  type="number"
                  className="input-control"
                  style={{ width: '100px', fontWeight: 700, borderColor: 'rgba(245, 158, 11, 0.5)' }}
                  value={settings.marginPercent}
                  onChange={(e) => handleChangeMargin(e.target.value)}
                />
              </div>

              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '8px' }}>
                Эта комиссия автоматически рассчитывается при каждом расчете.
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                {[5, 10, 11, 15, 20, 25].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    className={`btn btn-sm ${settings.marginPercent === pct ? 'btn-primary' : 'btn-secondary'}`}
                    onClick={() => handleChangeMargin(pct)}
                  >
                    {pct}%
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Rounding Rules */}
          <div className="form-group">
            <label className="form-label">Правило округления итоговой цены клиенту</label>
            <select
              className="select-control"
              value={settings.roundingRule}
              onChange={(e) => handleChangeRounding(e.target.value)}
            >
              <option value="none">Без округления (точное число)</option>
              <option value="round10">Округлять до 10 {settings.currency} (Рекомендуется)</option>
              <option value="round50">Округлять до 50 {settings.currency}</option>
              <option value="round100">Округлять до 100 {settings.currency}</option>
            </select>
          </div>

          {/* Currency & Shop Name */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Валюта</label>
              <select
                className="select-control"
                value={settings.currency}
                onChange={(e) => handleChangeCurrency(e.target.value)}
              >
                <option value="₽">₽ (Рубли)</option>
                <option value="$">$ (Доллары)</option>
                <option value="₸">₸ (Тенге)</option>
                <option value="Br">Br (Белорусские рубли)</option>
                <option value="₴">₴ (Гривны)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Название сервисного центра</label>
              <input
                type="text"
                className="input-control"
                placeholder="Сервисный Центр Ремонта"
                value={settings.shopName}
                onChange={(e) => handleChangeShopName(e.target.value)}
              />
            </div>
          </div>

          {/* Danger Reset Zone */}
          <div
            style={{
              marginTop: '20px',
              paddingTop: '20px',
              borderTop: '1px solid var(--border-color)',
              display: 'flex',
              justify: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '12px',
            }}
          >
            <div>
              <div style={{ fontWeight: 600, color: '#f87171', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <ShieldAlert size={18} /> Сброс данных
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                Сбросить все настройки и историю к начальным установкам.
              </div>
            </div>

            <button className="btn btn-danger btn-sm" onClick={onResetAll}>
              <RefreshCw size={16} /> Сбросить все данные
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
