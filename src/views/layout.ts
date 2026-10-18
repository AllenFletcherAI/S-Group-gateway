import { S_GROUP_BRAND } from "../config/branding.js";

export interface LayoutOptions {
  title?: string;
  activeNavId?: string;
  tenantName?: string;
  tenantId?: string;
  userEmail?: string;
  lang?: "de" | "en";
  content: string;
}

/**
 * Render the S-Group Gateway 100vh Operational Cockpit Layout.
 * WHY: Provides a fixed-viewport industrial workspace (no double scrollbars, no marketing footer)
 * with a two-tier header separating utility controls from navigation tabs and executive KPI chips.
 */
export function renderLayout(options: LayoutOptions): string {
  const {
    title = S_GROUP_BRAND.portalTitle,
    activeNavId = "audit",
    tenantName = "Schäfer & SIS Interlogistik GmbH",
    tenantId = "DE-SIS-8921",
    userEmail = "disponent@schaefer-sis.de",
    lang = "de",
    content
  } = options;

  const isDe = lang === "de";

  const navItemsHtml = S_GROUP_BRAND.navigation
    .map((item) => {
      const isActive = item.id === activeNavId;
      const label = isDe ? item.labelDe : item.labelEn;
      const activeClass = isActive ? "nav-tab-pill active" : "nav-tab-pill";
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      let icon = "fa-network-wired";
      if (item.id === "reconcile") icon = "fa-layer-group";
      if (item.id === "quarantine") icon = "fa-triangle-exclamation";
      if (item.id === "dispatch") icon = "fa-truck-front";
      if (item.id === "ledger") icon = "fa-clock-rotate-left";

      return `<a href="${item.href}?lang=${lang}" class="${activeClass}"${ariaCurrent} data-nav-id="${item.id}">
        <i class="fa-solid ${icon}"></i>
        <span>${label}</span>
      </a>`;
    })
    .join("\n        ");

  return `<!DOCTYPE html>
<html lang="${lang}" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="description" content="S-Group Gateway - Schäfer & SIS Interlogistik Fracht- und Zoll-Leitstand">
  <title>${title} | ${S_GROUP_BRAND.companyName}</title>
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600;700&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="/static/css/layout.css">
  <link rel="stylesheet" href="/static/css/telematicsMap.css">
  <script>
    (function () {
      try {
        var stored = localStorage.getItem("sgroup_theme");
        var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
        var theme = stored || (prefersDark ? "dark" : "light");
        document.documentElement.setAttribute("data-theme", theme);
        if (theme === "dark") {
          document.documentElement.classList.add("theme-dark");
        } else {
          document.documentElement.classList.remove("theme-dark");
        }
      } catch (e) {}
    })();
  </script>
</head>
<body class="s-group-cockpit">
  <!-- Top Accessibility Skip Link -->
  <a href="#main-content" class="skip-to-content">
    ${isDe ? "Zum Hauptinhalt springen" : "Skip to main content"}
  </a>

  <!-- TWO-TIER OPERATIONAL HEADER -->
  <header class="cockpit-header" role="banner">
    <!-- TIER 1: Utility & Brand Bar (Fixed 56px) -->
    <div class="header-tier-top">
      <div class="brand-cluster">
        <a href="/portal?lang=${lang}" class="brand-link" aria-label="S-Group Gateway Home">
          <div class="brand-mark">
            <span class="brand-s">S</span>
          </div>
          <div class="brand-text">
            <div class="brand-title-row">
              <h1 class="brand-title">S-GROUP GATEWAY</h1>
              <span class="live-bridge-pill">
                <span class="pulse-dot"></span>
                <span>${isDe ? "S-Group Bridge / ATLAS 9.1" : "S-Group Bridge / ATLAS 9.1"}</span>
              </span>
            </div>
            <span class="brand-subtitle">${S_GROUP_BRAND.companyName} • ${tenantName} (<code>${tenantId}</code>)</span>
          </div>
        </a>
      </div>

      <div class="utility-actions">
        <!-- Spickzettel & Cheat Sheet (F1) -->
        <button
          type="button"
          id="btn-spickzettel"
          class="util-btn highlight"
          onclick="openSpickzettelModal()"
          title="${isDe ? "Hilfe, Live-Tour & Spickzettel (F1)" : "Help, Live Tour & Cheat Sheet (F1)"}"
        >
          <i class="fa-solid fa-graduation-cap"></i>
          <span>${isDe ? "Einführung & Spickzettel (F1)" : "Tour & Cheat Sheet (F1)"}</span>
        </button>

        <!-- Light / Dark Mode Toggle Button -->
        <button
          type="button"
          id="theme-toggle-btn"
          class="theme-toggle-btn"
          onclick="toggleTheme()"
          aria-label="${isDe ? "Erscheinungsbild umschalten (Hell/Dunkel)" : "Toggle display theme (Light/Dark)"}"
          title="${isDe ? "Erscheinungsbild umschalten (Hell/Dunkel)" : "Toggle display theme (Light/Dark)"}"
        >
          <span id="theme-toggle-icon" class="theme-toggle-icon"><i class="fa-solid fa-moon"></i></span>
          <span id="theme-toggle-text" class="theme-toggle-text">${isDe ? "Modus: Dunkel" : "Mode: Dark"}</span>
        </button>

        <!-- Dropdown Theme Toggle Component (Slice 12) -->
        <button id="dropdown-theme-toggle" class="sr-only" type="button" aria-hidden="true" tabindex="-1">
          <span id="dropdown-theme-icon"><i class="fa-solid fa-moon"></i></span>
          <span id="dropdown-theme-text">${isDe ? "Dunkelmodus aktivieren" : "Switch to Dark Mode"}</span>
        </button>

        <!-- Language Switcher Button -->
        <button
          type="button"
          id="lang-toggle-btn"
          class="util-btn"
          onclick="toggleLanguage()"
          title="${isDe ? "Sprache wechseln (DE / EN)" : "Switch Language (DE / EN)"}"
        >
          <i class="fa-solid fa-globe text-signal-blue"></i>
          <span id="lang-indicator">${isDe ? "DE (Deutsch)" : "EN (English)"}</span>
        </button>

        <!-- Compact Operator Badge -->
        <div class="operator-badge" title="${isDe ? "Angemeldeter Speditionsdisponent" : "Logged in Dispatcher"}">
          <i class="fa-solid fa-circle-user"></i>
          <span class="operator-email">${userEmail}</span>
        </div>
      </div>
    </div>

    <!-- TIER 2: Dedicated Navigation Strip & Executive KPI Chips (Fixed 40px) -->
    <div class="header-tier-nav" id="main-nav-strip">
      <nav class="cockpit-nav desktop-nav" role="navigation" aria-label="Hauptnavigation">
        ${navItemsHtml}
      </nav>

      <!-- Executive KPI Chips (Clickable shortcuts for 50+ operators) -->
      <div class="kpi-chips-strip header-kpi-strip" role="region" aria-label="Executive KPI">
        <a href="/portal/ledger?lang=${lang}" class="kpi-chip-btn" title="${isDe ? "Zum Audit-Ledger wechseln" : "View Ingestion Ledger"}">
          <i class="fa-solid fa-file-lines text-slate-400"></i>
          <span class="kpi-label">${isDe ? "Verarbeitet:" : "Processed:"}</span>
          <span id="stat-total" class="kpi-val">24</span>
        </a>
        <a href="/portal/ledger?filter=clean&lang=${lang}" class="kpi-chip-btn clean" title="${isDe ? "Freigegebene Sendungen anzeigen" : "View Clean Shipments"}">
          <i class="fa-solid fa-circle-check text-emerald-400"></i>
          <span class="kpi-label">Clean:</span>
          <span id="stat-clean" class="kpi-val">18</span>
        </a>
        <a href="/portal/quarantine?lang=${lang}" class="kpi-chip-btn quar" title="${isDe ? "Zur Quarantäne-Konsole wechseln" : "View Quarantine Console"}">
          <i class="fa-solid fa-triangle-exclamation text-amber-400"></i>
          <span class="kpi-label">${isDe ? "Quarantäne:" : "Quarantine:"}</span>
          <span id="stat-holds" class="kpi-val">3</span>
        </a>
        <a href="/portal/quarantine?lang=${lang}" class="kpi-chip-btn demurrage" title="${isDe ? "Verhinderte Standgelder anzeigen" : "View Demurrage Savings"}">
          <i class="fa-solid fa-shield-halved text-emerald-400"></i>
          <span class="kpi-label">${isDe ? "Standgeld vermieden:" : "Demurrage Saved:"}</span>
          <span id="stat-demurrage" class="kpi-val">3.850 €</span>
        </a>
      </div>

      <!-- Regulatory Compliance & Retention Metadata (DSGVO Art. 5) -->
      <div class="sr-only">
        <span class="compliance-badge">${S_GROUP_BRAND.legal.complianceBadge}</span>
        <span class="retention-notice">${isDe ? S_GROUP_BRAND.legal.retentionNoticeDe : S_GROUP_BRAND.legal.retentionNoticeEn}</span>
      </div>
    </div>
  </header>

  <!-- 100vh FULL-HEIGHT OPERATIONAL COCKPIT WORKSPACE (NO MARKETING FOOTER) -->
  <main id="main-content" class="cockpit-main-workspace" role="main">
    ${content}
  </main>

  <!-- GLOBAL OPERATOR CHEAT SHEET & SPICKZETTEL MODAL (F1) -->
  <div id="modal-spickzettel" class="modal-backdrop hidden" onclick="if(event.target === this) closeSpickzettelModal()">
    <div class="spickzettel-modal-dialog">
      <div class="spickzettel-header">
        <div class="spickzettel-title-group">
          <span class="spickzettel-icon">🎓</span>
          <div>
            <h2 class="spickzettel-title">
              ${isDe ? "Operativer Leitfaden & Spickzettel (F1)" : "Operator Quick Reference & Cheat Sheet (F1)"}
            </h2>
            <p class="spickzettel-sub">
              ${isDe ? "Schäfer & SIS Interlogistik • Revisionssichere Zollabfertigung & Disposition" : "Schäfer & SIS Interlogistik • Compliant Customs Clearance & Dispatch"}
            </p>
          </div>
        </div>
        <button type="button" class="modal-close-btn" onclick="closeSpickzettelModal()" title="${isDe ? "Schließen (Esc)" : "Close (Esc)"}">✕</button>
      </div>

      <div class="spickzettel-body">
        <div class="spickzettel-grid">
          <!-- Card 1: 3-Step Workflow -->
          <div class="spickzettel-card">
            <h3><span class="num-badge">1</span> ${isDe ? "Workflow in 3 Schritten" : "3-Step Workflow"}</h3>
            <ol class="spickzettel-list">
              <li><strong>${isDe ? "Dokumenten-Audit:" : "Document Audit:"}</strong> ${isDe ? "Beleg per Drag&Drop oder Strg+V importieren. 5-Stufen-Prüfung verifiziert ISO 6346 Modulo-11 Prüfziffer und VGM-Bruttomasse." : "Import waybill via drag&drop or Ctrl+V. 5-stage engine validates ISO 6346 checksum and VGM weight."}</li>
              <li><strong>${isDe ? "3-Wege-Abgleich:" : "3-Way Match:"}</strong> ${isDe ? "B/L, Handelsrechnung und Packliste abgleichen. Toleranzgrenze &plusmn;50 kg nach ADSp 2017 & § 412 HGB." : "Reconcile B/L, invoice, and packing list. Maximum allowed tolerance is &plusmn;50 kg per ADSp 2017."}</li>
              <li><strong>${isDe ? "Freigabe / Quarantäne:" : "Release / Quarantine:"}</strong> ${isDe ? "Stimmige Dossiers gehen direkt an die Disposition. Unstimmigkeiten gehen in Quarantäne zur Standgeld-Abwehr." : "Clean files route to dispatch. Mismatches enter quarantine to stop demurrage."}</li>
            </ol>
          </div>

          <!-- Card 2: Tolerances & Compliance -->
          <div class="spickzettel-card">
            <h3><span class="num-badge">2</span> ${isDe ? "Zoll- & Frachttoleranzen" : "Customs Tolerances"}</h3>
            <ul class="spickzettel-list">
              <li><strong>${isDe ? "Tara-Toleranz (ADSp 2017):" : "Tare Tolerance (ADSp 2017):"}</strong> ${isDe ? "Max. 50 kg Abweichung zwischen B/L und Packliste zulässig." : "Max 50 kg deviation between B/L and packing list permitted."}</li>
              <li><strong>${isDe ? "ISO 6346 Modulo-11:" : "ISO 6346 Modulo-11:"}</strong> ${isDe ? "4 Buchstaben (Owner+U) + 6 Ziffern + 1 Prüfziffer. Fehlerhafte Nummern werden blockiert." : "4 letters + 6 digits + 1 check digit. Invalid container numbers blocked."}</li>
              <li><strong>${isDe ? "GoBD & § 147 AO:" : "GoBD & § 147 AO:"}</strong> ${isDe ? "10 Jahre Revisionssicherheit mit unveränderbarem SHA-256 Prüfstempel." : "10-year tamper-evident storage with immutable SHA-256 seals."}</li>
            </ul>
          </div>

          <!-- Card 3: Demurrage Schedules -->
          <div class="spickzettel-card">
            <h3><span class="num-badge">3</span> ${isDe ? "Standgeld & Kaigebühren (Demurrage)" : "Demurrage Rates"}</h3>
            <ul class="spickzettel-list">
              <li><strong>${isDe ? "Seehafen Hamburg (CTA/CTB):" : "Hamburg Seaport (CTA/CTB):"}</strong> ${isDe ? "5 Kalendertage freie Standzeit. Ab Tag 6: 180 €/Tag. Ab Tag 11: 350 €/Tag." : "5 calendar days free time. Day 6+: 180 €/day. Day 11+: 350 €/day."}</li>
              <li><strong>${isDe ? "Bremerhaven (CT4):" : "Bremerhaven (CT4):"}</strong> ${isDe ? "4 Werktage frei. Fristablauf löst automatische Quarantäne und Reederei-Avis aus." : "4 days free time. Expiry triggers immediate carrier notice."}</li>
              <li><strong>${isDe ? "Haftungsanzeige:" : "Liability Claim:"}</strong> ${isDe ? "Sofortige Schadensanzeige nach § 412 HGB per 1-Klick-Mail zur Fristwahrung." : "Immediate claim notice under § 412 HGB preserves recourse rights."}</li>
            </ul>
          </div>

          <!-- Card 4: Keyboard Shortcuts -->
          <div class="spickzettel-card">
            <h3><span class="num-badge">4</span> ${isDe ? "Tastatur-Kurzbefehle" : "Keyboard Shortcuts"}</h3>
            <div class="shortcuts-grid">
              <div><kbd>F1</kbd> <span>${isDe ? "Diesen Spickzettel öffnen / schließen" : "Open / close this cheat sheet"}</span></div>
              <div><kbd>Strg</kbd> + <kbd>V</kbd> <span>${isDe ? "Beleg aus Zwischenablage einfügen" : "Paste waybill from clipboard"}</span></div>
              <div><kbd>+</kbd> / <kbd>-</kbd> <span>${isDe ? "Beleg-Vorschau vergrößern / verkleinern" : "Zoom document preview"}</span></div>
              <div><kbd>W</kbd> <span>${isDe ? "An Fensterbreite anpassen" : "Fit to width"}</span></div>
              <div><kbd>P</kbd> <span>${isDe ? "Ganze Seite einpassen" : "Fit whole page"}</span></div>
              <div><kbd>Esc</kbd> <span>${isDe ? "Geöffnetes Dialogfenster schließen" : "Close active modal"}</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="spickzettel-footer">
        <span class="legal-notice">
          ${isDe ? "Schäfer & SIS Interlogistik • Server-Standort: Frankfurt am Main • ISO 27001 zertifiziert • ADSp 2017 & GoBD konform" : "Schäfer & SIS Interlogistik • Location: Frankfurt am Main • ISO 27001 • ADSp 2017 & GoBD Compliant"}
        </span>
        <button type="button" class="btn-scenario clean" onclick="closeSpickzettelModal()">
          ${isDe ? "Verstanden & Weiterarbeiten" : "Close & Continue"}
        </button>
      </div>
    </div>
  </div>

  <script src="/static/js/navigation.js" defer></script>
</body>
</html>`;
}
