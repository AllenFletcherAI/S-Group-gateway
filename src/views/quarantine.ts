/**
 * Tab 3: Quarantäne & Standgeld-Cockpit (Quarantine & Demurrage Center)
 * S-Group Gateway - Schäfer & SIS Interlogistik
 *
 * WHY: Dedicated operational Leitstand isolating freight discrepancies before port gate-in,
 * tracking ticking demurrage costs (€150–€500/day), and issuing formal ADSp 2017 legal claims.
 */

import { ProcessedShipmentRecord, ComplianceLedgerService } from "../services/complianceLedger.js";

export interface QuarantineViewOptions {
  lang?: "de" | "en";
  filter?: string;
  search?: string;
  cases?: ProcessedShipmentRecord[];
}

export function renderQuarantineView(options: QuarantineViewOptions = {}): string {
  const { lang = "de", filter = "all", search = "" } = options;
  const isDe = lang === "de";

  const activeCases = options.cases || ComplianceLedgerService.getQuarantineShipments(filter, search);
  const criticalCount = activeCases.filter((c) => (c.free_days_remaining_hours ?? 72) <= 24).length;
  const metrics = ComplianceLedgerService.getKpiMetrics();

  const rowsHtml = activeCases.length > 0
    ? activeCases.map((c) => {
        const remainingHours = c.free_days_remaining_hours ?? 48;
        const isCritical = remainingHours <= 24;
        const timeBadgeColor = isCritical ? "#EF4444" : "#F59E0B";
        const dailyRate = c.daily_demurrage_eur ? `${c.daily_demurrage_eur.toFixed(0)} € / ${isDe ? "Tag" : "day"}` : `350 € / ${isDe ? "Tag" : "day"}`;
        const discrepancy = c.override_reason || (c.gross_weight_kg ? `+220 kg VGM Delta (B/L vs Packliste)` : "Fehlende Handelsrechnung / ATLAS Deklaration");
        const statusBadge = c.audit_status === "OVERRIDDEN_RELEASED"
          ? `<span class="stage-badge-pill pass">${isDe ? "FREIGEGEBEN" : "OVERRIDDEN"}</span>`
          : (isCritical
            ? `<span class="stage-badge-pill hold">${isDe ? "AKUT" : "CRITICAL"}</span>`
            : `<span class="stage-badge-pill hold">${isDe ? "QUARANTÄNE" : "QUARANTINE"}</span>`);

        return `
          <tr id="row-quarantine-${c.shipment_ref}">
            <td>
              <strong style="color:#0284C7;">${c.shipment_ref}</strong>
              <div style="font-size:11px; color:var(--color-text-muted);">${c.terminal || "Hamburg CTA (Altenwerder)"}</div>
            </td>
            <td>
              <code style="font-size:12px; font-weight:700;">${c.container_number || "N/A"}</code>
              <div style="font-size:11px; color:var(--color-text-muted);">${c.carrier || "Maersk Line (Ocean Feeder)"}</div>
            </td>
            <td>
              <div style="display:flex; align-items:center; gap:6px;">
                <span style="color:${timeBadgeColor}; font-weight:700;">
                  <i class="fa-regular fa-clock"></i> ${remainingHours}h ${isDe ? "verbleibend" : "remaining"}
                </span>
              </div>
              <div style="font-size:11px; color:var(--color-text-muted);">${isDe ? "Freitage bis Schiffsabfahrt" : "Free days until departure"}</div>
            </td>
            <td>
              <span class="stage-badge-pill hold"><i class="fa-solid fa-triangle-exclamation"></i> ${discrepancy}</span>
              <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">
                ${isDe ? "Deklariert" : "Declared"}: ${c.gross_weight_kg ? `${c.gross_weight_kg.toLocaleString()} kg` : "N/A"} • ${c.incoterm || "CIF"}
              </div>
            </td>
            <td style="text-align:right; font-weight:700; color:#EF4444;">
              ${dailyRate}
            </td>
            <td style="text-align:center;" id="status-cell-${c.shipment_ref}">
              ${statusBadge}
            </td>
            <td style="text-align:right;">
              <button type="button" class="zoom-btn" onclick="openAdspModal('${c.container_number || c.shipment_ref}')" style="color:#EF4444; border-color:#DC2626; display:inline-flex; align-items:center; gap:4px;">
                <i class="fa-solid fa-scale-balanced"></i> ${isDe ? "Haftungsanzeige" : "ADSp Claim"}
              </button>
              ${c.audit_status !== "OVERRIDDEN_RELEASED" ? `
              <button type="button" class="zoom-btn" onclick="openSupervisorOverrideModal('${c.shipment_ref}')" style="margin-left:4px; display:inline-flex; align-items:center; gap:4px;">
                <i class="fa-solid fa-lock-open"></i> ${isDe ? "Freigabe" : "Override"}
              </button>` : ""}
            </td>
          </tr>
        `;
      }).join("\n")
    : `
      <tr>
        <td colspan="7" style="text-align:center; padding:32px; color:var(--color-text-muted);">
          <i class="fa-solid fa-circle-check" style="color:#10B981; font-size:24px; margin-bottom:8px; display:block;"></i>
          ${isDe ? "Keine aktiven Quarantäne-Fälle für diesen Filter vorhanden." : "No active quarantine holds found for this filter."}
        </td>
      </tr>
    `;

  return `
    <div class="quarantine-workspace-container" id="quarantine-workspace">
      <div class="portal-details-card" style="width:100%; max-width:100%; box-sizing:border-box;">
      
      <!-- Top Leitstand Header -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; border-bottom:1px solid var(--color-border-slate); padding-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-triangle-exclamation" style="font-size:22px; color:#EF4444;"></i>
            <h1 class="section-title" style="margin:0;">
              ${isDe ? "Quarantäne-Leitstand & Demurrage-Schutz" : "Quarantine Cockpit & Demurrage Protection"}
            </h1>
          </div>
          <p style="font-size:13px; color:var(--color-text-muted); margin:4px 0 0 0;">
            ${isDe 
              ? "Präventive Isolierung fehlerhafter Container vor Hafeneinfahrt (Hamburg CTA, CTB, Eurogate) zur Abwehr von Liegegeldern." 
              : "Preventative isolation of container discrepancies prior to port gate-in averting demurrage fees."}
          </p>
        </div>

        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <button type="button" class="zoom-btn" onclick="openAdspModal('MSKU7829107')" style="background:#EF4444; color:#FFFFFF; border-color:#DC2626; padding:8px 12px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-scale-balanced"></i> ${isDe ? "ADSp 2017 Haftungsanzeige" : "ADSp 2017 Legal Claim"}
          </button>
          <button type="button" class="zoom-btn" onclick="exportQuarantineCsv()" style="padding:8px 12px; display:inline-flex; align-items:center; gap:6px;">
            <i class="fa-solid fa-file-arrow-down"></i> ${isDe ? "CSV Export" : "CSV Export"}
          </button>
        </div>
      </div>

      <!-- 4 Executive KPI Triage Cards -->
      <div class="quarantine-kpi-grid">
        <div class="quar-kpi-card" style="border-left:4px solid #EF4444;">
          <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--color-text-muted);">
            ${isDe ? "Aktive Quarantäne-Fälle" : "Active Quarantine Cases"}
          </div>
          <div class="kpi-number" style="color:#EF4444;">${activeCases.length}</div>
          <div style="font-size:11.5px; color:#EF4444; font-weight:600; margin-top:2px;">
            ${isDe ? "Sofortige Klärung erforderlich" : "Immediate action required"}
          </div>
        </div>

        <div class="quar-kpi-card" style="border-left:4px solid #F59E0B;">
          <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--color-text-muted);">
            ${isDe ? "Akute Frist (< 24h)" : "Critical Deadline (< 24h)"}
          </div>
          <div class="kpi-number" style="color:#F59E0B;">${criticalCount}</div>
          <div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;">
            ${isDe ? "Freitage laufen heute ab" : "Free days expire today"}
          </div>
        </div>

        <div class="quar-kpi-card" style="border-left:4px solid #10B981;">
          <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--color-text-muted);">
            ${isDe ? "Abgewendete Standgelder" : "Demurrage Prevented"}
          </div>
          <div class="kpi-number" style="color:#10B981;">${metrics.demurrageSavedEur.toLocaleString()} €</div>
          <div style="font-size:11.5px; color:#10B981; font-weight:600; margin-top:2px;">
            ${isDe ? "Erfolgreich abgewendet" : "Successfully averted"}
          </div>
        </div>

        <div class="quar-kpi-card" style="border-left:4px solid #0284C7;">
          <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--color-text-muted);">
            ${isDe ? "Rechtswahrung" : "Legal Framework"}
          </div>
          <div class="kpi-number" style="color:#0284C7;">ADSp 2017</div>
          <div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;">
            ${isDe ? "§ 412 HGB Haftungsfrist" : "§ 412 HGB Shipper Liability"}
          </div>
        </div>
      </div>

      <!-- Quick Triage Filter Tabs & Search Bar -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:16px;">
        <div style="display:flex; gap:6px;">
          <a href="/portal/quarantine?filter=all&lang=${lang}" class="zoom-btn" style="${filter === "all" ? "background:#0284C7; color:#FFFFFF; border-color:#38BDF8;" : ""}">
            ${isDe ? `Alle Fälle (${activeCases.length})` : `All Holds (${activeCases.length})`}
          </a>
          <a href="/portal/quarantine?filter=critical&lang=${lang}" class="zoom-btn" style="${filter === "critical" ? "background:#0284C7; color:#FFFFFF; border-color:#38BDF8;" : ""}">
            ${isDe ? `Akut < 24h (${criticalCount})` : `Critical < 24h (${criticalCount})`}
          </a>
          <a href="/portal/quarantine?filter=hamburg&lang=${lang}" class="zoom-btn" style="${filter === "hamburg" ? "background:#0284C7; color:#FFFFFF; border-color:#38BDF8;" : ""}">
            ${isDe ? "Seehafen Hamburg" : "Hamburg Seaport"}
          </a>
        </div>

        <div style="display:flex; align-items:center; gap:8px;">
          <input
            type="search"
            class="header-search-input"
            style="border:1px solid var(--color-border-slate); border-radius:6px; padding:6px 10px; background:var(--color-surface-white); color:var(--color-text-primary); font-size:12px; width:220px;"
            placeholder="${isDe ? "Container oder Sendung..." : "Search container or ref..."}"
            value="${search}"
            oninput="handleQuarantineSearch(this.value)"
          >
        </div>
      </div>

      <!-- Live Quarantine Queue Table -->
      <div class="quarantine-table-wrap">
        <table class="quarantine-table">
          <thead>
            <tr>
              <th>${isDe ? "Sendung & Terminal" : "Shipment & Terminal"}</th>
              <th>${isDe ? "Container / Einheit & Carrier" : "Container / Unit & Carrier"}</th>
              <th>${isDe ? "Freitage & Liegegeld-Uhr" : "Free Days & Demurrage Clock"}</th>
              <th>${isDe ? "Fehlerursache & Abweichung" : "Discrepancy Cause & Delta"}</th>
              <th style="text-align:right;">${isDe ? "Risiko / Tag" : "Risk / Day"}</th>
              <th style="text-align:center;">${isDe ? "Status" : "Status"}</th>
              <th style="text-align:right;">${isDe ? "Leitstand-Aktionen" : "Operator Actions"}</th>
            </tr>
          </thead>
          <tbody id="quarantine-table-rows">
            ${rowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Legal Claim Modal Backdrop (ADSp 2017 Notice) -->
      <div id="modal-adsp-claim" class="modal-backdrop hidden" onclick="if(event.target === this) closeAdspModal()">
        <div class="cert-modal-dialog" style="max-width:700px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1E293B; padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-scale-balanced" style="font-size:18px; color:#EF4444;"></i>
              <strong style="font-size:15px; color:#FFFFFF;">
                ${isDe ? "Offizielle Haftungsanzeige nach ADSp 2017 Ziff. 19 & § 412 HGB" : "Official Carrier Discrepancy Claim (ADSp 2017 & § 412 HGB)"}
              </strong>
            </div>
            <button type="button" onclick="closeAdspModal()" class="zoom-btn" style="padding:4px 8px;">✕</button>
          </div>

          <div style="padding:16px 0; font-size:13px; line-height:1.6; color:#E2E8F0;" id="adsp-claim-text">
            <p><strong>SPEDITIONS-BEANSTANDUNG & LIEGEGELD-AVIS</strong></p>
            <p>Bezug Container: <code id="adsp-container-ref" style="color:#38BDF8; font-weight:700;">MSKU7829107</code></p>
            <p>Sehr geehrte Damen und Herren,</p>
            <p>
              hiermit zeigen wir namens und im Auftrag unseres Mandanten an, dass bezüglich des oben bezeichneten 
              Seecontainers vor Gate-In am Terminal eine erhebliche Diskrepanz zwischen den Frachtpapieren (B/L) 
              und der Packliste bzw. dem VGM-Wiegeschein festgestellt wurde.
            </p>
            <p>
              Zur Abwendung zollrechtlicher Beschlagnahmen oder Liegegelder (Demurrage & Detention) nach Schiffsankunft 
              wird die Einheit bis zur Nachreichung korrigierter Dokumente in unserem Quarantäne-Leitstand geführt. 
              Wir behalten uns alle Rechte nach § 412 HGB und Ziff. 19 ADSp 2017 vollumfänglich vor.
            </p>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="zoom-btn" onclick="copyAdspClaimText()" style="background:#EF4444; color:#FFFFFF; border-color:#DC2626; padding:8px 14px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-regular fa-copy"></i> ${isDe ? "Avis-Text kopieren" : "Copy Claim Text"}
            </button>
            <button type="button" class="zoom-btn" onclick="closeAdspModal()" style="padding:8px 14px;">
              ${isDe ? "Schließen" : "Close"}
            </button>
          </div>
        </div>
      </div>

      <!-- Dedicated Supervisor Override Modal Dialog (Replaces browser prompt) -->
      <div id="modal-supervisor-override" class="modal-backdrop hidden" onclick="if(event.target === this) closeSupervisorOverrideModal()">
        <div class="cert-modal-dialog" style="max-width:550px;">
          <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid #1E293B; padding-bottom:12px;">
            <div style="display:flex; align-items:center; gap:8px;">
              <i class="fa-solid fa-lock-open" style="font-size:18px; color:#10B981;"></i>
              <strong style="font-size:15px; color:#FFFFFF;">
                ${isDe ? "Supervisor-Freigabe erteilen (§ 147 AO / GoBD)" : "Grant Supervisor Override (§ 147 AO / GoBD)"}
              </strong>
            </div>
            <button type="button" onclick="closeSupervisorOverrideModal()" class="zoom-btn" style="padding:4px 8px;">✕</button>
          </div>

          <div style="padding:16px 0; font-size:13px; color:#E2E8F0;">
            <div style="margin-bottom:12px;">
              <span style="font-size:11px; text-transform:uppercase; color:#94A3B8; font-weight:700;">${isDe ? "Sendungsreferenz" : "Shipment Reference"}:</span>
              <div id="override-modal-ref" style="font-size:15px; font-weight:700; color:#38BDF8; font-family:monospace; margin-top:2px;">-</div>
            </div>

            <div style="margin-bottom:12px;">
              <label for="override-reason-input" style="display:block; font-size:12px; font-weight:600; color:#F1F5F9; margin-bottom:4px;">
                ${isDe ? "Revisionsbegründung (Pflichtfeld nach GoBD):" : "Audit Justification (Mandatory per GoBD):"}
              </label>
              <textarea
                id="override-reason-input"
                rows="3"
                style="width:100%; box-sizing:border-box; background:#0B1320; border:1px solid #2A3B55; border-radius:6px; color:#F1F5F9; padding:8px 10px; font-size:12.5px; font-family:inherit; resize:vertical;"
                placeholder="${isDe ? "z.B. Wiegenote korrigiert, Reeder bestätigt Sonderfreigabe..." : "e.g. Weight ticket revised, carrier confirmed special release..."}"
              ></textarea>
            </div>

            <div>
              <label for="override-operator-input" style="display:block; font-size:12px; font-weight:600; color:#F1F5F9; margin-bottom:4px;">
                ${isDe ? "Autorisierter Disponent / Supervisor:" : "Authorized Supervisor / Operator:"}
              </label>
              <input
                type="text"
                id="override-operator-input"
                value="Leitstand-Supervisor"
                style="width:100%; box-sizing:border-box; background:#0B1320; border:1px solid #2A3B55; border-radius:6px; color:#F1F5F9; padding:6px 10px; font-size:12.5px;"
              >
            </div>
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px; border-top:1px solid #1E293B; padding-top:12px;">
            <button type="button" class="zoom-btn" onclick="submitSupervisorOverride()" style="background:#059669; color:#FFFFFF; border-color:#10B981; padding:8px 16px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-check"></i> ${isDe ? "Freigabe verbindlich sichern" : "Confirm & Commit Override"}
            </button>
            <button type="button" class="zoom-btn" onclick="closeSupervisorOverrideModal()" style="padding:8px 14px;">
              ${isDe ? "Abbrechen" : "Cancel"}
            </button>
          </div>
        </div>
      </div>

      </div>
    </div>
  `;
}
