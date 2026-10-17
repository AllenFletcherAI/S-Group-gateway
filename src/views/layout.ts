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
 * Render the main S-Group Portal layout shell with responsive navigation header.
 * WHY: Modular layout template strictly enforces S-Group branding, accessibility (WCAG AA),
 * and DSGVO privacy notices on every customer-facing view.
 */
export function renderLayout(options: LayoutOptions): string {
  const {
    title = S_GROUP_BRAND.portalTitle,
    activeNavId = "shipments",
    tenantName = "Schäfer & SIS Interlogistik - Enterprise Demo Tenant",
    tenantId = "DE-SIS-8921",
    userEmail = "dispatcher@schaefer-sis.de",
    lang = "de",
    content
  } = options;

  const isDe = lang === "de";

  const navItemsHtml = S_GROUP_BRAND.navigation
    .map((item) => {
      const isActive = item.id === activeNavId;
      const label = isDe ? item.labelDe : item.labelEn;
      const activeClass = isActive ? "nav-link active" : "nav-link";
      const ariaCurrent = isActive ? ' aria-current="page"' : "";
      return `<a href="${item.href}" class="${activeClass}"${ariaCurrent} data-nav-id="${item.id}">
        ${label}
      </a>`;
    })
    .join("\n            ");

  return `<!DOCTYPE html>
<html lang="${lang}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="ie=edge">
  <meta name="description" content="S-Group Gateway - Schäfer & SIS Interlogistik Customer Freight & Tracking Portal">
  <title>${title} | ${S_GROUP_BRAND.companyName}</title>
  <link rel="stylesheet" href="/static/css/layout.css">
  <link rel="stylesheet" href="/static/css/telematicsMap.css">
</head>
<body class="s-group-theme">
  <!-- Top Accessibility Skip Link -->
  <a href="#main-content" class="skip-to-content">
    ${isDe ? "Zum Hauptinhalt springen" : "Skip to main content"}
  </a>

  <!-- Main Navigation Header -->
  <header class="main-header" role="banner">
    <div class="header-container">
      <!-- Brand Logo / Identity -->
      <div class="header-brand">
        <a href="/portal" class="brand-link" aria-label="S-Group Gateway Home">
          <div class="brand-mark">
            <span class="brand-s">S</span>
          </div>
          <div class="brand-text">
            <span class="brand-title">${S_GROUP_BRAND.groupName}</span>
            <span class="brand-subtitle">${S_GROUP_BRAND.companyName}</span>
          </div>
        </a>
      </div>

      <!-- Desktop Navigation Menu -->
      <nav class="desktop-nav" role="navigation" aria-label="Hauptnavigation">
        <div class="nav-links-wrapper">
          ${navItemsHtml}
        </div>
      </nav>

      <!-- Header Actions: Quick Search, Language Toggle, User Menu -->
      <div class="header-actions">
        <!-- Quick Shipment Search -->
        <div class="header-search-box" role="search">
          <label for="quick-search-input" class="sr-only">
            ${isDe ? "Sendung oder Container suchen" : "Search shipment or container"}
          </label>
          <input
            id="quick-search-input"
            type="search"
            class="header-search-input"
            placeholder="${isDe ? "Sendungs-Nr. / Container..." : "Shipment No. / Container..."}"
            aria-label="${isDe ? "Sendungsnummer oder Container eingeben" : "Enter shipment or container number"}"
          >
          <button class="header-search-btn" aria-label="${isDe ? "Suchen" : "Search"}">
            🔍
          </button>
        </div>

        <!-- Language Selector -->
        <div class="language-switch" aria-label="Sprachauswahl">
          <button class="lang-btn ${isDe ? "active" : ""}" data-lang="de" aria-pressed="${isDe}">DE</button>
          <span class="lang-divider" aria-hidden="true">/</span>
          <button class="lang-btn ${!isDe ? "active" : ""}" data-lang="en" aria-pressed="${!isDe}">EN</button>
        </div>

        <!-- User Profile Dropdown Button -->
        <div class="user-menu-container">
          <button id="user-menu-btn" class="user-profile-btn" aria-expanded="false" aria-haspopup="true" aria-label="${isDe ? "Benutzerkonto Menü" : "User Account Menu"}">
            <span class="user-avatar" aria-hidden="true">👤</span>
            <span class="user-email-text">${userEmail}</span>
            <span class="dropdown-chevron" aria-hidden="true">▾</span>
          </button>
          <div id="user-menu-dropdown" class="user-dropdown-panel" hidden>
            <div class="dropdown-user-info">
              <p class="dropdown-role">${isDe ? "Rolle: Speditionsdisponent" : "Role: Freight Dispatcher"}</p>
              <p class="dropdown-tenant">${tenantName} (<code>${tenantId}</code>)</p>
            </div>
            <hr class="dropdown-divider">
            <a href="/portal/settings" class="dropdown-item">${isDe ? "Konto-Einstellungen" : "Account Settings"}</a>
            <a href="/portal/compliance" class="dropdown-item">${isDe ? "DSGVO-Auskunft & Protokolle" : "DSGVO Audit & Export"}</a>
            <hr class="dropdown-divider">
            <a href="/auth/logout" class="dropdown-item text-danger">${isDe ? "Abmelden" : "Sign Out"}</a>
          </div>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Content Area -->
  <main id="main-content" class="portal-main-container" role="main">
    ${content}
  </main>

  <!-- German Privacy / DSGVO Compliant Footer -->
  <footer class="main-footer" role="contentinfo">
    <div class="footer-container">
      <div class="footer-col brand-col">
        <p class="footer-company-name"><strong>${S_GROUP_BRAND.companyName}</strong></p>
        <p class="footer-company-desc">
          ${isDe ? "Internationale Spedition & Logistiknetzwerk" : "International Freight Forwarding & Logistics Network"}
        </p>
        <p class="footer-copyright">${S_GROUP_BRAND.legal.copyright}</p>
      </div>

      <div class="footer-col compliance-col">
        <p class="footer-col-title">
          <strong>${isDe ? "Datenschutz & Compliance" : "Privacy & Compliance"}</strong>
          <span class="compliance-badge">🛡️ ${S_GROUP_BRAND.legal.complianceBadge}</span>
        </p>
        <p class="footer-dsgvo-notice">
          🛡️ ${isDe ? S_GROUP_BRAND.legal.retentionNoticeDe : S_GROUP_BRAND.legal.retentionNoticeEn}
        </p>
        <p class="footer-audit-stamp">
          ${isDe ? "Server-Standort: Deutschland (Frankfurt am Main) • ISO 27001 zertifiziert" : "Server Location: Germany (Frankfurt am Main) • ISO 27001 Certified"}
        </p>
      </div>

      <div class="footer-col links-col">
        <p class="footer-col-title"><strong>${isDe ? "Rechtliches" : "Legal"}</strong></p>
        <ul class="footer-links-list">
          <li><a href="/portal/impressum">${isDe ? "Impressum" : "Imprint"}</a></li>
          <li><a href="/portal/datenschutz">${isDe ? "Datenschutzerklärung (DSGVO)" : "Privacy Policy"}</a></li>
          <li><a href="/portal/agb">${isDe ? "AGB (ADSp 2017)" : "Terms & Conditions"}</a></li>
          <li><a href="/health" target="_blank">${isDe ? "System-Status (API)" : "System Health (API)"}</a></li>
        </ul>
      </div>
    </div>
  </footer>

  <script src="/static/js/navigation.js" defer></script>
</body>
</html>`;
}
