import { FeederTour, TourStatus } from "../repositories/dispatch.js";

/**
 * Render the Dispatch & Feeder Fleet Planning Operations Cockpit
 * WHY: Delivers an interactive, high-contrast operational dispatch board
 * for seaport feeder trucks, intermodal rail shuttles, and inland barges.
 * Enforces German DSGVO pseudonymization and vehicle capacity bounds (D-008).
 */
export function renderDispatchView(
  tours: FeederTour[],
  tenantId: string,
  lang: "de" | "en",
  activeFilter: string = "ALL",
  searchQuery: string = ""
): string {
  const isDe = lang === "de";

  // Calculate Aggregated Fleet Metrics for the KPI Ribbon
  const totalTours = tours.length;
  const enRouteTours = tours.filter((t) => t.status === "EN_ROUTE").length;

  const totalLoadedPallets = tours.reduce((sum, t) => sum + t.capacity.loadedPallets, 0);
  const totalMaxPallets = tours.reduce((sum, t) => sum + t.capacity.maxPallets, 0);
  const palletUtilPercent = totalMaxPallets > 0 ? Math.round((totalLoadedPallets / totalMaxPallets) * 100) : 0;

  const totalLoadedKg = tours.reduce((sum, t) => sum + t.capacity.loadedWeightKg, 0);
  const totalMaxKg = tours.reduce((sum, t) => sum + t.capacity.maxWeightKg, 0);
  const weightUtilPercent = totalMaxKg > 0 ? Math.round((totalLoadedKg / totalMaxKg) * 100) : 0;

  // Render Status Filter Tabs
  const statusTabs: { id: string; labelDe: string; labelEn: string }[] = [
    { id: "ALL", labelDe: "Alle Touren", labelEn: "All Tours" },
    { id: "EN_ROUTE", labelDe: "Im Transit", labelEn: "En Route" },
    { id: "PLANNED", labelDe: "Geplant", labelEn: "Planned" },
    { id: "COMPLETED", labelDe: "Abgeschlossen", labelEn: "Completed" },
  ];

  const filterTabsHtml = statusTabs
    .map((tab) => {
      const isActive = activeFilter === tab.id;
      const count =
        tab.id === "ALL" ? totalTours : tours.filter((t) => t.status === tab.id).length;
      const label = isDe ? tab.labelDe : tab.labelEn;
      const activeClass = isActive ? "dispatch-tab active" : "dispatch-tab";
      return `
        <a href="/portal/dispatch?status=${tab.id}&lang=${lang}${searchQuery ? `&q=${encodeURIComponent(searchQuery)}` : ""}" class="${activeClass}">
          ${label} <span class="tab-count-badge">${count}</span>
        </a>
      `;
    })
    .join("\n");

  // Helper for Transport Mode Badges
  const getModeBadge = (mode: string) => {
    switch (mode) {
      case "ROAD_FEEDER":
        return `<span class="mode-badge mode-road">🚛 ${isDe ? "LKW-Hauptlauf" : "Road Feeder"}</span>`;
      case "RAIL_INTERMODAL":
        return `<span class="mode-badge mode-rail">🚆 ${isDe ? "Güterbahn-Shuttle" : "Intermodal Rail"}</span>`;
      case "BARGE_INLAND":
        return `<span class="mode-badge mode-barge">🚢 ${isDe ? "Binnenschiff" : "Inland Barge"}</span>`;
      default:
        return `<span class="mode-badge">${mode}</span>`;
    }
  };

  // Helper for Tour Status Badges
  const getStatusBadge = (status: TourStatus) => {
    switch (status) {
      case "EN_ROUTE":
        return `<span class="badge-pill-success">● ${isDe ? "Im Transit (Aktiv)" : "En Route (Active)"}</span>`;
      case "PLANNED":
        return `<span class="badge-pill-neutral">○ ${isDe ? "Disponiert (Bereit)" : "Planned (Ready)"}</span>`;
      case "COMPLETED":
        return `<span class="badge-pill-neutral">✓ ${isDe ? "Abgeschlossen" : "Completed"}</span>`;
      case "CANCELLED":
        return `<span class="badge-pill-danger">✕ ${isDe ? "Storniert" : "Cancelled"}</span>`;
    }
  };

  // Render Individual Tour Cards
  const tourCardsHtml = tours.length === 0
    ? `
      <div class="empty-tours-card">
        <p class="empty-icon">🚛</p>
        <p class="empty-title"><strong>${isDe ? "Keine Touren gefunden" : "No Tours Found"}</strong></p>
        <p class="empty-desc">${isDe ? "Für die gewählten Filterkriterien liegen keine disponierten Fahrten vor." : "No scheduled tours match the selected filter criteria."}</p>
        <p><a href="/portal/dispatch?lang=${lang}" class="btn-doc-download" style="margin-top:12px;">${isDe ? "Alle Filter zurücksetzen" : "Reset All Filters"}</a></p>
      </div>
    `
    : tours.map((tour) => {
        const palletPercent = Math.min(100, Math.round((tour.capacity.loadedPallets / tour.capacity.maxPallets) * 100));
        const weightPercent = Math.min(100, Math.round((tour.capacity.loadedWeightKg / tour.capacity.maxWeightKg) * 100));

        const palletColorClass = palletPercent >= 90 ? "load-bar-high" : palletPercent >= 60 ? "load-bar-med" : "load-bar-normal";
        const weightColorClass = weightPercent >= 90 ? "load-bar-high" : weightPercent >= 60 ? "load-bar-med" : "load-bar-normal";

        const depFormatted = new Date(tour.departureTime).toLocaleString(isDe ? "de-DE" : "en-US", {
          dateStyle: "short",
          timeStyle: "short",
        });
        const arrFormatted = new Date(tour.estimatedArrival).toLocaleString(isDe ? "de-DE" : "en-US", {
          dateStyle: "short",
          timeStyle: "short",
        });

        const assignedHtml = tour.assignedShipments.length > 0
          ? tour.assignedShipments.map((shp) => `<a href="/portal/tracking?id=${shp}&lang=${lang}" class="shipment-code-chip" title="${isDe ? 'Sendung verfolgen' : 'Track shipment'}">📦 ${shp}</a>`).join(" ")
          : `<span class="text-muted" style="font-size:12px;">${isDe ? "Keine Sendungen zugeordnet" : "No shipments assigned"}</span>`;

        const adrNoticeHtml = tour.adrHazardousClass
          ? `<div class="adr-alert-box">
              <span class="adr-icon">⚠️</span>
              <div>
                <strong>ADR-Gefahrgutdeklaration:</strong>
                <p>${tour.adrHazardousClass}</p>
              </div>
            </div>`
          : `<div class="adr-safe-box">
              <span class="adr-safe-icon">✓</span>
              <span>${isDe ? "Standardladung (Gefahrgutfrei / Keine ADR-Restriktionen)" : "Standard Freight (Non-hazardous / No ADR restrictions)"}</span>
            </div>`;

        return `
          <article class="tour-card" data-tour-id="${tour.tourId}">
            <div class="tour-card-header">
              <div class="tour-id-group">
                <span class="tour-id-tag"><code>${tour.tourId}</code></span>
                ${getModeBadge(tour.transportMode)}
              </div>
              <div class="tour-status-group">
                ${getStatusBadge(tour.status)}
              </div>
            </div>

            <h3 class="tour-title">${isDe ? tour.tourTitleDe : tour.tourTitleEn}</h3>

            <div class="tour-corridor-box">
              <span class="corridor-icon">➔</span>
              <strong class="corridor-text">${tour.corridor}</strong>
            </div>

            <div class="tour-meta-grid">
              <div class="tour-meta-item">
                <span class="meta-label">${isDe ? "Fahrzeug / Einheit:" : "Vehicle / Unit:"}</span>
                <span class="meta-val">🚚 ${tour.vehicleIdentifier}</span>
              </div>
              <div class="tour-meta-item">
                <span class="meta-label">${isDe ? "Fahrpersonal (DSGVO):" : "Crew (GDPR Token):"}</span>
                <span class="meta-val"><code class="driver-token" title="Pseudonymisierter DSGVO-Mitarbeiter">${tour.driverPseudonym}</code></span>
              </div>
              <div class="tour-meta-item">
                <span class="meta-label">${isDe ? "Abfahrt (Soll):" : "Departure (ETD):"}</span>
                <span class="meta-val">⏱️ ${depFormatted}</span>
              </div>
              <div class="tour-meta-item">
                <span class="meta-label">${isDe ? "Ankunft (Geschätzt):" : "Arrival (ETA):"}</span>
                <span class="meta-val">🏁 ${arrFormatted}</span>
              </div>
            </div>

            <!-- Capacity Load Meters -->
            <div class="capacity-section">
              <h4 class="capacity-heading">${isDe ? "Ladekapazität & Auslastung" : "Vehicle Capacity & Load Invariants"}</h4>
              
              <!-- Pallet Meter -->
              <div class="load-meter-row">
                <div class="load-meter-labels">
                  <span class="load-type">${isDe ? "Paletten-Stellplätze:" : "Pallet Bays:"}</span>
                  <span class="load-stats"><strong>${tour.capacity.loadedPallets}</strong> / ${tour.capacity.maxPallets} (${palletPercent}%)</span>
                </div>
                <div class="load-track">
                  <div class="load-fill ${palletColorClass}" style="width: ${palletPercent}%;"></div>
                </div>
              </div>

              <!-- Weight Meter -->
              <div class="load-meter-row">
                <div class="load-meter-labels">
                  <span class="load-type">${isDe ? "Nutzlast (Gewicht):" : "Payload (Gross Weight):"}</span>
                  <span class="load-stats"><strong>${(tour.capacity.loadedWeightKg / 1000).toFixed(1)}t</strong> / ${(tour.capacity.maxWeightKg / 1000).toFixed(1)}t (${weightPercent}%)</span>
                </div>
                <div class="load-track">
                  <div class="load-fill ${weightColorClass}" style="width: ${weightPercent}%;"></div>
                </div>
              </div>
            </div>

            <!-- ADR Hazardous Warning Box -->
            ${adrNoticeHtml}

            <!-- Assigned Shipments -->
            <div class="assigned-shipments-row">
              <span class="assigned-label">${isDe ? "Zugeordnete Frachtsendungen:" : "Assigned Shipments:"}</span>
              <div class="assigned-chips">${assignedHtml}</div>
            </div>
          </article>
        `;
      }).join("\n");

  return `
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/portal?lang=${lang}">← ${isDe ? "Zurück zur Hauptübersicht" : "Back to Overview"}</a>
    </nav>

    <!-- Dispatch Hero Card -->
    <section class="portal-hero-card">
      <div class="hero-header">
        <div>
          <div class="shipment-id-badge-row">
            <span class="carrier-chip carrier-schenker">🚛 ${isDe ? "Tourendisposition & Zubringernetz" : "Feeder Dispatch & Network"}</span>
            <h1 class="hero-title" style="display:inline; margin-left: 8px;">
              ${isDe ? "Disposition & Zubringer-Tourenplanung" : "Dispatch & Feeder Fleet Planning"}
            </h1>
          </div>
          <p class="hero-subtitle">
            ${isDe ? "Zentrale Disposition für Seehafen-Zubringer (LKW-Hauptlauf, Güterbahn-Shuttle und Binnenschiff) mit Echtzeit-Kapazitätskontrolle und DSGVO-Mitarbeiterschutz für Schäfer & SIS Interlogistik." : "Central dispatch console for seaport feeder transport (road freight, rail shuttle, inland barge) with real-time capacity validation and GDPR worker privacy for Schäfer & SIS Interlogistik."}
          </p>
        </div>
        <div class="hero-badge">
          <span class="badge-pill-success">● ${isDe ? "Dispositions-Leitstand aktiv" : "Dispatch Console Active"}</span>
        </div>
      </div>

      <!-- Fleet KPI Ribbon (4 Metrics) -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Aktive Touren" : "Total Tours"}</span>
            <span class="metric-icon">🚛</span>
          </div>
          <div class="metric-value">${totalTours}</div>
          <p class="metric-footer">${isDe ? `${enRouteTours} Fahrzeuge im Zulauf` : `${enRouteTours} vehicles en route`}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Paletten-Auslastung" : "Pallet Utilization"}</span>
            <span class="metric-icon">📊</span>
          </div>
          <div class="metric-value">${palletUtilPercent}%</div>
          <p class="metric-footer">${totalLoadedPallets} / ${totalMaxPallets} ${isDe ? "Stellplätze belegt" : "bays allocated"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Gewichts-Auslastung" : "Payload Utilization"}</span>
            <span class="metric-icon">⚖️</span>
          </div>
          <div class="metric-value">${weightUtilPercent}%</div>
          <p class="metric-footer">${(totalLoadedKg / 1000).toFixed(1)}t / ${(totalMaxKg / 1000).toFixed(1)}t ${isDe ? "Nutzlast" : "gross weight"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "DSGVO & ADR-Schutz" : "GDPR & ADR Compliance"}</span>
            <span class="metric-icon">🛡️</span>
          </div>
          <div class="metric-value">100%</div>
          <p class="metric-footer">${isDe ? "Art. 5 DSGVO Pseudonyme" : "Art. 5 GDPR Pseudonymized"}</p>
        </div>
      </div>
    </section>

    <!-- Two-Column Layout: Left = Filter & Tours Grid, Right = Fast Booking Console -->
    <div class="dispatch-layout-container">
      <!-- Left Column: Tour Directory -->
      <div class="dispatch-tours-column">
        <!-- Filter Bar & Search Toolbar -->
        <div class="dispatch-toolbar-card">
          <div class="dispatch-tabs-container">
            ${filterTabsHtml}
          </div>
          <form method="GET" action="/portal/dispatch" class="dispatch-search-form">
            <input type="hidden" name="lang" value="${lang}">
            <input type="hidden" name="status" value="${activeFilter}">
            <input
              type="text"
              name="q"
              value="${searchQuery}"
              placeholder="${isDe ? 'Tour-ID, Korridor, LKW suchen…' : 'Search tour ID, corridor, truck…'}"
              class="dispatch-search-input"
              aria-label="Tour search"
            >
            <button type="submit" class="btn-dispatch-search">${isDe ? "Suchen" : "Search"}</button>
          </form>
        </div>

        <!-- Tours Grid -->
        <div class="tours-list-grid">
          ${tourCardsHtml}
        </div>
      </div>

      <!-- Right Column: Interactive Shipment Assignment Action Console -->
      <aside class="dispatch-action-column">
        <div class="portal-details-card dispatch-assign-box">
          <h2 class="section-title">
            <span>📦</span> ${isDe ? "Sendung zu Tour disponieren" : "Assign Freight to Tour"}
          </h2>
          <p class="card-subtitle">
            ${isDe ? "Buchen Sie ankommende Seehafen-Fracht auf geplante Zubringer-Touren. Die physikalischen Stellplatz- und Nutzlastgrenzen werden in Echtzeit geprüft (D-008)." : "Allocate incoming seaport shipments to planned feeder tours. Physical pallet limits and payload bounds are validated in real time (D-008)."}
          </p>

          <form id="dispatch-assign-form" class="assign-form" onsubmit="event.preventDefault(); window.handleAssignShipment(event);">
            <div class="form-field-group">
              <label for="assign-tour-select" class="form-field-label">
                ${isDe ? "Ziel-Tour auswählen:" : "Select Target Feeder Tour:"}
              </label>
              <select id="assign-tour-select" class="form-input-text" required>
                ${tours.filter(t => t.status !== "COMPLETED" && t.status !== "CANCELLED").map(t => `
                  <option value="${t.tourId}">
                    ${t.tourId} — ${t.corridor} (${t.capacity.maxPallets - t.capacity.loadedPallets} ${isDe ? 'Paletten frei' : 'pallets free'})
                  </option>
                `).join("\n")}
              </select>
            </div>

            <div class="form-field-group">
              <label for="assign-shipment-id" class="form-field-label">
                ${isDe ? "Sendungsnummer (Shipment ID):" : "Shipment Reference ID:"}
              </label>
              <input
                type="text"
                id="assign-shipment-id"
                class="form-input-text"
                placeholder="z.B. SHP-SIS-2088"
                value="SHP-SIS-2088"
                required
              >
            </div>

            <div class="form-field-row" style="display:grid; grid-template-columns: 1fr 1fr; gap: var(--space-3);">
              <div class="form-field-group">
                <label for="assign-pallets" class="form-field-label">
                  ${isDe ? "Paletten-Anzahl:" : "Pallet Count:"}
                </label>
                <input
                  type="number"
                  id="assign-pallets"
                  class="form-input-text"
                  min="1"
                  max="66"
                  value="4"
                  required
                >
              </div>

              <div class="form-field-group">
                <label for="assign-weight" class="form-field-label">
                  ${isDe ? "Gewicht (kg):" : "Weight (kg):"}
                </label>
                <input
                  type="number"
                  id="assign-weight"
                  class="form-input-text"
                  min="1"
                  max="50000"
                  value="1200"
                  required
                >
              </div>
            </div>

            <button type="submit" id="btn-submit-assignment" class="btn-primary-action" style="width: 100%; margin-top: var(--space-4);">
              <span>⚡</span> ${isDe ? "Fracht verbindlich disponieren" : "Confirm Tour Booking"}
            </button>
          </form>

          <div id="assign-result-message" class="assign-feedback-box" style="display:none;" aria-live="polite"></div>

          <!-- Dispatch Guardrail Notice -->
          <div class="guardrail-notice-box" style="margin-top: var(--space-4);">
            <p><strong>🛡️ ${isDe ? "Sicherheits- & Kapazitätsrichtlinie:" : "Safety & Capacity Rules:"}</strong></p>
            <ul style="margin-left: 18px; font-size: 12px; line-height: 1.6; color: var(--color-text-muted);">
              <li>${isDe ? "Maximale Überladung wird mit HTTP 400 'Capacity Overload' abgewiesen." : "Overloading is rejected with HTTP 400 'Capacity Overload'."}</li>
              <li>${isDe ? "Fahrerdaten werden gemäß Art. 5 DSGVO ausschließlich pseudonymisiert dargestellt." : "Driver profiles are strictly pseudonymized pursuant to Art. 5 DSGVO."}</li>
              <li>${isDe ? "ADR-Klassen erfordern zugelassene Transportmittel mit Gefahrgut-Sicherheitsausstattung." : "ADR hazardous classifications require safety certified vehicles."}</li>
            </ul>
          </div>
        </div>
      </aside>
    </div>

    <script>
      window.handleAssignShipment = async function(e) {
        const resultBox = document.getElementById("assign-result-message");
        const submitBtn = document.getElementById("btn-submit-assignment");
        const tourId = document.getElementById("assign-tour-select").value;
        const shipmentId = document.getElementById("assign-shipment-id").value.trim();
        const pallets = parseInt(document.getElementById("assign-pallets").value, 10);
        const weightKg = parseFloat(document.getElementById("assign-weight").value);

        submitBtn.disabled = true;
        resultBox.style.display = "block";
        resultBox.className = "assign-feedback-box feedback-loading";
        resultBox.textContent = "${isDe ? 'Übermittle Buchung an Dispositions-API…' : 'Submitting booking to dispatch API…'}";

        try {
          const res = await fetch('/api/v1/dispatch/tours/' + encodeURIComponent(tourId) + '/assign', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Tenant-Id': '${tenantId}'
            },
            body: JSON.stringify({ shipmentId, pallets, weightKg })
          });

          const data = await res.json();
          if (res.ok) {
            resultBox.className = "assign-feedback-box feedback-success";
            resultBox.innerHTML = "<strong>✓ ${isDe ? 'Erfolgreich disponiert!' : 'Successfully Dispatched!'}</strong><br>" + data.message;
            setTimeout(() => window.location.reload(), 1400);
          } else {
            resultBox.className = "assign-feedback-box feedback-error";
            resultBox.innerHTML = "<strong>✕ ${isDe ? 'Dispositionsfehler:' : 'Dispatch Rejected:'}</strong><br>" + (data.message || data.error);
          }
        } catch (err) {
          resultBox.className = "assign-feedback-box feedback-error";
          resultBox.innerHTML = "<strong>✕ ${isDe ? 'Netzwerkfehler:' : 'Network Error:'}</strong> " + err.message;
        } finally {
          submitBtn.disabled = false;
        }
      };
    </script>
  `;
}
