import { ShipmentDetailsResult } from "../repositories/shipments.js";
import { UnifiedMilestone } from "../schemas/carrierEvents.js";
import { renderTelematicsMap } from "./components/telematicsMap.js";

function getMilestoneText(milestone: UnifiedMilestone, isDe: boolean): { label: string; icon: string } {
  const map: Record<UnifiedMilestone, { de: string; en: string; icon: string }> = {
    BOOKING_CREATED: { de: "Frachtauftrag gebucht", en: "Booking Created", icon: "📋" },
    PICKED_UP: { de: "Frachtgut übernommen", en: "Picked Up by Carrier", icon: "📦" },
    PORT_ARRIVED: { de: "Im See-/Flughafen eingetroffen", en: "Arrived at Port", icon: "⚓" },
    CUSTOMS_INSPECTION: { de: "Zollbeschau / ATLAS Prüfung", en: "Customs Hold / Inspection", icon: "⚠️" },
    CUSTOMS_CLEARED: { de: "Zollabfertigung abgeschlossen", en: "Customs Cleared", icon: "🛡️" },
    IN_TRANSIT: { de: "Im Hauptlauf / Auf See", en: "In Transit", icon: "🚚" },
    HUB_ARRIVED: { de: "Im Umschlag-Hub eingetroffen", en: "Arrived at Logistics Hub", icon: "🏢" },
    OUT_FOR_DELIVERY: { de: "In Zustellung", en: "Out for Final Delivery", icon: "🚛" },
    DELIVERED: { de: "Erfolgreich zugestellt", en: "Successfully Delivered", icon: "✅" },
    EXCEPTION_HOLD: { de: "Verzögerung / Frachthalt", en: "Exception Hold", icon: "🛑" },
  };

  const item = map[milestone] || { de: milestone, en: milestone, icon: "ℹ️" };
  return { label: isDe ? item.de : item.en, icon: item.icon };
}

/**
 * Render the Live Shipment Timeline & Documents View
 */
export function renderTrackingView(details: ShipmentDetailsResult, lang: "de" | "en"): string {
  const isDe = lang === "de";
  const { shipment, timeline } = details;
  const cargoDesc = isDe ? shipment.cargoDescriptionDe : shipment.cargoDescriptionEn;

  // Render Timeline Nodes
  const timelineNodesHtml = timeline.map((node, index) => {
    const isLatest = index === timeline.length - 1;
    const { label, icon } = getMilestoneText(node.milestone, isDe);
    const dateFormatted = new Date(node.timestamp).toLocaleString(isDe ? "de-DE" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const sourceTag = node.source === "CARRIER_TELEMATICS"
      ? `<span class="source-tag source-telematics" title="Verifiziertes Webhook-Signal">${isDe ? "🛰️ Telemetrie-Ereignis" : "🛰️ Live Telematics"}</span>`
      : `<span class="source-tag source-dispatch">${isDe ? "📋 Gateway Disposition" : "📋 Gateway Dispatch"}</span>`;

    return `
      <div class="timeline-step ${isLatest ? "step-latest" : ""}">
        <div class="timeline-marker" aria-hidden="true">
          <span class="timeline-marker-dot ${isLatest ? "pulse" : ""}"></span>
        </div>
        <div class="timeline-card">
          <div class="timeline-card-header">
            <div class="timeline-milestone-title">
              <span class="milestone-icon" aria-hidden="true">${icon}</span>
              <strong>${label}</strong>
            </div>
            <time class="timeline-time">${dateFormatted}</time>
          </div>
          <p class="timeline-location">📍 <strong>${node.location}</strong></p>
          ${node.details ? `<p class="timeline-details">${node.details}</p>` : ""}
          <div class="timeline-footer">
            ${sourceTag}
            <span class="event-id-tag">ID: <code>${node.eventId.slice(0, 8)}</code></span>
          </div>
        </div>
      </div>
    `;
  }).join("\n");

  // Render Customs Documents
  const documentsHtml = shipment.documents.length === 0
    ? `<p class="empty-docs-notice">${isDe ? "Keine Zolldokumente hinterlegt." : "No customs documents uploaded."}</p>`
    : shipment.documents.map((doc) => {
        const title = isDe ? doc.titleDe : doc.titleEn;
        return `
          <div class="document-item-card">
            <div class="doc-icon" aria-hidden="true">📄</div>
            <div class="doc-info">
              <p class="doc-title"><strong>${title}</strong></p>
              <p class="doc-meta">
                <span>${isDe ? "Aktenzeichen:" : "Ref:"} <code>${doc.fileNumber}</code></span> • 
                <span>${doc.fileSizeKb} KB</span> • 
                <span>${isDe ? "Geprüft am:" : "Verified:"} ${new Date(doc.verifiedDate).toLocaleDateString(isDe ? "de-DE" : "en-US")}</span>
              </p>
            </div>
            <div class="doc-action">
              <a href="/api/v1/documents/${doc.docId}/download" target="_blank" class="btn-doc-download">
                ⬇️ ${isDe ? "Herunterladen & Prüfen" : "Verify & Download"}
              </a>
            </div>
          </div>
        `;
      }).join("\n");

  const telematicsMapHtml = renderTelematicsMap(shipment, isDe);

  return `
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/portal/shipments?lang=${lang}">← ${isDe ? "Zurück zur Sendungsübersicht" : "Back to Shipments"}</a>
    </nav>

    <!-- Shipment Overview Banner -->
    <section class="portal-hero-card">
      <div class="hero-header">
        <div>
          <div class="shipment-id-badge-row">
            <span class="carrier-chip carrier-${shipment.carrier.toLowerCase()}">${shipment.carrier}</span>
            <h1 class="hero-title" style="display:inline; margin-left: 8px;">${shipment.shipmentId}</h1>
          </div>
          <p class="hero-subtitle">
            ${isDe ? "Frachtführer-Referenz:" : "Carrier Reference:"} <strong>${shipment.trackingReference}</strong> • 
            ${isDe ? "Mandant:" : "Tenant:"} <code>${shipment.tenantId}</code>
          </p>
        </div>
        <div class="hero-badge">
          <span class="badge-pill-success">● ${isDe ? "Tracking Aktiv" : "Tracking Active"}</span>
        </div>
      </div>

      <!-- Route Overview -->
      <div class="shipment-route-banner">
        <div class="route-banner-point">
          <span class="route-label">${isDe ? "Abgangsort" : "Origin"}</span>
          <p class="route-location">📍 ${shipment.origin}</p>
        </div>
        <div class="route-banner-arrow" aria-hidden="true">➔</div>
        <div class="route-banner-point">
          <span class="route-label">${isDe ? "Bestimmungsort" : "Destination"}</span>
          <p class="route-location">🏁 ${shipment.destination}</p>
        </div>
      </div>

      <div class="shipment-details-grid">
        <div class="detail-box">
          <span class="detail-label">${isDe ? "Frachtgut" : "Cargo"}</span>
          <p class="detail-val">${cargoDesc}</p>
        </div>
        <div class="detail-box">
          <span class="detail-label">${isDe ? "Gesamtgewicht" : "Total Weight"}</span>
          <p class="detail-val"><code>${shipment.weightKg.toLocaleString()} kg</code></p>
        </div>
        <div class="detail-box">
          <span class="detail-label">${isDe ? "Voraussichtliche Ankunft" : "Estimated Arrival"}</span>
          <p class="detail-val">📅 ${new Date(shipment.estimatedDelivery).toLocaleDateString(isDe ? "de-DE" : "en-US", { dateStyle: "long" })}</p>
        </div>
      </div>
    </section>

    <!-- Live Corridor & Telematics Map -->
    ${telematicsMapHtml}

    <!-- Two-Column Grid: Live Timeline & Customs Documents -->
    <div class="tracking-two-col">
      <!-- Live Milestone Timeline -->
      <section class="portal-details-card">
        <h2 class="section-title">
          ${isDe ? "Live-Telemetrie Status-Timeline" : "Live Telematics Status Timeline"}
        </h2>
        <div class="milestone-timeline">
          ${timelineNodesHtml}
        </div>
      </section>

      <!-- Verified Documents & Customs Paperwork -->
      <section class="portal-details-card">
        <h2 class="section-title">
          🛡️ ${isDe ? "Zollunterlagen & Frachtpapiere" : "Customs Documents & Waybills"}
        </h2>
        <p class="section-intro">
          ${isDe ? "Offiziell geprüfte Begleitpapiere nach EU-Zollkodex (UZK) und ATLAS-Standard." : "Officially verified shipping documents compliant with EU Customs Code (UCC) and ATLAS standards."}
        </p>
        <div class="documents-list">
          ${documentsHtml}
        </div>
      </section>
    </div>
  `;
}
