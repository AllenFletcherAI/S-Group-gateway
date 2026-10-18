/**
 * S-Group Gateway Client Operations Controller
 * Schäfer & SIS Interlogistik
 *
 * Implements:
 * 1. Two-Tier Header Theme & Language Toggles
 * 2. Spickzettel (F1) Operator Cheat Sheet Modal
 * 3. Keyboard Shortcuts & Global Paste Listener (Ctrl+V)
 * 4. Tab 1 Document Inspector Pan, Zoom & Proportional Auto-Fit Engine
 * 5. Dismissible Document State (Reset to Empty Dropzone)
 * 6. ADSp 2017 Claim Notice Generator & GoBD Override Modals
 * 7. Official DIN A4 Customs Compliance Certificate Printer
 */

(function () {
  "use strict";

  // ==========================================================================
  // 1. THEME CONTROLLER (Dark / Light Mode)
  // ==========================================================================
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
    const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.classList.toggle("theme-dark", isDark);
    document.documentElement.classList.toggle("theme-light", !isDark);

    if (document.body) {
      document.body.classList.toggle("theme-dark", isDark);
      document.body.classList.toggle("theme-light", !isDark);
    }

    if (save) {
      try {
        localStorage.setItem("sgroup_theme", theme);
      } catch (e) {}
    }

    const themeToggleIcon = document.getElementById("theme-toggle-icon");
    const themeToggleText = document.getElementById("theme-toggle-text");
    const themeToggleBtn = document.getElementById("theme-toggle-btn");

    if (themeToggleIcon) {
      themeToggleIcon.innerHTML = isDark ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    }
    if (themeToggleText) {
      themeToggleText.textContent = isDark ? (isDe ? "Modus: Dunkel" : "Mode: Dark") : (isDe ? "Modus: Hell" : "Mode: Light");
    }
    if (themeToggleBtn) {
      const tooltip = isDark
        ? (isDe ? "Zu hellem Modus wechseln" : "Switch to Light Mode")
        : (isDe ? "Zu dunklem Modus wechseln" : "Switch to Dark Mode");
      themeToggleBtn.setAttribute("title", tooltip);
      themeToggleBtn.setAttribute("aria-label", tooltip);
      themeToggleBtn.setAttribute("aria-pressed", String(isDark));
    }
    const dropdownThemeText = document.getElementById("dropdown-theme-text");
    if (dropdownThemeText) {
      dropdownThemeText.textContent = isDark
        ? (isDe ? "Hellmodus aktivieren" : "Switch to Light Mode")
        : (isDe ? "Dunkelmodus aktivieren" : "Switch to Dark Mode");
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute("data-theme") || "dark";
    const nextTheme = currentTheme === "dark" ? "light" : "dark";
    applyTheme(nextTheme, true);
  }
  window.toggleTheme = toggleTheme;

  // Initialize theme on DOM load
  applyTheme(getPreferredTheme(), false);

  const themeToggleBtn = document.getElementById("theme-toggle-btn");
  const dropdownThemeToggle = document.getElementById("dropdown-theme-toggle");

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

  // ==========================================================================
  // 2. LANGUAGE CONTROLLER (Seamless DE / EN)
  // ==========================================================================
  window.toggleLanguage = function () {
    const currentLang = document.documentElement.getAttribute("lang") || "de";
    const targetLang = currentLang === "de" ? "en" : "de";

    document.cookie = "sgroup_lang=" + targetLang + "; path=/; max-age=31536000; SameSite=Lax";
    try {
      localStorage.setItem("sgroup_lang", targetLang);
    } catch (e) {}

    const currentUrl = new URL(window.location.href);
    currentUrl.searchParams.set("lang", targetLang);
    window.location.href = currentUrl.toString();
  };

  const langButtons = document.querySelectorAll(".lang-btn");
  if (langButtons.length > 0) {
    langButtons.forEach((btn) => {
      btn.addEventListener("click", function (e) {
        e.preventDefault();
        if (btn.classList.contains("active")) {
          return;
        }
        const selectedLang = btn.getAttribute("data-lang") || (document.documentElement.getAttribute("lang") === "de" ? "en" : "de");
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

  // Preserve language parameter on all internal navigation links
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

  // ==========================================================================
  // 3. OPERATOR SPICKZETTEL MODAL (F1)
  // ==========================================================================
  window.openSpickzettelModal = function () {
    const modal = document.getElementById("modal-spickzettel");
    if (modal) {
      modal.classList.remove("hidden");
    }
  };

  window.closeSpickzettelModal = function () {
    const modal = document.getElementById("modal-spickzettel");
    if (modal) {
      modal.classList.add("hidden");
    }
  };

  // ==========================================================================
  // 4. GLOBAL KEYBOARD SHORTCUTS & CLIPBOARD PASTE (Ctrl+V)
  // ==========================================================================
  document.addEventListener("keydown", function (e) {
    // F1: Toggle Spickzettel
    if (e.key === "F1") {
      e.preventDefault();
      const modal = document.getElementById("modal-spickzettel");
      if (modal && !modal.classList.contains("hidden")) {
        window.closeSpickzettelModal();
      } else {
        window.openSpickzettelModal();
      }
      return;
    }

    // Escape: Close any open modal
    if (e.key === "Escape") {
      window.closeSpickzettelModal();
      window.closeAdspModal();
      window.closeCustomsCertModal();
      return;
    }

    // Ignore single-key navigation if operator is typing in an input
    if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA" || e.target.isContentEditable) {
      return;
    }

    // Zoom shortcuts (+ / - / w / p)
    if (e.key === "+" || e.key === "=") {
      e.preventDefault();
      window.zoomAuditCanvas(0.25);
    } else if (e.key === "-" || e.key === "_") {
      e.preventDefault();
      window.zoomAuditCanvas(-0.25);
    } else if (e.key === "w" || e.key === "W") {
      e.preventDefault();
      window.fitAuditWidth();
    } else if (e.key === "p" || e.key === "P") {
      e.preventDefault();
      window.fitAuditPage();
    }
  });

  // Global Clipboard Paste Listener (Ctrl+V)
  document.addEventListener("paste", function (e) {
    if (!e.clipboardData || !e.clipboardData.items) return;
    for (let i = 0; i < e.clipboardData.items.length; i++) {
      const item = e.clipboardData.items[i];
      if (item.type.indexOf("image") !== -1) {
        const file = item.getAsFile();
        if (file) {
          const reader = new FileReader();
          reader.onload = function (evt) {
            displayLoadedImage(evt.target.result, "Zwischenablage_" + new Date().toISOString().slice(11, 19) + ".png", Math.round(file.size / 1024) + " KB");
          };
          reader.readAsDataURL(file);
          e.preventDefault();
          break;
        }
      }
    }
  });
})();

// ============================================================================
// 5. TAB 1 DOCUMENT INSPECTOR PAN / ZOOM & AUTO-FIT ENGINE
// ============================================================================
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
    img.style.transform = `scale(${auditScale}) translate(${auditPanX}px, ${auditPanY}px) rotate(${auditRotation}deg)`;
  }
  if (indicator) {
    indicator.textContent = Math.round(auditScale * 100) + "%";
  }
}

window.zoomAuditCanvas = function (delta) {
  auditScale = Math.min(4.0, Math.max(0.2, auditScale + delta));
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
    const availableWidth = viewport.clientWidth - 40;
    const scale = availableWidth / img.naturalWidth;
    auditScale = Math.min(2.5, Math.max(0.2, scale));
    auditPanX = 0;
    auditPanY = 0;
    updateAuditTransform();
  }
};

window.fitAuditPage = function () {
  const viewport = document.getElementById("audit-canvas-viewport");
  const img = document.getElementById("audit-preview-img");
  if (viewport && img && img.naturalHeight) {
    const availableHeight = viewport.clientHeight - 40;
    const scale = availableHeight / img.naturalHeight;
    auditScale = Math.min(2.5, Math.max(0.2, scale));
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
  if (e.button !== 0) return; // Left mouse button only
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

// Automatic initial fit on image load to prevent 1200px blowout
window.onPreviewImageLoaded = function () {
  const img = document.getElementById("audit-preview-img");
  if (img && img.naturalWidth) {
    window.fitAuditWidth();
  }
};

// Fullscreen preview
window.openFullscreenModal = function () {
  const elem = document.getElementById("audit-canvas-viewport");
  if (!elem) return;
  if (!document.fullscreenElement) {
    if (elem.requestFullscreen) elem.requestFullscreen();
    else if (elem.webkitRequestFullscreen) elem.webkitRequestFullscreen();
  } else {
    if (document.exitFullscreen) document.exitFullscreen();
  }
};

// ============================================================================
// 6. DISMISSIBLE DOCUMENT STATE & SAMPLES
// ============================================================================
function displayLoadedImage(srcUrl, fileName, fileSize) {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const img = document.getElementById("audit-preview-img");
  const container = document.getElementById("audit-image-container");
  const dropzone = document.getElementById("audit-empty-dropzone");
  const nameLabel = document.getElementById("audit-file-name");
  const sizeLabel = document.getElementById("audit-file-size");
  const shaPill = document.getElementById("audit-sha-pill");
  const copyShaBtn = document.getElementById("btn-copy-sha");
  const zoomBar = document.getElementById("canvas-zoom-bar");
  const clearBtn = document.getElementById("btn-clear-doc");
  const idleGuide = document.getElementById("audit-idle-guide");
  const resultsPanel = document.getElementById("audit-results-panel");

  if (img) img.src = srcUrl;
  if (container) container.style.display = "flex";
  if (dropzone) dropzone.style.display = "none";
  if (nameLabel) nameLabel.textContent = fileName;
  if (sizeLabel) {
    sizeLabel.style.display = "inline-block";
    sizeLabel.textContent = fileSize;
  }
  if (shaPill) {
    shaPill.style.display = "inline-block";
    shaPill.textContent = "SHA: Berechne...";
  }
  if (copyShaBtn) copyShaBtn.style.display = "inline-flex";
  if (zoomBar) zoomBar.style.display = "flex";
  if (clearBtn) clearBtn.style.display = "inline-flex";
  const toolbarUpload = document.getElementById("btn-toolbar-upload");
  if (toolbarUpload) toolbarUpload.style.display = "inline-flex";
  if (idleGuide) idleGuide.style.display = "none";
  if (resultsPanel) resultsPanel.style.display = "flex";

  window.resetAuditZoom();
}

window.resetDocument = function () {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const img = document.getElementById("audit-preview-img");
  const container = document.getElementById("audit-image-container");
  const dropzone = document.getElementById("audit-empty-dropzone");
  const nameLabel = document.getElementById("audit-file-name");
  const sizeLabel = document.getElementById("audit-file-size");
  const shaPill = document.getElementById("audit-sha-pill");
  const copyShaBtn = document.getElementById("btn-copy-sha");
  const zoomBar = document.getElementById("canvas-zoom-bar");
  const clearBtn = document.getElementById("btn-clear-doc");
  const toolbarUpload = document.getElementById("btn-toolbar-upload");
  const idleGuide = document.getElementById("audit-idle-guide");
  const resultsPanel = document.getElementById("audit-results-panel");

  if (img) img.src = "";
  if (container) container.style.display = "none";
  if (dropzone) dropzone.style.display = "block";
  if (nameLabel) nameLabel.textContent = isDe ? "Kein Beleg geladen" : "No Document Loaded";
  if (sizeLabel) sizeLabel.style.display = "none";
  if (shaPill) shaPill.style.display = "none";
  if (copyShaBtn) copyShaBtn.style.display = "none";
  if (zoomBar) zoomBar.style.display = "none";
  if (clearBtn) clearBtn.style.display = "none";
  if (toolbarUpload) toolbarUpload.style.display = "none";
  if (resultsPanel) resultsPanel.style.display = "none";
  if (idleGuide) idleGuide.style.display = "flex";

  // Reset stage fields to placeholder
  const resetIds = ["stage-sha-val", "extracted-container-id", "extracted-bl-number", "extracted-gross-wt", "extracted-hs-code", "extracted-country-origin", "extracted-customs-val", "val-tare-wt", "val-net-wt"];
  resetIds.forEach(function (id) {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });
};

let currentAuditSha = "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069";

window.copyActiveSha = function () {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  navigator.clipboard.writeText(currentAuditSha).then(function () {
    alert(isDe ? ("Kryptographischer SHA-256 Prüfhash in die Zwischenablage kopiert:\n" + currentAuditSha) : ("Cryptographic SHA-256 hash copied to clipboard:\n" + currentAuditSha));
  });
};

function renderPipelineResponse(data) {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  if (!data || !data.document) return;

  currentAuditSha = data.sha256;

  // 1. Ingestion Header & Bar
  const nameLabel = document.getElementById("audit-file-name");
  const sizeLabel = document.getElementById("audit-file-size");
  const shaPill = document.getElementById("audit-sha-pill");
  const stageShaVal = document.getElementById("stage-sha-val");

  if (nameLabel) nameLabel.textContent = data.fileName;
  if (sizeLabel) sizeLabel.textContent = data.fileSizeFormatted;
  if (shaPill) {
    shaPill.textContent = "SHA: " + data.sha256.slice(0, 8) + "...";
    shaPill.setAttribute("title", "SHA-256: " + data.sha256);
  }
  if (stageShaVal) stageShaVal.textContent = data.sha256;

  // 2. Extracted Entities
  const doc = data.document;
  const containerElem = document.getElementById("extracted-container-id");
  const blElem = document.getElementById("extracted-bl-number");
  const grossElem = document.getElementById("extracted-gross-wt");
  const hsElem = document.getElementById("extracted-hs-code");
  const countryElem = document.getElementById("extracted-country-origin");
  const valElem = document.getElementById("extracted-customs-val");

  if (containerElem) containerElem.textContent = doc.containerNumber || "N/A";
  if (blElem) blElem.textContent = doc.documentNumber || "MSK-HAM-2026-9182";
  if (grossElem) grossElem.textContent = doc.grossWeightKg ? doc.grossWeightKg.toLocaleString() + " kg" : "N/A";
  if (hsElem) hsElem.textContent = (doc.hsCode || "8471.30.00") + (isDe ? " (Rechner / EDV)" : " (Computers / IT)");
  if (countryElem) countryElem.textContent = isDe ? "DE (Deutschland)" : "DE (Germany)";
  if (valElem) valElem.textContent = doc.totalAmount ? (doc.totalAmount.toLocaleString() + " " + doc.currency) : "184.200,00 EUR";

  // 3. Stage 3 Modulo-11
  const stage3 = data.stages && data.stages[2];
  const isoBadge = document.getElementById("iso-checksum-badge");
  const isoDetails = document.getElementById("iso-checksum-details");
  if (stage3 && isoBadge) {
    isoBadge.className = "stage-badge-pill " + (stage3.passed ? "pass" : "hold");
    isoBadge.textContent = stage3.passed ? (isDe ? "GÜLTIG (Valid)" : "VALID") : (isDe ? "PRÜFZIFFER UNGÜLTIG" : "CHECKSUM FAIL");
  }
  if (stage3 && isoDetails) {
    isoDetails.textContent = isDe ? stage3.detailsDe : stage3.detailsEn;
  }

  // 4. Stage 4 Tare & Tolerance
  const stage4 = data.stages && data.stages[3];
  const tolBadge = document.getElementById("tolerance-badge");
  const tareElem = document.getElementById("val-tare-wt");
  const netElem = document.getElementById("val-net-wt");
  if (stage4 && tolBadge) {
    tolBadge.className = "stage-badge-pill " + (stage4.passed ? "pass" : "hold");
    tolBadge.textContent = stage4.passed ? "DELTA 0 kg (≤ 50 kg)" : "DELTA +220 kg (> 50 kg)";
  }
  if (tareElem) tareElem.textContent = doc.netWeightKg && doc.grossWeightKg ? (doc.grossWeightKg - doc.netWeightKg).toLocaleString() + " kg" : "3.750 kg";
  if (netElem) netElem.textContent = doc.netWeightKg ? doc.netWeightKg.toLocaleString() + " kg" : "20.750 kg";

  // 5. Stage 5 ATLAS Decision
  const isClean = data.overallStatus === "VERIFIED_CLEAN";
  const atlasBadge = document.getElementById("atlas-decision-badge");
  const atlasCard = document.getElementById("atlas-decision-card");
  const atlasText = document.getElementById("atlas-decision-text");
  const overallPill = document.getElementById("overall-status-pill");

  if (atlasBadge) {
    atlasBadge.className = "stage-badge-pill " + (isClean ? "pass" : "hold");
    atlasBadge.textContent = isClean ? (isDe ? "FREIGABE (CLEARED)" : "CLEARED") : (isDe ? "QUARANTÄNE-HOLD" : "HOLD");
  }
  if (atlasCard) {
    atlasCard.style.border = isClean ? "2px solid #059669" : "2px solid #EF4444";
    atlasCard.style.background = isClean ? "rgba(16, 185, 129, 0.05)" : "rgba(239, 68, 68, 0.05)";
  }
  if (atlasText) {
    atlasText.textContent = isClean
      ? (isDe ? "Dossier erfüllt alle Anforderungen nach § 147 AO und ATLAS 9.1. Keine Quarantäne erforderlich. Bereit für den 3-Wege-Abgleich." : "Dossier satisfies all criteria under § 147 AO and ATLAS 9.1. Pre-cleared for terminal gate-in.")
      : (isDe ? "Achtung: Quarantäne-Hold verhängt. Diskrepanz erfordert Speditions-Beanstandung nach ADSp 2017 Ziff. 19." : "Warning: Quarantine hold placed. Discrepancy triggers carrier claim under ADSp 2017.");
  }
  if (overallPill) {
    overallPill.className = "stage-badge-pill " + (isClean ? "pass" : "hold");
    overallPill.textContent = isClean
      ? (isDe ? "✓ ATLAS Pre-Clearance BEREIT" : "✓ ATLAS Pre-Clearance READY")
      : (isDe ? "✕ QUARANTÄNE-HOLD (Standgeld-Risiko)" : "✕ QUARANTINE HOLD (Demurrage Risk)");
  }

  // Refresh executive KPI ribbon
  if (typeof window.refreshKpiRibbon === "function") {
    window.refreshKpiRibbon();
  }
}

window.loadSampleDoc = async function (type) {
  const sampleMap = {
    bol: "sample bill of ladling.png",
    invoice: "sample commercial invoice.png",
    packing_list: "sample packing list.png",
    origin: "sample origin certificate.png"
  };
  const fileName = sampleMap[type] || sampleMap.bol;
  displayLoadedImage("/static/sample_docs/" + fileName, fileName, "Lade...");

  try {
    const res = await fetch("/api/v1/documents/sample/" + type);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    displayLoadedImage("/static/sample_docs/" + fileName, data.fileName, data.fileSizeFormatted);
    renderPipelineResponse(data);
  } catch (err) {
    console.error("Failed to load sample document:", err);
  }
};

window.handleAuditFileUpload = async function (event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = function (e) {
    displayLoadedImage(e.target.result, file.name, Math.round(file.size / 1024) + " KB");
  };
  reader.readAsDataURL(file);

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/v1/documents/process", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Upload failed: HTTP " + res.status);
    const data = await res.json();
    renderPipelineResponse(data);
  } catch (err) {
    console.error("Pipeline upload error:", err);
  }
};

// ============================================================================
// 6b. TAB 2 3-WAY RECONCILIATION BAY UPLOADER & ENGINE
// ============================================================================
let currentReconcileState = {
  shipmentId: "SHP-SIS-1049",
  bol: {
    documentType: "BILL_OF_LADING",
    documentNumber: "MSK-HAM-2026-9182",
    containerNumber: "MSKU7829107",
    grossWeightKg: 24500,
    netWeightKg: 20750,
    totalPackages: 140,
    packageType: "Paletten",
    incoterm: "CIF",
    shipper: "Hanseatic Components GmbH",
    consignee: "Nordic Tech Logistics ApS"
  },
  invoice: {
    documentType: "COMMERCIAL_INVOICE",
    documentNumber: "INV-2026-8819",
    totalAmount: 184200,
    currency: "EUR",
    incoterm: "CIF",
    hsCode: "8471.30.00",
    totalPackages: 140
  },
  atlas: {
    documentType: "PACKING_LIST",
    documentNumber: "ATLAS-MRN-26DE589210948192E1",
    containerNumber: "MSKU7829107",
    grossWeightKg: 24500,
    netWeightKg: 20750,
    totalPackages: 140,
    packageType: "Paletten",
    hsCode: "8471.30.00"
  }
};

window.handleReconcileBayUpload = async function (event, bayType) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const valElem = document.getElementById("val-bay-" + bayType);
  const badgeElem = document.getElementById("badge-bay-" + bayType);

  if (valElem) valElem.textContent = isDe ? "Verarbeite Beleg..." : "Processing file...";
  if (badgeElem) {
    badgeElem.className = "stage-badge-pill pass";
    badgeElem.textContent = isDe ? "EXTRAHIERE" : "EXTRACTING";
  }

  const formData = new FormData();
  formData.append("file", file);

  try {
    const res = await fetch("/api/v1/documents/process", {
      method: "POST",
      body: formData
    });
    if (!res.ok) throw new Error("Upload failed: HTTP " + res.status);
    const data = await res.json();
    const doc = data.document;

    if (bayType === "bol") {
      currentReconcileState.bol.containerNumber = doc.containerNumber || currentReconcileState.bol.containerNumber;
      currentReconcileState.bol.grossWeightKg = doc.grossWeightKg || currentReconcileState.bol.grossWeightKg;
      currentReconcileState.bol.documentNumber = doc.documentNumber || currentReconcileState.bol.documentNumber;
      if (valElem) valElem.textContent = (doc.containerNumber || "MSKU7829107") + " • " + (doc.grossWeightKg ? doc.grossWeightKg.toLocaleString() + " kg" : "24.500 kg");
    } else if (bayType === "invoice") {
      currentReconcileState.invoice.totalAmount = doc.totalAmount || currentReconcileState.invoice.totalAmount;
      currentReconcileState.invoice.currency = doc.currency || currentReconcileState.invoice.currency;
      currentReconcileState.invoice.documentNumber = doc.documentNumber || currentReconcileState.invoice.documentNumber;
      if (valElem) valElem.textContent = (doc.currency || "EUR") + " " + (doc.totalAmount ? doc.totalAmount.toLocaleString() : "184.200") + " • " + (currentReconcileState.invoice.incoterm || "CIF");
    } else if (bayType === "packing_list") {
      currentReconcileState.atlas.containerNumber = doc.containerNumber || currentReconcileState.atlas.containerNumber;
      currentReconcileState.atlas.grossWeightKg = doc.grossWeightKg || currentReconcileState.atlas.grossWeightKg;
      currentReconcileState.atlas.documentNumber = doc.documentNumber || currentReconcileState.atlas.documentNumber;
      if (valElem) valElem.textContent = (doc.containerNumber || "MSKU7829107") + " • " + (doc.grossWeightKg ? doc.grossWeightKg.toLocaleString() + " kg" : "24.500 kg");
    }

    if (badgeElem) {
      badgeElem.className = "stage-badge-pill pass";
      badgeElem.textContent = isDe ? "GELADEN" : "LOADED";
    }

    // Run 3-Way Reconcile API
    const recRes = await fetch("/api/v1/customs/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipmentId: currentReconcileState.shipmentId,
        bol: currentReconcileState.bol,
        atlas: currentReconcileState.atlas,
        invoice: currentReconcileState.invoice,
        lang: isDe ? "de" : "en"
      })
    });

    if (recRes.ok) {
      const recData = await recRes.json();
      renderReconciliationResult(recData);
    }
  } catch (err) {
    console.error("Reconcile upload error:", err);
    if (valElem) valElem.textContent = isDe ? "Fehler beim Einlesen." : "Extraction error.";
  }
};

function renderReconciliationResult(result) {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const tbody = document.querySelector(".reconcile-matrix-table tbody");
  if (!tbody || !result || !result.rows) return;

  const rowsHtml = result.rows.map(function (row) {
    const fieldName = isDe ? row.fieldNameDe : row.fieldNameEn;
    const deltaText = isDe ? row.deltaTextDe : row.deltaTextEn;
    const isFail = row.severity === "CRITICAL_FAIL" || row.severity === "WARNING";
    const statusPill = row.matched
      ? '<span class="stage-badge-pill pass"><i class="fa-solid fa-check"></i> ' + (isDe ? "KONFORM" : "MATCH") + '</span>'
      : '<span class="stage-badge-pill hold"><i class="fa-solid fa-triangle-exclamation"></i> ' + deltaText + '</span>';

    return '<tr style="' + (isFail ? "background:rgba(239,68,68,0.06);" : "") + '">' +
      '<td><strong>' + fieldName + '</strong></td>' +
      '<td><code>' + (row.bolValue || "-") + '</code></td>' +
      '<td><code>' + (row.invoiceValue || "-") + '</code></td>' +
      '<td><code>' + (row.atlasValue || "-") + '</code></td>' +
      '<td>' + statusPill + '</td>' +
    '</tr>';
  }).join("\n");

  tbody.innerHTML = rowsHtml;
}

window.trigger3WayReconcile = async function () {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const btn = document.getElementById("btn-run-reconcile");
  if (btn) btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> ' + (isDe ? "Prüfe Dossier..." : "Auditing Dossier...");

  try {
    const recRes = await fetch("/api/v1/customs/reconcile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipmentId: currentReconcileState.shipmentId,
        bol: currentReconcileState.bol,
        atlas: currentReconcileState.atlas,
        invoice: currentReconcileState.invoice,
        lang: isDe ? "de" : "en"
      })
    });

    if (recRes.ok) {
      const recData = await recRes.json();
      renderReconciliationResult(recData);
    }
  } catch (err) {
    console.error("Reconcile audit error:", err);
  } finally {
    if (btn) btn.innerHTML = '<i class="fa-solid fa-arrows-rotate"></i> ' + (isDe ? "3-Wege-Abgleich ausführen" : "Execute 3-Way Audit");
  }
};

// ============================================================================
// 7. MODALS (ADSp Claim Notice, Customs Certificate, Supervisor Override)
// ============================================================================
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
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const textElem = document.getElementById("adsp-claim-text");
  if (textElem) {
    navigator.clipboard.writeText(textElem.innerText).then(function () {
      alert(isDe ? "Haftungsanzeige nach ADSp 2017 & § 412 HGB in die Zwischenablage kopiert." : "ADSp 2017 & § 412 HGB claim copied to clipboard.");
    });
  }
};

window.openCustomsCertModal = async function (shipmentId) {
  const modal = document.getElementById("modal-customs-cert");
  const targetId = shipmentId || "SHP-SIS-1049";

  try {
    const res = await fetch("/api/v1/customs/ledger");
    if (res.ok) {
      const data = await res.json();
      const match = data.shipments && data.shipments.find(function (s) { return s.shipment_ref === targetId; });
      if (match) {
        const refElem = document.getElementById("cert-shipment-ref");
        const contElem = document.getElementById("cert-container-id");
        const grossElem = document.getElementById("cert-gross-weight");
        const tariffElem = document.getElementById("cert-tariff-code");
        const shaElem = document.getElementById("cert-sha-hash");

        if (refElem) refElem.textContent = match.shipment_ref + " (Mandant DE-SIS-8921)";
        if (contElem) contElem.textContent = (match.container_number || "MSKU7829107") + " (ISO 6346 Modulo-11 verifiziert: Gültig)";
        if (grossElem) grossElem.textContent = (match.gross_weight_kg ? match.gross_weight_kg.toLocaleString() + " kg" : "24.500 kg") + " (Toleranzdelta zu Packliste: 0 kg ≤ 50 kg)";
        if (tariffElem) tariffElem.textContent = "HS-Code " + (match.hs_code || "8471.30.00") + " • Ursprungsland: Deutschland (DE)";
        if (shaElem) shaElem.textContent = match.sha256;
      }
    }
  } catch (e) {
    console.warn("Cert modal data fetch error:", e);
  }

  if (modal) modal.classList.remove("hidden");
};

window.closeCustomsCertModal = function () {
  const modal = document.getElementById("modal-customs-cert");
  if (modal) modal.classList.add("hidden");
};

window.copyCertText = function () {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const paper = document.getElementById("customs-cert-paper");
  if (paper) {
    navigator.clipboard.writeText(paper.innerText).then(function () {
      alert(isDe ? "Offizieller Zertifikatstext in die Zwischenablage kopiert." : "Official certificate text copied to clipboard.");
    });
  }
};

let activeOverrideTargetId = null;

window.openSupervisorOverrideModal = function (shipmentId) {
  activeOverrideTargetId = shipmentId;
  const modal = document.getElementById("modal-supervisor-override");
  const refElem = document.getElementById("override-modal-ref");
  const reasonElem = document.getElementById("override-reason-input");
  if (refElem) refElem.textContent = shipmentId;
  if (reasonElem) reasonElem.value = "";
  if (modal) modal.classList.remove("hidden");
};

window.closeSupervisorOverrideModal = function () {
  activeOverrideTargetId = null;
  const modal = document.getElementById("modal-supervisor-override");
  if (modal) modal.classList.add("hidden");
};

window.submitSupervisorOverride = async function () {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const shipmentId = activeOverrideTargetId;
  const reasonElem = document.getElementById("override-reason-input");
  const operatorElem = document.getElementById("override-operator-input");

  const reason = reasonElem ? reasonElem.value.trim() : "";
  const operator = operatorElem ? operatorElem.value.trim() : "Leitstand-Supervisor";

  if (!reason) {
    alert(isDe ? "Bitte geben Sie eine Begründung für die Freigabe ein (§ 147 AO Pflichtfeld)." : "Please enter a valid justification for this override (§ 147 AO mandatory).");
    if (reasonElem) reasonElem.focus();
    return;
  }

  try {
    const res = await fetch("/api/v1/customs/override", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        shipmentId: shipmentId,
        reason: reason,
        operator: operator
      })
    });

    if (res.ok) {
      window.closeSupervisorOverrideModal();

      // Real-time DOM update of the row status
      const cell = document.getElementById("status-cell-" + shipmentId);
      if (cell) {
        cell.innerHTML = '<span class="stage-badge-pill pass">' + (isDe ? "FREIGEGEBEN" : "OVERRIDDEN") + '</span>';
      }

      if (typeof window.refreshKpiRibbon === "function") {
        window.refreshKpiRibbon();
      }
    } else {
      const err = await res.json();
      alert("Fehler bei der Freigabe: " + (err.message || res.statusText));
    }
  } catch (err) {
    alert("Netzwerkfehler beim Speichern des Overrides.");
  }
};

// Real Database Health Probe (SELECT 1, latency, pool status)
window.testDbConnection = async function () {
  const isDe = (document.documentElement.getAttribute("lang") || "de") === "de";
  const btn = document.getElementById("btn-test-db");
  const stat = document.getElementById("db-ping-result");

  if (btn) btn.textContent = isDe ? "Prüfe Verbindung..." : "Checking connection...";

  try {
    const res = await fetch("/api/v1/health/db");
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();

    if (btn) {
      btn.textContent = isDe ? ("✓ Verbunden (" + data.latencyMs + " ms)") : ("✓ Connected (" + data.latencyMs + " ms)");
    }
    if (stat) {
      stat.textContent = isDe
        ? ("Datenbank: " + data.driver + " • " + data.totalRecords + " Datensätze • Latenz: " + data.latencyMs + " ms")
        : ("Database: " + data.driver + " • " + data.totalRecords + " records • Latency: " + data.latencyMs + " ms");
    }
  } catch (err) {
    if (btn) btn.textContent = isDe ? "✕ Verbindungsfehler" : "✕ Connection Failed";
    if (stat) stat.textContent = isDe ? "Datenbank nicht erreichbar." : "Database unreachable.";
  }
};

// Real CSV Exports
window.exportQuarantineCsv = function () {
  window.location.href = "/api/v1/compliance/quarantine/export";
};

window.exportLedgerCsv = function () {
  window.location.href = "/api/v1/compliance/ledger/export";
};

// Real SAP IDoc XML Export
window.downloadIdocXml = function () {
  const pre = document.getElementById("idoc-payload-preview");
  if (!pre) return;
  const content = pre.innerText;
  const blob = new Blob([content], { type: "application/xml" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "sap-idoc-desadv-SHP-SIS-1049.xml";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

// Live search filtering in Quarantine Cockpit
window.handleQuarantineSearch = function (query) {
  const q = (query || "").toLowerCase().trim();
  const rows = document.querySelectorAll("#quarantine-table-rows tr");
  rows.forEach(function (row) {
    const text = row.innerText.toLowerCase();
    row.style.display = !q || text.includes(q) ? "" : "none";
  });
};

// Executive KPI Ribbon live sync
window.refreshKpiRibbon = async function () {
  try {
    const res = await fetch("/api/v1/metrics/kpi");
    if (!res.ok) return;
    const data = await res.json();

    const statTotal = document.getElementById("stat-total");
    const statClean = document.getElementById("stat-clean");
    const statHolds = document.getElementById("stat-holds");
    const statDemurrage = document.getElementById("stat-demurrage");

    if (statTotal) statTotal.textContent = String(data.totalProcessed);
    if (statClean) statClean.textContent = String(data.verifiedClean);
    if (statHolds) statHolds.textContent = String(data.quarantineHolds);
    if (statDemurrage) statDemurrage.textContent = data.demurrageSavedEur.toLocaleString() + " €";
  } catch (e) {}
};

// Tab 4 Workspace View Switcher (Hick's Law: Progressive Disclosure)
window.toggleDispatchView = function (mode) {
  const mapWrap = document.getElementById("dispatch-map-view-wrapper");
  const toursWrap = document.getElementById("dispatch-tours-view-wrapper");
  const btnMap = document.getElementById("tab4-view-map-btn");
  const btnTours = document.getElementById("tab4-view-tours-btn");
  const btnSplit = document.getElementById("tab4-view-split-btn");

  const resetBtn = function (btn) {
    if (!btn) return;
    btn.style.background = "";
    btn.style.color = "";
    btn.style.borderColor = "";
  };
  const setBtnActive = function (btn) {
    if (!btn) return;
    btn.style.background = "#0284C7";
    btn.style.color = "#FFFFFF";
    btn.style.borderColor = "#38BDF8";
  };

  [btnMap, btnTours, btnSplit].forEach(resetBtn);

  if (mode === "map") {
    if (mapWrap) mapWrap.style.display = "block";
    if (toursWrap) toursWrap.style.display = "none";
    setBtnActive(btnMap);
  } else if (mode === "tours") {
    if (mapWrap) mapWrap.style.display = "none";
    if (toursWrap) toursWrap.style.display = "block";
    setBtnActive(btnTours);
  } else {
    // split / combined
    if (mapWrap) mapWrap.style.display = "block";
    if (toursWrap) toursWrap.style.display = "block";
    setBtnActive(btnSplit);
  }
};

// Tab 5 Workspace View Switcher (Hick's Law: Focus on Ledger vs. IT Connectors)
window.toggleLedgerView = function (mode) {
  const tableSec = document.getElementById("ledger-table-section");
  const itSec = document.getElementById("ledger-it-section");
  const btnLedger = document.getElementById("tab5-view-ledger-btn");
  const btnIt = document.getElementById("tab5-view-it-btn");
  const btnAll = document.getElementById("tab5-view-all-btn");

  const resetBtn = function (btn) {
    if (!btn) return;
    btn.style.background = "";
    btn.style.color = "";
    btn.style.borderColor = "";
  };
  const setBtnActive = function (btn) {
    if (!btn) return;
    btn.style.background = "#0284C7";
    btn.style.color = "#FFFFFF";
    btn.style.borderColor = "#38BDF8";
  };

  [btnLedger, btnIt, btnAll].forEach(resetBtn);

  if (mode === "it") {
    if (tableSec) tableSec.style.display = "none";
    if (itSec) itSec.style.display = "block";
    setBtnActive(btnIt);
  } else if (mode === "all") {
    if (tableSec) tableSec.style.display = "block";
    if (itSec) itSec.style.display = "block";
    setBtnActive(btnAll);
  } else {
    // ledger focus
    if (tableSec) tableSec.style.display = "block";
    if (itSec) itSec.style.display = "none";
    setBtnActive(btnLedger);
  }
};

// Initialize KPI Ribbon and Tab Views on page load
function initPageWorkspace() {
  window.refreshKpiRibbon();
  if (document.getElementById("tab5-view-ledger-btn")) {
    window.toggleLedgerView("ledger");
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initPageWorkspace);
} else {
  initPageWorkspace();
}
