/**
 * Chạy trước khi React hydrate để tránh nháy màn hình khi load dark mode.
 * Đọc theme từ localStorage và gắn class "dark" lên <html> ngay lập tức.
 */
export function ThemeScript() {
  const script = `
(function() {
  var key = 'work-management-theme';
  var stored = localStorage.getItem(key);
  var isDark = stored === 'dark' || (!stored && window.matchMedia('(prefers-color-scheme: dark)').matches);
  if (isDark) document.documentElement.classList.add('dark');
  else document.documentElement.classList.remove('dark');
})();
  `.trim();
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
