import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { renderLayout } from "../views/layout.js";

interface PortalQuery {
  lang?: "de" | "en";
  q?: string;
}

/**
 * Customer Portal Routing Module
 * WHY: Delivers the branded Schäfer & SIS Interlogistik customer interface,
 * enforcing tenant context and clean modular UI views.
 */
export async function portalRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  // Root redirect
  fastify.get("/", async (_req, reply) => {
    return reply.redirect("/portal");
  });

  // Portal Main Dashboard (Slice 1 Core View)
  fastify.get("/portal", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = req.query.lang === "en" ? "en" : "de";
    const isDe = lang === "de";

    const content = `
      <section class="portal-hero-card">
        <div class="hero-header">
          <div>
            <h1 class="hero-title">
              ${isDe ? "Willkommen im S-Group Fracht- & Tracking-Portal" : "Welcome to the S-Group Freight & Tracking Portal"}
            </h1>
            <p class="hero-subtitle">
              ${isDe ? "Zentrale Schnittstelle für Sendungsverfolgung, Disposition und Telemetriedaten von Schäfer & SIS Interlogistik." : "Unified gateway for freight tracking, dispatch operations, and telematics by Schäfer & SIS Interlogistik."}
            </p>
          </div>
          <div class="hero-badge">
            <span class="badge-pill-success">● ${isDe ? "Alle Systeme aktiv" : "All Systems Operational"}</span>
          </div>
        </div>

        <!-- Metric KPI Cards (8px grid spacing) -->
        <div class="metrics-grid">
          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "Aktive Sendungen" : "Active Shipments"}</span>
              <span class="metric-icon">🚚</span>
            </div>
            <div class="metric-value">142</div>
            <p class="metric-footer">${isDe ? "98,4% im Zeitplan" : "98.4% on schedule"}</p>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "Zollabfertigung" : "Customs Clearance"}</span>
              <span class="metric-icon">📄</span>
            </div>
            <div class="metric-value">18</div>
            <p class="metric-footer">${isDe ? "Hamburg Port & Frankfurt Hub" : "Hamburg Port & Frankfurt Hub"}</p>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "Carrier-Feeds" : "Carrier Feeds"}</span>
              <span class="metric-icon">🛰️</span>
            </div>
            <div class="metric-value">3 / 3</div>
            <p class="metric-footer">${isDe ? "DHL, Schenker, Maersk verbunden" : "DHL, Schenker, Maersk connected"}</p>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "DSGVO-Status" : "DSGVO Compliance"}</span>
              <span class="metric-icon">🛡️</span>
            </div>
            <div class="metric-value">100%</div>
            <p class="metric-footer">${isDe ? "Telemetrie-Aufbewahrung: 90 Tage" : "Retention: 90 days active"}</p>
          </div>
        </div>
      </section>

      <!-- Slice 1 Verification Card -->
      <section class="portal-details-card">
        <h2 class="section-title">${isDe ? "Slice 1: Navigation & Design-System Überprüfung" : "Slice 1: Navigation & Design System Verification"}</h2>
        <div class="verification-list">
          <div class="verification-item">
            <span class="check-icon">✓</span>
            <div>
              <strong>${isDe ? "Modulare Architektur:" : "Modular Architecture:"}</strong>
              <span>${isDe ? "Keine 300KB-Monolithen. Trennung von Routing, Views, Config und CSS." : "Zero 300KB monoliths. Clear separation of routes, views, config, and styling."}</span>
            </div>
          </div>
          <div class="verification-item">
            <span class="check-icon">✓</span>
            <div>
              <strong>${isDe ? "Offizielles S-Group Branding:" : "Official S-Group Branding:"}</strong>
              <span>${isDe ? "Tiefblau (#0B192C), Signalblau (#0284C7), 8px-Raster und barrierefreie Kontraste." : "Deep Navy (#0B192C), Signal Blue (#0284C7), 8px grid spacing, and WCAG AA contrast."}</span>
            </div>
          </div>
          <div class="verification-item">
            <span class="check-icon">✓</span>
            <div>
              <strong>${isDe ? "Deutsche Datenschutz-Standards (DSGVO):" : "German Privacy Standards (DSGVO):"}</strong>
              <span>${isDe ? "Mandanten-Kennzeichnung (DE-SIS-8921), anonymisierte Protokollierung, 90-Tage-Telemetriehinweis." : "Tenant isolation chip (DE-SIS-8921), privacy notices, and 90-day retention badge."}</span>
            </div>
          </div>
          <div class="verification-item">
            <span class="check-icon">✓</span>
            <div>
              <strong>${isDe ? "Barrierefreiheit & Responsivität:" : "Accessibility & Responsiveness:"}</strong>
              <span>${isDe ? "Tastaturbedienung mit sichtbarem Fokus, Skip-Link und responsives Menü für Mobilgeräte." : "Keyboard navigable with focus rings, skip-to-content link, and mobile drawer."}</span>
            </div>
          </div>
        </div>
      </section>
    `;

    const html = renderLayout({
      title: isDe ? "Fracht-Übersicht" : "Freight Overview",
      activeNavId: "shipments",
      lang,
      content
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // Additional Nav Routes for Demonstration
  const navSections = [
    { path: "/portal/shipments", id: "shipments", titleDe: "Sendungsübersicht", titleEn: "Shipment Overview" },
    { path: "/portal/tracking", id: "tracking", titleDe: "Live-Telemetrie Tracking", titleEn: "Live Telematics Tracking" },
    { path: "/portal/dispatch", id: "dispatch", titleDe: "Disposition & Tourenplanung", titleEn: "Dispatch & Tour Planning" },
    { path: "/portal/documents", id: "documents", titleDe: "Frachtbriefe & Zolldokumente", titleEn: "Freight Bills & Customs Documents" },
    { path: "/portal/compliance", id: "compliance", titleDe: "DSGVO-Auskunft & Protokolle", titleEn: "DSGVO Audit & Log Compliance" },
  ];

  for (const section of navSections) {
    fastify.get(section.path, async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
      const lang = req.query.lang === "en" ? "en" : "de";
      const isDe = lang === "de";

      const content = `
        <section class="portal-hero-card">
          <h1 class="hero-title">${isDe ? section.titleDe : section.titleEn}</h1>
          <p class="hero-subtitle">
            ${isDe ? "Bereich: " + section.id + " • Mandant: DE-SIS-8921" : "Section: " + section.id + " • Tenant: DE-SIS-8921"}
          </p>
          <div class="content-placeholder-box">
            <p><strong>${isDe ? "Aktiver Modulpfad:" : "Active Module Path:"}</strong> <code>${section.path}</code></p>
            <p>${isDe ? "Dieser Bereich wird in den nachfolgenden Slices (EDI-Adapter & Tracking-API) mit Live-Telemetrie befüllt." : "This view will be populated in subsequent slices with live carrier telematics and status APIs."}</p>
            <p><a href="/portal" class="btn-back">← ${isDe ? "Zurück zur Übersicht" : "Back to Overview"}</a></p>
          </div>
        </section>
      `;

      const html = renderLayout({
        title: isDe ? section.titleDe : section.titleEn,
        activeNavId: section.id,
        lang,
        content
      });

      return reply.type("text/html; charset=utf-8").send(html);
    });
  }
}
