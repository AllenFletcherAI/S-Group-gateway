import { Shipment } from "../repositories/shipments.js";
import { UnifiedMilestone } from "../schemas/carrierEvents.js";

function getStatusBadge(status: UnifiedMilestone, isDe: boolean): string {
  const map: Record<UnifiedMilestone, { de: string; en: string; css: string; icon: string }> = {
    BOOKING_CREATED: { de: "Gebucht", en: "Booked", css: "badge-neutral", icon: "📋" },
    PICKED_UP: { de: "Übernommen", en: "Picked Up", css: "badge-info", icon: "📦" },
    PORT_ARRIVED: { de: "Hafen eingetroffen", en: "Port Arrived", css: "badge-info", icon: "⚓" },
    CUSTOMS_INSPECTION: { de: "Zollprüfung", en: "Customs Hold", css: "badge-warning", icon: "⚠️" },
    CUSTOMS_CLEARED: { de: "Zollabfertigung OK", en: "Customs Cleared", css: "badge-success", icon: "🛡️" },
    IN_TRANSIT: { de: "Im Hauptlauf", en: "In Transit", css: "badge-info", icon: "🚚" },
    HUB_ARRIVED: { de: "Hub eingetroffen", en: "Hub Arrived", css: "badge-info", icon: "🏢" },
    OUT_FOR_DELIVERY: { de: "In Zustellung", en: "Out for Delivery", css: "badge-warning", icon: "🚛" },
    DELIVERED: { de: "Zugestellt", en: "Delivered", css: "badge-success", icon: "✅" },
    EXCEPTION_HOLD: { de: "Ausnahme / Stop", en: "Exception Hold", css: "badge-danger", icon: "🛑" },
  };

  const item = map[status] || { de: status, en: status, css: "badge-neutral", icon: "ℹ️" };
  const label = isDe ? item.de : item.en;
  return `<span class="milestone-pill ${item.css}" title="${label}">
    <span aria-hidden="true">${item.icon}</span> ${label}
  </span>`;
}

/**
 * Render the Shipment Directory View
 */
export function renderShipmentsView(shipments: Shipment[], lang: "de" | "en", currentCarrier?: string, currentSearch?: string): string {
  const isDe = lang === "de";

  const cardsHtml = shipments.length === 0
    ? `<div class="empty-state-box">
        <p class="empty-state-title">🔍 ${isDe ? "Keine Sendungen gefunden" : "No shipments found"}</p>
        <p class="empty-state-desc">${isDe ? "Bitte überprüfen Sie Ihre Filter oder Suchbegriffe." : "Please check your filter or search terms."}</p>
        <a href="/portal/shipments?lang=${lang}" class="btn-clear-filter">${isDe ? "Filter zurücksetzen" : "Reset Filters"}</a>
      </div>`
    : shipments
        .map((s) => {
          const statusBadge = getStatusBadge(s.currentStatus, isDe);
          const cargoDesc = isDe ? s.cargoDescriptionDe : s.cargoDescriptionEn;
          const docBadge = s.documents.length > 0
            ? `<span class="doc-count-tag" title="${s.documents.length} ${isDe ? "Zolldokumente verfügbar" : "customs documents available"}">
                📄 ${s.documents.length} ${isDe ? "Dokumente" : "Docs"}
              </span>`
            : "";

          return `
          <article class="shipment-card" data-shipment-id="${s.shipmentId}" onclick="window.location.href='/portal/tracking?id=${s.shipmentId}&lang=${lang}'" style="cursor: pointer;">
            <div class="shipment-card-top">
              <div class="shipment-id-group">
                <span class="carrier-chip carrier-${s.carrier.toLowerCase()}">${s.carrier}</span>
                <h3 class="shipment-id-title">${s.shipmentId}</h3>
                <span class="carrier-ref-tag" title="${isDe ? "Frachtführer-Referenz" : "Carrier Reference"}">#${s.trackingReference}</span>
              </div>
              <div class="shipment-card-status">
                ${statusBadge}
              </div>
            </div>

            <div class="shipment-route-row">
              <div class="route-point">
                <span class="route-label">${isDe ? "Abgangsort" : "Origin"}</span>
                <p class="route-location">📍 ${s.origin}</p>
              </div>
              <div class="route-arrow" aria-hidden="true">➔</div>
              <div class="route-point">
                <span class="route-label">${isDe ? "Bestimmungsort" : "Destination"}</span>
                <p class="route-location">🏁 ${s.destination}</p>
              </div>
            </div>

            <div class="shipment-meta-row">
              <p class="cargo-desc"><strong>${isDe ? "Frachtgut:" : "Cargo:"}</strong> ${cargoDesc} (<code>${s.weightKg.toLocaleString()} kg</code>)</p>
              <div class="meta-right">
                ${docBadge}
                <a href="/portal/tracking?id=${s.shipmentId}&lang=${lang}" class="btn-track-action" onclick="event.stopPropagation();">
                  ${isDe ? "Live-Tracking & Timeline ➔" : "Live Tracking & Timeline ➔"}
                </a>
              </div>
            </div>
          </article>
          `;
        })
        .join("\n");

  const carrierFilters = ["ALL", "DHL", "SCHENKER", "MAERSK"].map((c) => {
    const isSelected = (!currentCarrier && c === "ALL") || currentCarrier === c;
    const label = c === "ALL" ? (isDe ? "Alle Frachtführer" : "All Carriers") : c;
    const url = `/portal/shipments?carrier=${c}&lang=${lang}${currentSearch ? `&q=${encodeURIComponent(currentSearch)}` : ""}`;
    return `<a href="${url}" class="filter-tab ${isSelected ? "active" : ""}">${label}</a>`;
  }).join("\n");

  return `
    <section class="portal-hero-card">
      <div class="hero-header">
        <div>
          <h1 class="hero-title">${isDe ? "Sendungsverfolgung & Frachtübersicht" : "Freight Directory & Tracking"}</h1>
          <p class="hero-subtitle">
            ${isDe ? "Aktive Sendungen für Mandant DE-SIS-8921. Klicken Sie auf eine Sendung, um die Live-Telemetrie-Timeline zu öffnen." : "Active shipments for tenant DE-SIS-8921. Click any shipment to inspect its live telematics timeline."}
          </p>
        </div>
        <div class="hero-badge">
          <span class="badge-pill-success">● ${shipments.length} ${isDe ? "Sendungen aktiv" : "Active Shipments"}</span>
        </div>
      </div>

      <!-- Filter & Search Toolbar -->
      <div class="shipments-toolbar">
        <div class="carrier-filter-tabs" role="tablist">
          ${carrierFilters}
        </div>
        <form class="shipments-search-form" method="GET" action="/portal/shipments">
          <input type="hidden" name="lang" value="${lang}">
          ${currentCarrier && currentCarrier !== "ALL" ? `<input type="hidden" name="carrier" value="${currentCarrier}">` : ""}
          <input
            type="search"
            name="q"
            class="shipments-search-input"
            placeholder="${isDe ? "Sendungs-Nr., Container, Frachtgut..." : "Shipment No., Container, Cargo..."}"
            value="${currentSearch || ""}"
            aria-label="${isDe ? "Sendungen filtern" : "Filter shipments"}"
          >
          <button type="submit" class="btn-search-submit">${isDe ? "Suchen" : "Search"}</button>
        </form>
      </div>

      <!-- Shipment Cards List -->
      <div class="shipments-list">
        ${cardsHtml}
      </div>
    </section>
  `;
}
