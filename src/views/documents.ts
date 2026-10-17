import { ThreeWayAuditResult, CustomsAuditorService } from "../services/customsAuditor.js";
import { CustomsDocument } from "../repositories/shipments.js";

export interface DocumentsViewOptions {
  documents: { doc: CustomsDocument; shipmentId: string; carrier: string }[];
  auditResult: ThreeWayAuditResult;
  selectedSample: "clean" | "discrepancy";
  lang: "de" | "en";
}

/**
 * Render the Interactive Customs Document Archive & 3-Way Redline Audit Cockpit
 * WHY: Solves S-Group's pre-clearance customs discrepancy risk, prevents container
 * demurrage penalties (€150–€500/day), and enforces ADSp 2017 / HGB § 412 standards.
 */
export function renderDocumentsView(options: DocumentsViewOptions): string {
  const { documents, auditResult, selectedSample, lang } = options;
  const isDe = lang === "de";

  const isClean = auditResult.status === "PERFECT_MATCH";
  const statusBadge = isClean
    ? `<span class="badge-pill-success">✓ ${isDe ? "100% Konform (ATLAS 9.1 Freigabe)" : "100% Match (ATLAS 9.1 Cleared)"}</span>`
    : `<span class="badge-pill-danger">🛑 ${isDe ? "Quarantäne-Hold (Diskrepanzen festgestellt)" : "Quarantine Hold (Discrepancy Flagged)"}</span>`;

  // Render 4-Column Redline Matrix Rows
  const matrixRowsHtml = auditResult.rows.map((row) => {
    const fieldName = isDe ? row.fieldNameDe : row.fieldNameEn;
    const deltaText = isDe ? row.deltaTextDe : row.deltaTextEn;
    const statusChip = row.severity === "MATCH"
      ? `<span class="badge-pill-success" style="font-size:11px; padding:2px 8px;">✓ ${isDe ? "Match" : "Match"}</span>`
      : row.severity === "WARNING"
      ? `<span class="badge-pill-warning" style="font-size:11px; padding:2px 8px;">⚠️ ${isDe ? "Abweichung" : "Warning"}</span>`
      : `<span class="badge-pill-danger" style="font-size:11px; padding:2px 8px;">✕ ${isDe ? "Kritisch" : "Critical"}</span>`;

    const rowHighlight = row.severity === "CRITICAL_FAIL"
      ? "style=\"background: rgba(239, 68, 68, 0.05); font-weight: 600;\""
      : row.severity === "WARNING"
      ? "style=\"background: rgba(245, 158, 11, 0.04);\""
      : "";

    return `
      <tr ${rowHighlight} style="border-bottom: 1px solid var(--color-border-slate);">
        <td style="padding: 10px 8px; font-weight: 600; color: var(--color-navy-dark);">${fieldName}</td>
        <td style="padding: 10px 8px; font-family: monospace;">${row.atlasValue}</td>
        <td style="padding: 10px 8px; font-family: monospace;">${row.bolValue}</td>
        <td style="padding: 10px 8px; font-family: monospace;">${row.invoiceValue}</td>
        <td style="padding: 10px 8px; font-size: 12px; color: ${row.matched ? '#065F46' : '#DC2626'};">${deltaText}</td>
        <td style="padding: 10px 8px; text-align: right;">${statusChip}</td>
      </tr>
    `;
  }).join("\n");

  // Render Static Stored Customs Documents
  const docItemsHtml = documents.map(({ doc, shipmentId, carrier }) => {
    const title = isDe ? doc.titleDe : doc.titleEn;
    return `
      <div class="document-item-card" data-doc-id="${doc.docId}">
        <div class="doc-icon" aria-hidden="true">📄</div>
        <div class="doc-info">
          <p class="doc-title"><strong>${title}</strong></p>
          <p class="doc-meta">
            <span>${isDe ? "Sendung:" : "Shipment:"} <strong>${shipmentId}</strong> (${carrier})</span> • 
            <span>${isDe ? "Aktenzeichen:" : "Ref:"} <code>${doc.fileNumber}</code></span> • 
            <span>${doc.fileSizeKb} KB</span> • 
            <span>${isDe ? "Geprüft:" : "Verified:"} ${new Date(doc.verifiedDate).toLocaleDateString(isDe ? "de-DE" : "en-US")}</span>
          </p>
        </div>
        <div class="doc-action">
          <a href="/api/v1/documents/${doc.docId}/download" target="_blank" class="btn-cta-secondary">
            ⬇️ ${isDe ? "Prüfen & Download" : "Verify & Download"}
          </a>
        </div>
      </div>
    `;
  }).join("\n");

  const noticeMemo = isDe ? auditResult.adspNoticeTextDe : auditResult.adspNoticeTextEn;

  return `
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/portal?lang=${lang}">← ${isDe ? "Zurück zur Hauptübersicht" : "Back to Overview"}</a>
    </nav>

    <!-- Customs Hero & Discrepancy Prevention Header -->
    <section class="portal-hero-card">
      <div class="hero-header">
        <div>
          <div class="shipment-id-badge-row">
            <span class="carrier-chip carrier-schenker">🛡️ ATLAS 9.1 & ADSp 2017</span>
            <h1 class="hero-title" style="display:inline; margin-left: 8px;">
              ${isDe ? "Zolldokumente & Frachtbrief-Archiv" : "Customs Documents & Waybill Archive"}
            </h1>
          </div>
          <p class="hero-subtitle">
            ${isDe ? "Zentrales Archiv für ATLAS-Ausfuhr-/Einfuhrbelege, CMR-Frachtbriefe und Konnossemente (Mandant DE-SIS-8921) mit integrierter Redline-Vorabprüfung zur Vermeidung von Seehafen-Standgeldern." : "Central repository for ATLAS customs declarations, CMR waybills, and bills of lading (Tenant DE-SIS-8921) with integrated Redline pre-clearance to avert seaport demurrage penalties."}
          </p>
        </div>
        <div class="hero-badge">
          ${statusBadge}
        </div>
      </div>

      <!-- 4-Metric Compliance Ribbon -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Aktive Zolldokumente" : "Stored Documents"}</span>
            <span class="metric-icon">📄</span>
          </div>
          <div class="metric-value">${documents.length}</div>
          <p class="metric-footer">${isDe ? "ATLAS & CMR verifiziert" : "ATLAS & CMR verified"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "ISO 6346 Checksummen" : "Container Checksum"}</span>
            <span class="metric-icon">🔢</span>
          </div>
          <div class="metric-value">${auditResult.containerChecksumValid ? "100%" : "FEHLER"}</div>
          <p class="metric-footer">${isDe ? "Modulo-11 verifiziert" : "Modulo-11 verified"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Abgewendete Standgelder" : "Averted Demurrage"}</span>
            <span class="metric-icon">💶</span>
          </div>
          <div class="metric-value">€ ${auditResult.demurrageRiskEur.toLocaleString()}</div>
          <p class="metric-footer">${isDe ? "Seehafen-Risiko neutralisiert" : "Terminal liability averted"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Zoll-Toleranz (§ 412 HGB)" : "Customs Tolerance"}</span>
            <span class="metric-icon">⚖️</span>
          </div>
          <div class="metric-value">${auditResult.weightToleranceValid ? "≤ 50 kg" : "> 50 kg"}</div>
          <p class="metric-footer">${isDe ? "Gewichtsabgleich konform" : "Weight consistency check"}</p>
        </div>
      </div>
    </section>

    <!-- REDLINE 3-WAY RECONCILIATION AUDIT COCKPIT -->
    <section class="portal-details-card" style="margin-bottom: var(--space-6); border: 2px solid var(--color-signal-blue);">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: var(--space-3); margin-bottom: var(--space-4);">
        <div>
          <div style="display:flex; align-items:center; gap: 8px;">
            <span style="background: var(--color-signal-blue); color: #FFF; font-size: 11px; font-weight: 800; padding: 2px 8px; border-radius: 4px;">REDLINE ENGINE</span>
            <h2 class="section-title" style="margin: 0;">
              🔍 ${isDe ? "3-Wege-Dokumentenabgleich & Zoll-Vorabfertigung" : "3-Way Document Reconciliation & Redline Audit"}
            </h2>
          </div>
          <p class="section-intro" style="margin-top: 4px;">
            ${isDe ? "Automatischer Vergleich zwischen ATLAS-Zollanmeldung, Frachtführer-Konnossement (B/L) und Handelsrechnung zur Beseitigung von Zollbeschauen (Zollbeschau) vor Schiffseinlauf." : "Automated cross-check between ATLAS customs declaration, Carrier Bill of Lading, and Commercial Invoice to eliminate customs holds prior to port gate-in."}
          </p>
        </div>

        <!-- Sample Dossier Switcher (Progressive Demonstration) -->
        <div style="display:flex; align-items:center; gap: 8px; background: #F8FAFC; border: 1px solid var(--color-border-slate); padding: 4px 8px; border-radius: 8px;">
          <span style="font-size: 12px; font-weight: 600; color: var(--color-text-muted);">${isDe ? "Dossier:" : "Dossier:"}</span>
          <a href="/portal/documents?sample=clean&lang=${lang}" class="filter-tab ${selectedSample === 'clean' ? 'active' : ''}" style="font-size: 12px; padding: 4px 10px;">
            ${isDe ? "✓ Konformes Dossier (SHP-SIS-1049)" : "✓ Clean Dossier (SHP-SIS-1049)"}
          </a>
          <a href="/portal/documents?sample=discrepancy&lang=${lang}" class="filter-tab ${selectedSample === 'discrepancy' ? 'active' : ''}" style="font-size: 12px; padding: 4px 10px;">
            ${isDe ? "⚠️ Diskrepanz-Fall (SHP-SIS-2088)" : "⚠️ Discrepancy Case (SHP-SIS-2088)"}
          </a>
        </div>
      </div>

      <!-- Action Banner: Hick's Law Dominant Single CTA -->
      <div style="background: ${isClean ? '#F0FDF4' : '#FEF2F2'}; border: 1px solid ${isClean ? '#BBF7D0' : '#FECACA'}; padding: var(--space-4); border-radius: 8px; margin-bottom: var(--space-4); display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: var(--space-3);">
        <div>
          <strong style="color: ${isClean ? '#166534' : '#991B1B'}; font-size: 15px;">
            ${isClean ? (isDe ? "✓ Vorabprüfung erfolgreich: Keine zollrelevanten Abweichungen" : "✓ Pre-clearance passed: No customs discrepancies detected") : (isDe ? "🛑 Achtung: Zollsperre droht durch Gewichts- / Colli-Abweichung" : "🛑 Alert: Customs hold imminent due to weight / package variance")}
          </strong>
          <p style="font-size: 13px; color: ${isClean ? '#15803D' : '#B91C1C'}; margin-top: 2px;">
            ${isDe ? auditResult.actionRequiredDe : auditResult.actionRequiredEn}
          </p>
        </div>

        <div style="display:flex; gap: var(--space-2);">
          ${isClean
            ? `<a href="/portal/tracking?id=${auditResult.shipmentId}&lang=${lang}" class="btn-cta-primary">
                ⚡ ${isDe ? "ATLAS-Zollfreigabe bestätigen ➔" : "Confirm ATLAS Clearance ➔"}
              </a>`
            : `<button onclick="copyDiscrepancyMemo()" class="btn-cta-primary" style="background:#DC2626; border-color:#DC2626;">
                📋 ${isDe ? "ADSp-Beanstandung kopieren" : "Copy ADSp Discrepancy Notice"}
              </button>`
          }
        </div>
      </div>

      <!-- 4-Column Cross-Audit Comparison Matrix -->
      <div style="overflow-x: auto; margin-top: 12px;">
        <table style="width: 100%; border-collapse: collapse; font-size: 13px; background: #FFFFFF; border-radius: 8px; overflow: hidden; border: 1px solid var(--color-border-slate);">
          <thead>
            <tr style="background: var(--color-navy-dark); color: #FFFFFF; text-align: left;">
              <th style="padding: 10px 8px;">${isDe ? "Geprüfter Parameter" : "Audit Parameter"}</th>
              <th style="padding: 10px 8px;">${isDe ? "1. ATLAS-Zollanmeldung" : "1. ATLAS Declaration"}</th>
              <th style="padding: 10px 8px;">${isDe ? "2. Frachtbrief (B/L)" : "2. Carrier Bill of Lading"}</th>
              <th style="padding: 10px 8px;">${isDe ? "3. Handelsrechnung" : "3. Commercial Invoice"}</th>
              <th style="padding: 10px 8px;">${isDe ? "Delta / Toleranznachweis" : "Delta / Tolerance Check"}</th>
              <th style="padding: 10px 8px; text-align: right;">${isDe ? "Zollstatus" : "Audit Status"}</th>
            </tr>
          </thead>
          <tbody>
            ${matrixRowsHtml}
          </tbody>
        </table>
      </div>

      <!-- Progressive Disclosure: Formal ADSp 2017 & § 412 HGB Memo -->
      <details class="progressive-disclosure" style="margin-top: 16px;">
        <summary>
          📜 ${isDe ? "Amtlicher Beanstandungstext (ADSp 2017 Ziff. 19 & § 412 HGB Frachtrecht)" : "Official Discrepancy Notice (ADSp 2017 & § 412 German Commercial Code)"}
        </summary>
        <div class="progressive-disclosure-content">
          <p style="font-size: 13px; color: var(--color-text-muted); margin-bottom: 8px;">
            ${isDe ? "Dieser Text wird bei festgestellten Diskrepanzen automatisch an die Reederei (Maersk/DHL/Schenker) übermittelt, um Standgeldforderungen rechtlich abzuwehren:" : "This memo is transmitted to the shipping line upon variance detection to legally reject carrier demurrage liability:"}
          </p>
          <pre id="adsp-memo-content" style="background:#0F172A; color:#E2E8F0; padding: var(--space-4); border-radius: 6px; font-family: monospace; font-size: 12px; white-space: pre-wrap; line-height: 1.5;">${noticeMemo}</pre>
          <div style="margin-top: 12px; display:flex; justify-content: space-between; align-items: center;">
            <span style="font-size: 12px; color: var(--color-text-muted);">
              Audit-Hash: <code>${auditResult.auditHash.slice(0, 16)}…</code> • ISO-Timestamp: <code>${auditResult.verifiedTimestamp}</code>
            </span>
            <button onclick="copyDiscrepancyMemo()" class="btn-cta-secondary" style="font-size: 12px;">
              📋 ${isDe ? "Text in Zwischenablage kopieren" : "Copy to Clipboard"}
            </button>
          </div>
        </div>
      </details>
    </section>

    <!-- Permanent Stored Documents Archive Section -->
    <section class="portal-details-card">
      <h2 class="section-title">
        📂 ${isDe ? "Gespeicherte Begleitpapiere & Zolldokumente" : "Stored Customs Waybills & Documents"}
      </h2>
      <p class="section-intro">
        ${isDe ? "Offiziell archivierte Dokumente für Mandant DE-SIS-8921 mit Download-Möglichkeit für Betriebsprüfungen." : "Officially archived files for tenant DE-SIS-8921 available for customs audit inspection."}
      </p>
      <div class="documents-list" style="margin-top: 16px;">
        ${docItemsHtml}
      </div>
    </section>

    <script>
      function copyDiscrepancyMemo() {
        const text = document.getElementById('adsp-memo-content').textContent;
        navigator.clipboard.writeText(text).then(() => {
          alert("${isDe ? 'Beanstandungstext erfolgreich kopiert!' : 'Discrepancy memo copied to clipboard!'}");
        }).catch(() => {
          alert("${isDe ? 'Kopieren fehlgeschlagen.' : 'Copy failed.'}");
        });
      }
    </script>
  `;
}
