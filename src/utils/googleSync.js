import { GOOGLE_SHEET_URL, DEFAULT_PRICES } from '../data/initialData';
import sheetsMap from '../data/sheets_map.json';

export { GOOGLE_SHEET_URL };

// Format elapsed time since last sync
export const getTimeSinceLastSync = (lastSyncTimestamp) => {
  if (!lastSyncTimestamp) return 'Никогда';
  const diffMs = Date.now() - new Date(lastSyncTimestamp).getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMins / 60);

  if (diffMins < 1) return 'Только что';
  if (diffMins < 60) return `${diffMins} мин назад`;
  if (diffHours < 24) return `${diffHours} ч ${diffMins % 60} мин назад`;
  return new Date(lastSyncTimestamp).toLocaleDateString('ru-RU');
};

// Format remaining time until next auto sync (2 hours default)
export const getTimeUntilNextSync = (lastSyncTimestamp, intervalHours = 2) => {
  if (!lastSyncTimestamp) return 'Скоро';
  const nextSyncTime = new Date(lastSyncTimestamp).getTime() + intervalHours * 3600 * 1000;
  const diffMs = nextSyncTime - Date.now();

  if (diffMs <= 0) return 'Выполняется сверка...';
  
  const totalMins = Math.floor(diffMs / (1000 * 60));
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours > 0) return `${hours} ч ${mins} мин`;
  return `${mins} мин`;
};

// A robust CSV line splitter that handles quotes correctly
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// Categorize service based on Russian word roots
const categorizeService = (name) => {
  const n = name.toLowerCase();
  
  if (
    n.includes('диспле') || 
    n.includes('экран') || 
    n.includes('модул') || 
    n.includes('тачскрин') || 
    n.includes('матриц') ||
    n.includes('стекло экрана') ||
    n.includes('стекло дисплея') ||
    n.includes('стекла экрана') ||
    n.includes('сенсор')
  ) {
    return 'Дисплей';
  }
  
  if (
    n.includes('аккумулятор') || 
    n.includes('акб') || 
    n.includes('батаре')
  ) {
    return 'Аккумулятор';
  }
  
  if (
    n.includes('корпус') || 
    n.includes('крышк') || 
    n.includes('заднее стекло') || 
    n.includes('задняя панель') || 
    n.includes('стекло камеры') || 
    n.includes('рамк')
  ) {
    return 'Корпус';
  }
  
  if (
    n.includes('динамик') || 
    n.includes('микрофон') || 
    n.includes('вибро') || 
    n.includes('taptic') || 
    n.includes('звонок') || 
    n.includes('звук')
  ) {
    return 'Звук / Динамики';
  }
  
  if (
    n.includes('разъем') || 
    n.includes('разъём') || 
    n.includes('разьем') || 
    n.includes('шлейф') || 
    n.includes('зарядк') || 
    n.includes('плат') || 
    n.includes('face id') || 
    n.includes('faceid') || 
    n.includes('кнопк') || 
    n.includes('антенн') || 
    n.includes('камер') || 
    n.includes('пайк') || 
    n.includes('контроллер') || 
    n.includes('микросхем')
  ) {
    return 'Разъемы / Пайка';
  }
  
  if (
    n.includes('восстановление') || 
    n.includes('обновление') || 
    n.includes('ios') || 
    n.includes('android') || 
    n.includes('резервное') || 
    n.includes('копирование') || 
    n.includes('прошивк') || 
    n.includes('настройк') || 
    n.includes('активац') || 
    n.includes('перенос') || 
    n.includes('данны')
  ) {
    return 'ПО / Настройка';
  }
  
  return 'Прочее';
};

// Parse price from cells supporting ranges (like "800-1200", "от 500 до 1000")
function parsePriceAndComment(priceCell, existingComment) {
  let price = 0;
  let commentStr = existingComment || '';

  const val = priceCell.trim();
  if (!val) return { price, comment: commentStr };

  const numbers = val.match(/\d+/g);
  if (numbers && numbers.length > 0) {
    price = parseInt(numbers[0], 10);

    if (numbers.length > 1 || val.includes('-') || val.toLowerCase().includes('от') || val.toLowerCase().includes('до')) {
      const rangeComment = `В прайсе указано: ${val}`;
      commentStr = commentStr ? `${commentStr} • ${rangeComment}` : rangeComment;
    }
  }

  return { price, comment: commentStr };
}

// Perform live sync with Google Sheets directly in client browser
export const syncWithGoogleSheets = async () => {
  try {
    const listToFetch = [...sheetsMap];
    if (!listToFetch.some(s => s.gid === '1200739781')) {
      listToFetch.push({ gid: '1200739781', title: 'Андроид' });
    }

    const allParsedPrices = [];
    let counter = 1;

    // Fetch all sheets in parallel
    const fetchPromises = listToFetch.map(async (sheet) => {
      try {
        const url = `https://docs.google.com/spreadsheets/d/1IdiyvhDD4-fVQfTNTgqmIK-tFqhilt0gCb51gMI9Qwo/export?format=csv&gid=${sheet.gid}`;
        const response = await fetch(url);
        if (!response.ok) return { sheet, csvData: null };
        const csvData = await response.text();
        return { sheet, csvData };
      } catch (e) {
        console.error(`Failed to fetch GID ${sheet.gid}:`, e);
        return { sheet, csvData: null };
      }
    });

    const results = await Promise.all(fetchPromises);

    for (const result of results) {
      const { sheet, csvData } = result;
      if (!csvData) continue;

      const lines = csvData.split(/\r?\n/);
      if (lines.length === 0) continue;

      // Extract general sheet comment from row 0 col 2 (if present)
      let sheetComment = '';
      const firstRowParts = parseCSVLine(lines[0]);
      if (firstRowParts.length > 2 && firstRowParts[2] && firstRowParts[2] !== 'Назад к списку') {
        sheetComment = firstRowParts[2];
      }

      // Android Sheet parser
      if (sheet.gid === '1200739781' || sheet.title.toLowerCase().includes('андроид')) {
        for (let r = 0; r < lines.length; r++) {
          const line = lines[r].trim();
          if (!line) continue;
          const parts = parseCSVLine(line);
          const serviceName = parts[0];
          if (!serviceName || serviceName.toLowerCase().startsWith('ремонт android') || serviceName.toLowerCase().includes('съемная') || serviceName.toLowerCase().includes('крышка')) {
            continue;
          }

          const variants = [
            { colIndex: 1, suffix: '(съемная крышка)' },
            { colIndex: 2, suffix: '(не съемная крышка)' },
            { colIndex: 3, suffix: '(скидка при нескольких услугах)' },
          ];

          for (const v of variants) {
            if (parts.length > v.colIndex && parts[v.colIndex]) {
              const cellVal = parts[v.colIndex];
              const parsed = parsePriceAndComment(cellVal, sheetComment);
              if (parsed.price > 0) {
                allParsedPrices.push({
                  id: `gsheet-${counter++}`,
                  brand: 'Android',
                  model: 'Все модели Android',
                  serviceName: `${serviceName} ${v.suffix}`,
                  price: parsed.price,
                  category: categorizeService(serviceName),
                  comment: parsed.comment
                });
              }
            }
          }
        }
      } 
      // iPhone Sheet parser
      else {
        const model = sheet.title.replace(/^Ремонт\s*/i, '').trim();
        for (let r = 1; r < lines.length; r++) {
          const line = lines[r].trim();
          if (!line) continue;
          const parts = parseCSVLine(line);
          const serviceName = parts[0];
          if (!serviceName || serviceName.toLowerCase().startsWith('ремонт iphone') || serviceName.toLowerCase().includes('назад к')) {
            continue;
          }

          if (parts.length > 1 && parts[1]) {
            const priceCell = parts[1];
            let rowComment = '';
            if (parts.length > 2 && parts[2] && parts[2] !== 'Назад к списку') {
              rowComment = parts[2];
            }

            const combinedComment = [sheetComment, rowComment].filter(Boolean).join(' • ');
            const parsed = parsePriceAndComment(priceCell, combinedComment);
            if (parsed.price > 0) {
              allParsedPrices.push({
                id: `gsheet-${counter++}`,
                brand: 'iPhone (Apple)',
                model,
                serviceName,
                price: parsed.price,
                category: categorizeService(serviceName),
                comment: parsed.comment
              });
            }
          }
        }
      }
    }

    // Safety check: if parser returned almost nothing, do not overwrite database
    if (allParsedPrices.length < 100) {
      console.warn("Too few prices parsed, aborting sync:", allParsedPrices.length);
      return { success: false, error: 'Недостаточно данных для сверки' };
    }

    // Add static Notebooks from initialData
    const staticLaptops = DEFAULT_PRICES.filter(p => p.brand === 'Ноутбуки');
    for (const lap of staticLaptops) {
      allParsedPrices.push({
        ...lap,
        id: `gsheet-${counter++}`
      });
    }

    return {
      success: true,
      prices: allParsedPrices,
      timestamp: new Date().toISOString(),
      count: allParsedPrices.length,
    };
  } catch (err) {
    console.error('Error during client-side Google Sheet sync:', err);
    return { success: false, error: err.message };
  }
};

