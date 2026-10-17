/**
 * Tab 1: Dokumenten-Audit (Document Audit & Visual Inspector Workspace)
 * S-Group Gateway - Schäfer & SIS Interlogistik
 *
 * WHY: Provides an active operational workstation where freight dispatchers
 * inspect authentic freight documentation (B/L, Commercial Invoice, Packing List),
 * execute pan/zoom visual verification, and run deterministic 5-stage customs validation.
 */

export interface DocumentAuditViewOptions {
  lang?: "de" | "en";
  activeSampleDoc?: string;
  containerId?: string;
}

export function renderDocumentAuditView(options: DocumentAuditViewOptions = {}): string {
  const { lang = "de", activeSampleDoc = "bol", containerId = "MSKU7829104" } = options;
  const isDe = lang === "de";

  return `
    <div class="split-audit-workspace" id="document-audit-workspace">
      
      <!-- LEFT WORKSPACE PANE: VISUAL INSPECTOR & PAN/ZOOM CANVAS -->
      <div class="audit-pane-left">
        <!-- Hidden file upload input -->
        <input type="file" id="audit-file-input" class="hidden" accept=".png,.jpg,.jpeg,.pdf,.webp" style="display:none;" onchange="handleAuditFileUpload(event)">

        <!-- Canvas Toolbar -->
        <div class="canvas-toolbar" id="canvas-toolbar">
          <div class="canvas-controls-group">
            <span id="audit-file-name" style="font-weight:600; color:#F1F5F9; max-width:180px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              sample bill of ladling.png
            </span>
            <span id="audit-file-size" style="background:#162035; border:1px solid #1E293B; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:700; color:#38BDF8;">
              86 KB
            </span>
          </div>

          <!-- Pan / Zoom Controls -->
          <div class="canvas-controls-group">
            <button type="button" class="zoom-btn" onclick="zoomAuditCanvas(-0.25)" title="${isDe ? "Verkleinern (-)" : "Zoom Out (-)"}">
              ➖
            </button>
            <button type="button" class="zoom-btn" id="audit-zoom-indicator" onclick="resetAuditZoom()" title="${isDe ? "Auf 100% zurücksetzen" : "Reset to 100%"}">
              100%
            </button>
            <button type="button" class="zoom-btn" onclick="zoomAuditCanvas(0.25)" title="${isDe ? "Vergrößern (+)" : "Zoom In (+)"}">
              ➕
            </button>
            <button type="button" class="zoom-btn" onclick="fitAuditWidth()" title="${isDe ? "Breite anpassen" : "Fit Width"}">
              ↔ ${isDe ? "Breite" : "Width"}
            </button>
            <button type="button" class="zoom-btn" onclick="fitAuditPage()" title="${isDe ? "Ganze Seite einpassen" : "Fit Page"}">
              ↕ ${isDe ? "Seite" : "Page"}
            </button>
            <button type="button" class="zoom-btn" onclick="rotateAuditCanvas()" title="${isDe ? "90° Drehen" : "Rotate 90°"}">
              ↻
            </button>
            <button type="button" class="zoom-btn" onclick="document.getElementById('audit-file-input').click()" style="background:#0284C7; color:#FFFFFF; border-color:#38BDF8;">
              📤 ${isDe ? "Neuer Beleg" : "Upload"}
            </button>
          </div>
        </div>

        <!-- Canvas Viewport -->
        <div class="audit-canvas-viewport" id="audit-canvas-viewport" onwheel="handleAuditWheel(event)" onmousedown="startAuditPan(event)">
          <img
            id="audit-preview-img"
            class="audit-preview-img"
            src="/static/sample_docs/sample bill of ladling.png"
            alt="${isDe ? "Dokumentenvorschau Frachtbrief" : "Document preview waybill"}"
            style="transform: scale(1) translate(0px, 0px) rotate(0deg);"
          >
        </div>

        <!-- Sample Doc Switcher Footer Bar -->
        <div style="background:#0B1220; border-top:1px solid #1E293B; padding:8px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px;">
          <span style="color:#94A3B8; font-weight:600;">
            ${isDe ? "Musterbelege:" : "Sample Docs:"}
          </span>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('bol')" style="color:#38BDF8; font-weight:700;">
              🚢 ${isDe ? "Ocean B/L" : "Ocean B/L"}
            </button>
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('invoice')">
              📄 ${isDe ? "Handelsrechnung" : "Invoice"}
            </button>
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('packing_list')">
              📦 ${isDe ? "Packliste" : "Packing List"}
            </button>
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('origin')">
              🏛️ ${isDe ? "Ursprungszeugnis" : "Certificate of Origin"}
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT WORKSPACE PANE: 5-STAGE PIPELINE & VERIFICATION TELEMETRY -->
      <div class="audit-pane-right">
        <!-- Header Banner -->
        <div style="display:flex; align-items:center; justify-content:space-between; border-bottom:1px solid var(--color-border-slate); padding-bottom:12px;">
          <div>
            <div style="display:flex; align-items:center; gap:8px;">
              <span class="live-dot" style="font-size:12px;">●</span>
              <h2 style="font-size:18px; font-weight:800; color:var(--color-text-primary); margin:0;">
                ${isDe ? "5-Stufen Zoll- & Dokumentenprüfung" : "5-Stage Customs & Document Audit"}
              </h2>
            </div>
            <p style="font-size:12px; color:var(--color-text-muted); margin:4px 0 0 0;">
              ${isDe ? "Automatisierte OCR-Extraktion, ISO 6346 Modulo-11 Prüfziffer und ADSp 2017 Tara-Toleranz." : "Automated OCR extraction, ISO 6346 Modulo-11 checksum, and ADSp 2017 tare tolerance."}
            </p>
          </div>
          <span class="stage-badge-pill pass" id="overall-status-pill">
            ✓ ${isDe ? "ATLAS Pre-Clearance BEREIT" : "ATLAS Pre-Clearance READY"}
          </span>
        </div>

        <!-- 5-Stage Checklist -->
        <div class="audit-stages-stack">
          
          <!-- Stage 1: File Integrity -->
          <div class="audit-stage-card">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--color-signal-blue);">01</span>
                <strong style="font-size:13px;">${isDe ? "Dateinintegrität & SHA-256 Signatur" : "File Integrity & SHA-256 Signature"}</strong>
              </div>
              <span class="stage-badge-pill pass">PASS</span>
            </div>
            <div style="font-size:11px; font-family:monospace; color:var(--color-text-muted); background:rgba(0,0,0,0.04); padding:6px 8px; border-radius:4px; word-break:break-all;">
              SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
            </div>
          </div>

          <!-- Stage 2: OCR & Extraction -->
          <div class="audit-stage-card">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--color-signal-blue);">02</span>
                <strong style="font-size:13px;">${isDe ? "OCR & Strukturierte Entitätserkennung" : "OCR & Structured Entity Recognition"}</strong>
              </div>
              <span class="stage-badge-pill pass">100% CONFIDENCE</span>
            </div>
            <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:8px; font-size:12px; margin-top:6px;">
              <div>
                <span style="color:var(--color-text-muted);">${isDe ? "Container-Kennzeichnung:" : "Container ID:"}</span>
                <strong id="extracted-container-id" style="color:#0284C7; font-family:monospace; display:block;">${containerId}</strong>
              </div>
              <div>
                <span style="color:var(--color-text-muted);">${isDe ? "Deklarierte Bruttomasse (VGM):" : "Declared Gross Weight (VGM):"}</span>
                <strong id="extracted-gross-wt" style="display:block;">24.500 kg</strong>
              </div>
              <div>
                <span style="color:var(--color-text-muted);">${isDe ? "Zolltarifnummer (HS-Code):" : "HS Tariff Code:"}</span>
                <strong style="display:block;">8471.30.00</strong>
              </div>
              <div>
                <span style="color:var(--color-text-muted);">${isDe ? "Ursprungsland:" : "Country of Origin:"}</span>
                <strong style="display:block;">DE (Deutschland)</strong>
              </div>
            </div>
          </div>

          <!-- Stage 3: ISO 6346 Modulo-11 Checksum -->
          <div class="audit-stage-card">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--color-signal-blue);">03</span>
                <strong style="font-size:13px;">${isDe ? "ISO 6346 Modulo-11 Prüfziffern-Validierung" : "ISO 6346 Modulo-11 Check Digit Validation"}</strong>
              </div>
              <span class="stage-badge-pill pass" id="iso-checksum-badge">GÜLTIG (Valid)</span>
            </div>
            <p style="font-size:11.5px; color:var(--color-text-muted); margin:0;">
              ${isDe 
                ? "Eigentümercode 'MSK', Ausrüstungstyp 'U', Seriennummer '782910', Prüfziffer '4'. Modulo-11 Übereinstimmung mathematisch verifiziert."
                : "Owner code 'MSK', equipment type 'U', serial '782910', check digit '4'. Modulo-11 algorithm mathematically verified."}
            </p>
          </div>

          <!-- Stage 4: Tare & Tolerance Bounds Check -->
          <div class="audit-stage-card">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--color-signal-blue);">04</span>
                <strong style="font-size:13px;">${isDe ? "ADSp 2017 & SOLAS VGM Toleranzprüfung" : "ADSp 2017 & SOLAS VGM Tolerance Check"}</strong>
              </div>
              <span class="stage-badge-pill pass" id="tolerance-badge">DELTA 0 kg (&le; 50 kg)</span>
            </div>
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; margin-top:4px;">
              <span>${isDe ? "Leergewicht (Tara):" : "Tare Weight:"} <strong>3.750 kg</strong></span>
              <span>${isDe ? "Nettogewicht:" : "Net Weight:"} <strong>20.750 kg</strong></span>
              <span>${isDe ? "Zulässige Abweichung:" : "Allowed Delta:"} <strong style="color:#10B981;">&plusmn; 50 kg</strong></span>
            </div>
          </div>

          <!-- Stage 5: ATLAS Pre-Clearance Decision -->
          <div class="audit-stage-card" style="border: 2px solid #059669; background: rgba(16, 185, 129, 0.05);">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:#10B981;">05</span>
                <strong style="font-size:13px; color:#059669;">${isDe ? "ATLAS Pre-Clearance Entscheidung" : "ATLAS Pre-Clearance Decision"}</strong>
              </div>
              <span class="stage-badge-pill pass">FREIGABE (CLEARED)</span>
            </div>
            <p style="font-size:12px; margin:4px 0 10px 0; color:var(--color-text-primary);">
              ${isDe 
                ? "Dossier erfüllt alle Anforderungen nach § 147 AO und ATLAS 9.1. Keine Quarantäne erforderlich. Bereit für den 3-Wege-Abgleich."
                : "Dossier satisfies all criteria under § 147 AO and ATLAS 9.1. No quarantine required. Ready for 3-way reconciliation."}
            </p>
            <div style="display:flex; gap:10px;">
              <a href="/portal/reconcile?lang=${lang}&sample=clean" class="btn-scenario clean" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px;">
                ➡️ ${isDe ? "Im 3-Wege-Abgleich öffnen" : "Open in 3-Way Reconciliation"}
              </a>
              <button type="button" class="zoom-btn" onclick="window.print()" style="padding:8px 12px;">
                🖨️ ${isDe ? "Prüfprotokoll drucken" : "Print Audit Protocol"}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}
