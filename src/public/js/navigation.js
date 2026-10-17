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
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        const selectedLang = btn.getAttribute("data-lang");
        // Guard: Do not reload if user clicks the currently active language
        if (btn.classList.contains("active")) {
          return;
        }

        // Persist language choice in session cookie and localStorage
        document.cookie = "sgroup_lang=" + selectedLang + "; path=/; max-age=31536000; SameSite=Lax";
        try {
          localStorage.setItem("sgroup_lang", selectedLang);
        } catch (err) {}

        const currentUrl = new URL(window.location.href);
        currentUrl.searchParams.set("lang", selectedLang);
        window.location.href = currentUrl.toString();
      });
    });
  }

  // 4. Preserve Language Across Internal Portal Tabs & Navigation Links
  const activePortalLang = document.documentElement.getAttribute("lang") || "de";
  document.querySelectorAll('a[href^="/portal"]').forEach((link) => {
    try {
      const rawHref = link.getAttribute("href");
      if (rawHref && !rawHref.includes("lang=")) {
        const url = new URL(rawHref, window.location.origin);
        url.searchParams.set("lang", activePortalLang);
        link.setAttribute("href", url.pathname + url.search);
      }
    } catch (e) {}
  });

  // 5. Quick Search Handler
  if (quickSearchInput) {
    quickSearchInput.addEventListener("keydown", function (event) {
      if (event.key === "Enter") {
        const query = quickSearchInput.value.trim();
        if (query) {
          const targetUrl = new URL("/portal/shipments", window.location.origin);
          targetUrl.searchParams.set("q", query);
          targetUrl.searchParams.set("lang", activePortalLang);
          window.location.href = targetUrl.toString();
        }
      }
    });
  }
})();

// ============================================================================
// OPERATIONAL ASSEMBLY LINE CLIENT CONTROLLERS (Tabs 1 - 5)
// ============================================================================

// --- 1. Tab 1 Document Inspector Pan/Zoom Engine ---
let auditScale = 1.0;
let auditPanX = 0;
let auditPanY = 0;
let auditRotation = 0;
let isPanning = false;
let startX = 0;
let startY = 0;

function updateAuditTransform() {
  const img = document.getElementById("audit-preview-img");
  const indicator = document.getElementById("audit-zoom-indicator");
  if (img) {
    img.style.transform = "scale(" + auditScale + ") translate(" + auditPanX + "px, " + auditPanY + "px) rotate(" + auditRotation + "deg)";
  }
  if (indicator) {
    indicator.textContent = Math.round(auditScale * 100) + "%";
  }
}

window.zoomAuditCanvas = function (delta) {
  auditScale = Math.min(4.0, Math.max(0.25, auditScale + delta));
  updateAuditTransform();
};

window.resetAuditZoom = function () {
  auditScale = 1.0;
  auditPanX = 0;
  auditPanY = 0;
  auditRotation = 0;
  updateAuditTransform();
};

window.fitAuditWidth = function () {
  const viewport = document.getElementById("audit-canvas-viewport");
  const img = document.getElementById("audit-preview-img");
  if (viewport && img && img.naturalWidth) {
    const scale = (viewport.clientWidth - 32) / img.naturalWidth;
    auditScale = Math.min(4.0, Math.max(0.2, scale));
    auditPanX = 0;
    auditPanY = 0;
    updateAuditTransform();
  }
};

window.fitAuditPage = function () {
  const viewport = document.getElementById("audit-canvas-viewport");
  const img = document.getElementById("audit-preview-img");
  if (viewport && img && img.naturalHeight) {
    const scale = (viewport.clientHeight - 32) / img.naturalHeight;
    auditScale = Math.min(4.0, Math.max(0.2, scale));
    auditPanX = 0;
    auditPanY = 0;
    updateAuditTransform();
  }
};

window.rotateAuditCanvas = function () {
  auditRotation = (auditRotation + 90) % 360;
  updateAuditTransform();
};

window.handleAuditWheel = function (e) {
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.15 : -0.15;
  window.zoomAuditCanvas(delta);
};

window.startAuditPan = function (e) {
  if (e.button !== 0) return; // Primary click only
  isPanning = true;
  startX = e.clientX - auditPanX;
  startY = e.clientY - auditPanY;

  function onMouseMove(ev) {
    if (!isPanning) return;
    auditPanX = ev.clientX - startX;
    auditPanY = ev.clientY - startY;
    updateAuditTransform();
  }

  function onMouseUp() {
    isPanning = false;
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mouseup", onMouseUp);
  }

  window.addEventListener("mousemove", onMouseMove);
  window.addEventListener("mouseup", onMouseUp);
};

// --- Sample Document Switcher ---
window.loadSampleDoc = function (type) {
  const img = document.getElementById("audit-preview-img");
  const nameLabel = document.getElementById("audit-file-name");
  const sizeLabel = document.getElementById("audit-file-size");
  const containerLabel = document.getElementById("extracted-container-id");

  const sampleMap = {
    bol: {
      file: "sample bill of ladling.png",
      name: "sample bill of ladling.png",
      size: "86 KB",
      containerId: "MSKU7829104",
      grossKg: "24.500 kg"
    },
    invoice: {
      file: "sample commercial invoice.png",
      name: "sample commercial invoice.png",
      size: "246 KB",
      containerId: "MSKU7829104",
      grossKg: "24.500 kg"
    },
    packing_list: {
      file: "sample packing list.png",
      name: "sample packing list.png",
      size: "858 KB",
      containerId: "MSKU7829104",
      grossKg: "24.720 kg"
    },
    origin: {
      file: "sample origin certificate.png",
      name: "sample origin certificate.png",
      size: "289 KB",
      containerId: "MSKU7829104",
      grossKg: "24.500 kg"
    }
  };

  const sample = sampleMap[type] || sampleMap.bol;
  if (img) {
    img.src = "/static/sample_docs/" + sample.file;
  }
  if (nameLabel) nameLabel.textContent = sample.name;
  if (sizeLabel) sizeLabel.textContent = sample.size;
  if (containerLabel) containerLabel.textContent = sample.containerId;
  window.resetAuditZoom();
};

window.handleAuditFileUpload = function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    const img = document.getElementById("audit-preview-img");
    const nameLabel = document.getElementById("audit-file-name");
    const sizeLabel = document.getElementById("audit-file-size");

    if (img) img.src = e.target.result;
    if (nameLabel) nameLabel.textContent = file.name;
    if (sizeLabel) sizeLabel.textContent = Math.round(file.size / 1024) + " KB";
    window.resetAuditZoom();
  };
  reader.readAsDataURL(file);
};

// --- Modals (ADSp Claim & Customs Certificate) ---
window.openAdspModal = function (containerRef) {
  const modal = document.getElementById("modal-adsp-claim");
  const refElem = document.getElementById("adsp-container-ref");
  if (refElem && containerRef) refElem.textContent = containerRef;
  if (modal) modal.classList.remove("hidden");
};

window.closeAdspModal = function () {
  const modal = document.getElementById("modal-adsp-claim");
  if (modal) modal.classList.add("hidden");
};

window.copyAdspClaimText = function () {
  const textElem = document.getElementById("adsp-claim-text");
  if (textElem) {
    navigator.clipboard.writeText(textElem.innerText).then(function () {
      alert("Haftungsanzeige in die Zwischenablage kopiert.");
    });
  }
};

window.openCustomsCertModal = function (shipmentId) {
  const modal = document.getElementById("modal-customs-cert");
  if (modal) modal.classList.remove("hidden");
};

window.closeCustomsCertModal = function () {
  const modal = document.getElementById("modal-customs-cert");
  if (modal) modal.classList.add("hidden");
};

window.copyCertText = function () {
  const paper = document.getElementById("customs-cert-paper");
  if (paper) {
    navigator.clipboard.writeText(paper.innerText).then(function () {
      alert("Zertifikatstext in die Zwischenablage kopiert.");
    });
  }
};

window.openSupervisorOverrideModal = function (shipmentId) {
  const reason = prompt("Supervisor-Freigabe für " + shipmentId + " bestätigen.\nBitte Revisionsgrund eingeben (Pflichtfeld nach GoBD):");
  if (reason && reason.trim()) {
    alert("Sendung " + shipmentId + " wurde vom Supervisor freigegeben.\nAudit-Vermerk gespeichert: " + reason.trim());
  }
};

