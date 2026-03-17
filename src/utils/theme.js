import AsyncStorage from '@react-native-async-storage/async-storage';

export const themes = {
  dark: {
    name: 'Тёмная',
    bg: '#050508',
    surface: '#141418',
    surfaceLight: '#1E1E24',
    purple: '#7C6AEF',
    purpleLight: '#9D8DF7',
    purpleDark: '#5B4BC7',
    text: '#FFFFFF',
    textSecondary: '#8E8E93',
    bubbleOut: '#2D2560',
    bubbleIn: '#1C1C22',
    red: '#FF3B30',
    green: '#34C759',
    glassBg: 'rgba(20,20,24,0.8)',
    glassBorder: 'rgba(255,255,255,0.08)',
    statusBar: 'light',
  },
  light: {
    name: 'Светлая',
    bg: '#F2F2F7',
    surface: '#FFFFFF',
    surfaceLight: '#E8E8ED',
    purple: '#7C6AEF',
    purpleLight: '#9D8DF7',
    purpleDark: '#5B4BC7',
    text: '#000000',
    textSecondary: '#6E6E82',
    bubbleOut: '#7C6AEF',
    bubbleIn: '#E8E8ED',
    red: '#FF3B30',
    green: '#34C759',
    glassBg: 'rgba(255,255,255,0.9)',
    glassBorder: 'rgba(0,0,0,0.08)',
    statusBar: 'dark',
  },
  midnight: {
    name: 'Полночь',
    bg: '#0A0A1A',
    surface: '#12122A',
    surfaceLight: '#1A1A36',
    purple: '#8B7CF6',
    purpleLight: '#A99DF8',
    purpleDark: '#6B5CD6',
    text: '#E8E8F0',
    textSecondary: '#7878A0',
    bubbleOut: '#2D2570',
    bubbleIn: '#18183A',
    red: '#FF4757',
    green: '#2ED573',
    glassBg: 'rgba(10,10,26,0.9)',
    glassBorder: 'rgba(139,124,246,0.1)',
    statusBar: 'light',
  },
  ocean: {
    name: 'Океан',
    bg: '#051520',
    surface: '#0A2030',
    surfaceLight: '#0F2A3D',
    purple: '#00B4D8',
    purpleLight: '#48CAE4',
    purpleDark: '#0096C7',
    text: '#E0F0FF',
    textSecondary: '#7BAAC4',
    bubbleOut: '#0A3D5C',
    bubbleIn: '#0C2535',
    red: '#FF6B6B',
    green: '#51CF66',
    glassBg: 'rgba(5,21,32,0.9)',
    glassBorder: 'rgba(0,180,216,0.1)',
    statusBar: 'light',
  },
  rose: {
    name: 'Роза',
    bg: '#1A0A14',
    surface: '#2A1020',
    surfaceLight: '#36182C',
    purple: '#E84393',
    purpleLight: '#FD79A8',
    purpleDark: '#C03078',
    text: '#FFE0F0',
    textSecondary: '#B07090',
    bubbleOut: '#4A1838',
    bubbleIn: '#2A1020',
    red: '#FF6B6B',
    green: '#55EFC4',
    glassBg: 'rgba(26,10,20,0.9)',
    glassBorder: 'rgba(232,67,147,0.1)',
    statusBar: 'light',
  },
};

let currentTheme = 'dark';
let currentColors = { ...themes.dark };
let themeListeners = [];
let chatBg = null; // custom chat background color

export function getThemeName() { return currentTheme; }
export function getChatBg() { return chatBg || currentColors.bg; }

export function setTheme(name) {
  if (themes[name]) {
    currentTheme = name;
    Object.assign(currentColors, themes[name]);
    AsyncStorage.setItem('pc_theme', name).catch(() => {});
    themeListeners.forEach(fn => fn(name));
  }
}

export function setChatBg(color) {
  chatBg = color;
  AsyncStorage.setItem('pc_chatbg', color || '').catch(() => {});
  themeListeners.forEach(fn => fn(currentTheme));
}

export async function loadThemeFromStorage() {
  try {
    const t = await AsyncStorage.getItem('pc_theme');
    if (t && themes[t]) {
      currentTheme = t;
      Object.assign(currentColors, themes[t]);
    }
    const bg = await AsyncStorage.getItem('pc_chatbg');
    if (bg) chatBg = bg;
  } catch(_) {}
}

export function onThemeChange(fn) {
  themeListeners.push(fn);
  return () => { themeListeners = themeListeners.filter(l => l !== fn); };
}

export const colors = currentColors;
