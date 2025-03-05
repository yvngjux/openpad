interface LanguageSelectProps {
  languages: string[];
  selectedLanguage: string;
  onLanguageChange: (language: string) => void;
}

export function LanguageSelect({
  languages,
  selectedLanguage,
  onLanguageChange
}: LanguageSelectProps) {
  return (
    <div className="flex items-center space-x-2">
      <label htmlFor="language-select" className="text-sm font-medium text-gray-700">Language:</label>
      <select
        id="language-select"
        value={selectedLanguage}
        onChange={(e) => onLanguageChange(e.target.value)}
        className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      >
        {languages.map((lang) => (
          <option key={lang} value={lang}>
            {lang.charAt(0).toUpperCase() + lang.slice(1)}
          </option>
        ))}
      </select>
    </div>
  );
} 