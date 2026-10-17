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
import { renderDocumentAuditView } from "../views/documentAudit.js";
import { renderReconciliationView } from "../views/reconciliation.js";
import { renderQuarantineView } from "../views/quarantine.js";
import { renderLedgerView } from "../views/ledger.js";

interface PortalQuery {
  lang?: "de" | "en";
  q?: string;
  carrier?: string;
  status?: string;
  id?: string;
  sample?: "clean" | "discrepancy";
  filter?: string;
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
 * structured as an active 5-tab operational assembly line with backwards-compatible subpage routing.
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

  // Portal Main Dashboard (Overview & Quick Station Access)
  fastify.get("/portal", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const shipments = ShipmentRepository.getShipmentsByTenant(DEFAULT_TENANT);

    const content = `
      <section class="portal-hero-card">
        <div class="hero-header">
          <div>
            <h1 class="hero-title">
              ${isDe ? "Willkommen im S-Group Gateway" : "Welcome to the S-Group Gateway"}
            </h1>
            <p class="hero-subtitle">
              ${isDe 
                ? "Operatives Fracht- & Zoll-Leitstandssystem der Schäfer & SIS Interlogistik für Seehafen-Zubringung, Dokumentenprüfung und revisionssichere Verzollung." 
                : "Operational freight and customs cockpit by Schäfer & SIS Interlogistik for seaport feeding, document audit, and compliance."}
            </p>
          </div>
          <div class="hero-badge">
            <span class="badge-pill-success">● ${isDe ? "Operative Leitstände aktiv" : "All Operational Centers Active"}</span>
          </div>
        </div>

        <!-- 5-Station Operational Pipeline Quick Jump Grid -->
        <div class="metrics-grid" style="grid-template-columns: repeat(5, 1fr);">
          <a href="/portal/audit?lang=${lang}" class="metric-card" style="text-decoration:none; cursor:pointer;">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "1. Dok-Audit" : "1. Doc Audit"}</span>
              <span class="metric-icon">🔍</span>
            </div>
            <div class="metric-value" style="font-size:18px;">${isDe ? "Inspektor" : "Inspector"}</div>
            <p class="metric-footer">${isDe ? "Pan/Zoom & 5-Stufen OCR" : "Pan/Zoom & 5-Stage OCR"}</p>
          </a>

          <a href="/portal/reconcile?lang=${lang}" class="metric-card" style="text-decoration:none; cursor:pointer;">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "2. 3-Wege-Match" : "2. 3-Way Match"}</span>
              <span class="metric-icon">⚖️</span>
            </div>
            <div class="metric-value" style="font-size:18px;">${isDe ? "Abgleich" : "Reconcile"}</div>
            <p class="metric-footer">${isDe ? "B/L ↔ RE ↔ Packliste" : "B/L ↔ Inv ↔ Packing"}</p>
          </a>

          <a href="/portal/quarantine?lang=${lang}" class="metric-card" style="text-decoration:none; cursor:pointer; border-color:rgba(245,158,11,0.4);">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "3. Quarantäne" : "3. Quarantine"}</span>
              <span class="metric-icon">⚠️</span>
            </div>
            <div class="metric-value" style="font-size:18px; color:#F59E0B;">3 ${isDe ? "Fälle" : "Holds"}</div>
            <p class="metric-footer">${isDe ? "Standgeld-Abwehr" : "Demurrage Shield"}</p>
          </a>

          <a href="/portal/dispatch?lang=${lang}" class="metric-card" style="text-decoration:none; cursor:pointer;">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "4. Disposition" : "4. Dispatch"}</span>
              <span class="metric-icon">🚛</span>
            </div>
            <div class="metric-value" style="font-size:18px;">${isDe ? "Hinterland" : "Fleet"}</div>
            <p class="metric-footer">${isDe ? "Vector-Map & Feeder" : "Vector Map & Feeder"}</p>
          </a>

          <a href="/portal/ledger?lang=${lang}" class="metric-card" style="text-decoration:none; cursor:pointer; border-color:rgba(16,185,129,0.4);">
            <div class="metric-header">
              <span class="metric-label">${isDe ? "5. Audit-Ledger" : "5. Audit Ledger"}</span>
              <span class="metric-icon">🏛️</span>
            </div>
            <div class="metric-value" style="font-size:18px; color:#10B981;">§ 147 AO</div>
            <p class="metric-footer">${isDe ? "GoBD & A4 Zertifikat" : "GoBD & A4 Certificate"}</p>
          </a>
        </div>
      </section>

      <!-- Document Audit Workspace Embedded directly on overview for instant action -->
      <section style="margin-top:20px;">
        ${renderDocumentAuditView({ lang, containerId: "MSKU7829104" })}
      </section>
    `;

    const html = renderLayout({
      title: isDe ? "Dokumenten-Audit & Leitstand" : "Document Audit & Workspace",
      activeNavId: "audit",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // TAB 1: Document Audit & Pan/Zoom Canvas Workspace
  fastify.get("/portal/audit", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";

    const content = renderDocumentAuditView({ lang });

    const html = renderLayout({
      title: isDe ? "Dokumenten-Audit & Inspektor" : "Document Audit & Inspector",
      activeNavId: "audit",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // TAB 2: 3-Way Dossier Reconciliation Workspace
  fastify.get("/portal/reconcile", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const selectedScenario = req.query.sample === "discrepancy" ? "discrepancy" : "clean";

    const content = renderReconciliationView({
      lang,
      selectedScenario,
    });

    const html = renderLayout({
      title: isDe ? "3-Wege-Zollabgleich" : "3-Way Customs Match",
      activeNavId: "reconcile",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // TAB 3: Quarantine & Demurrage Center
  fastify.get("/portal/quarantine", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const filter = req.query.filter || req.query.status || "all";
    const search = req.query.q || "";

    const content = renderQuarantineView({
      lang,
      filter,
      search,
    });

    const html = renderLayout({
      title: isDe ? "Quarantäne & Standgeld-Leitstand" : "Quarantine & Demurrage Cockpit",
      activeNavId: "quarantine",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // TAB 4: Hinterland Dispatch & Sovereign Telematics Map
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
      title: isDe ? "Disposition & Telemetrie" : "Dispatch & Telematics",
      activeNavId: "dispatch",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // TAB 5: GoBD Audit-Ledger & IT-Konsole
  fastify.get("/portal/ledger", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const filter = req.query.filter || req.query.status || "all";
    const search = req.query.q || "";

    const content = renderLedgerView({
      lang,
      filter,
      search,
    });

    const html = renderLayout({
      title: isDe ? "Audit-Ledger & IT-Konsole" : "Audit Ledger & IT Console",
      activeNavId: "ledger",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // BACKWARDS COMPATIBILITY ROUTES (Ensures zero breakage of existing links and tests)
  // Shipments Directory
  fastify.get("/portal/shipments", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const shipments = ShipmentRepository.getShipmentsByTenant(DEFAULT_TENANT, {
      carrier: req.query.carrier,
      status: req.query.status,
      search: req.query.q,
    });

    const content = renderShipmentsView(shipments, lang, req.query.carrier, req.query.q);

    const html = renderLayout({
      title: lang === "de" ? "Sendungsübersicht" : "Shipment Directory",
      activeNavId: "ledger",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // Live Tracking & Timeline
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
          <p><a href="/portal/dispatch?lang=${lang}" class="btn-back">← ${isDe ? "Zurück zur Disposition" : "Back to Dispatch"}</a></p>
        </section>
      `;
    } else {
      content = renderTrackingView(details, lang);
    }

    const html = renderLayout({
      title: isDe ? `Tracking: ${shipmentId}` : `Tracking: ${shipmentId}`,
      activeNavId: "dispatch",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // Customs Documents & Redline 3-Way Audit
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
      activeNavId: "reconcile",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });

  // DSGVO Compliance & Audit
  fastify.get("/portal/compliance", async (req: FastifyRequest<{ Querystring: PortalQuery }>, reply) => {
    const lang = resolvePortalLang(req, reply);
    const isDe = lang === "de";
    const ledger = TelematicsPrunerService.getPruningLedger(DEFAULT_TENANT);

    const content = renderComplianceView(ledger, DEFAULT_TENANT, lang);

    const html = renderLayout({
      title: isDe ? "Datenschutz & Compliance" : "Privacy & Compliance",
      activeNavId: "quarantine",
      lang,
      content,
    });

    return reply.type("text/html; charset=utf-8").send(html);
  });
}
