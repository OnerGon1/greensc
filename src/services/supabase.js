import { createClient } from '@supabase/supabase-js';

const getEnv = () => import.meta.env || {};

export const getSupabaseConfig = () => {
  const env = getEnv();
  // Check localStorage for dynamic config or fallback to Vite env, then to project defaults
  const dynamicUrl = localStorage.getItem('service_supabase_url');
  const dynamicKey = localStorage.getItem('service_supabase_key');
  return {
    url: dynamicUrl || env.VITE_SUPABASE_URL || 'https://fynqkwhyjuzlnlqirczx.supabase.co',
    key: dynamicKey || env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_YfOosMRxjAOAP41igcIc3g_HY2mqNJ-'
  };
};

let supabaseClient = null;

export const initSupabase = (customUrl = null, customKey = null) => {
  const config = getSupabaseConfig();
  const url = customUrl || config.url;
  const key = customKey || config.key;

  if (!url || !key) {
    supabaseClient = null;
    return null;
  }

  try {
    supabaseClient = createClient(url, key, {
      auth: { persistSession: false }
    });
    return supabaseClient;
  } catch (err) {
    console.error('Failed to initialize Supabase client:', err);
    supabaseClient = null;
    return null;
  }
};

export const getSupabase = () => {
  if (!supabaseClient) {
    initSupabase();
  }
  return supabaseClient;
};

export const isSupabaseConnected = () => {
  return getSupabase() !== null;
};

// Map DB row to application article schema
export const mapRowToArticle = (row) => ({
  id: row.id,
  title: row.title || '',
  category: row.category || 'Прочее',
  subcategory: row.subcategory || 'Общее',
  tags: Array.isArray(row.tags) ? row.tags : (typeof row.tags === 'string' ? JSON.parse(row.tags || '[]') : []),
  summary: row.summary || '',
  content: row.content || '',
  quickScript: row.quick_script || '',
  readTime: row.read_time || '2 мин',
  isPinned: Boolean(row.is_pinned),
  updatedAt: row.updated_at || new Date().toISOString().split('T')[0]
});

// Map application article to DB row
export const mapArticleToRow = (a) => ({
  id: a.id,
  title: a.title,
  category: a.category,
  subcategory: a.subcategory,
  tags: a.tags || [],
  summary: a.summary || '',
  content: a.content || '',
  quick_script: a.quickScript || '',
  read_time: a.readTime || '2 мин',
  is_pinned: Boolean(a.isPinned),
  updated_at: a.updatedAt || new Date().toISOString().split('T')[0]
});

// Fetch all articles from Supabase
export const fetchArticlesFromCloud = async () => {
  const client = getSupabase();
  if (!client) return null;

  try {
    const { data, error } = await client
      .from('knowledge_base')
      .select('*')
      .order('is_pinned', { ascending: false })
      .order('updated_at', { ascending: false });

    if (error) {
      console.warn('Supabase fetch error (table might not exist yet):', error.message);
      return null;
    }

    return (data || []).map(mapRowToArticle);
  } catch (err) {
    console.error('Error fetching articles from Supabase:', err);
    return null;
  }
};

// Subscribe to real-time changes
export const subscribeToKnowledgeBaseSupabase = (onArticlesUpdate) => {
  const client = getSupabase();
  if (!client) return () => {};

  try {
    const channel = client
      .channel('public:knowledge_base')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'knowledge_base' },
        async () => {
          // Re-fetch sorted list whenever any change occurs
          const fresh = await fetchArticlesFromCloud();
          if (fresh) onArticlesUpdate(fresh);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  } catch (err) {
    console.error('Failed to subscribe to Supabase realtime:', err);
    return () => {};
  }
};

// Save (create or update) article in cloud
export const saveArticleToCloud = async (article) => {
  const client = getSupabase();
  if (!client) return false;

  try {
    const row = mapArticleToRow(article);
    const { error } = await client
      .from('knowledge_base')
      .upsert(row, { onConflict: 'id' });

    if (error) {
      console.error('Supabase upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error saving article to Supabase:', err);
    return false;
  }
};

// Delete article from cloud
export const deleteArticleFromCloud = async (articleId) => {
  const client = getSupabase();
  if (!client) return false;

  try {
    const { error } = await client
      .from('knowledge_base')
      .delete()
      .eq('id', articleId);

    if (error) {
      console.error('Supabase delete error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error deleting article from Supabase:', err);
    return false;
  }
};

// Seed initial articles into Supabase table
export const seedArticlesToCloud = async (articles) => {
  const client = getSupabase();
  if (!client || !Array.isArray(articles) || articles.length === 0) return false;

  try {
    const rows = articles.map(mapArticleToRow);
    const { error } = await client
      .from('knowledge_base')
      .upsert(rows, { onConflict: 'id' });

    if (error) {
      console.error('Supabase bulk upsert error:', error);
      return false;
    }
    return true;
  } catch (err) {
    console.error('Error seeding articles to Supabase:', err);
    return false;
  }
};
