import React, { useState, useMemo } from 'react';
import { TrendingUp, DollarSign, PieChart, ShoppingBag, Trash2, Download, Search, Calendar } from 'lucide-react';
import { formatCurrency, exportToCSV } from '../utils/calculator';

export default function AnalyticsTab({ history, setHistory, currency }) {
  const [searchTerm, setSearchTerm] = useState('');

  // Filtered History
  const filteredHistory = useMemo(() => {
    return history.filter((item) => {
      const text = `${item.brand} ${item.model} ${item.serviceName} ${item.clientPhone || ''} ${item.note || ''}`.toLowerCase();
      return text.includes(searchTerm.toLowerCase());
    });
  }, [history, searchTerm]);

  // Aggregate KPI Indicators
  const stats = useMemo(() => {
    let totalRevenue = 0; // Итоговая выручка (клиенты)
    let totalPartsCost = 0; // Затраты на запчасти
    let totalLaborRevenue = 0; // Доход от работ
    let totalGrossProfit = 0; // Валовая прибыль (Выручка - Запчасти)
    let totalMarginAmount = 0; // Чистая наценка

    history.forEach((record) => {
      totalRevenue += Number(record.finalPrice) || 0;
      totalPartsCost += Number(record.partPrice) || 0;
      totalLaborRevenue += Number(record.workPrice) || 0;
      totalGrossProfit += Number(record.grossProfit) || 0;
      totalMarginAmount += Number(record.marginAmount) || 0;
    });

    const averageProfitPerJob = history.length ? totalGrossProfit / history.length : 0;
    const grossMarginPercent = totalRevenue ? Math.round((totalGrossProfit / totalRevenue) * 100) : 0;

    return {
      count: history.length,
      totalRevenue,
      totalPartsCost,
      totalLaborRevenue,
      totalGrossProfit,
      totalMarginAmount,
      averageProfitPerJob,
      grossMarginPercent,
    };
  }, [history]);

  const handleDeleteRecord = (id) => {
    if (window.confirm('Удалить эту запись из истории расчетов?')) {
      setHistory(history.filter((h) => h.id !== id));
    }
  };

  const handleClearHistory = () => {
    if (window.confirm('Вы уверены, что хотите полностью очистить историю расчетов?')) {
      setHistory([]);
    }
  };

  const handleExportHistoryCSV = () => {
    const exportData = history.map((h) => ({
      'Дата': new Date(h.date).toLocaleString('ru-RU'),
      'Бренд': h.brand,
      'Модель': h.model,
      'Работа': h.serviceName,
      'Цена работы': h.workPrice,
      'Цена запчасти': h.partPrice,
      'Сумма без наценки': h.subtotal,
      'Наценка %': h.marginPercent,
      'Сумма наценки': h.marginAmount,
      'Итого для клиента': h.finalPrice,
      'Валовая прибыль': h.grossProfit,
      'Телефон клиента': h.clientPhone || '',
      'Заметка': h.note || '',
    }));
    exportToCSV('Repair_History_Analytics.csv', exportData);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Stat KPI Cards Grid */}
      <div className="grid-4">
        {/* Card 1: Gross Profit */}
        <div
          className="glass-card"
          style={{
            background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.12), rgba(16, 185, 129, 0.04))',
            borderColor: 'rgba(16, 185, 129, 0.3)',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#10b981', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Валовая прибыль</span>
            <TrendingUp size={22} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#10b981' }}>
            {formatCurrency(stats.totalGrossProfit, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Рентабельность: <strong style={{ color: '#10b981' }}>{stats.grossMarginPercent}%</strong>
          </div>
        </div>

        {/* Card 2: Total Revenue */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#60a5fa', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Общий оборот расчетов</span>
            <DollarSign size={22} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {formatCurrency(stats.totalRevenue, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Всего расчетов: <strong>{stats.count} шт</strong>
          </div>
        </div>

        {/* Card 3: Parts Cost */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#f59e0b', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Расходы на запчасти</span>
            <ShoppingBag size={22} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#f59e0b' }}>
            {formatCurrency(stats.totalPartsCost, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Себестоимость от поставщиков
          </div>
        </div>

        {/* Card 4: Average Profit Per Job */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', color: '#c084fc', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.88rem', fontWeight: 600 }}>Средняя прибыль с работы</span>
            <PieChart size={22} />
          </div>
          <div style={{ fontSize: '1.8rem', fontWeight: 800, color: '#c084fc' }}>
            {formatCurrency(stats.averageProfitPerJob, currency)}
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
            Комиссия сервиса: {formatCurrency(stats.totalMarginAmount, currency)}
          </div>
        </div>
      </div>

      {/* History Log Table Card */}
      <div className="glass-card">
        <div className="card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Calendar className="text-blue-400" size={24} />
            История сохраненных расчетов ({filteredHistory.length})
          </div>

          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-secondary btn-sm" onClick={handleExportHistoryCSV} disabled={!history.length}>
              <Download size={16} /> Экспорт истории CSV
            </button>
            <button className="btn btn-danger btn-sm" onClick={handleClearHistory} disabled={!history.length}>
              <Trash2 size={16} /> Очистить историю
            </button>
          </div>
        </div>

        {/* Search History */}
        <div style={{ position: 'relative', marginBottom: '16px' }}>
          <input
            type="text"
            className="input-control"
            placeholder="Поиск по истории (устройство, услуга, телефон клиента)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Search
            size={18}
            style={{
              position: 'absolute',
              right: '12px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
            }}
          />
        </div>

        {/* History Table */}
        <div className="table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Дата</th>
                <th>Устройство</th>
                <th>Услуга / Работа</th>
                <th>Запчасть</th>
                <th>Работа</th>
                <th>Клиенту</th>
                <th>Валовая прибыль</th>
                <th>Клиент / Заметка</th>
                <th style={{ textAlign: 'right' }}>Удалить</th>
              </tr>
            </thead>
            <tbody>
              {filteredHistory.length > 0 ? (
                filteredHistory.map((item) => (
                  <tr key={item.id}>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(item.date).toLocaleDateString('ru-RU', {
                        day: '2-digit',
                        month: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </td>
                    <td style={{ fontWeight: 600 }}>
                      <span className="badge badge-brand" style={{ marginRight: '6px' }}>{item.brand}</span>
                      {item.model}
                    </td>
                    <td>{item.serviceName}</td>
                    <td style={{ color: '#f59e0b' }}>{formatCurrency(item.partPrice, currency)}</td>
                    <td style={{ color: '#60a5fa' }}>{formatCurrency(item.workPrice, currency)}</td>
                    <td style={{ fontWeight: 700, color: 'var(--text-main)' }}>
                      {formatCurrency(item.finalPrice, currency)}
                    </td>
                    <td>
                      <span style={{ fontWeight: 800, color: '#10b981' }}>
                        +{formatCurrency(item.grossProfit, currency)}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {item.clientPhone && <div>📱 {item.clientPhone}</div>}
                      {item.note && <div>📝 {item.note}</div>}
                    </td>
                    <td style={{ textAlign: 'right' }}>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={() => handleDeleteRecord(item.id)}
                      >
                        <Trash2 size={14} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={9} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                    История расчетов пуста. Расчеты из калькулятора сохраняются здесь автоматически при нажатии «Сохранить расчет».
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
