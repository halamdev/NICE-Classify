import React, { createContext, useContext, useState, useCallback } from 'react';

type Language = 'vi' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (vi: string, en: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('nice-lang');
    return (saved === 'en' || saved === 'vi') ? saved : 'vi';
  });

  const handleSetLanguage = useCallback((lang: Language) => {
    setLanguage(lang);
    localStorage.setItem('nice-lang', lang);
  }, []);

  const t = useCallback((vi: string, en: string) => {
    return language === 'vi' ? vi : en;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage: handleSetLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
