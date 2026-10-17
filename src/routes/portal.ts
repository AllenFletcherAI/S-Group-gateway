import { FastifyInstance, FastifyPluginOptions, FastifyRequest } from "fastify";
import { renderLayout } from "../views/layout.js";
import { ShipmentRepository } from "../repositories/shipments.js";
import { renderShipmentsView } from "../views/shipments.js";
import { renderTrackingView } from "../views/tracking.js";
import { renderComplianceView } from "../views/compliance.js";
import { TelematicsPrunerService } from "../services/telematicsPruner.js";
import { DispatchRepository } from "../repositories/dispatch.js";
import { renderDispatchView } from "../views/dispatch.js";
import { renderDocumentsView } from "../views/documents.js";
import { CustomsAuditorService } from "../services/customsAuditor.js";

interface PortalQuery {
  lang?: "de" | "en";
  q?: string;
  carrier?: string;
  status?: string;
  id?: string;
  sample?: "clean" | "discrepancy";
}

/**
 * Resolve preferred language from query parameters or session cookie.
 * WHY: Prevents language preference from resetting when navigating between portal tabs (D-013).
 */
export function resolvePortalLang(
  req: FastifyRequest<{ Querystring: PortalQuery }>,
  reply?: { header: (name: string, value: string) => void }
): "de" | "en" {
  let lang: "de" | "en";
  if (req.query.lang === "en" || req.query.lang === "de") {
    lang = req.query.lang;
    if (reply) {
      reply.header("Set-Cookie", `sgroup_lang=${lang}; Path=/; Max-Age=31536000; SameSite=Lax`);
    }
  } else {
    const cookieHeader = req.headers.cookie || "";
    const match = cookieHeader.match(/sgroup_lang=(de|en)/);
    lang = match ? (match[1] as "de" | "en") : "de";
  }
  return lang;
}

/**
 * Customer Portal Routing Module
 * WHY: Delivers the branded Schäfer & SIS Interlogistik customer interface,
 * integrating real-time shipment directory, interactive milestone timelines, and document downloads.
 */
export async function portalRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  const DEFAULT_TENANT = "DE-SIS-8921";

  // Root redirect
  fastify.get("/", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const queryLang = req.query.lang;
    const cookieLang = resolvePortalLang(req, reply);
    const targetQuery = queryLang ? `?lang=${queryLang}` : (cookieLang !== "de" ? `?lang=${cookieLang}` : "");
    return reply.redirect(targetQuery ? `/portal${targetQuery}` : "/portal");
  });

  // Portal Main Dashboard (Overview)
  fastify.get("/portal", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const shipments = ShipmentRepository.getShipmentsByTenant(DEFAULT_TENANT);

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
            <div class="metric-value">${shipments.length}</div>
            <p class="metric-footer">${isDe ? "100% im Zeitplan" : "100% on schedule"}</p>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "Zolldokumente" : "Customs Documents"}</span>
              <span class="metric-icon">📄</span>
            </div>
            <div class="metric-value">4</div>
            <p class="metric-footer">${isDe ? "ATLAS & CMR verifiziert" : "ATLAS & CMR verified"}</p>
          </div>

          <div class="metric-card">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "Carrier-Feeds" : "Carrier Feeds"}</span>
              <span class="metric-icon">🛰️</span>
            </div>
            <div class="metric-value">3 / 3</div>
            <p class="metric-footer">${isDe ? "DHL, Schenker, Maersk aktiv" : "DHL, Schenker, Maersk active"}</p>
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

      <!-- Quick Action Jump Cards -->
      <section class="portal-details-card">
        <h2 class="section-title">${isDe ? "Direktzugriff auf Portal-Module" : "Quick Access Portal Modules"}</h2>
        <div class="verification-list">
          <div class="verification-item">
            <span class="check-icon">📦</span>
            <div>
              <strong><a href="/portal/shipments?lang=${lang}">${isDe ? "Sendungsübersicht & Frachtliste" : "Shipment Directory"}</a></strong>
              <p>${isDe ? "Aktive Frachtsendungen filtern, nach Frachtführer sortieren und Status prüfen." : "Filter active shipments, sort by carrier, and inspect status."}</p>
            </div>
          </div>
          <div class="verification-item">
            <span class="check-icon">🛰️</span>
            <div>
              <strong><a href="/portal/tracking?id=SHP-SIS-1049&lang=${lang}">${isDe ? "Live-Telemetrie & Status-Timeline" : "Live Telematics & Timeline"}</a></strong>
              <p>${isDe ? "Schritt-für-Schritt Timeline mit verifizierten Webhook-Ereignissen anzeigen." : "Step-by-step milestone timeline with verified carrier webhook events."}</p>
            </div>
          </div>
          <div class="verification-item">
            <span class="check-icon">📄</span>
            <div>
              <strong><a href="/portal/documents?lang=${lang}">${isDe ? "Zolldokumente & Frachtbriefe" : "Customs Documents & CMR"}</a></strong>
              <p>${isDe ? "ATLAS-Zollfreigaben, CMR-Frachtbriefe und Bill of Lading einsehen und herunterladen." : "View and download ATLAS clearances, CMR waybills, and Bills of Lading."}</p>
            </div>
          </div>
        </div>
      </section>
    `;

    const html = renderLayout({
      title: isDe ? "Portal-Übersicht" : "Portal Overview",
      activeNavId: "shipments",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // 1. Shipments Directory Page
  fastify.get("/portal/shipments", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const shipments = ShipmentRepository.getShipmentsByTenant(DEFAULT_TENANT, {
      carrier: req.query.carrier,
      status: req.query.status,
      search: req.query.q,
    });

    const content = renderShipmentsView(shipments, lang, req.query.carrier, req.query.q);

    const html = renderLayout({
      title: lang === "de" ? "Sendungsverfolgung" : "Shipment Directory",
      activeNavId: "shipments",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // 2. Live Tracking & Timeline Page
  fastify.get("/portal/tracking", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const shipmentId = req.query.id || "SHP-SIS-1049";

    const details = ShipmentRepository.getShipmentDetails(DEFAULT_TENANT, shipmentId);

    let content: string;
    if (!details) {
      content = `
        <section class="portal-hero-card">
          <h1 class="hero-title">${isDe ? "Sendung nicht gefunden" : "Shipment Not Found"}</h1>
          <p>${isDe ? "Die angeforderte Sendung existiert nicht oder gehört nicht zu Ihrem Mandanten." : "The requested shipment does not exist or is unauthorized for your tenant."}</p>
          <p><a href="/portal/shipments?lang=${lang}" class="btn-back">← ${isDe ? "Zurück zur Übersicht" : "Back to Shipments"}</a></p>
        </section>
      `;
    } else {
      content = renderTrackingView(details, lang);
    }

    const html = renderLayout({
      title: isDe ? `Tracking: ${shipmentId}` : `Tracking: ${shipmentId}`,
      activeNavId: "tracking",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // 3. Customs Documents & Compliance Page with Redline 3-Way Audit
  fastify.get("/portal/documents", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const selectedSample = req.query.sample === "discrepancy" ? "discrepancy" : "clean";

    const shipments = ShipmentRepository.getShipmentsByTenant(DEFAULT_TENANT);
    const allDocs = shipments.flatMap((s) => s.documents.map((d) => ({ doc: d, shipmentId: s.shipmentId, carrier: s.carrier })));

    const samples = CustomsAuditorService.getSampleDossiers();
    const activeDossier = selectedSample === "discrepancy" ? samples.discrepancy : samples.clean;

    const auditResult = CustomsAuditorService.reconcileDossier(
      activeDossier.shipmentId,
      activeDossier.bol,
      activeDossier.atlas,
      activeDossier.invoice,
      lang
    );

    const content = renderDocumentsView({
      documents: allDocs,
      auditResult,
      selectedSample,
      lang,
    });

    const html = renderLayout({
      title: isDe ? "Zolldokumente & Redline-Audit" : "Customs Documents & Redline Audit",
      activeNavId: "documents",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // 4. Disposition & Tour Planning Page
  fastify.get("/portal/dispatch", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const activeFilter = req.query.status || "ALL";
    const searchQuery = req.query.q || "";

    const tours = DispatchRepository.getToursByTenant(DEFAULT_TENANT, {
      status: activeFilter,
      search: searchQuery,
    });

    const content = renderDispatchView(tours, DEFAULT_TENANT, lang, activeFilter, searchQuery);

    const html = renderLayout({
      title: isDe ? "Disposition & Tourenplanung" : "Dispatch & Fleet Routing",
      activeNavId: "dispatch",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // 5. DSGVO Compliance & Audit Page
  fastify.get("/portal/compliance", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const ledger = TelematicsPrunerService.getPruningLedger(DEFAULT_TENANT);

    const content = renderComplianceView(ledger, DEFAULT_TENANT, lang);

    const html = renderLayout({
      title: isDe ? "Datenschutz & Compliance" : "Privacy & Compliance",
      activeNavId: "compliance",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });
}
