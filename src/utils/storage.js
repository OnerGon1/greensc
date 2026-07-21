import { DEFAULT_PRICES, DEFAULT_SETTINGS, DEFAULT_HISTORY } from '../data/initialData';

const KEYS = {
  PRICES: 'service_prices_v6', // Bumped key for comments column and Android variants
  SETTINGS: 'service_settings_v6',
  HISTORY: 'service_history_v6',
};

export const getStoredPrices = () => {
  try {
    const data = localStorage.getItem(KEYS.PRICES);
    return data ? JSON.parse(data) : DEFAULT_PRICES;
  } catch (e) {
    console.error('Failed to read prices from storage', e);
    return DEFAULT_PRICES;
  }
};

export const saveStoredPrices = (prices) => {
  try {
    localStorage.setItem(KEYS.PRICES, JSON.stringify(prices));
  } catch (e) {
    console.error('Failed to save prices to storage', e);
  }
};

export const getStoredSettings = () => {
  try {
    const data = localStorage.getItem(KEYS.SETTINGS);
    return data ? JSON.parse(data) : DEFAULT_SETTINGS;
  } catch (e) {
    console.error('Failed to read settings from storage', e);
    return DEFAULT_SETTINGS;
  }
};

export const saveStoredSettings = (settings) => {
  try {
    localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
  } catch (e) {
    console.error('Failed to save settings to storage', e);
  }
};

export const getStoredHistory = () => {
  try {
    const data = localStorage.getItem(KEYS.HISTORY);
    return data ? JSON.parse(data) : DEFAULT_HISTORY;
  } catch (e) {
    console.error('Failed to read history from storage', e);
    return DEFAULT_HISTORY;
  }
};

export const saveStoredHistory = (history) => {
  try {
    localStorage.setItem(KEYS.HISTORY, JSON.stringify(history));
  } catch (e) {
    console.error('Failed to save history to storage', e);
  }
};

export const resetAllToDefaults = () => {
  Object.values(KEYS).forEach((k) => localStorage.removeItem(k));
  ['v1', 'v2', 'v3', 'v4', 'v5'].forEach((v) => {
    localStorage.removeItem(`service_prices_${v}`);
    localStorage.removeItem(`service_settings_${v}`);
    localStorage.removeItem(`service_history_${v}`);
  });
};
