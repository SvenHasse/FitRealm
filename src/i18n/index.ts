// i18n setup — German default, English secondary
// Auto-detects device language; persists user choice via AsyncStorage

import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getLocales } from 'expo-localization';
import de from './de.json';
import en from './en.json';

const LANGUAGE_KEY = 'fitrealmLanguage';

function getDeviceLanguage(): string {
  try {
    const locales = getLocales();
    if (locales.length > 0) {
      const code = locales[0].languageCode;
      if (code === 'en') return 'en';
    }
  } catch {}
  return 'de';
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
  },
  lng: getDeviceLanguage(),
  fallbackLng: 'de',
  interpolation: {
    escapeValue: false,
  },
});

// Load persisted language preference (async — overrides device default once loaded)
AsyncStorage.getItem(LANGUAGE_KEY).then(lang => {
  if (lang === 'en' || lang === 'de') {
    i18n.changeLanguage(lang);
  }
}).catch(() => {});

export async function setLanguage(lang: 'de' | 'en'): Promise<void> {
  await AsyncStorage.setItem(LANGUAGE_KEY, lang);
  i18n.changeLanguage(lang);
}

export default i18n;
