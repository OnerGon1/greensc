export const IPHONE_CHRONOLOGICAL_ORDER = [
  'iPhone 5',
  'iPhone 5c',
  'iPhone 5s',
  'iPhone SE',
  'iPhone 6',
  'iPhone 6 Plus',
  'iPhone 6s',
  'iPhone 6s Plus',
  'iPhone 7',
  'iPhone 7 Plus',
  'iPhone 8',
  'iPhone 8 Plus',
  'iPhone X',
  'iPhone XR',
  'iPhone XS',
  'iPhone XS Max',
  'iPhone SE 2020',
  'iPhone 11',
  'iPhone 11 Pro',
  'iPhone 11 Pro Max',
  'iPhone 12 Mini',
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13 Mini',
  'iPhone 13',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Plus',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  'iPhone 15',
  'iPhone 15 Plus',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16e',
  'iPhone 16 Plus',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
  'iPhone 17',
  'iPhone 17e',
  'iPhone 17 Air',
  'iPhone 17 Pro',
  'iPhone 17 Pro Max',
];

export const sortModelsChronologically = (modelsList) => {
  return [...modelsList].sort((a, b) => {
    if (a === 'All') return -1;
    if (b === 'All') return 1;

    const cleanA = a.replace(/^Ремонт\s*/i, '').trim();
    const cleanB = b.replace(/^Ремонт\s*/i, '').trim();

    const indexA = IPHONE_CHRONOLOGICAL_ORDER.findIndex(
      (m) => m.toLowerCase() === cleanA.toLowerCase()
    );
    const indexB = IPHONE_CHRONOLOGICAL_ORDER.findIndex(
      (m) => m.toLowerCase() === cleanB.toLowerCase()
    );

    if (indexA !== -1 && indexB !== -1) {
      return indexA - indexB;
    }
    if (indexA !== -1) return -1;
    if (indexB !== -1) return 1;

    return cleanA.localeCompare(cleanB, 'ru-RU', { numeric: true });
  });
};

export const applyRounding = (amount, roundingRule) => {
  if (amount <= 0) return 0;
  switch (roundingRule) {
    case 'round10':
      return Math.ceil(amount / 10) * 10;
    case 'round50':
      return Math.ceil(amount / 50) * 50;
    case 'round100':
      return Math.ceil(amount / 100) * 100;
    case 'none':
    default:
      return Math.ceil(amount);
  }
};

export const calculateRepairQuote = ({
  workPrice = 0,
  partPrice = 0,
  marginPercent = 11,
  roundingRule = 'round10',
}) => {
  const parsedWork = Number(workPrice) || 0;
  const parsedPart = Number(partPrice) || 0;
  const parsedMargin = Number(marginPercent) || 0;

  const subtotal = parsedWork + parsedPart;
  const rawMarginAmount = (subtotal * parsedMargin) / 100;
  const rawFinalPrice = subtotal + rawMarginAmount;
  
  const finalPrice = applyRounding(rawFinalPrice, roundingRule);
  
  const grossProfit = Math.max(0, finalPrice - parsedPart);
  const actualMarginAmount = finalPrice - subtotal;

  return {
    workPrice: parsedWork,
    partPrice: parsedPart,
    subtotal,
    marginPercent: parsedMargin,
    rawMarginAmount,
    rawFinalPrice,
    finalPrice,
    actualMarginAmount,
    grossProfit,
  };
};

export const formatCurrency = (val, currency = '₽') => {
  const num = Number(val) || 0;
  return `${num.toLocaleString('ru-RU')} ${currency}`;
};

export const generateClientMessage = ({
  brand = '',
  model = '',
  serviceName = '',
  finalPrice = 0,
  cashPrice = 0,
  currency = '₽',
  shopName = 'Сервисный Центр',
}) => {
  const device = [brand, model].filter(Boolean).join(' ');
  let msg = `📱 ${shopName}\nУстройство: ${device}\nРабота/Услуга:\n${serviceName}\n\n💰 Стоимость ремонта под ключ: ${formatCurrency(finalPrice, currency)}`;
  if (cashPrice && cashPrice !== finalPrice) {
    const discount = Math.max(0, finalPrice - cashPrice);
    msg += `\n💵 При оплате наличными: ${formatCurrency(cashPrice, currency)} (Выгода: ${formatCurrency(discount, currency)}!)`;
  }
  msg += `\n\n(Включает качественную запчасть + работу мастера + гарантию).\n\nЖдем вас! По всем вопросам звоните или пишите в ответном сообщении.`;
  return msg;
};

export const exportToCSV = (filename, rows) => {
  if (!rows || !rows.length) return;
  const separator = ';';
  const keys = Object.keys(rows[0]);
  const csvContent = [
    keys.join(separator),
    ...rows.map(row =>
      keys.map(k => {
        let cell = row[k] === null || row[k] === undefined ? '' : row[k];
        cell = String(cell).replace(/"/g, '""');
        if (cell.search(/("|,|\n|;)/g) >= 0) {
          cell = `"${cell}"`;
        }
        return cell;
      }).join(separator)
    ),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
