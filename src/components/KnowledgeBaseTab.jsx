import React, { useState, useMemo, useRef } from 'react';
import {
  Search,
  BookOpen,
  FolderTree,
  Tag,
  Copy,
  Check,
  Plus,
  Edit3,
  Trash2,
  X,
  ChevronRight,
  Pin,
  Clock,
  Sparkles,
  MessageSquare,
  HelpCircle,
  Download,
  Upload,
  AlertTriangle,
  FileText,
  ShieldAlert,
  Hash
} from 'lucide-react';
import { KB_CATEGORIES, DEFAULT_KNOWLEDGE_BASE } from '../data/initialKnowledgeBase';

const PRESET_TAGS = [
  'цена', 'дорого', 'оригинал', 'копия', 'дисплей', 'экран',
  'акб', 'батарея', 'iphone', 'android', 'ноутбук', 'вода',
  'утопленник', 'гарантия', 'faceid', 'пайка', 'скрипт', 'сроки',
  'переклейка', 'выгорание', 'приемка', 'выдача', 'претензия',
  'отказ', 'чек-лист', 'скидка', 'камера', 'корпус', 'динамик', 'разъем'
];

export default function KnowledgeBaseTab({ articles, setArticles }) {
  // Filters & Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Все категории');
  const [selectedSubcategory, setSelectedSubcategory] = useState('Все');
  const [selectedTag, setSelectedTag] = useState(null);

  // Reader Modal State
  const [readingArticle, setReadingArticle] = useState(null);
  const [copiedScriptId, setCopiedScriptId] = useState(null);

  // Editor Modal State
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState(null);
  const [formCategory, setFormCategory] = useState('');
  const [customCategory, setCustomCategory] = useState('');
  const [formSubcategory, setFormSubcategory] = useState('');
  const [customSubcategory, setCustomSubcategory] = useState('');
  const [formTitle, setFormTitle] = useState('');
  const [formSummary, setFormSummary] = useState('');
  const [formContent, setFormContent] = useState('');
  const [formQuickScript, setFormQuickScript] = useState('');
  const [formSelectedTags, setFormSelectedTags] = useState([]);
  const [newTagInput, setNewTagInput] = useState('');
  const [formIsPinned, setFormIsPinned] = useState(false);
  const [autoTagToast, setAutoTagToast] = useState(false);

  // Reset Confirmation State (with required safety confirmation text)
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetVerificationWord, setResetVerificationWord] = useState('');

  // Hidden file input for importing KB
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);

  // Derive unique categories and subcategories from articles
  const availableCategories = useMemo(() => {
    const cats = new Set(KB_CATEGORIES.filter(c => c !== 'Все категории'));
    articles.forEach(a => {
      if (a.category) cats.add(a.category);
    });
    return ['Все категории', ...Array.from(cats)];
  }, [articles]);

  const availableSubcategories = useMemo(() => {
    if (selectedCategory === 'Все категории') {
      const subs = new Set();
      articles.forEach(a => {
        if (a.subcategory) subs.add(a.subcategory);
      });
      return ['Все', ...Array.from(subs)];
    }
    const subs = new Set();
    articles.filter(a => a.category === selectedCategory).forEach(a => {
      if (a.subcategory) subs.add(a.subcategory);
    });
    return ['Все', ...Array.from(subs)];
  }, [articles, selectedCategory]);

  // Derive available subcategories for the currently selected category in the editor
  const editorSubcategories = useMemo(() => {
    const targetCat = formCategory === '__custom__' ? customCategory : formCategory;
    const subs = new Set();
    articles.forEach(a => {
      if (a.category === targetCat && a.subcategory) {
        subs.add(a.subcategory);
      }
    });

    if (subs.size === 0) {
      if (targetCat === 'Приёмка и диагностика') {
        ['iPhone & iPad', 'Android смартфоны', 'Ноутбуки & ПК'].forEach(s => subs.add(s));
      } else if (targetCat === 'Скрипты и возражения') {
        ['Ценовые возражения', 'Качество запчастей', 'Сроки ремонта'].forEach(s => subs.add(s));
      } else if (targetCat === 'Технические регламенты') {
        ['Дисплейные модули', 'Аккумуляторы', 'Пайка и материнские платы'].forEach(s => subs.add(s));
      } else if (targetCat === 'Гарантия и спорные ситуации') {
        ['Спорные ситуации', 'Гарантийные случаи', 'Отказ в гарантии'].forEach(s => subs.add(s));
      } else if (targetCat === 'Регламенты сервиса и CRM') {
        ['CRM и документация', 'Склад и запчасти'].forEach(s => subs.add(s));
      } else {
        subs.add('Общее');
      }
    }
    return Array.from(subs);
  }, [articles, formCategory, customCategory]);

  // Extract all unique tags across existing articles and presets
  const allKnownTags = useMemo(() => {
    const tagSet = new Set(PRESET_TAGS);
    articles.forEach(a => {
      if (Array.isArray(a.tags)) {
        a.tags.forEach(t => tagSet.add(t.toLowerCase().trim()));
      }
    });
    return Array.from(tagSet).sort();
  }, [articles]);

  // Extract top popular tags for the filter bar
  const popularTags = useMemo(() => {
    const tagCounts = {};
    articles.forEach(a => {
      if (Array.isArray(a.tags)) {
        a.tags.forEach(t => {
          const lower = t.toLowerCase().trim();
          tagCounts[lower] = (tagCounts[lower] || 0) + 1;
        });
      }
    });
    return Object.entries(tagCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t]) => t);
  }, [articles]);

  // Filtered Articles based on Search & Category & Subcategory & Tag
  const filteredArticles = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return articles.filter(article => {
      // Category match
      if (selectedCategory !== 'Все категории' && article.category !== selectedCategory) {
        return false;
      }

      // Subcategory match
      if (selectedSubcategory !== 'Все' && article.subcategory !== selectedSubcategory) {
        return false;
      }

      // Tag match
      if (selectedTag && (!article.tags || !article.tags.some(t => t.toLowerCase() === selectedTag.toLowerCase()))) {
        return false;
      }

      // Full text search match
      if (q) {
        const inTitle = article.title?.toLowerCase().includes(q);
        const inSummary = article.summary?.toLowerCase().includes(q);
        const inContent = article.content?.toLowerCase().includes(q);
        const inScript = article.quickScript?.toLowerCase().includes(q);
        const inSubcategory = article.subcategory?.toLowerCase().includes(q);
        const inCategory = article.category?.toLowerCase().includes(q);
        const inTags = article.tags?.some(t => t.toLowerCase().includes(q));

        if (!inTitle && !inSummary && !inContent && !inScript && !inSubcategory && !inCategory && !inTags) {
          return false;
        }
      }

      return true;
    }).sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return 0;
    });
  }, [articles, searchQuery, selectedCategory, selectedSubcategory, selectedTag]);

  // Copy Quick Script to clipboard
  const handleCopyScript = (e, article) => {
    e.stopPropagation();
    if (!article.quickScript) return;
    navigator.clipboard.writeText(article.quickScript);
    setCopiedScriptId(article.id);
    setTimeout(() => {
      setCopiedScriptId(null);
    }, 2200);
  };

  // Handler when Category changes in editor form
  const handleCategoryChange = (newCat) => {
    setFormCategory(newCat);
    if (newCat === '__custom__') {
      setFormSubcategory('__custom__');
      setCustomSubcategory('');
    } else {
      const subs = new Set();
      articles.forEach(a => {
        if (a.category === newCat && a.subcategory) subs.add(a.subcategory);
      });
      const subList = Array.from(subs);
      const firstSub = subList[0] || (
        newCat === 'Приёмка и диагностика' ? 'iPhone & iPad' :
        newCat === 'Скрипты и возражения' ? 'Ценовые возражения' :
        newCat === 'Технические регламенты' ? 'Дисплейные модули' :
        newCat === 'Гарантия и спорные ситуации' ? 'Спорные ситуации' :
        newCat === 'Регламенты сервиса и CRM' ? 'CRM и документация' : 'Общее'
      );
      setFormSubcategory(firstSub);
      setCustomSubcategory('');
    }
  };

  // Open Editor for new article
  const handleOpenCreateModal = () => {
    setEditingArticle(null);
    setFormTitle('');
    const initialCat = selectedCategory !== 'Все категории' ? selectedCategory : 'Скрипты и возражения';
    setFormCategory(initialCat);
    setCustomCategory('');

    const subs = new Set();
    articles.forEach(a => {
      if (a.category === initialCat && a.subcategory) subs.add(a.subcategory);
    });
    const subList = Array.from(subs);
    const initialSub = (selectedSubcategory !== 'Все' && subList.includes(selectedSubcategory))
      ? selectedSubcategory
      : (subList[0] || 'Ценовые возражения');

    setFormSubcategory(initialSub);
    setCustomSubcategory('');
    setFormSummary('');
    setFormContent('');
    setFormQuickScript('');
    setFormSelectedTags([]);
    setNewTagInput('');
    setFormIsPinned(false);
    setIsEditorOpen(true);
  };

  // Open Editor for existing article
  const handleOpenEditModal = (e, article) => {
    e.stopPropagation();
    setEditingArticle(article);
    setFormTitle(article.title || '');
    setFormCategory(article.category || 'Прочее');
    setCustomCategory('');
    setFormSubcategory(article.subcategory || 'Общее');
    setCustomSubcategory('');
    setFormSummary(article.summary || '');
    setFormContent(article.content || '');
    setFormQuickScript(article.quickScript || '');
    setFormSelectedTags(article.tags ? article.tags.map(t => t.toLowerCase().trim()) : []);
    setNewTagInput('');
    setFormIsPinned(!!article.isPinned);
    setIsEditorOpen(true);
  };

  // Automatic intelligent tag extraction from article text
  const handleAutoExtractTags = () => {
    const fullText = `${formTitle} ${formSummary} ${formContent} ${formQuickScript} ${formCategory} ${formSubcategory}`.toLowerCase();
    const detected = new Set(formSelectedTags);

    const keywordRules = [
      { tag: 'цена', regex: /(цен|рубл|стоимост|прайс)/i },
      { tag: 'дорого', regex: /(дорог|дешевл|скидк|торг)/i },
      { tag: 'оригинал', regex: /(оригинал|родн|сервис пак)/i },
      { tag: 'копия', regex: /(копи|дубликат|tft|incell|gx|zy)/i },
      { tag: 'дисплей', regex: /(диспле|экран|матриц|тачскрин|стекл)/i },
      { tag: 'акб', regex: /(акб|батаре|аккумулятор|емкост|заряд)/i },
      { tag: 'iphone', regex: /(iphone|айфон|apple|ios)/i },
      { tag: 'android', regex: /(android|андроид|samsung|xiaomi|redmi|huawei|honor)/i },
      { tag: 'ноутбук', regex: /(ноутбук|laptop|macbook|петли|топкейс)/i },
      { tag: 'вода', regex: /(вод|влаг|залит|утопленник|жидкост|окисл)/i },
      { tag: 'гарантия', regex: /(гаранти|брак|возврат|претензи)/i },
      { tag: 'faceid', regex: /(face id|faceid|датчик|трутон|true tone)/i },
      { tag: 'пайка', regex: /(пайк|микросхем|bga|реболл|шлейф|кз)/i },
      { tag: 'скрипт', regex: /(скрипт|клиент|ответ|фраза|возражен)/i },
      { tag: 'сроки', regex: /(срок|минут|быстро|спешк|время)/i },
      { tag: 'переклейка', regex: /(переклей|сепаратор|oca|струн)/i },
      { tag: 'приемка', regex: /(приемк|осмотр|чек-лист|акт)/i },
      { tag: 'выдача', regex: /(выдач|демонстрац|готово)/i },
      { tag: 'камера', regex: /(камер|стабилизатор|фокус|линз)/i },
      { tag: 'корпус', regex: /(корпус|рамк|крышк|изогнут)/i },
    ];

    keywordRules.forEach(rule => {
      if (rule.regex.test(fullText)) {
        detected.add(rule.tag);
      }
    });

    setFormSelectedTags(Array.from(detected));
    setAutoTagToast(true);
    setTimeout(() => setAutoTagToast(false), 2000);
  };

  // Toggle tag selection
  const handleToggleTag = (tag) => {
    setFormSelectedTags(prev => {
      if (prev.includes(tag)) {
        return prev.filter(t => t !== tag);
      } else {
        return [...prev, tag];
      }
    });
  };

  // Add custom tag from input
  const handleAddCustomTag = (e) => {
    e.preventDefault();
    const clean = newTagInput.trim().toLowerCase().replace(/^#/, '');
    if (clean && !formSelectedTags.includes(clean)) {
      setFormSelectedTags(prev => [...prev, clean]);
      setNewTagInput('');
    }
  };

  // Insert markdown snippet into content textarea
  const handleInsertSnippet = (snippet) => {
    if (!textareaRef.current) {
      setFormContent(prev => prev + '\n' + snippet);
      return;
    }
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const current = formContent;
    const before = current.substring(0, start);
    const after = current.substring(end);
    const nextVal = `${before}\n${snippet}\n${after}`;
    setFormContent(nextVal);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + snippet.length + 2, start + snippet.length + 2);
    }, 10);
  };

  // Save Article (create or update)
  const handleSaveArticle = (e) => {
    e.preventDefault();
    if (!formTitle.trim()) {
      alert('Укажите заголовок статьи');
      return;
    }

    const finalCategory = formCategory === '__custom__' ? (customCategory.trim() || 'Прочее') : formCategory;
    const finalSubcategory = formSubcategory === '__custom__' ? (customSubcategory.trim() || 'Общее') : (formSubcategory || 'Общее');

    if (editingArticle) {
      // Update
      const updated = articles.map(a => {
        if (a.id === editingArticle.id) {
          return {
            ...a,
            title: formTitle.trim(),
            category: finalCategory,
            subcategory: finalSubcategory,
            tags: formSelectedTags,
            summary: formSummary.trim(),
            content: formContent.trim(),
            quickScript: formQuickScript.trim(),
            isPinned: formIsPinned,
            updatedAt: new Date().toISOString().split('T')[0]
          };
        }
        return a;
      });
      setArticles(updated);
      if (readingArticle && readingArticle.id === editingArticle.id) {
        setReadingArticle({
          ...readingArticle,
          title: formTitle.trim(),
          category: finalCategory,
          subcategory: finalSubcategory,
          tags: formSelectedTags,
          summary: formSummary.trim(),
          content: formContent.trim(),
          quickScript: formQuickScript.trim(),
          isPinned: formIsPinned,
          updatedAt: new Date().toISOString().split('T')[0]
        });
      }
    } else {
      // Create new
      const newArticle = {
        id: `kb-custom-${Date.now()}`,
        title: formTitle.trim(),
        category: finalCategory,
        subcategory: finalSubcategory,
        tags: formSelectedTags,
        summary: formSummary.trim(),
        content: formContent.trim(),
        quickScript: formQuickScript.trim(),
        readTime: `${Math.max(1, Math.ceil(formContent.split(/\s+/).length / 120))} мин`,
        isPinned: formIsPinned,
        updatedAt: new Date().toISOString().split('T')[0]
      };
      setArticles([newArticle, ...articles]);
    }

    setIsEditorOpen(false);
  };

  // Delete article
  const handleDeleteArticle = (e, articleId) => {
    e.stopPropagation();
    if (window.confirm('Вы уверены, что хотите удалить эту статью из базы знаний?')) {
      const next = articles.filter(a => a.id !== articleId);
      setArticles(next);
      if (readingArticle && readingArticle.id === articleId) {
        setReadingArticle(null);
      }
    }
  };

  // Export knowledge base to JSON file (Backup)
  const handleExportBackup = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(articles, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `baza_znaniy_backup_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // Import knowledge base from JSON file
  const handleImportFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target.result);
        if (Array.isArray(imported) && imported.length > 0) {
          if (window.confirm(`Загрузить ${imported.length} статей из файла? Текущие статьи будут обновлены.`)) {
            setArticles(imported);
            alert('База знаний успешно загружена из файла!');
          }
        } else {
          alert('Некорректный формат файла базы знаний.');
        }
      } catch (err) {
        alert('Ошибка при чтении файла JSON: ' + err.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Protected reset to default initial knowledge base
  const handleResetToDefaults = () => {
    if (resetVerificationWord.trim().toUpperCase() !== 'СБРОС') {
      alert('Для подтверждения введите слово «СБРОС»');
      return;
    }
    setArticles(DEFAULT_KNOWLEDGE_BASE);
    setConfirmReset(false);
    setResetVerificationWord('');
    setSelectedCategory('Все категории');
    setSelectedSubcategory('Все');
    setSelectedTag(null);
    setSearchQuery('');
    setReadingArticle(null);
  };

  // Highlight keyword occurrences in text
  const highlightText = (text, query) => {
    if (!text || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return parts.map((part, index) =>
      part.toLowerCase() === query.toLowerCase() ? (
        <mark key={index} className="kb-highlight">{part}</mark>
      ) : (
        part
      )
    );
  };

  // Render markdown-like simple formatting for article body
  const renderFormattedContent = (content, query) => {
    if (!content) return null;
    const lines = content.split('\n');

    return (
      <div className="kb-rendered-body">
        {lines.map((line, idx) => {
          const trimmed = line.trim();
          if (!trimmed) {
            return <div key={idx} style={{ height: '10px' }} />;
          }

          if (trimmed.startsWith('#### ')) {
            return <h4 key={idx} className="kb-content-h4">{highlightText(trimmed.replace('#### ', ''), query)}</h4>;
          }
          if (trimmed.startsWith('### ')) {
            return <h3 key={idx} className="kb-content-h3">{highlightText(trimmed.replace('### ', ''), query)}</h3>;
          }
          if (trimmed.startsWith('## ')) {
            return <h2 key={idx} className="kb-content-h2">{highlightText(trimmed.replace('## ', ''), query)}</h2>;
          }
          if (trimmed.startsWith('> ')) {
            return (
              <blockquote key={idx} className="kb-content-quote">
                {highlightText(trimmed.replace('> ', ''), query)}
              </blockquote>
            );
          }
          if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            return (
              <li key={idx} className="kb-content-li">
                {highlightText(trimmed.substring(2), query)}
              </li>
            );
          }
          if (/^\d+\.\s/.test(trimmed)) {
            return (
              <div key={idx} className="kb-content-num-item">
                <span className="kb-num-badge">{trimmed.match(/^\d+/)[0]}</span>
                <span>{highlightText(trimmed.replace(/^\d+\.\s*/, ''), query)}</span>
              </div>
            );
          }

          return <p key={idx} className="kb-content-p">{highlightText(line, query)}</p>;
        })}
      </div>
    );
  };

  return (
    <div className="kb-container">
      {/* Hidden file input for backup restore */}
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: 'none' }}
        accept=".json"
        onChange={handleImportFile}
      />

      {/* Top Banner & Quick Controls */}
      <div className="kb-header-card glass-card">
        <div className="kb-header-top">
          <div className="kb-title-box">
            <div className="kb-icon-badge">
              <BookOpen size={26} />
            </div>
            <div>
              <h2 className="kb-main-title">База знаний менеджера</h2>
              <p className="kb-subtitle">
                Регламенты приёмки, стандарты качества, отработка возражений и готовые скрипты ответов клиентам
              </p>
            </div>
          </div>

          <div className="kb-top-actions">
            <button
              className="btn btn-primary"
              onClick={handleOpenCreateModal}
              title="Добавить новую статью или регламент"
            >
              <Plus size={18} />
              Добавить статью
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={handleExportBackup}
              title="Скачать резервную копию всех статей (JSON)"
            >
              <Download size={15} />
              Экспорт
            </button>

            <button
              className="btn btn-secondary btn-sm"
              onClick={() => fileInputRef.current && fileInputRef.current.click()}
              title="Загрузить базу знаний из файла"
            >
              <Upload size={15} />
              Импорт
            </button>
          </div>
        </div>

        {/* Global Full-Text Search Input */}
        <div className="kb-search-row">
          <div className="kb-search-input-wrapper">
            <Search className="kb-search-icon" size={20} />
            <input
              type="text"
              className="kb-search-input"
              placeholder="Поиск по словам из статей, скриптов, возражений, кодов и деталей..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="kb-clear-search-btn"
                onClick={() => setSearchQuery('')}
                title="Очистить поиск"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {/* Popular Quick Tags */}
        <div className="kb-quick-tags-bar">
          <span className="kb-quick-tags-label">
            <Tag size={13} /> Быстрые теги:
          </span>
          {popularTags.map(tag => (
            <button
              key={tag}
              className={`kb-tag-chip ${selectedTag === tag ? 'active' : ''}`}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
            >
              #{tag}
            </button>
          ))}
          {selectedTag && (
            <button
              className="kb-tag-chip kb-tag-clear"
              onClick={() => setSelectedTag(null)}
              title="Сбросить фильтр по тегу"
            >
              <X size={12} /> сбросить тег
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout: Categories Tabs + Subcategories Bar + Articles Grid */}
      <div className="kb-main-layout">
        {/* Categories Bar */}
        <div className="kb-category-nav">
          <div className="kb-category-scroll">
            {availableCategories.map(cat => {
              const count = cat === 'Все категории' 
                ? articles.length 
                : articles.filter(a => a.category === cat).length;
              const isActive = selectedCategory === cat;

              return (
                <button
                  key={cat}
                  className={`kb-cat-btn ${isActive ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(cat);
                    setSelectedSubcategory('Все');
                  }}
                >
                  <span>{cat}</span>
                  <span className={`kb-cat-badge ${isActive ? 'active' : ''}`}>{count}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subcategories Chips Bar */}
        {availableSubcategories.length > 1 && (
          <div className="kb-subcategory-bar">
            <div className="kb-subcat-label">
              <FolderTree size={14} /> Подкатегории:
            </div>
            <div className="kb-subcat-list">
              {availableSubcategories.map(sub => {
                const isActive = selectedSubcategory === sub;
                const subCount = sub === 'Все'
                  ? (selectedCategory === 'Все категории' 
                      ? articles.length 
                      : articles.filter(a => a.category === selectedCategory).length)
                  : articles.filter(a => 
                      (selectedCategory === 'Все категории' || a.category === selectedCategory) && 
                      a.subcategory === sub
                    ).length;

                return (
                  <button
                    key={sub}
                    className={`kb-subcat-chip ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedSubcategory(sub)}
                  >
                    <span>{sub}</span>
                    <span className="kb-subcat-count">{subCount}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Search Results Summary Header */}
        <div className="kb-results-meta">
          <div>
            <span>
              Найдено статей:{' '}
              <strong style={{ color: 'var(--primary-glow)' }}>{filteredArticles.length}</strong>
            </span>
            {searchQuery && (
              <span className="kb-active-query-badge">
                по запросу: «{searchQuery}»
              </span>
            )}
            {selectedCategory !== 'Все категории' && (
              <span className="kb-active-query-badge">
                папка: {selectedCategory}
              </span>
            )}
            {selectedSubcategory !== 'Все' && (
              <span className="kb-active-query-badge">
                подкатегория: {selectedSubcategory}
              </span>
            )}
          </div>

          {(searchQuery || selectedCategory !== 'Все категории' || selectedSubcategory !== 'Все' || selectedTag) && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Все категории');
                setSelectedSubcategory('Все');
                setSelectedTag(null);
              }}
            >
              Сбросить все фильтры
            </button>
          )}
        </div>

        {/* Articles Grid */}
        {filteredArticles.length === 0 ? (
          <div className="kb-empty-state glass-card">
            <HelpCircle size={48} style={{ color: 'var(--text-dim)', marginBottom: '12px' }} />
            <h3>Статьи не найдены</h3>
            <p>По вашему поисковому запросу ничего не нашлось. Попробуйте изменить формулировку или сбросить фильтры.</p>
            <button
              className="btn btn-primary"
              style={{ marginTop: '16px' }}
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('Все категории');
                setSelectedSubcategory('Все');
                setSelectedTag(null);
              }}
            >
              Показать все статьи
            </button>
          </div>
        ) : (
          <div className="kb-articles-grid">
            {filteredArticles.map(article => {
              const hasScript = Boolean(article.quickScript);
              const isCopied = copiedScriptId === article.id;

              return (
                <div
                  key={article.id}
                  className={`kb-card glass-card ${article.isPinned ? 'pinned' : ''}`}
                  onClick={() => setReadingArticle(article)}
                >
                  {/* Card Top Meta */}
                  <div className="kb-card-header">
                    <div className="kb-card-badges">
                      <span className="kb-category-pill">{article.category}</span>
                      {article.subcategory && (
                        <span className="kb-subcategory-pill">{article.subcategory}</span>
                      )}
                    </div>

                    <div className="kb-card-actions-top">
                      {article.isPinned && (
                        <span className="kb-pin-badge" title="Закрепленный регламент">
                          <Pin size={13} /> Важно
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Title */}
                  <h3 className="kb-card-title">
                    {highlightText(article.title, searchQuery)}
                  </h3>

                  {/* Summary / Excerpt */}
                  <p className="kb-card-summary">
                    {highlightText(article.summary || article.content?.slice(0, 140) + '...', searchQuery)}
                  </p>

                  {/* Quick Script Box (if present) */}
                  {hasScript && (
                    <div
                      className="kb-card-script-preview"
                      onClick={(e) => handleCopyScript(e, article)}
                      title="Нажмите, чтобы скопировать скрипт для клиента"
                    >
                      <div className="kb-script-preview-header">
                        <span className="kb-script-tag">
                          <MessageSquare size={13} /> Готовый скрипт клиенту
                        </span>
                        <button
                          className={`btn btn-sm ${isCopied ? 'btn-success' : 'btn-secondary'}`}
                          style={{ padding: '3px 8px', fontSize: '0.75rem' }}
                          onClick={(e) => handleCopyScript(e, article)}
                        >
                          {isCopied ? <Check size={12} /> : <Copy size={12} />}
                          {isCopied ? 'Скопировано!' : 'Копировать'}
                        </button>
                      </div>
                      <p className="kb-script-preview-text">
                        «{highlightText(article.quickScript.slice(0, 130), searchQuery)}...»
                      </p>
                    </div>
                  )}

                  {/* Tags */}
                  {article.tags && article.tags.length > 0 && (
                    <div className="kb-card-tags">
                      {article.tags.map(tag => (
                        <span
                          key={tag}
                          className="kb-card-tag"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedTag(tag);
                          }}
                        >
                          #{highlightText(tag, searchQuery)}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Card Footer */}
                  <div className="kb-card-footer">
                    <div className="kb-card-time">
                      <Clock size={13} />
                      <span>{article.readTime || '2 мин'}</span>
                      {article.updatedAt && (
                        <span style={{ color: 'var(--text-dim)', marginLeft: '8px' }}>
                          • {article.updatedAt}
                        </span>
                      )}
                    </div>

                    <div className="kb-card-buttons">
                      <button
                        className="kb-icon-btn"
                        onClick={(e) => handleOpenEditModal(e, article)}
                        title="Редактировать статью"
                      >
                        <Edit3 size={15} />
                      </button>
                      <button
                        className="kb-icon-btn delete"
                        onClick={(e) => handleDeleteArticle(e, article.id)}
                        title="Удалить статью"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Footer Maintenance Section (Safe and subtle, away from the top) */}
        <div className="kb-footer-management">
          <div>
            База знаний сервисного центра • Всего статей: {articles.length}
          </div>
          <button
            className="kb-danger-link"
            onClick={() => {
              setResetVerificationWord('');
              setConfirmReset(true);
            }}
          >
            <ShieldAlert size={14} />
            Сброс к эталонным регламентам...
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* ARTICLE READER MODAL (FULL VIEW) */}
      {/* ======================================================== */}
      {readingArticle && (
        <div className="kb-modal-overlay" onClick={() => setReadingArticle(null)}>
          <div
            className="kb-reader-modal glass-card"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="kb-reader-header">
              <div className="kb-reader-meta-row">
                <div className="kb-breadcrumbs">
                  <span className="kb-breadcrumb-cat">{readingArticle.category}</span>
                  <ChevronRight size={14} style={{ color: 'var(--text-dim)' }} />
                  <span className="kb-breadcrumb-sub">{readingArticle.subcategory}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={(e) => {
                      setReadingArticle(null);
                      handleOpenEditModal(e, readingArticle);
                    }}
                  >
                    <Edit3 size={14} /> Редактировать
                  </button>

                  <button
                    className="kb-modal-close-btn"
                    onClick={() => setReadingArticle(null)}
                    title="Закрыть"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <h1 className="kb-reader-title">
                {highlightText(readingArticle.title, searchQuery)}
              </h1>


            </div>

            {/* Modal Body */}
            <div className="kb-reader-body-wrapper">
              {/* Ready Client Script Callout Block */}
              {readingArticle.quickScript && (
                <div className="kb-script-callout">
                  <div className="kb-script-callout-header">
                    <div className="kb-script-callout-title">
                      <Sparkles size={18} style={{ color: '#10b981' }} />
                      <span>Готовый скрипт для ответа клиенту (WhatsApp / звонок / чат)</span>
                    </div>

                    <button
                      className={`btn btn-sm ${copiedScriptId === readingArticle.id ? 'btn-success' : 'btn-primary'}`}
                      onClick={(e) => handleCopyScript(e, readingArticle)}
                    >
                      {copiedScriptId === readingArticle.id ? <Check size={15} /> : <Copy size={15} />}
                      {copiedScriptId === readingArticle.id ? 'Скрипт скопирован!' : 'Скопировать ответ клиенту'}
                    </button>
                  </div>

                  <div className="kb-script-callout-box">
                    <p className="kb-script-callout-text">
                      «{readingArticle.quickScript}»
                    </p>
                  </div>
                </div>
              )}

              {/* Main Content Body */}
              <div className="kb-article-content-rendered">
                {renderFormattedContent(readingArticle.content, searchQuery)}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="kb-reader-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setReadingArticle(null)}
              >
                Закрыть статью
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* ARTICLE EDITOR MODAL (ADD / EDIT) - Sleek Dark Studio */}
      {/* ======================================================== */}
      {isEditorOpen && (
        <div className="kb-modal-overlay" onClick={() => setIsEditorOpen(false)}>
          <div
            className="kb-editor-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="kb-editor-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: 'linear-gradient(135deg, #6366f1, #3b82f6)', padding: '8px', borderRadius: '8px', color: 'white', display: 'flex' }}>
                  <FileText size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: 0 }}>
                    {editingArticle ? 'Редактирование статьи' : 'Новая статья в базу знаний'}
                  </h3>
                  <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
                    Заполните заголовок, регламент и при необходимости готовый скрипт для клиентов
                  </p>
                </div>
              </div>
              <button
                className="kb-modal-close-btn"
                onClick={() => setIsEditorOpen(false)}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveArticle} className="kb-editor-form">
              {/* Title Input */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Заголовок статьи / возражения *</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Например: Возражение: «Почему так дорого?» или Регламент приёмки MacBook"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  required
                />
              </div>

              {/* Categories & Subcategories Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Категория *</label>
                  <select
                    className="form-select"
                    value={formCategory}
                    onChange={(e) => handleCategoryChange(e.target.value)}
                  >
                    {availableCategories.filter(c => c !== 'Все категории').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                    <option value="__custom__">+ Создать новую категорию...</option>
                  </select>

                  {formCategory === '__custom__' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Название новой категории..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      style={{ marginTop: '8px' }}
                      required
                    />
                  )}
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ color: '#cbd5e1' }}>Подкатегория *</label>
                  <select
                    className="form-select"
                    value={formSubcategory}
                    onChange={(e) => setFormSubcategory(e.target.value)}
                  >
                    {editorSubcategories.map(sub => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                    <option value="__custom__">+ Создать новую подкатегорию...</option>
                  </select>

                  {formSubcategory === '__custom__' && (
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Название новой подкатегории..."
                      value={customSubcategory}
                      onChange={(e) => setCustomSubcategory(e.target.value)}
                      style={{ marginTop: '8px' }}
                      required
                    />
                  )}
                </div>
              </div>

              {/* Summary */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <label className="form-label" style={{ color: '#cbd5e1' }}>Краткая суть (1-2 предложения для карточки)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="Краткое описание сути регламента или вопроса..."
                  value={formSummary}
                  onChange={(e) => setFormSummary(e.target.value)}
                />
              </div>

              {/* Client Quick Script Box */}
              <div className="kb-editor-script-box">
                <label className="form-label" style={{ color: '#34d399', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <MessageSquare size={16} />
                  Готовый скрипт для клиента (что менеджеру скопировать в чат / сказать вслух)
                </label>
                <textarea
                  className="form-input"
                  rows={3}
                  placeholder="Точный текст ответа клиенту: «Понимаю ваше желание сэкономить! Разница в цене кроется в...»"
                  value={formQuickScript}
                  onChange={(e) => setFormQuickScript(e.target.value)}
                  style={{ borderColor: 'rgba(16, 185, 129, 0.3)' }}
                />
              </div>

              {/* Full Content with Quick Formatting Buttons */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <label className="form-label" style={{ margin: 0, color: '#cbd5e1' }}>
                    Полный текст статьи / регламента *
                  </label>
                  <div className="kb-format-toolbar">
                    <button
                      type="button"
                      className="kb-format-btn"
                      onClick={() => handleInsertSnippet('### Заголовок раздела')}
                      title="Вставить заголовок"
                    >
                      ### Заголовок
                    </button>
                    <button
                      type="button"
                      className="kb-format-btn"
                      onClick={() => handleInsertSnippet('1. Первый пункт\n2. Второй пункт')}
                      title="Вставить список"
                    >
                      1. Список
                    </button>
                    <button
                      type="button"
                      className="kb-format-btn"
                      onClick={() => handleInsertSnippet('> Важное примечание')}
                      title="Вставить цитату"
                    >
                      &gt; Цитата
                    </button>
                    <button
                      type="button"
                      className="kb-format-btn"
                      onClick={() => handleInsertSnippet('### ⚠️ Чего говорить нельзя:\n- ')}
                      title="Вставить блок запретов"
                    >
                      ⚠️ Табу
                    </button>
                  </div>
                </div>

                <textarea
                  ref={textareaRef}
                  className="form-input"
                  rows={7}
                  placeholder="Подробный текст статьи... Используйте заголовки ### и списки для структурирования."
                  value={formContent}
                  onChange={(e) => setFormContent(e.target.value)}
                  required
                />
              </div>

              {/* Intelligent Tags Picker Box */}
              <div className="kb-tags-picker-box">
                <div className="kb-tags-picker-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Hash size={15} style={{ color: '#818cf8' }} />
                    <span style={{ fontSize: '0.88rem', fontWeight: 600, color: '#e2e8f0' }}>Теги статьи:</span>
                    <span style={{ fontSize: '0.78rem', color: '#94a3b8' }}>
                      ({formSelectedTags.length} выбрано)
                    </span>
                  </div>

                  <button
                    type="button"
                    className="kb-auto-tag-btn"
                    onClick={handleAutoExtractTags}
                    title="Автоматически распознать теги из текста статьи"
                  >
                    <Sparkles size={14} />
                    {autoTagToast ? 'Теги подобраны!' : 'Авто-подбор тегов из текста'}
                  </button>
                </div>

                {/* Chips Grid of All Available Tags */}
                <div className="kb-tag-chips-select-grid">
                  {allKnownTags.map(tag => {
                    const isSelected = formSelectedTags.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        className={`kb-tag-select-chip ${isSelected ? 'selected' : ''}`}
                        onClick={() => handleToggleTag(tag)}
                      >
                        {isSelected ? <Check size={12} /> : '+'} #{tag}
                      </button>
                    );
                  })}
                </div>

                {/* Add Custom Tag Mini Form */}
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="Добавить свой уникальный тег..."
                    value={newTagInput}
                    onChange={(e) => setNewTagInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddCustomTag(e);
                      }
                    }}
                    style={{ padding: '6px 12px', fontSize: '0.84rem' }}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={handleAddCustomTag}
                    style={{ whiteSpace: 'nowrap' }}
                  >
                    + Добавить тег
                  </button>
                </div>
              </div>

              {/* Pin Checkbox */}
              <div>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', fontSize: '0.9rem', color: '#e2e8f0' }}>
                  <input
                    type="checkbox"
                    checked={formIsPinned}
                    onChange={(e) => setFormIsPinned(e.target.checked)}
                    style={{ width: '18px', height: '18px', accentColor: '#f59e0b', cursor: 'pointer' }}
                  />
                  <span>📌 Закрепить статью вверху списка (как обязательный регламент)</span>
                </label>
              </div>

              {/* Modal Footer */}
              <div className="kb-editor-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setIsEditorOpen(false)}
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingArticle ? 'Сохранить изменения' : 'Создать статью'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PROTECTED SAFE RESET MODAL (REQUIRES TYPING "СБРОС") */}
      {/* ======================================================== */}
      {confirmReset && (
        <div className="kb-modal-overlay" onClick={() => setConfirmReset(false)}>
          <div
            className="kb-dialog-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
              <div style={{ background: 'rgba(239, 68, 68, 0.15)', padding: '10px', borderRadius: '50%', color: '#ef4444' }}>
                <AlertTriangle size={24} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.15rem', color: '#f8fafc', margin: 0 }}>Сбросить базу знаний?</h3>
                <span style={{ fontSize: '0.8rem', color: '#f87171' }}>Защита от случайного нажатия</span>
              </div>
            </div>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '14px', lineHeight: 1.5 }}>
              Эта функция заменит текущие статьи на начальные 12 эталонных регламентов сервиса.
              Все добавленные вами статьи будут удалены.
            </p>

            <div style={{ background: 'rgba(0,0,0,0.3)', padding: '12px 14px', borderRadius: '8px', marginBottom: '16px' }}>
              <label style={{ fontSize: '0.82rem', color: '#cbd5e1', display: 'block', marginBottom: '6px' }}>
                Чтобы подтвердить удаление, напишите слово <strong>СБРОС</strong> большими буквами:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="СБРОС"
                value={resetVerificationWord}
                onChange={(e) => setResetVerificationWord(e.target.value)}
                style={{ textTransform: 'uppercase', fontWeight: 700, letterSpacing: '1px' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setConfirmReset(false);
                  setResetVerificationWord('');
                }}
              >
                Отмена (Ничего не менять)
              </button>
              <button
                className="btn btn-danger"
                onClick={handleResetToDefaults}
                disabled={resetVerificationWord.trim().toUpperCase() !== 'СБРОС'}
                style={{
                  opacity: resetVerificationWord.trim().toUpperCase() === 'СБРОС' ? 1 : 0.4,
                  cursor: resetVerificationWord.trim().toUpperCase() === 'СБРОС' ? 'pointer' : 'not-allowed'
                }}
              >
                Подтвердить сброс
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
