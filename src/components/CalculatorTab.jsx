import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Calculator,
  Search,
  Copy,
  Check,
  Save,
  Sparkles,
  RefreshCw,
  Wrench,
  DollarSign,
  Plus,
  Trash2,
  CornerDownLeft,
  Delete,
  MessageSquare
} from 'lucide-react';
import { calculateRepairQuote, formatCurrency, generateClientMessage, applyRounding } from '../utils/calculator';

// High-Fidelity iOS Style Calculator Widget
function IosCalculator({ onApplyResultToPartCost, currency }) {
  const [display, setDisplay] = useState('0');
  const [operand, setOperand] = useState(null);
  const [operator, setOperator] = useState(null);
  const [shouldReset, setShouldReset] = useState(false);

  // Focus ref to capture keyboard presses when mouse is over calculator
  const calcContainerRef = useRef(null);

  const handleDigit = (digit) => {
    if (display === '0' || shouldReset) {
      setDisplay(digit);
      setShouldReset(false);
    } else {
      setDisplay((prev) => prev + digit);
    }
  };

  const handleDecimal = () => {
    if (shouldReset) {
      setDisplay('0.');
      setShouldReset(false);
      return;
    }
    if (!display.includes('.')) {
      setDisplay((prev) => prev + '.');
    }
  };

  const handleOperator = (op) => {
    const value = parseFloat(display);

    if (operator && !shouldReset) {
      const result = evaluate(operand, value, operator);
      setDisplay(String(result));
      setOperand(result);
    } else {
      setOperand(value);
    }

    setOperator(op);
    setShouldReset(true);
  };

  const evaluate = (op1, op2, operation) => {
    switch (operation) {
      case '+': return op1 + op2;
      case '-': return op1 - op2;
      case '*': return op1 * op2;
      case '/': return op2 !== 0 ? op1 / op2 : 0;
      default: return op2;
    }
  };

  const handleEqual = () => {
    if (!operator) return;
    const value = parseFloat(display);
    const result = evaluate(operand, value, operator);
    setDisplay(String(Math.round(result * 100) / 100));
    setOperand(null);
    setOperator(null);
    setShouldReset(true);
  };

  const handleClear = () => {
    setDisplay('0');
    setOperand(null);
    setOperator(null);
    setShouldReset(false);
  };

  const handleBackspace = () => {
    if (shouldReset) {
      handleClear();
      return;
    }
    if (display.length > 1) {
      setDisplay((prev) => prev.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  // Keyboard input handler
  const handleKeyDown = (e) => {
    if (e.key >= '0' && e.key <= '9') {
      e.preventDefault();
      handleDigit(e.key);
    } else if (e.key === '.') {
      e.preventDefault();
      handleDecimal();
    } else if (e.key === '+') {
      e.preventDefault();
      handleOperator('+');
    } else if (e.key === '-') {
      e.preventDefault();
      handleOperator('-');
    } else if (e.key === '*') {
      e.preventDefault();
      handleOperator('*');
    } else if (e.key === '/') {
      e.preventDefault();
      handleOperator('/');
    } else if (e.key === 'Enter' || e.key === '=') {
      e.preventDefault();
      handleEqual();
    } else if (e.key === 'Backspace') {
      e.preventDefault();
      handleBackspace();
    } else if (e.key === 'Escape' || e.key === 'c' || e.key === 'C') {
      e.preventDefault();
      handleClear();
    }
  };

  const resultValue = parseFloat(display);

  return (
    <div
      ref={calcContainerRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="glass-card"
      style={{
        padding: '20px 16px',
        background: '#000000', // iOS Black screen background
        borderRadius: '24px',
        border: '1px solid rgba(255,255,255,0.1)',
        outline: 'none',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.8)',
      }}
    >
      {/* iOS Display Screen */}
      <div
        style={{
          width: '100%',
          textAlign: 'right',
          padding: '16px 8px 10px 8px',
          color: '#ffffff',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto',
          fontSize: display.length > 8 ? '2rem' : '2.8rem',
          fontWeight: '300',
          minHeight: '74px',
          wordBreak: 'break-all',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
        }}
      >
        {display}
      </div>

      {/* Button Pad in Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '12px',
          width: '100%',
          marginBottom: '16px',
        }}
      >
        {/* Row 1: Top Gray Buttons */}
        <button
          onClick={handleClear}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#a5a5a5',
            color: '#000000',
            fontSize: '1.25rem',
            fontWeight: '600',
            cursor: 'pointer',
            transition: 'opacity 0.15s ease',
          }}
          onMouseDown={(e) => (e.target.style.opacity = '0.7')}
          onMouseUp={(e) => (e.target.style.opacity = '1')}
        >
          AC
        </button>

        <button
          onClick={handleBackspace}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#a5a5a5',
            color: '#000000',
            fontSize: '1.2rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          ⌫
        </button>

        <button
          onClick={() => handleOperator('/')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: operator === '/' ? '#ffffff' : '#ff9f0a',
            color: operator === '/' ? '#ff9f0a' : '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ÷
        </button>

        <button
          onClick={() => handleOperator('*')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: operator === '*' ? '#ffffff' : '#ff9f0a',
            color: operator === '*' ? '#ff9f0a' : '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          ×
        </button>

        {/* Row 2 */}
        <button
          onClick={() => handleDigit('7')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          7
        </button>

        <button
          onClick={() => handleDigit('8')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          8
        </button>

        <button
          onClick={() => handleDigit('9')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          9
        </button>

        <button
          onClick={() => handleOperator('-')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: operator === '-' ? '#ffffff' : '#ff9f0a',
            color: operator === '-' ? '#ff9f0a' : '#ffffff',
            fontSize: '1.6rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          -
        </button>

        {/* Row 3 */}
        <button
          onClick={() => handleDigit('4')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          4
        </button>

        <button
          onClick={() => handleDigit('5')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          5
        </button>

        <button
          onClick={() => handleDigit('6')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          6
        </button>

        <button
          onClick={() => handleOperator('+')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: operator === '+' ? '#ffffff' : '#ff9f0a',
            color: operator === '+' ? '#ff9f0a' : '#ffffff',
            fontSize: '1.5rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          +
        </button>

        {/* Row 4 */}
        <button
          onClick={() => handleDigit('1')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          1
        </button>

        <button
          onClick={() => handleDigit('2')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          2
        </button>

        <button
          onClick={() => handleDigit('3')}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          3
        </button>

        <button
          onClick={handleEqual}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#ff9f0a',
            color: '#ffffff',
            fontSize: '1.6rem',
            fontWeight: '600',
            cursor: 'pointer',
          }}
        >
          =
        </button>
      </div>

      {/* Row 5: Capsule Zero & Decimal */}
      <div style={{ display: 'flex', gap: '12px', width: '100%', justifyContent: 'flex-start', paddingLeft: '4px', marginBottom: '16px' }}>
        <button
          onClick={() => handleDigit('0')}
          style={{
            width: '124px',
            height: '56px',
            borderRadius: '28px',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            textAlign: 'left',
            paddingLeft: '22px',
            cursor: 'pointer',
          }}
        >
          0
        </button>

        <button
          onClick={handleDecimal}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            border: 'none',
            background: '#333333',
            color: '#ffffff',
            fontSize: '1.4rem',
            fontWeight: '500',
            cursor: 'pointer',
          }}
        >
          .
        </button>
      </div>

      {/* Action Button to apply sum to part cost */}
      {!isNaN(resultValue) && resultValue > 0 && (
        <button
          className="btn btn-success"
          style={{
            width: '100%',
            fontSize: '0.9rem',
            fontWeight: 700,
            padding: '12px',
            borderRadius: '12px',
            marginTop: '8px',
            border: 'none',
          }}
          onClick={() => onApplyResultToPartCost(resultValue)}
        >
          <CornerDownLeft size={16} /> Вставить {resultValue} {currency}
        </button>
      )}

      <div style={{ fontSize: '0.74rem', color: 'rgba(255,255,255,0.4)', marginTop: '8px', textAlign: 'center' }}>
        Наведите мышь и вводите цифры с клавиатуры
      </div>
    </div>
  );
}

export default function CalculatorTab({ prices, settings, prefilledData, clearPrefilledData, onSaveToHistory }) {
  // Implicitly derived brand & model from active selected price items
  const [inferredBrand, setInferredBrand] = useState('iPhone (Apple)');
  const [inferredModel, setInferredModel] = useState('iPhone 13');

  // Array of multi-service items
  const [serviceItems, setServiceItems] = useState([
    {
      id: 'item-1',
      serviceName: '',
      workPrice: '',
      partPrice: '',
      searchTerm: '',
      comment: '',
      showDropdown: false,
    }
  ]);

  // Active item index for autocomplete and math calculator target
  const [activeItemIndex, setActiveItemIndex] = useState(0);

  // Note/Warranty comments (derived from first selected item or manual entry)
  const [note, setNote] = useState('');

  // Notifications
  const [copied, setCopied] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [hasPrefilledBanner, setHasPrefilledBanner] = useState(false);
  const [showMobileMath, setShowMobileMath] = useState(false);

  // Auto pre-fill when manager clicks "Выбрать" in PriceListTab (Appends as next service!)
  useEffect(() => {
    if (prefilledData) {
      setInferredBrand(prefilledData.brand || 'iPhone (Apple)');
      setInferredModel(prefilledData.model || 'iPhone');

      const newItem = {
        id: `item-${Date.now()}-${Math.random()}`,
        serviceName: prefilledData.serviceName || '',
        workPrice: prefilledData.price ? prefilledData.price.toString() : '',
        partPrice: '',
        searchTerm: `${prefilledData.model} — ${prefilledData.serviceName}`,
        comment: prefilledData.comment || '',
        showDropdown: false,
      };

      const isEmpty = serviceItems.length === 1 &&
                      !serviceItems[0].serviceName &&
                      !serviceItems[0].workPrice;

      if (isEmpty) {
        setServiceItems([newItem]);
        setActiveItemIndex(0);
      } else {
        setServiceItems((prev) => [...prev, newItem]);
        setActiveItemIndex(serviceItems.length);
      }

      if (prefilledData.comment) {
        setNote((prev) => prev ? `${prev} • ${prefilledData.comment}` : prefilledData.comment);
      }
      
      setHasPrefilledBanner(true);
      
      if (clearPrefilledData) {
        clearPrefilledData();
      }
    }
  }, [prefilledData]);

  // Add new service row
  const handleAddServiceRow = () => {
    const newItem = {
      id: `item-${Date.now()}-${Math.random()}`,
      serviceName: '',
      workPrice: '',
      partPrice: '',
      searchTerm: '',
      comment: '',
      showDropdown: false,
    };
    setServiceItems([...serviceItems, newItem]);
    setActiveItemIndex(serviceItems.length);
  };

  // Remove service row
  const handleRemoveServiceRow = (id) => {
    if (serviceItems.length === 1) return;
    const updated = serviceItems.filter((item) => item.id !== id);
    setServiceItems(updated);
    setActiveItemIndex(Math.max(0, activeItemIndex - 1));
  };

  // Update specific field in a service row
  const updateServiceItem = (index, field, value) => {
    setServiceItems((prev) =>
      prev.map((item, idx) => (idx === index ? { ...item, [field]: value } : item))
    );
  };

  // Select item from autocomplete dropdown
  const handleSelectPriceItem = (index, priceItem) => {
    if (priceItem.brand) setInferredBrand(priceItem.brand);
    if (priceItem.model) setInferredModel(priceItem.model);

    updateServiceItem(index, 'serviceName', priceItem.serviceName);
    updateServiceItem(index, 'workPrice', priceItem.price.toString());
    updateServiceItem(index, 'searchTerm', `${priceItem.model} — ${priceItem.serviceName}`);
    updateServiceItem(index, 'comment', priceItem.comment || '');
    updateServiceItem(index, 'showDropdown', false);
    
    // Automatically set notes/warranty if first item gets parsed comments
    if (index === 0 && priceItem.comment) {
      setNote(priceItem.comment);
    }

    setActiveItemIndex(index);
  };

  // Calculate totals
  const multiCalculation = useMemo(() => {
    let totalWork = 0;
    let totalPart = 0;
    let totalFinalPrice = 0;
    let totalGrossProfit = 0;
    let totalMarginAmount = 0;

    const itemsBreakdown = serviceItems.map((item) => {
      const work = Number(item.workPrice) || 0;
      const part = Number(item.partPrice) || 0;
      
      const itemQuote = calculateRepairQuote({
        workPrice: work,
        partPrice: part,
        marginPercent: settings.marginPercent,
        roundingRule: settings.roundingRule,
      });

      totalWork += work;
      totalPart += part;
      totalFinalPrice += itemQuote.finalPrice;
      totalGrossProfit += itemQuote.grossProfit;
      totalMarginAmount += itemQuote.actualMarginAmount;

      return {
        name: item.serviceName || 'Услуга',
        work,
        part,
        sum: itemQuote.finalPrice, // Sum includes 11% margin and rounding!
        comment: item.comment,
      };
    });

    const subtotalVal = totalWork + totalPart;
    const roundedSubtotal = applyRounding(subtotalVal, settings.roundingRule);

    return {
      workPrice: totalWork,
      partPrice: totalPart,
      subtotal: roundedSubtotal,
      marginPercent: settings.marginPercent,
      actualMarginAmount: totalMarginAmount,
      finalPrice: totalFinalPrice,
      grossProfit: totalGrossProfit,
      itemsBreakdown,
      itemCount: serviceItems.length,
    };
  }, [serviceItems, settings.marginPercent, settings.roundingRule]);

  // Apply math result
  const handleApplyMathToPartCost = (val) => {
    const idx = activeItemIndex < serviceItems.length ? activeItemIndex : 0;
    updateServiceItem(idx, 'partPrice', val.toString());
  };

  // Preset addition
  const handleAddPartPreset = (index, amount) => {
    const current = Number(serviceItems[index].partPrice) || 0;
    updateServiceItem(index, 'partPrice', (current + amount).toString());
  };

  // Copy offer message (now lists separate prices with commission!)
  const handleCopyForClient = () => {
    let servicesText = '';
    if (multiCalculation.itemsBreakdown.length === 1) {
      const item = multiCalculation.itemsBreakdown[0];
      servicesText = `${item.name} — ${formatCurrency(item.sum, settings.currency)}`;
    } else {
      servicesText = multiCalculation.itemsBreakdown
        .map((it, i) => `${i + 1}. ${it.name} — ${formatCurrency(it.sum, settings.currency)}`)
        .join('\n');
    }

    const text = generateClientMessage({
      brand: inferredBrand,
      model: inferredModel,
      serviceName: servicesText,
      finalPrice: multiCalculation.finalPrice,
      cashPrice: multiCalculation.subtotal,
      currency: settings.currency,
      shopName: settings.shopName,
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  // Save to history
  const handleSaveCalculation = () => {
    if (!multiCalculation.finalPrice) return;

    const namesCombined = serviceItems
      .map((it) => it.serviceName)
      .filter(Boolean)
      .join(', ');

    const historyRecord = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      brand: inferredBrand || 'Прочее',
      model: inferredModel || 'Модель',
      serviceName: namesCombined || 'Комплексный ремонт',
      workPrice: multiCalculation.workPrice,
      partPrice: multiCalculation.partPrice,
      subtotal: multiCalculation.subtotal,
      marginPercent: multiCalculation.marginPercent,
      marginAmount: multiCalculation.actualMarginAmount,
      finalPrice: multiCalculation.finalPrice,
      grossProfit: multiCalculation.grossProfit,
      clientPhone: '—', // Removed Telephone field
      note: note ? `${note} (${serviceItems.length} услуг)` : `${serviceItems.length} услуг`,
    };

    onSaveToHistory(historyRecord);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleReset = () => {
    setInferredBrand('iPhone (Apple)');
    setInferredModel('iPhone 13');
    setServiceItems([
      {
        id: `item-${Date.now()}`,
        serviceName: '',
        workPrice: '',
        partPrice: '',
        searchTerm: '',
        comment: '',
        showDropdown: false,
      }
    ]);
    setNote('');
    setHasPrefilledBanner(false);
    setActiveItemIndex(0);
  };

  return (
    <div>
      {/* Mobile Toggle for Math Calculator */}
      <div className="mobile-only" style={{ marginBottom: '16px' }}>
        <button
          className="btn btn-secondary"
          style={{ width: '100%', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center', padding: '12px' }}
          onClick={() => setShowMobileMath(!showMobileMath)}
        >
          <Calculator size={18} />
          {showMobileMath ? 'Скрыть обычный калькулятор' : 'Показать обычный калькулятор'}
        </button>
      </div>

      <div className="calculator-layout-grid">
        {/* 1. LEFT SIDEBAR: Real iOS Style Calculator */}
        <div className={`math-calc-sidebar ${showMobileMath ? 'show' : ''}`}>
          <IosCalculator
            onApplyResultToPartCost={handleApplyMathToPartCost}
            currency={settings.currency}
          />
        </div>

      {/* 2. MIDDLE COLUMN: Clean & Uncluttered Multi-Service Inputs */}
      <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        <div>
          <div className="card-title" style={{ justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Wrench className="text-blue-400" size={22} />
              Расчет стоимости ремонта ({serviceItems.length})
            </div>

            <button className="btn btn-primary btn-sm" onClick={handleAddServiceRow}>
              <Plus size={16} /> Добавить работу
            </button>
          </div>

          {/* Prefilled info banner */}
          {hasPrefilledBanner && (
            <div style={{ background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)', padding: '10px 14px', borderRadius: '10px', marginBottom: '16px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                Устройство: <strong style={{ color: '#60a5fa' }}>{inferredBrand} {inferredModel}</strong>
                <div style={{ color: '#10b981', fontSize: '0.8rem', marginTop: '2px' }}>
                  Введите стоимость запчасти для вычисления полной цены работы.
                </div>
              </div>
              <button className="btn btn-secondary btn-sm" style={{ padding: '2px 8px', fontSize: '0.78rem' }} onClick={() => setHasPrefilledBanner(false)}>
                ОК
              </button>
            </div>
          )}

          {/* Device model indicator badge */}
          <div style={{ background: 'rgba(245, 158, 11, 0.1)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '10px', padding: '10px 16px', marginBottom: '16px', fontSize: '0.9rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-muted)' }}>Устройство в расчете:</span>
            <strong style={{ color: '#f59e0b', fontSize: '0.98rem' }}>{inferredBrand} {inferredModel}</strong>
          </div>

          {/* LIST OF REPAIR SERVICES */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '20px' }}>
            {serviceItems.map((item, index) => {
              const searchResults = item.searchTerm.trim()
                ? prices.filter((p) => `${p.brand} ${p.model} ${p.serviceName}`.toLowerCase().includes(item.searchTerm.toLowerCase())).slice(0, 20)
                : [];

              return (
                <div
                  key={item.id}
                  onClick={() => setActiveItemIndex(index)}
                  style={{
                    background: activeItemIndex === index ? 'rgba(30, 41, 59, 0.7)' : 'rgba(15, 23, 42, 0.5)',
                    border: `1px solid ${activeItemIndex === index ? 'rgba(59, 130, 246, 0.5)' : 'var(--border-color)'}`,
                    borderRadius: '12px',
                    padding: '16px',
                    position: 'relative',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <div style={{ fontWeight: 700, fontSize: '0.92rem', color: '#60a5fa', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>Услуга №{index + 1}</span>
                      {activeItemIndex === index && (
                        <span style={{ fontSize: '0.75rem', background: 'rgba(59,130,246,0.2)', padding: '2px 8px', borderRadius: '999px', color: '#93c5fd' }}>
                          Активная
                        </span>
                      )}
                    </div>

                    {serviceItems.length > 1 && (
                      <button
                        className="btn btn-danger btn-sm"
                        style={{ padding: '4px 8px' }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveServiceRow(item.id);
                        }}
                        title="Удалить услугу"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>

                  {/* Autocomplete Search input */}
                  <div className="form-group" style={{ position: 'relative', marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Поиск по прайсу:</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Наберите: замена экрана, батареи..."
                      value={item.searchTerm}
                      onChange={(e) => {
                        updateServiceItem(index, 'searchTerm', e.target.value);
                        updateServiceItem(index, 'showDropdown', true);
                      }}
                      onFocus={() => {
                        setActiveItemIndex(index);
                        updateServiceItem(index, 'showDropdown', true);
                      }}
                    />

                    {/* Dropdown */}
                    {item.showDropdown && item.searchTerm.trim() && (
                      <div className="search-dropdown">
                        {searchResults.length > 0 ? (
                          searchResults.map((pItem) => (
                            <div
                              key={pItem.id}
                              className="search-item"
                              onClick={() => handleSelectPriceItem(index, pItem)}
                            >
                              <div>
                                <div className="search-item-title">
                                  <span style={{ color: '#f59e0b', marginRight: '6px' }}>{pItem.model}</span>
                                  {pItem.serviceName}
                                </div>
                                <div className="search-item-sub">{pItem.brand} • {pItem.category}</div>
                              </div>
                              <div style={{ fontWeight: 700, color: '#60a5fa' }}>
                                {formatCurrency(pItem.price, settings.currency)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div style={{ padding: '10px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                            Ничего не найдено. Введите услугу вручную.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Manual Service Name */}
                  <div className="form-group" style={{ marginBottom: '12px' }}>
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Название услуги</label>
                    <input
                      type="text"
                      className="input-control"
                      placeholder="Замена дисплея..."
                      value={item.serviceName}
                      onChange={(e) => updateServiceItem(index, 'serviceName', e.target.value)}
                    />
                  </div>

                  {/* Work Price & Part Cost */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#60a5fa', fontSize: '0.8rem' }}>
                        Стоимость работы ({settings.currency})
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        style={{ fontWeight: 700, borderColor: 'rgba(59, 130, 246, 0.4)' }}
                        placeholder="0"
                        value={item.workPrice}
                        onChange={(e) => updateServiceItem(index, 'workPrice', e.target.value)}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: 0 }}>
                      <label className="form-label" style={{ color: '#f59e0b', fontSize: '0.8rem' }}>
                        Стоимость запчасти ({settings.currency})
                      </label>
                      <input
                        type="number"
                        className="input-control"
                        style={{ fontWeight: 700, borderColor: 'rgba(245, 158, 11, 0.4)', background: 'rgba(245, 158, 11, 0.05)' }}
                        placeholder="0"
                        value={item.partPrice}
                        onChange={(e) => updateServiceItem(index, 'partPrice', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Quick Presets for Part Cost */}
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                    {[500, 1000, 2500, 5000].map((amt) => (
                      <button
                        key={amt}
                        type="button"
                        className="btn btn-secondary btn-sm"
                        style={{ fontSize: '0.74rem', padding: '2px 6px' }}
                        onClick={() => handleAddPartPreset(index, amt)}
                      >
                        +{amt}
                      </button>
                    ))}
                    <button
                      type="button"
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: '0.74rem', padding: '2px 6px', color: '#f87171' }}
                      onClick={() => updateServiceItem(index, 'partPrice', '')}
                    >
                      Сброс
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className="btn btn-secondary"
            style={{ width: '100%', marginBottom: '20px', padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            onClick={handleAddServiceRow}
          >
            <Plus size={18} /> Добавить еще одну услугу к заказу
          </button>
        </div>

        {/* Customer Note / Warranty */}
        <div className="form-group" style={{ marginBottom: 0, marginTop: 'auto' }}>
          <label className="form-label">Заметка / Примечание / Гарантия</label>
          <input
            type="text"
            className="input-control"
            placeholder="Гарантия 3 месяца, проклейка в комплекте..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
      </div>

      {/* 3. RIGHT COLUMN: Detailed Realtime Multi-Service Calculation */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="calc-result-box" style={{ height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.88rem', fontWeight: 600, color: 'var(--text-muted)' }}>
                Итоговая цена под ключ
              </span>
              <span className="badge badge-brand">
                Наценка: {settings.marginPercent}%
              </span>
            </div>

            <div className="calc-total-price">
              {formatCurrency(multiCalculation.finalPrice, settings.currency)}
            </div>

            {/* CASH PRICE ROW */}
            <div style={{ marginTop: '4px', marginBottom: '14px', padding: '8px 12px', background: 'rgba(16, 185, 129, 0.1)', border: '1px dashed rgba(16, 185, 129, 0.35)', borderRadius: '10px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: '#10b981', fontWeight: 600 }}>💵 При оплате наличными:</span>
                <strong style={{ fontSize: '1.05rem', color: '#10b981', fontWeight: 800 }}>{formatCurrency(multiCalculation.subtotal, settings.currency)}</strong>
              </div>
              {multiCalculation.finalPrice > multiCalculation.subtotal && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#34d399', borderTop: '1px solid rgba(16, 185, 129, 0.15)', paddingTop: '4px' }}>
                  <span>Скидка / Выгода:</span>
                  <span style={{ fontWeight: 700 }}>-{formatCurrency(multiCalculation.finalPrice - multiCalculation.subtotal, settings.currency)}</span>
                </div>
              )}
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Всего услуг в заказе: <strong style={{ color: 'var(--text-main)' }}>{multiCalculation.itemCount}</strong>
            </div>

            {/* ITEMIZED SERVICES BREAKDOWN LIST */}
            <div style={{ background: 'rgba(0,0,0,0.25)', padding: '14px', borderRadius: '12px', marginBottom: '16px' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#60a5fa', marginBottom: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '4px' }}>
                Детализация по услугам:
              </div>

              {multiCalculation.itemsBreakdown.map((item, i) => (
                <div key={i} style={{ marginBottom: '8px', fontSize: '0.82rem' }}>
                  <div style={{ fontWeight: 600, color: '#f59e0b' }}>
                    {i + 1}. {item.name}
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '0.78rem', paddingLeft: '8px' }}>
                    <span>Работа: {formatCurrency(item.work, settings.currency)} | Запчасть: {formatCurrency(item.part, settings.currency)}</span>
                    <span style={{ fontWeight: 700, color: 'var(--text-main)' }}>= {formatCurrency(item.sum, settings.currency)}</span>
                  </div>
                </div>
              ))}

              <div style={{ paddingTop: '8px', marginTop: '8px', borderTop: '1px dashed var(--border-color)' }}>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Всего работы:</span>
                  <span>{formatCurrency(multiCalculation.workPrice, settings.currency)}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: 'var(--text-muted)' }}>Всего запчасти:</span>
                  <span>{formatCurrency(multiCalculation.partPrice, settings.currency)}</span>
                </div>
                <div className="breakdown-row">
                  <span style={{ color: '#f59e0b' }}>Комиссия ({settings.marginPercent}%):</span>
                  <span style={{ color: '#f59e0b', fontWeight: 600 }}>+{formatCurrency(multiCalculation.actualMarginAmount, settings.currency)}</span>
                </div>
                <div className="breakdown-row" style={{ paddingTop: '6px', marginTop: '4px', borderTop: '1px solid var(--border-color)' }}>
                  <span style={{ color: '#10b981', fontWeight: 700 }}>Прибыль сервиса:</span>
                  <span style={{ fontWeight: 800, color: '#10b981' }}>{formatCurrency(multiCalculation.grossProfit, settings.currency)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <button
              className="btn btn-success"
              style={{ width: '100%', fontSize: '1rem', padding: '12px' }}
              onClick={handleCopyForClient}
              disabled={!multiCalculation.finalPrice}
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
              {copied ? 'Скопировано в буфер!' : 'Скопировать КП для клиента'}
            </button>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <button
                className="btn btn-primary"
                onClick={handleSaveCalculation}
                disabled={!multiCalculation.finalPrice}
              >
                {savedSuccess ? <Check size={16} /> : <Save size={16} />}
                {savedSuccess ? 'Сохранено!' : 'Сохранить'}
              </button>

              <button className="btn btn-secondary" onClick={handleReset}>
                <RefreshCw size={16} /> Сброс
              </button>
            </div>
          </div>
        </div>

        {/* TIPS */}
        <div className="glass-card" style={{ padding: '14px 16px' }}>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
            <Sparkles size={18} style={{ color: 'var(--accent-warning)', flexShrink: 0, marginTop: '2px' }} />
            <div>
              <strong style={{ color: 'var(--text-main)' }}>Стиль iOS:</strong> Вы можете кликнуть по калькулятору и вводить цифры прямо на клавиатуре.
            </div>
          </div>
        </div>
        </div>
      </div>
    </div>
  );
}
