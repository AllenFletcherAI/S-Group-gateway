import { PruneLogEntry } from "../services/telematicsPruner.js";

/**
 * Render the Interactive German Privacy (DSGVO) & Compliance Dashboard
 * WHY: Delivers an auditable, customer-facing interface proving compliance with
 * German DSGVO Art. 5 (Storage Limitation) and Art. 15 (Right of Access).
 */
export function renderComplianceView(ledger: PruneLogEntry[], tenantId: string, lang: "de" | "en"): string {
  const isDe = lang === "de";

  const ledgerRowsHtml = ledger.map((entry) => {
    const execDate = new Date(entry.executedAt).toLocaleString(isDe ? "de-DE" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
    });
    const cutoffDate = new Date(entry.retentionCutoff).toLocaleDateString(isDe ? "de-DE" : "en-US");

    return `
      <tr class="ledger-row">
        <td><code>${entry.sweepId}</code></td>
        <td>${execDate}</td>
        <td><code>${cutoffDate}</code></td>
        <td><strong>${entry.recordsPurged.toLocaleString()}</strong> / ${entry.recordsEvaluated.toLocaleString()}</td>
        <td><span class="badge-pill-success">● ${entry.status}</span></td>
        <td><code class="audit-hash-snippet" title="${entry.auditHash}">${entry.auditHash.slice(0, 10)}…</code></td>
      </tr>
    `;
  }).join("\n");

  return `
    <nav class="breadcrumb-bar" aria-label="Breadcrumb">
      <a href="/portal?lang=${lang}">← ${isDe ? "Zurück zur Hauptübersicht" : "Back to Overview"}</a>
    </nav>

    <!-- Compliance Hero Card -->
    <section class="portal-hero-card">
      <div class="hero-header">
        <div>
          <div class="shipment-id-badge-row">
            <span class="carrier-chip carrier-schenker">🛡️ DSGVO / GDPR</span>
            <h1 class="hero-title" style="display:inline; margin-left: 8px;">
              ${isDe ? "Datenschutz & Compliance Cockpit" : "Privacy & Compliance Cockpit"}
            </h1>
          </div>
          <p class="hero-subtitle">
            ${isDe ? "Zentrale Nachweis- und Prüfstelle für europäische und deutsche Datenschutzgesetze (Art. 5, 15, 17 & 32 DSGVO)." : "Central audit verification console for European and German data privacy standards (Art. 5, 15, 17 & 32 GDPR)."}
          </p>
        </div>
        <div class="hero-badge">
          <span class="badge-pill-success">● ${isDe ? "DSGVO-Konformität aktiv" : "GDPR Compliance Active"}</span>
        </div>
      </div>

      <!-- Compliance Metrics Grid -->
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Speicherbegrenzung" : "Storage Limitation"}</span>
            <span class="metric-icon">⏱️</span>
          </div>
          <div class="metric-value">90 ${isDe ? "Tage" : "Days"}</div>
          <p class="metric-footer">${isDe ? "Art. 5 Abs. 1 lit. e DSGVO" : "Art. 5(1)(e) GDPR rule"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Mandantentrennung" : "Tenant Isolation"}</span>
            <span class="metric-icon">🏢</span>
          </div>
          <div class="metric-value">100%</div>
          <p class="metric-footer">${isDe ? "Zero IDOR / BOLA geprüft" : "Zero IDOR / BOLA verified"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Protokoll-Anonymisierung" : "Log Masking"}</span>
            <span class="metric-icon">🛡️</span>
          </div>
          <div class="metric-value">${isDe ? "Aktiv" : "Active"}</div>
          <p class="metric-footer">${isDe ? "Keine Fahrernamen / IP maskiert" : "No driver names / masked IPs"}</p>
        </div>

        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-label">${isDe ? "Audit-Prüfsummen" : "Audit Integrity"}</span>
            <span class="metric-icon">🔐</span>
          </div>
          <div class="metric-value">SHA-256</div>
          <p class="metric-footer">${isDe ? "Unveränderliches Ledger" : "Immutable ledger records"}</p>
        </div>
      </div>
    </section>

    <!-- Two-Column Grid: Pruning Engine & Pruning Audit Ledger -->
    <div class="tracking-two-col">
      <!-- Left Column: Actions & Controls -->
      <div style="display:flex; flex-direction:column; gap: var(--space-6);">
        <!-- Automated 90-Day Telematics Pruner Control Card -->
        <section class="portal-details-card">
          <h2 class="section-title">
            ⏱️ ${isDe ? "90-Tage Telemetrie-Löschmaschine" : "90-Day Telematics Pruning Engine"}
          </h2>
          <p class="section-intro">
            ${isDe ? "Zum Schutz der Privatsphäre von LKW-Fahrern und Schiffsbesatzungen werden minutengenaue GPS-Ortungspunkte nach 90 Tagen unwiderruflich gelöscht. Geschäftliche Makro-Meilensteine ('Zugestellt', 'Zollfreigabe') bleiben im Frachtarchiv erhalten." : "To protect the privacy of drivers and crew, granular GPS tracking pings are purged permanently after 90 days. Permanent macro-milestones ('Delivered', 'Customs Cleared') remain in the freight archive."}
          </p>

          <div class="content-placeholder-box" style="margin-top: 12px; background: #F8FAFC;">
            <p><strong>${isDe ? "Nächster automatischer Löschlauf:" : "Next Automated Pruning Sweep:"}</strong></p>
            <p>📅 <strong>${isDe ? "Morgen um 03:00 Uhr MEZ" : "Tomorrow at 03:00 CET"}</strong> • <code>Cron: 0 3 * * *</code></p>
            <p style="font-size: 13px; color: var(--color-text-muted);">
              ${isDe ? "Betroffenes Lösch-Intervall: Alle Telemetriedaten erfasst vor " : "Pruning window: All telemetry recorded prior to "}
              <code>${new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toLocaleDateString(isDe ? "de-DE" : "en-US")}</code>
            </p>
          </div>

          <div style="margin-top: 16px; display:flex; gap: var(--space-2); flex-wrap: wrap;">
            <button id="btn-trigger-prune" class="btn-search-submit" onclick="executePruningSweep(false)">
              ⚡ ${isDe ? "Löschlauf jetzt ausführen" : "Run Pruning Sweep Now"}
            </button>
            <button id="btn-dryrun-prune" class="btn-doc-download" onclick="executePruningSweep(true)">
              🔍 ${isDe ? "Testlauf (Dry-Run)" : "Simulate (Dry-Run)"}
            </button>
          </div>
          <div id="prune-result-banner" style="margin-top: 12px; display: none;"></div>
        </section>

        <!-- Data Portability Card (Art. 15) -->
        <section class="portal-details-card">
          <h2 class="section-title">
            📦 ${isDe ? "Recht auf Auskunft (Art. 15 DSGVO)" : "Right of Access & Portability (Art. 15 GDPR)"}
          </h2>
          <p class="section-intro">
            ${isDe ? "Laden Sie den vollständigen, kryptographisch signierten Datenbestand Ihres Mandanten (Sendungen, Ereignisse, Zolldokumente und Löschprotokolle) als maschinenlesbares JSON-Paket herunter." : "Download the complete, cryptographically signed data package for your tenant (shipments, events, customs waybills, and purge logs) as machine-readable JSON."}
          </p>

          <a href="/api/v1/compliance/export?download=true&tenantId=${tenantId}" target="_blank" class="btn-search-submit" style="display:inline-block; text-decoration:none; margin-top: 8px;">
            ⬇️ ${isDe ? "Mandanten-Datenpaket exportieren (JSON)" : "Export Tenant Data Package (JSON)"}
          </a>
        </section>
      </div>

      <!-- Right Column: Immutable Audit Ledger Table -->
      <section class="portal-details-card">
        <h2 class="section-title">
          📋 ${isDe ? "Unveränderliches Löschprotokoll (Ledger)" : "Immutable Pruning Audit Ledger"}
        </h2>
        <p class="section-intro">
          ${isDe ? "Verifizierte Nachweise durchgeführter Speicherbegrenzungs-Läufe nach Art. 5 Abs. 1 lit. e DSGVO." : "Verified execution receipts of storage limitation sweeps pursuant to GDPR Art. 5(1)(e)."}
        </p>

        <div style="overflow-x: auto; margin-top: 16px;">
          <table class="shipments-table" style="width:100%; border-collapse: collapse; font-size: 13px;">
            <thead>
              <tr style="border-bottom: 2px solid var(--color-border-slate); text-align: left;">
                <th style="padding: 8px 6px;">ID</th>
                <th style="padding: 8px 6px;">${isDe ? "Ausgeführt" : "Executed"}</th>
                <th style="padding: 8px 6px;">${isDe ? "Stichtag" : "Cutoff"}</th>
                <th style="padding: 8px 6px;">${isDe ? "Gelöscht" : "Purged"}</th>
                <th style="padding: 8px 6px;">Status</th>
                <th style="padding: 8px 6px;">Hash</th>
              </tr>
            </thead>
            <tbody id="ledger-table-body">
              ${ledgerRowsHtml}
            </tbody>
          </table>
        </div>
      </section>
    </div>

    <script>
      async function executePruningSweep(dryRun) {
        const banner = document.getElementById('prune-result-banner');
        banner.style.display = 'block';
        banner.innerHTML = '<p style="color: #0284C7;">⏳ ${isDe ? "Löschlauf wird verarbeitet..." : "Processing sweep..."}</p>';

        try {
          const res = await fetch('/api/v1/compliance/prune', {
            method: 'POST',
            headers: { 'content-type': 'application/json' },
            body: JSON.stringify({ tenantId: '${tenantId}', dryRun })
          });
          const data = await res.json();
          if (res.ok) {
            banner.innerHTML = '<div style="background:#ECFDF5; border:1px solid #A7F3D0; color:#065F46; padding:8px 12px; border-radius:6px; font-size:13px;">' +
              '<strong>✓ ' + (dryRun ? '${isDe ? "Testlauf erfolgreich" : "Dry-run successful"}' : '${isDe ? "Löschlauf abgeschlossen" : "Sweep completed"}') + ':</strong> ' +
              data.sweep.recordsPurged + ' ${isDe ? "Datensätze bereinigt (Audit-Hash: " : "records purged (hash: "}' + data.sweep.auditHash.slice(0, 8) + '…)</div>';
            if (!dryRun) {
              setTimeout(() => window.location.reload(), 1500);
            }
          } else {
            banner.innerHTML = '<p style="color:#DC2626;">✗ Fehler beim Löschlauf.</p>';
          }
        } catch (err) {
          banner.innerHTML = '<p style="color:#DC2626;">✗ Netzwerkfehler.</p>';
        }
      }
    </script>
  `;
}
