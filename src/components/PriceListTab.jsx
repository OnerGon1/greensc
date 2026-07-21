import React, { useState, useMemo, useRef } from 'react';
import { Plus, Search, Edit2, Trash2, Download, Upload, RefreshCcw, Check, X, FileSpreadsheet, Smartphone, Layers, Wrench, RefreshCw, MessageSquare, Calculator } from 'lucide-react';
import { formatCurrency, exportToCSV, sortModelsChronologically } from '../utils/calculator';
import { DEFAULT_PRICES } from '../data/initialData';

export default function PriceListTab({ prices, setPrices, currency, onManualSync, isSyncing, onSelectForCalculator }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBrand, setSelectedBrand] = useState('All');
  const [selectedModel, setSelectedModel] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Modal State for Add / Edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    brand: 'iPhone (Apple)',
    model: 'iPhone 13',
    serviceName: '',
    price: '',
    category: 'Дисплей',
    comment: '',
  });

  const fileInputRef = useRef(null);

  // Available brands list
  const brandsList = useMemo(() => {
    const brands = new Set(prices.map((p) => p.brand));
    return ['All', ...Array.from(brands)];
  }, [prices]);

  // Available models list (sorted chronologically for iPhone!)
  const availableModels = useMemo(() => {
    let filtered = prices;
    if (selectedBrand !== 'All') {
      filtered = prices.filter((p) => p.brand === selectedBrand);
    }
    const models = new Set(filtered.map((p) => p.model));
    const sorted = sortModelsChronologically(Array.from(models));
    return ['All', ...sorted];
  }, [prices, selectedBrand]);

  // Available categories list
  const categoriesList = useMemo(() => {
    const cats = new Set(prices.map((p) => p.category || 'Прочее'));
    return ['All', ...Array.from(cats)];
  }, [prices]);

  // Filtered prices for the table
  const filteredPrices = useMemo(() => {
    return prices.filter((item) => {
      const matchBrand = selectedBrand === 'All' || item.brand === selectedBrand;
      const matchModel = selectedModel === 'All' || item.model === selectedModel;
      const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
      const text = `${item.brand} ${item.model} ${item.serviceName} ${item.comment || ''}`.toLowerCase();
      const matchText = text.includes(searchTerm.toLowerCase());
      return matchBrand && matchModel && matchCat && matchText;
    });
  }, [prices, selectedBrand, selectedModel, selectedCategory, searchTerm]);

  // Open modal for Add
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setFormData({
      brand: selectedBrand !== 'All' ? selectedBrand : 'iPhone (Apple)',
      model: selectedModel !== 'All' ? selectedModel : 'iPhone 13',
      serviceName: '',
      price: '',
      category: 'Дисплей',
      comment: '',
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (item) => {
    setEditingItem(item);
    setFormData({
      brand: item.brand,
      model: item.model,
      serviceName: item.serviceName,
      price: item.price.toString(),
      category: item.category || 'Дисплей',
      comment: item.comment || '',
    });
    setIsModalOpen(true);
  };

  // Save Item (Add or Edit)
  const handleSaveItem = (e) => {
    e.preventDefault();
    if (!formData.serviceName.trim() || !formData.price) return;

    if (editingItem) {
      setPrices(
        prices.map((p) =>
          p.id === editingItem.id
            ? { ...p, ...formData, price: Number(formData.price) || 0 }
            : p
        )
      );
    } else {
      const newItem = {
        id: Date.now().toString(),
        brand: formData.brand.trim() || 'iPhone (Apple)',
        model: formData.brand === 'Android' ? 'Все модели Android' : (formData.model.trim() || 'Все модели'),
        serviceName: formData.serviceName.trim(),
        price: Number(formData.price) || 0,
        category: formData.category || 'Прочее',
        comment: formData.comment || '',
      };
      setPrices([newItem, ...prices]);
    }

    setIsModalOpen(false);
  };

  // Delete Item
  const handleDeleteItem = (id) => {
    if (window.confirm('Удалить эту работу из прайс-листа?')) {
      setPrices(prices.filter((p) => p.id !== id));
    }
  };

  // Reset to default prices
  const handleResetDefaults = () => {
    if (window.confirm('Восстановить базовый прайс-лист из Google Таблицы?')) {
      setPrices(DEFAULT_PRICES);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const exportData = prices.map((p) => ({
      'Бренд': p.brand,
      'Модель': p.model,
      'Название работы': p.serviceName,
      'Стоимость работы': p.price,
      'Категория': p.category || '',
      'Примечание / Комментарий': p.comment || '',
    }));
    exportToCSV('Price_List_Service.csv', exportData);
  };

  // Import CSV
  const handleImportCSV = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      const lines = text.split(/\r\n|\n/);
      if (lines.length < 2) return;

      const newItems = [];
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        const cols = line.split(';').map(c => c.replace(/^"|"$/g, ''));
        if (cols.length >= 4) {
          newItems.push({
            id: `import-${Date.now()}-${i}`,
            brand: cols[0] || 'Общий',
            model: cols[1] || 'Модель',
            serviceName: cols[2] || 'Услуга',
            price: Number(cols[3]) || 0,
            category: cols[4] || 'Прочее',
            comment: cols[5] || '',
          });
        }
      }

      if (newItems.length > 0) {
        setPrices([...newItems, ...prices]);
        alert(`Успешно импортировано ${newItems.length} позиций в прайс-лист!`);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="glass-card">
      <div className="card-title" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FileSpreadsheet className="text-blue-400" size={24} />
          Прайс-лист работ ({filteredPrices.length} из {prices.length} поз.)
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {onManualSync && (
            <button
              className="btn btn-success btn-sm"
              onClick={onManualSync}
              disabled={isSyncing}
              title="Сверить с Гугл Таблицами"
            >
              <RefreshCw size={14} className={isSyncing ? 'spin' : ''} />
              {isSyncing ? 'Сверка...' : 'Сверить с Гугл Таблицей'}
            </button>
          )}

          <button className="btn btn-primary btn-sm" onClick={handleOpenAddModal}>
            <Plus size={16} /> Добавить позицию
          </button>

          <button className="btn btn-secondary btn-sm" onClick={handleExportCSV}>
            <Download size={16} /> Экспорт CSV
          </button>

          <button
            className="btn btn-secondary btn-sm"
            onClick={() => fileInputRef.current && fileInputRef.current.click()}
          >
            <Upload size={16} /> Импорт CSV
          </button>
          <input
            type="file"
            ref={fileInputRef}
            style={{ display: 'none' }}
            accept=".csv"
            onChange={handleImportCSV}
          />

          <button className="btn btn-secondary btn-sm" title="Сбросить к умолчанию" onClick={handleResetDefaults}>
            <RefreshCcw size={16} /> Сброс
          </button>
        </div>
      </div>

      {/* FILTER BAR */}
      <div
        style={{
          background: 'rgba(23, 32, 54, 0.6)',
          border: '1px solid var(--border-color)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px',
        }}
      >
        <div className="pricelist-filters-grid">
          {/* 1. Brand Selection Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#60a5fa' }}>
                <Layers size={14} /> Бренд / Раздел:
              </span>
            </label>
            <select
              className="select-control"
              style={{ fontWeight: 600 }}
              value={selectedBrand}
              onChange={(e) => {
                setSelectedBrand(e.target.value);
                setSelectedModel('All');
              }}
            >
              {brandsList.map((b) => (
                <option key={b} value={b}>
                  {b === 'All' ? 'Все бренды и разделы' : b}
                </option>
              ))}
            </select>
          </div>

          {/* 2. Model Selection Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#f59e0b' }}>
                <Smartphone size={14} /> Выбор модели:
              </span>
            </label>
            <select
              className="select-control"
              style={{ fontWeight: 600, borderColor: 'rgba(245, 158, 11, 0.4)' }}
              value={selectedModel}
              onChange={(e) => setSelectedModel(e.target.value)}
            >
              {availableModels.map((m) => (
                <option key={m} value={m}>
                  {m === 'All' ? ' Все модели' : m}
                </option>
              ))}
            </select>
          </div>

          {/* 3. Category Filter Dropdown */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Категория работы:</label>
            <select
              className="select-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categoriesList.map((c) => (
                <option key={c} value={c}>
                  {c === 'All' ? 'Все категории' : c}
                </option>
              ))}
            </select>
          </div>

          {/* 4. Text Search */}
          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label">Поиск работы:</label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="input-control"
                placeholder="Поиск по модели, услуге или примечанию..."
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
          </div>
        </div>

        {/* Selected Filter Summary Badge */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
          <div>
            Показаны услуги для:{' '}
            <strong style={{ color: '#60a5fa' }}>{selectedBrand === 'All' ? 'Все бренды' : selectedBrand}</strong>
            {' ➔ '}
            <strong style={{ color: '#f59e0b' }}>{selectedModel === 'All' ? 'Все модели' : selectedModel}</strong>
          </div>
          <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
            Найдено позиций: {filteredPrices.length} из {prices.length}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>Бренд</th>
              <th>Модель</th>
              <th>Услуга / Вид работы</th>
              <th>Категория</th>
              <th>Стоимость работы</th>
              <th>Примечание / Комментарий</th>
              <th style={{ textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {filteredPrices.length > 0 ? (
              filteredPrices.map((item) => (
                <tr key={item.id}>
                  <td data-label="Бренд">
                    <span className="badge badge-brand">{item.brand}</span>
                  </td>
                  <td data-label="Модель" style={{ fontWeight: 700, color: '#f59e0b' }}>{item.model}</td>
                  <td data-label="Услуга" style={{ fontWeight: 500 }}>{item.serviceName}</td>
                  <td data-label="Категория">
                    <span className="badge badge-category">{item.category || 'Прочее'}</span>
                  </td>
                  <td data-label="Стоимость" style={{ fontWeight: 700, color: '#60a5fa', fontSize: '1rem' }}>
                    {formatCurrency(item.price, currency)}
                  </td>
                  <td data-label="Примечание">
                    {item.comment ? (
                      <span style={{ fontSize: '0.82rem', color: '#10b981', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '6px', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <MessageSquare size={12} /> {item.comment}
                      </span>
                    ) : (
                      <span style={{ color: 'var(--text-dim)', fontSize: '0.8rem' }}>—</span>
                    )}
                  </td>
                  <td data-label="Действия" style={{ textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px', alignItems: 'center' }}>
                      {/* PROMINENT "ВЫБРАТЬ" BUTTON FOR CALCULATOR */}
                      {onSelectForCalculator && (
                        <button
                          className="btn btn-success btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.82rem', fontWeight: 700 }}
                          onClick={() => onSelectForCalculator(item)}
                          title="Перенести в Калькулятор"
                        >
                          <Calculator size={14} /> Выбрать
                        </button>
                      )}

                      <button
                        className="btn btn-secondary btn-sm"
                        style={{ padding: '6px 8px' }}
                        onClick={() => handleOpenEditModal(item)}
                        title="Редактировать"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '6px 8px' }}
                        onClick={() => handleDeleteItem(item.id)}
                        title="Удалить"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)' }}>
                  Для выбранных параметров позиций не найдено. Нажмите «Сброс» или введите другой поисковый запрос.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.7)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div className="glass-card" style={{ width: '100%', maxWidth: '500px' }}>
            <div className="card-title" style={{ justifyContent: 'space-between' }}>
              <span>{editingItem ? 'Редактировать работу' : 'Добавить работу в прайс'}</span>
              <button
                className="btn btn-secondary btn-sm"
                onClick={() => setIsModalOpen(false)}
                style={{ padding: '4px 8px' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveItem}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Бренд / Платформа</label>
                  <select
                    className="select-control"
                    value={formData.brand}
                    onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  >
                    <option value="iPhone (Apple)">iPhone (Apple)</option>
                    <option value="Android">Android</option>
                    <option value="Ноутбуки">Ноутбуки</option>
                    <option value="Универсальный">Универсальный</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Модель</label>
                  {formData.brand === 'Android' ? (
                    <input
                      type="text"
                      className="input-control"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  ) : (
                    <input
                      type="text"
                      className="input-control"
                      required
                      placeholder="например: iPhone 14 Pro"
                      value={formData.model}
                      onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                    />
                  )}
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Название работы / услуги</label>
                <input
                  type="text"
                  className="input-control"
                  required
                  placeholder="Замена экрана, Замена аккумулятора..."
                  value={formData.serviceName}
                  onChange={(e) => setFormData({ ...formData, serviceName: e.target.value })}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div className="form-group">
                  <label className="form-label">Стоимость работы ({currency})</label>
                  <input
                    type="number"
                    className="input-control"
                    required
                    placeholder="2000"
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Категория</label>
                  <select
                    className="select-control"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  >
                    <option value="Дисплей">Дисплей</option>
                    <option value="Аккумулятор">Аккумулятор</option>
                    <option value="Корпус">Корпус</option>
                    <option value="Разъемы / Пайка">Разъемы / Пайка</option>
                    <option value="Звук / Динамики">Звук / Динамики</option>
                    <option value="Восстановление">Восстановление</option>
                    <option value="ПО / Настройка">ПО / Настройка</option>
                    <option value="Прочее">Прочее</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Примечание / Дополнительный комментарий</label>
                <input
                  type="text"
                  className="input-control"
                  placeholder="например: ПРОКЛЕЙКУ дисплея при любом ремонте..."
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  <Check size={18} /> Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
