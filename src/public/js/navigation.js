/**
 * S-Group Navigation & Interaction Controller
 * Schäfer & SIS Interlogistik
 *
 * Lightweight vanilla script providing accessible toggling for:
 * 1. User profile dropdown
 * 2. Language preference toggle (DE/EN)
 * 3. Quick search box
 */

(function () {
  "use strict";

  // Elements
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userDropdown = document.getElementById("user-menu-dropdown");
  const langButtons = document.querySelectorAll(".lang-btn");
  const quickSearchInput = document.getElementById("quick-search-input");
  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const dropdownThemeToggle = document.getElementById("dropdown-theme-toggle");
  const themeToggleIcon = document.getElementById("theme-toggle-icon");
  const themeToggleText = document.getElementById("theme-toggle-text");
  const dropdownThemeIcon = document.getElementById("dropdown-theme-icon");
  const dropdownThemeText = document.getElementById("dropdown-theme-text");

  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";

  // 1. Theme Controller (Dark / Light Mode)
  function getPreferredTheme() {
    const stored = localStorage.getItem("sgroup_theme");
    if (stored === "dark" || stored === "light") {
      return stored;
    }
    return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme, save = true) {
    const isDark = theme === "dark";
    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("theme-dark", isDark);
    if (document.body) {
      document.body.classList.toggle("theme-dark", isDark);
    }

    if (save) {
      try {
        localStorage.setItem("sgroup_theme", theme);
      } catch (e) {}
    }

    // Update Header Toggle Button
    if (themeToggleIcon) {
      themeToggleIcon.textContent = isDark ? "☀️" : "🌙";
    }
    if (themeToggleText) {
      themeToggleText.textContent = isDark ? (isDe ? "Hell" : "Light") : (isDe ? "Dunkel" : "Dark");
    }
    if (themeToggleBtn) {
      const tooltip = isDark
        ? (isDe ? "Zu hellem Modus wechseln" : "Switch to Light Mode")
        : (isDe ? "Zu dunklem Modus wechseln" : "Switch to Dark Mode");
      themeToggleBtn.setAttribute("title", tooltip);
      themeToggleBtn.setAttribute("aria-label", tooltip);
      themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    }

    // Update Dropdown Item
    if (dropdownThemeIcon) {
      dropdownThemeIcon.textContent = isDark ? "☀️" : "🌙";
    }
    if (dropdownThemeText) {
      dropdownThemeText.textContent = isDark
        ? (isDe ? "Hellen Modus aktivieren" : "Switch to Light Mode")
        : (isDe ? "Dunkelmodus aktivieren" : "Switch to Dark Mode");
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "light";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  }

  // Initialize theme UI state
  applyTheme(getPreferredTheme(), false);

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  if (dropdownThemeToggle) {
    dropdownThemeToggle.addEventListener("click", function (e) {
      e.preventDefault();
      toggleTheme();
    });
  }

  // Listen for OS theme changes if user hasn't explicitly set preference
  if (window.matchMedia) {
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
      if (!localStorage.getItem("sgroup_theme")) {
        applyTheme(e.matches ? "dark" : "light", false);
      }
    });
  }

  // 2. User Menu Dropdown Toggle
  if (userMenuBtn && userDropdown) {
    userMenuBtn.addEventListener("click", function (event) {
      event.stopPropagation();
      const isExpanded = userMenuBtn.getAttribute("aria-expanded") === "true";
      userMenuBtn.setAttribute("aria-expanded", String(!isExpanded));
      userDropdown.hidden = isExpanded;
    });

    // Close dropdown on outside click
    document.addEventListener("click", function (event) {
      if (!userDropdown.hidden && !userMenuBtn.contains(event.target) && !userDropdown.contains(event.target)) {
        userMenuBtn.setAttribute("aria-expanded", "false");
        userDropdown.hidden = true;
      }
    });

    // Close dropdown on Escape key
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && !userDropdown.hidden) {
        userMenuBtn.setAttribute("aria-expanded", "false");
        userDropdown.hidden = true;
        userMenuBtn.focus();
      }
    });
  }

  // 3. Language Preference Toggle (DE/EN)
  if (langButtons.length > 0) {
    langButtons.forEach((btn) => {
      btn.addEventListener("click", function () {
        const lang = btn.getAttribute("data-lang");
        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("lang", lang);
        window.location.href = currentUrl.toString();
      });
    });
  }

  // 4. Quick Search Handler
  if (quickSearchInput) {
    quickSearchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const query = quickSearchInput.value.trim();
        if (query) {
          const targetUrl = new URL("/portal/shipments", window.location.origin);
          targetUrl.searchParams.set("q", query);
          window.location.href = targetUrl.toString();
        }
      }
    });
  }
})();
