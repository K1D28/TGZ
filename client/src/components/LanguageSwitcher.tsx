import { useTranslation } from 'react-i18next';

export function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const change = (lng: string) => {
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') localStorage.setItem('appLang', lng);
  };

  return (
    <select
      value={i18n.language}
      onChange={(e) => change(e.target.value)}
      aria-label="Language"
      className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm"
    >
      <option value="my">မြန်မာ</option>
      <option value="en">English</option>
    </select>
  );
}
