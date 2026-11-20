(function () {
  try {
    // 1. Check if user manually selected a theme during this active browser session
    var sessionTheme = sessionStorage.getItem('vitra_theme');
    var theme;

    if (sessionTheme === 'dark' || sessionTheme === 'light') {
      theme = sessionTheme;
    } else {
      // 2. Open in light or dark mode depending on the local time of day:
      // Daytime (6:00 AM to 5:59 PM): Light Mode (Moon Sand)
      // Evening/Night (6:00 PM to 5:59 AM): Dark Mode (Obsidian)
      var hour = new Date().getHours();
      theme = (hour >= 6 && hour < 18) ? 'light' : 'dark';
    }

    var root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.setAttribute('data-theme', 'dark');
    } else {
      root.classList.remove('dark');
      root.setAttribute('data-theme', 'light');
    }
  } catch (e) {}
})();
