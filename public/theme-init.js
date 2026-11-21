(function () {
  try {
    // 1. Check if user manually selected a theme during this active browser session
    var sessionTheme = sessionStorage.getItem('vitra_theme');
    var theme;

    if (sessionTheme === 'dark' || sessionTheme === 'light') {
      theme = sessionTheme;
    } else {
      // 2. Open in light or dark mode depending on the local time of day:
      // Daytime (6:59 AM to 5:59 PM): Light Mode (Moon Sand)
      // Evening/Nighttime (6:00 PM to 7:00 AM): 75% Obsidian Black Dark Mode
      var now = new Date();
      var minutes = now.getHours() * 60 + now.getMinutes();
      // 6:59 AM = 6 * 60 + 59 = 419 minutes
      // 5:59 PM (17:59) = 17 * 60 + 59 = 1079 minutes; 6:00 PM (18:00) = 1080 minutes
      theme = (minutes >= 419 && minutes < 1080) ? 'light' : 'dark';
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
