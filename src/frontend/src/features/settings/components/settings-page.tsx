// settings-page.tsx
// Settings page component for Upemba Medical Information System (UMIS)
// Features premium language selection support with immediate state updates.

import React, { useState } from 'react';
import { useTranslation, Language } from '@/features/i18n/store/use-i18n-store';
import { Stethoscope, Globe, Check, AlertCircle, Save } from 'lucide-react';

export function SettingsPage() {
  const { language, setLanguage, t } = useTranslation();
  const [selectedLang, setSelectedLang] = useState<Language>(language);
  const [showSuccess, setShowSuccess] = useState<boolean>(false);

  const handleSave = () => {
    setLanguage(selectedLang);
    setShowSuccess(true);
    setTimeout(() => {
      setShowSuccess(false);
    }, 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* 1. Header Section */}
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">{t('settings.title')}</h1>
        <p className="text-sm text-slate-500 mt-1">{t('settings.subtitle')}</p>
      </div>

      {/* 2. Main Config Card */}
      <div className="bg-white border border-border rounded-xl shadow-sm overflow-hidden">
        {/* Card Title */}
        <div className="px-6 py-5 border-b border-border bg-slate-50/50 flex items-center gap-3">
          <div className="bg-accent/40 p-2 border border-accent rounded-lg text-primary">
            <Globe className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-800">{t('settings.langTitle')}</h2>
            <p className="text-xs text-slate-500">{t('settings.langDesc')}</p>
          </div>
        </div>

        {/* Card Body */}
        <div className="p-6 space-y-6">
          {/* Active selection display */}
          <div className="text-sm font-medium text-slate-600">
            {t('settings.activeLang')}: <span className="font-bold text-slate-800 uppercase bg-slate-100 px-2 py-0.5 rounded text-xs">{selectedLang}</span>
          </div>

          {/* Grid Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* French option */}
            <button
              onClick={() => setSelectedLang('fr')}
              className={`flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition ${
                selectedLang === 'fr'
                  ? 'border-primary bg-primary/5 text-slate-800 ring-2 ring-primary/20 font-semibold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0" aria-hidden="true">FR</span>
                <div>
                  <span className="block text-sm">{t('settings.french')}</span>
                  <span className="block text-[10px] text-slate-400 font-normal">{t('settings.frenchSub')}</span>
                </div>
              </div>
              {selectedLang === 'fr' && (
                <div className="bg-primary text-white p-1 rounded-full shrink-0">
                  <Check className="h-4.5 w-4.5" />
                </div>
              )}
            </button>

            {/* English option */}
            <button
              onClick={() => setSelectedLang('en')}
              className={`flex items-center justify-between p-4 rounded-xl border text-left cursor-pointer transition ${
                selectedLang === 'en'
                  ? 'border-primary bg-primary/5 text-slate-800 ring-2 ring-primary/20 font-semibold'
                  : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600'
              }`}
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl shrink-0" aria-hidden="true">ENG</span>
                <div>
                  <span className="block text-sm">{t('settings.english')}</span>
                  <span className="block text-[10px] text-slate-400 font-normal">{t('settings.englishSub')}</span>
                </div>
              </div>
              {selectedLang === 'en' && (
                <div className="bg-primary text-white p-1 rounded-full shrink-0">
                  <Check className="h-4.5 w-4.5" />
                </div>
              )}
            </button>
          </div>

          {/* Success Banner */}
          {showSuccess && (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-xs rounded-xl flex items-center gap-2.5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="bg-emerald-500 text-white p-1 rounded-full shrink-0">
                <Check className="h-3.5 w-3.5" />
              </div>
              <span className="font-semibold">{t('settings.saved')}</span>
            </div>
          )}
        </div>

        {/* Card Footer Actions */}
        <div className="px-6 py-4 border-t border-border bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span className="text-[10px]">{t('settings.devNotice')}</span>
          </div>

          <button
            onClick={handleSave}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-teal-400 font-semibold text-sm transition shadow-sm cursor-pointer"
          >
            <Save className="h-4 w-4" />
            {t('settings.save')}
          </button>
        </div>
      </div>

      {/* Aesthetic Micro Info Graphic */}
      <div className="bg-gradient-to-r from-teal-500/5 to-cyan-500/5 border border-border p-6 rounded-xl flex items-center gap-4">
        <div className="bg-teal-500/10 border border-teal-500/20 p-2.5 rounded-xl text-teal-600 shrink-0">
          <Stethoscope className="h-6 w-6" />
        </div>
        <div>
          <h3 className="text-xs font-semibold text-slate-700 uppercase tracking-wider">{t('general.parkMedicalDept')}</h3>
          <p className="text-[11px] text-slate-500 mt-1 leading-normal">
            {t('settings.clinicNotice')}
          </p>
        </div>
      </div>
    </div>
  );
}
