/**
 * S-Group Navigation & Interaction Controller
 * Schäfer & SIS Interlogistik
 *
 * Lightweight vanilla script providing accessible toggling for:
 * 1. Mobile navigation drawer
 * 2. User profile dropdown
 * 3. Language preference toggle (DE/EN)
 */

(function () {
  "use strict";

  // Elements
  const mobileToggle = document.getElementById("mobile-menu-toggle");
  const mobileDrawer = document.getElementById("mobile-nav-drawer");
  const userMenuBtn = document.getElementById("user-menu-btn");
  const userDropdown = document.getElementById("user-menu-dropdown");
  const langButtons = document.querySelectorAll(".lang-btn");
  const quickSearchInput = document.getElementById("quick-search-input");

  // 1. Mobile Drawer Toggle
  if (mobileToggle && mobileDrawer) {
    mobileToggle.addEventListener("click", function () {
      const isExpanded = mobileToggle.getAttribute("aria-expanded") === "true";
      mobileToggle.setAttribute("aria-expanded", String(!isExpanded));
      mobileDrawer.hidden = isExpanded;
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
