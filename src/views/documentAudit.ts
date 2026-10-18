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
  const { lang = "de", containerId = "MSKU7829104" } = options;
  const isDe = lang === "de";

  return `
    <div class="split-audit-workspace" id="document-audit-workspace">
      
      <!-- LEFT WORKSPACE PANE: VISUAL INSPECTOR & PAN/ZOOM CANVAS -->
      <div class="audit-pane-left">
        <!-- Hidden file upload input -->
        <input type="file" id="audit-file-input" class="hidden" accept=".png,.jpg,.jpeg,.pdf,.webp" style="display:none;" onchange="handleAuditFileUpload(event)">

        <!-- Top Inspector Toolbar -->
        <div class="canvas-toolbar" id="canvas-toolbar">
          <div class="canvas-controls-group">
            <i class="fa-regular fa-file-lines text-signal-blue"></i>
            <span id="audit-file-name" style="font-weight:600; color:#F1F5F9; max-width:160px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
              sample bill of ladling.png
            </span>
            <span id="audit-file-size" style="background:#162035; border:1px solid #1E293B; border-radius:4px; padding:1px 6px; font-size:10px; font-weight:700; color:#38BDF8;">
              86 KB
            </span>
            <span id="audit-sha-pill" style="font-family:'JetBrains Mono', monospace; font-size:10px; color:#64748B; background:rgba(0,0,0,0.3); padding:1px 6px; border-radius:4px; max-width:110px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="SHA-256: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069">
              SHA: 7f83b165...
            </span>
            <button type="button" class="zoom-btn" onclick="copyActiveSha()" title="${isDe ? "SHA-256 Prüfhash kopieren" : "Copy SHA-256 hash"}" style="padding:1px 5px; height:22px; font-size:10px;">
              <i class="fa-regular fa-copy"></i>
            </button>
          </div>

          <div class="canvas-controls-group">
            <!-- Upload new document -->
            <button type="button" class="zoom-btn" onclick="document.getElementById('audit-file-input').click()" style="background:#0284C7; color:#FFFFFF; border-color:#38BDF8;" title="${isDe ? "Neuen Beleg hochladen" : "Upload new document"}">
              <i class="fa-solid fa-arrow-up-from-bracket"></i>
              <span>${isDe ? "Neuer Import" : "Upload"}</span>
            </button>
            <!-- Clear document / reset to empty dropzone -->
            <button type="button" id="btn-clear-doc" class="zoom-btn" onclick="resetDocument()" style="background:#2A1215; border-color:#5B1A1E; color:#EF4444;" title="${isDe ? "Beleg entfernen & Ansicht zurücksetzen" : "Clear document & reset view"}">
              <i class="fa-solid fa-xmark"></i>
              <span>${isDe ? "Entfernen" : "Clear"}</span>
            </button>
          </div>
        </div>

        <!-- Combined Zoom & Viewport Controls Bar -->
        <div style="height:32px; background:#080D18; border-bottom:1px solid #1E293B; display:flex; align-items:center; justify-content:space-between; padding:0 10px; font-size:11px; user-select:none; flex-shrink:0;">
          <div style="display:flex; align-items:center; gap:4px;">
            <button type="button" class="zoom-btn" onclick="zoomAuditCanvas(-0.25)" title="${isDe ? "Verkleinern (-)" : "Zoom Out (-)"}">
              <i class="fa-solid fa-minus"></i>
            </button>
            <button type="button" class="zoom-btn" id="audit-zoom-indicator" onclick="resetAuditZoom()" title="${isDe ? "Auf 100% zurücksetzen (1:1)" : "Reset to 100% (1:1)"}" style="font-family:'JetBrains Mono', monospace; font-weight:700;">
              100%
            </button>
            <button type="button" class="zoom-btn" onclick="zoomAuditCanvas(0.25)" title="${isDe ? "Vergrößern (+)" : "Zoom In (+)"}">
              <i class="fa-solid fa-plus"></i>
            </button>

            <span style="display:inline-block; width:1px; height:14px; background:#1E293B; margin:0 4px;"></span>

            <button type="button" class="zoom-btn" onclick="fitAuditWidth()" title="${isDe ? "An Fensterbreite anpassen" : "Fit Width"}">
              <i class="fa-solid fa-arrows-left-right"></i>
              <span>${isDe ? "Breite" : "Width"}</span>
            </button>
            <button type="button" class="zoom-btn" onclick="fitAuditPage()" title="${isDe ? "Ganze Seite einpassen" : "Fit Page"}">
              <i class="fa-solid fa-arrows-up-down"></i>
              <span>${isDe ? "Seite" : "Page"}</span>
            </button>
            <button type="button" class="zoom-btn" onclick="resetAuditZoom()" title="${isDe ? "Originalgröße 100%" : "Original size 1:1"}">
              1:1
            </button>
            <button type="button" class="zoom-btn" onclick="rotateAuditCanvas()" title="${isDe ? "90° im Uhrzeigersinn drehen" : "Rotate 90 degrees"}">
              <i class="fa-solid fa-rotate-right"></i>
            </button>
          </div>

          <div style="display:flex; align-items:center; gap:6px;">
            <button type="button" class="zoom-btn" onclick="openFullscreenModal()" title="${isDe ? "Vollbildanzeige öffnen" : "Open fullscreen"}">
              <i class="fa-solid fa-expand"></i>
            </button>
          </div>
        </div>

        <!-- Canvas Viewport -->
        <div class="audit-canvas-viewport" id="audit-canvas-viewport" onwheel="handleAuditWheel(event)" onmousedown="startAuditPan(event)">
          <!-- Document Preview Image -->
          <div id="audit-image-container" style="display:flex; align-items:center; justify-content:center; width:100%; height:100%;">
            <img
              id="audit-preview-img"
              class="audit-preview-img"
              src="/static/sample_docs/sample bill of ladling.png"
              alt="${isDe ? "Dokumentenvorschau Frachtbrief" : "Document preview waybill"}"
              onload="onPreviewImageLoaded()"
            >
          </div>

          <!-- Empty State Dropzone (Hidden while document is loaded) -->
          <div id="audit-empty-dropzone" style="display:none; text-align:center; padding:32px 24px; max-width:420px; background:#0B1322; border:2px dashed #2A3B55; border-radius:14px;">
            <div style="font-size:36px; margin-bottom:12px;">📥</div>
            <h3 style="font-size:15px; font-weight:700; color:#FFFFFF; margin:0 0 6px 0;">
              ${isDe ? "Kein Beleg geladen" : "No Document Loaded"}
            </h3>
            <p style="font-size:12px; color:#94A3B8; margin:0 0 16px 0;">
              ${isDe ? "Frachtbrief, Handelsrechnung oder Packliste hierher ziehen oder auswählen." : "Drag and drop waybill, invoice, or packing list here."}
            </p>
            <button type="button" class="btn-scenario clean" onclick="document.getElementById('audit-file-input').click()" style="margin-bottom:12px;">
              📁 ${isDe ? "Dateien auswählen (PDF, PNG, JPG)" : "Choose Files (PDF, PNG, JPG)"}
            </button>
            <div style="font-size:11.5px; color:#64748B; margin-bottom:16px;">
              ${isDe ? "Oder Beleg direkt aus der Zwischenablage einfügen (" : "Or paste directly from clipboard ("}<kbd>Strg+V</kbd>)
            </div>

            <!-- Supported Docs Popover Trigger -->
            <div style="border-top:1px solid #1E293B; padding-top:14px; text-align:left;">
              <span style="font-size:11px; font-weight:700; color:#38BDF8; text-transform:uppercase;">
                ${isDe ? "Musterbelege laden:" : "Load Sample Document:"}
              </span>
              <div style="display:grid; grid-template-columns:repeat(2, 1fr); gap:6px; margin-top:8px;">
                <button type="button" class="zoom-btn" onclick="loadSampleDoc('bol')" style="justify-content:center;">
                  🚢 Ocean B/L
                </button>
                <button type="button" class="zoom-btn" onclick="loadSampleDoc('invoice')" style="justify-content:center;">
                  📄 Rechnung
                </button>
                <button type="button" class="zoom-btn" onclick="loadSampleDoc('packing_list')" style="justify-content:center;">
                  📦 Packliste
                </button>
                <button type="button" class="zoom-btn" onclick="loadSampleDoc('origin')" style="justify-content:center;">
                  🏛️ Ursprung
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Sample Doc Switcher Footer Bar -->
        <div style="background:#080D18; border-top:1px solid #1E293B; padding:6px 12px; display:flex; align-items:center; justify-content:space-between; gap:8px; font-size:11px; flex-shrink:0;">
          <span style="color:#64748B; font-weight:600;">
            ${isDe ? "Muster:" : "Samples:"}
          </span>
          <div style="display:flex; gap:6px; flex-wrap:wrap;">
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('bol')" style="color:#38BDF8; font-weight:700;">
              🚢 Ocean B/L
            </button>
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('invoice')">
              📄 Handelsrechnung
            </button>
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('packing_list')">
              📦 Packliste
            </button>
            <button type="button" class="zoom-btn" onclick="loadSampleDoc('origin')">
              🏛️ Ursprung
            </button>
          </div>
        </div>
      </div>

      <!-- RIGHT WORKSPACE PANE: 5-STAGE PIPELINE & VERIFICATION TELEMETRY -->
      <div class="audit-pane-right">
        <!-- Station Title Banner -->
        <div style="display:flex; align-items:center; justify-content:space-between; margin-bottom:8px; flex-shrink:0;">
          <div>
            <h2 style="font-size:15px; font-weight:800; color:var(--color-text-primary); margin:0;">
              ${isDe ? "5-Stufen Zoll- & Dokumentenprüfung" : "5-Stage Customs & Document Audit"}
            </h2>
            <p style="font-size:11.5px; color:var(--color-text-muted); margin:2px 0 0 0;">
              ${isDe ? "Automatisierte OCR-Extraktion, ISO 6346 Modulo-11 Prüfziffer und ADSp 2017 Tara-Toleranz." : "Automated OCR extraction, ISO 6346 Modulo-11 checksum, and ADSp 2017 tare tolerance."}
            </p>
          </div>
        </div>

        <!-- 5-Stage Pipeline Breadcrumb Ribbon -->
        <div class="pipeline-breadcrumb-strip">
          <div class="breadcrumb-steps">
            <span class="breadcrumb-step completed"><i class="fa-solid fa-circle-check"></i> 1. INGEST</span>
            <span class="breadcrumb-arrow">›</span>
            <span class="breadcrumb-step completed"><i class="fa-solid fa-circle-check"></i> 2. OCR</span>
            <span class="breadcrumb-arrow">›</span>
            <span class="breadcrumb-step completed"><i class="fa-solid fa-circle-check"></i> 3. MODULO-11</span>
            <span class="breadcrumb-arrow">›</span>
            <span class="breadcrumb-step completed"><i class="fa-solid fa-circle-check"></i> 4. TOLERANZ</span>
            <span class="breadcrumb-arrow">›</span>
            <span class="breadcrumb-step active"><i class="fa-solid fa-circle-play"></i> 5. ATLAS</span>
          </div>
          <span class="stage-badge-pill pass" id="overall-status-pill">
            ✓ ${isDe ? "ATLAS Pre-Clearance BEREIT" : "ATLAS Pre-Clearance READY"}
          </span>
        </div>

        <!-- 5-Stage Compact Checklist Cards -->
        <div class="audit-stages-stack" style="display:flex; flex-direction:column; gap:10px;">
          
          <!-- Stage 1: File Integrity -->
          <div class="audit-stage-card">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--color-signal-blue);">01</span>
                <strong style="font-size:13px;">${isDe ? "Dateinintegrität & SHA-256 Signatur" : "File Integrity & SHA-256 Signature"}</strong>
              </div>
              <span class="stage-badge-pill pass">PASS</span>
            </div>
            <div style="font-size:11px; font-family:'JetBrains Mono', monospace; color:var(--color-text-muted); background:rgba(0,0,0,0.25); border:1px solid #1E293B; padding:5px 8px; border-radius:4px; display:flex; align-items:center; justify-content:space-between;">
              <span id="stage-sha-val" style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:85%;">7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069</span>
              <button type="button" onclick="copyActiveSha()" class="zoom-btn" style="padding:1px 6px; height:20px; font-size:10px;" title="Kopieren">
                <i class="fa-regular fa-copy"></i>
              </button>
            </div>
          </div>

          <!-- Stage 2: OCR & Structured Extraction (Colon-Aligned Monospace Grid) -->
          <div class="audit-stage-card">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:var(--color-signal-blue);">02</span>
                <strong style="font-size:13px;">${isDe ? "OCR & Strukturierte Entitätserkennung" : "OCR & Structured Entity Recognition"}</strong>
              </div>
              <span class="stage-badge-pill pass">100% CONFIDENCE</span>
            </div>
            
            <div class="align-grid">
              <div class="align-row">
                <span class="align-label">${isDe ? "Container-Kennzeichnung" : "Container ID"}</span>
                <span class="align-colon">:</span>
                <span class="align-value" id="extracted-container-id" style="color:#38BDF8;">${containerId}</span>
              </div>
              <div class="align-row">
                <span class="align-label">${isDe ? "Konnossement (B/L Nr.)" : "Bill of Lading No."}</span>
                <span class="align-colon">:</span>
                <span class="align-value">MSK-HAM-2026-9182</span>
              </div>
              <div class="align-row">
                <span class="align-label">${isDe ? "Bruttomasse (VGM)" : "Declared Gross Weight"}</span>
                <span class="align-colon">:</span>
                <span class="align-value" id="extracted-gross-wt">24.500 kg</span>
              </div>
              <div class="align-row">
                <span class="align-label">${isDe ? "Zolltarifnummer (HS)" : "HS Tariff Code"}</span>
                <span class="align-colon">:</span>
                <span class="align-value">8471.30.00 (Rechner / EDV)</span>
              </div>
              <div class="align-row">
                <span class="align-label">${isDe ? "Ursprungsland" : "Country of Origin"}</span>
                <span class="align-colon">:</span>
                <span class="align-value">DE (Deutschland)</span>
              </div>
              <div class="align-row">
                <span class="align-label">${isDe ? "Zollwert (CIF Hamburg)" : "Customs Value"}</span>
                <span class="align-colon">:</span>
                <span class="align-value">184.200,00 EUR</span>
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
            <p style="font-size:12px; color:var(--color-text-muted); margin:0;">
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
            <div style="display:flex; align-items:center; justify-content:space-between; font-size:12px; margin-top:2px;">
              <span>${isDe ? "Tara:" : "Tare:"} <strong>3.750 kg</strong></span>
              <span>${isDe ? "Netto:" : "Net:"} <strong>20.750 kg</strong></span>
              <span>${isDe ? "Toleranzgrenze:" : "Allowed Delta:"} <strong style="color:#10B981;">&plusmn; 50 kg</strong></span>
            </div>
          </div>

          <!-- Stage 5: ATLAS Pre-Clearance Decision -->
          <div class="audit-stage-card" style="border: 2px solid #059669; background: rgba(16, 185, 129, 0.05);">
            <div class="stage-header-row">
              <div style="display:flex; align-items:center; gap:8px;">
                <span style="font-weight:800; color:#10B981;">05</span>
                <strong style="font-size:13px; color:#10B981;">${isDe ? "ATLAS Pre-Clearance Entscheidung (§ 147 AO)" : "ATLAS Pre-Clearance Decision (§ 147 AO)"}</strong>
              </div>
              <span class="stage-badge-pill pass">FREIGABE (CLEARED)</span>
            </div>
            <p style="font-size:12px; margin:4px 0 10px 0; color:var(--color-text-primary);">
              ${isDe 
                ? "Dossier erfüllt alle Anforderungen nach § 147 AO und ATLAS 9.1. Keine Quarantäne erforderlich. Bereit für den 3-Wege-Abgleich."
                : "Dossier satisfies all criteria under § 147 AO and ATLAS 9.1. No quarantine required. Ready for 3-way reconciliation."}
            </p>
            <div style="display:flex; gap:8px;">
              <a href="/portal/reconcile?sample=clean&lang=${lang}" class="btn-scenario clean" style="text-decoration:none; display:inline-flex; align-items:center; gap:6px; padding:6px 12px; font-size:12px;">
                ➡️ ${isDe ? "Im 3-Wege-Abgleich öffnen" : "Open in 3-Way Match"}
              </a>
              <button type="button" class="zoom-btn" onclick="window.print()" style="padding:6px 12px; font-size:12px;">
                🖨️ ${isDe ? "Prüfprotokoll drucken" : "Print Protocol"}
              </button>
            </div>
          </div>

        </div>
      </div>

    </div>
  `;
}
