/**
 * Tab 2: 3-Wege-Abgleich (3-Way Dossier Reconciliation Workspace)
 * S-Group Gateway - Schäfer & SIS Interlogistik
 *
 * WHY: Provides deterministic cross-reconciliation between transport contracts (B/L),
 * commercial invoices, and physical packing lists to eliminate terminal demurrage traps.
 */

import { ThreeWayAuditResult, CustomsAuditorService } from "../services/customsAuditor.js";
import { ComplianceLedgerService } from "../services/complianceLedger.js";

export interface ReconciliationViewOptions {
  lang?: "de" | "en";
  selectedScenario?: "clean" | "discrepancy";
  auditResult?: ThreeWayAuditResult;
}

export function renderReconciliationView(options: ReconciliationViewOptions = {}): string {
  const { lang = "de", selectedScenario = "clean" } = options;
  const isDe = lang === "de";
  const metrics = ComplianceLedgerService.getKpiMetrics();

  const samples = CustomsAuditorService.getSampleDossiers();
  const dossier = selectedScenario === "discrepancy" ? samples.discrepancy : samples.clean;

  const result = options.auditResult || CustomsAuditorService.reconcileDossier(
    dossier.shipmentId,
    dossier.bol,
    dossier.atlas,
    dossier.invoice,
    lang
  );

  const isDiscrepancy = selectedScenario === "discrepancy";

  // Build matrix rows from deterministic engine
  const matrixRowsHtml = result.rows.map((row) => {
    const fieldName = isDe ? row.fieldNameDe : row.fieldNameEn;
    const deltaText = isDe ? row.deltaTextDe : row.deltaTextEn;
    const isFail = row.severity === "CRITICAL_FAIL" || row.severity === "WARNING";
    const statusPill = row.matched
      ? `<span class="stage-badge-pill pass"><i class="fa-solid fa-check"></i> ${isDe ? "KONFORM" : "MATCH"}</span>`
      : `<span class="stage-badge-pill hold"><i class="fa-solid fa-triangle-exclamation"></i> ${deltaText}</span>`;

    return `
      <tr style="${isFail ? "background:rgba(239,68,68,0.06);" : ""}">
        <td><strong>${fieldName}</strong></td>
        <td><code>${row.bolValue || "-"}</code></td>
        <td><code>${row.invoiceValue || "-"}</code></td>
        <td><code>${row.atlasValue || "-"}</code></td>
        <td>${statusPill}</td>
      </tr>
    `;
  }).join("\n");

  return `
    <div class="reconciliation-workspace-container" id="reconciliation-workspace">
      <div class="portal-details-card" style="width:100%; max-width:100%; box-sizing:border-box;">
      
      <!-- Top Title & Operational Standards Bar -->
      <div style="display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; margin-bottom:20px; border-bottom:1px solid var(--color-border-slate); padding-bottom:16px;">
        <div>
          <div style="display:flex; align-items:center; gap:8px;">
            <i class="fa-solid fa-scale-balanced" style="font-size:20px; color:var(--color-signal-blue);"></i>
            <h1 class="section-title" style="margin:0;">
              ${isDe ? "Deterministischer 3-Wege-Zollabgleich (§ ATLAS 9.1 & ADSp 2017)" : "Deterministic 3-Way Customs Reconciliation"}
            </h1>
          </div>
          <p style="font-size:13px; color:var(--color-text-muted); margin:4px 0 0 0;">
            ${isDe 
              ? "Prüfung von Frachtvertrag (B/L) ↔ Handelsrechnung ↔ Packliste zur Abwendung von Liegegeldern an Seehäfen." 
              : "Cross-validation of transport waybill ↔ invoice ↔ packing list preventing port demurrage."}
          </p>
        </div>

        <!-- Compliance Badges -->
        <div style="display:flex; align-items:center; gap:8px; flex-wrap:wrap;">
          <span class="stage-badge-pill pass">● ATLAS 9.1</span>
          <span class="stage-badge-pill pass">● ADSp 2017 (&le; 50 kg)</span>
          <span class="stage-badge-pill pass">● GoBD &sect; 147 AO</span>
        </div>
      </div>

      <!-- 1-Click Scenario Switcher (Clean vs Demurrage Trap) -->
      <div class="scenario-switcher-bar">
        <div style="display:flex; align-items:center; gap:12px;">
          <strong style="font-size:13px;">${isDe ? "Prüf-Szenario wählen:" : "Select Test Scenario:"}</strong>
          <a
            href="/portal/reconcile?sample=clean&lang=${lang}"
            class="btn-scenario ${!isDiscrepancy ? "clean" : ""}"
            style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;"
          >
            <i class="fa-solid fa-circle-check"></i> ${isDe ? "Konformes Dossier (Szenario A - Clean)" : "Compliant Dossier (Scenario A - Clean)"}
          </a>
          <a
            href="/portal/reconcile?sample=discrepancy&lang=${lang}"
            class="btn-scenario ${isDiscrepancy ? "trap" : ""}"
            style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;"
          >
            <i class="fa-solid fa-triangle-exclamation"></i> ${isDe ? "Demurrage-Falle (Szenario B - +220 kg Abweichung)" : "Demurrage Trap (Scenario B - +220 kg Discrepancy)"}
          </a>
        </div>
        <div style="font-size:12px; color:var(--color-text-muted);">
          ${isDe ? "Sendungs-ID:" : "Shipment ID:"} <strong style="font-family:monospace; color:var(--color-signal-blue);">${dossier.shipmentId}</strong>
        </div>
      </div>

      <!-- Hidden File Inputs for 3 Bays -->
      <input type="file" id="reconcile-file-bol" class="hidden" style="display:none;" accept=".png,.jpg,.jpeg,.pdf" onchange="handleReconcileBayUpload(event, 'bol')">
      <input type="file" id="reconcile-file-invoice" class="hidden" style="display:none;" accept=".png,.jpg,.jpeg,.pdf" onchange="handleReconcileBayUpload(event, 'invoice')">
      <input type="file" id="reconcile-file-packing" class="hidden" style="display:none;" accept=".png,.jpg,.jpeg,.pdf" onchange="handleReconcileBayUpload(event, 'packing_list')">

      <!-- 3 Intake Document Loading Bays with Completeness Dots -->
      <div class="dossier-slots-container">
        <!-- Slot 1: Bill of Lading -->
        <div class="dossier-slot-bay loaded" id="bay-slot-bol">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="slot-dot active" id="dot-bay-bol"></span>
              <strong style="font-size:13px; color:#F1F5F9;">${isDe ? "1. Frachturkunde (B/L)" : "1. Bill of Lading (B/L)"}</strong>
            </div>
            <span class="stage-badge-pill pass" id="badge-bay-bol">${isDe ? "GELADEN" : "LOADED"}</span>
          </div>
          <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">
            ${isDe ? "Frachtvertrag & SOLAS VGM Verwiegung" : "Contract of carriage & SOLAS VGM weight"}
          </div>
          <div style="font-size:12px; font-family:monospace; color:#38BDF8; margin-top:2px;" id="val-bay-bol">
            ${dossier.bol.containerNumber} • ${dossier.bol.grossWeightKg.toLocaleString()} kg
          </div>
          <button type="button" class="zoom-btn" onclick="document.getElementById('reconcile-file-bol').click()" style="margin-top:8px; font-size:11px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; border-color:#38BDF8; color:#38BDF8;">
            <i class="fa-solid fa-arrow-up-from-bracket"></i> ${isDe ? "Beleg ersetzen" : "Replace File"}
          </button>
        </div>

        <!-- Slot 2: Commercial Invoice -->
        <div class="dossier-slot-bay loaded" id="bay-slot-invoice">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="slot-dot active" id="dot-bay-invoice"></span>
              <strong style="font-size:13px; color:#F1F5F9;">${isDe ? "2. Handelsrechnung" : "2. Commercial Invoice"}</strong>
            </div>
            <span class="stage-badge-pill pass" id="badge-bay-invoice">${isDe ? "GELADEN" : "LOADED"}</span>
          </div>
          <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">
            ${isDe ? "Zollwert, Währung & Incoterms" : "Customs value, currency & Incoterms"}
          </div>
          <div style="font-size:12px; font-family:monospace; color:#38BDF8; margin-top:2px;" id="val-bay-invoice">
            ${dossier.invoice.currency} ${dossier.invoice.totalAmount.toLocaleString()} • ${dossier.invoice.incoterm}
          </div>
          <button type="button" class="zoom-btn" onclick="document.getElementById('reconcile-file-invoice').click()" style="margin-top:8px; font-size:11px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; border-color:#38BDF8; color:#38BDF8;">
            <i class="fa-solid fa-arrow-up-from-bracket"></i> ${isDe ? "Beleg ersetzen" : "Replace File"}
          </button>
        </div>

        <!-- Slot 3: Packing List / ATLAS -->
        <div class="dossier-slot-bay loaded" id="bay-slot-packing" style="${isDiscrepancy ? "border-color:#DC2626; background:rgba(239,68,68,0.08);" : ""}">
          <div style="display:flex; align-items:center; justify-content:space-between;">
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="slot-dot active" id="dot-bay-packing" style="${isDiscrepancy ? "background:#EF4444;" : ""}"></span>
              <strong style="font-size:13px; color:#F1F5F9;">${isDe ? "3. Packliste / ATLAS" : "3. Packing List / ATLAS"}</strong>
            </div>
            <span class="stage-badge-pill ${isDiscrepancy ? "hold" : "pass"}" id="badge-bay-packing">
              ${isDiscrepancy ? (isDe ? "WARNUNG" : "WARNING") : (isDe ? "GELADEN" : "LOADED")}
            </span>
          </div>
          <div style="font-size:11.5px; color:#94A3B8; margin-top:4px;">
            ${isDe ? "Physisches Tara & Colli-Manifest" : "Physical tare & packages manifest"}
          </div>
          <div style="font-size:12px; font-family:monospace; color:${isDiscrepancy ? "#EF4444" : "#38BDF8"}; margin-top:2px;" id="val-bay-packing">
            ${dossier.atlas.containerNumber} • ${dossier.atlas.grossWeightKg.toLocaleString()} kg ${isDiscrepancy ? "(!)" : ""}
          </div>
          <button type="button" class="zoom-btn" onclick="document.getElementById('reconcile-file-packing').click()" style="margin-top:8px; font-size:11px; padding:3px 8px; display:inline-flex; align-items:center; gap:4px; border-color:#38BDF8; color:#38BDF8;">
            <i class="fa-solid fa-arrow-up-from-bracket"></i> ${isDe ? "Beleg ersetzen" : "Replace File"}
          </button>
        </div>
      </div>

      <!-- Live Reconcile Status Result Banner -->
      <div style="border-radius:10px; padding:16px; margin-bottom:20px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:12px; ${
        result.status === "PERFECT_MATCH" 
          ? "background:rgba(16,185,129,0.1); border:1px solid #059669;" 
          : "background:rgba(239,68,68,0.12); border:1px solid #DC2626;"
      }">
        <div style="display:flex; align-items:center; gap:12px;">
          <span style="font-size:24px;">${result.status === "PERFECT_MATCH" ? '<i class="fa-solid fa-shield-halved" style="color:#10B981;"></i>' : '<i class="fa-solid fa-triangle-exclamation" style="color:#EF4444;"></i>'}</span>
          <div>
            <h3 style="font-size:16px; font-weight:800; margin:0; color:${result.status === "PERFECT_MATCH" ? "#10B981" : "#EF4444"};">
              ${result.status === "PERFECT_MATCH" 
                ? (isDe ? "3-Wege-Abgleich ERFOLGREICH • Vollständige Freigabe" : "3-Way Match PASSED • Full Customs Clearance")
                : (isDe ? "Diskrepanz erkannt • Sofortige Quarantäne vor Terminal Gate-in" : "Discrepancy Detected • Container Quarantined Before Gate-In")}
            </h3>
            <p style="font-size:12.5px; margin:2px 0 0 0; color:var(--color-text-primary);">
              ${isDe 
                ? (result.status === "PERFECT_MATCH" 
                    ? "Alle Dokumente stimmen zu 100% überein. Berechnetes Standgeld-Risiko: 0 €."
                    : "Gewichtsabweichung von +220 kg übersteigt gesetzliche Toleranz (§ ADSp 2017). Liegegeld-Risiko: bis zu 450 €/Tag.")
                : (result.status === "PERFECT_MATCH"
                    ? "All 3 documents match 100%. Calculated demurrage exposure: 0 €."
                    : "Weight delta of +220 kg exceeds statutory bounds (ADSp 2017). Demurrage exposure: up to 450 €/day.")}
            </p>
          </div>
        </div>

        <div style="display:flex; gap:10px;">
          ${result.status === "PERFECT_MATCH" 
            ? `
              <a href="/portal/ledger?lang=${lang}" class="btn-scenario clean" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-file-contract"></i> ${isDe ? "GoBD-Zertifikat ausstellen" : "Issue GoBD Certificate"}
              </a>
            ` 
            : `
              <a href="/portal/quarantine?lang=${lang}" class="btn-scenario trap" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                <i class="fa-solid fa-triangle-exclamation"></i> ${isDe ? "In Quarantäne-Konsole öffnen" : "Open in Quarantine Console"}
              </a>
            `
          }
        </div>
      </div>

      <!-- 4-Column Reconciliation Matrix -->
      <div style="overflow-x:auto;">
        <table class="reconcile-matrix-table">
          <thead>
            <tr>
              <th>${isDe ? "Prüfparameter" : "Audit Parameter"}</th>
              <th>${isDe ? "Frachturkunde (B/L)" : "Waybill (B/L)"}</th>
              <th>${isDe ? "Handelsrechnung" : "Invoice"}</th>
              <th>${isDe ? "Packliste / ATLAS" : "Packing List / ATLAS"}</th>
              <th>${isDe ? "Abweichung & Status" : "Delta & Status"}</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Demurrage Savings Footnote -->
      <div style="margin-top:16px; padding:12px; background:rgba(2,132,199,0.06); border:1px solid rgba(2,132,199,0.2); border-radius:8px; display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:8px; font-size:12px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <i class="fa-solid fa-lightbulb" style="color:var(--color-signal-blue);"></i>
          <span>
            ${isDe 
              ? "<strong>Präventiver Demurrage-Schutz:</strong> Durch automatische Vorerfassung vor Hafeneinfahrt (Hamburg CTA/CTB) werden Liegegelder von durchschnittlich <strong>180 € bis 450 € pro Tag</strong> pro Container vermieden." 
              : "<strong>Preventative Demurrage Shield:</strong> Pre-validating before port gate-in avoids demurrage charges averaging <strong>€180 to €450 per container/day</strong>."}
          </span>
        </div>
        <span style="font-weight:700; color:#10B981;">
          ${isDe ? `Ersparnis: ${metrics.demurrageSavedEur.toLocaleString()} €` : `Saved: ${metrics.demurrageSavedEur.toLocaleString()} €`}
        </span>
      </div>

      </div>
    </div>
  `;
}
