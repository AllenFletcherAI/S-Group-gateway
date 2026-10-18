/**
 * Tab 3: Quarantäne & Standgeld-Cockpit (Quarantine & Demurrage Center)
 * S-Group Gateway - Schäfer & SIS Interlogistik
 *
 * WHY: Dedicated operational Leitstand isolating freight discrepancies before port gate-in,
 * tracking ticking demurrage costs (€150–€500/day), and issuing formal ADSp 2017 legal claims.
 */

export interface QuarantineViewOptions {
  lang?: "de" | "en";
  filter?: string;
  search?: string;
}

export function renderQuarantineView(options: QuarantineViewOptions = {}): string {
  const { lang = "de", filter = "all", search = "" } = options;
  const isDe = lang === "de";

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
          <button type="button" class="zoom-btn" onclick="openAdspModal('MSKU7829104')" style="background:#EF4444; color:#FFFFFF; border-color:#DC2626; padding:8px 12px; font-weight:700; display:inline-flex; align-items:center; gap:6px;">
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
          <div class="kpi-number" style="color:#EF4444;">3</div>
          <div style="font-size:11.5px; color:#EF4444; font-weight:600; margin-top:2px;">
            ${isDe ? "Sofortige Klärung erforderlich" : "Immediate action required"}
          </div>
        </div>

        <div class="quar-kpi-card" style="border-left:4px solid #F59E0B;">
          <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--color-text-muted);">
            ${isDe ? "Akute Frist (< 24h)" : "Critical Deadline (< 24h)"}
          </div>
          <div class="kpi-number" style="color:#F59E0B;">1</div>
          <div style="font-size:11.5px; color:var(--color-text-muted); margin-top:2px;">
            ${isDe ? "Freitage laufen heute ab" : "Free days expire today"}
          </div>
        </div>

        <div class="quar-kpi-card" style="border-left:4px solid #10B981;">
          <div style="font-size:11px; text-transform:uppercase; font-weight:700; color:var(--color-text-muted);">
            ${isDe ? "Abgewendete Standgelder" : "Demurrage Prevented"}
          </div>
          <div class="kpi-number" style="color:#10B981;">3.850 €</div>
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
            ${isDe ? "Alle Fälle (3)" : "All Holds (3)"}
          </a>
          <a href="/portal/quarantine?filter=critical&lang=${lang}" class="zoom-btn" style="${filter === "critical" ? "background:#0284C7; color:#FFFFFF; border-color:#38BDF8;" : ""}">
            ${isDe ? "Akut < 24h (1)" : "Critical < 24h (1)"}
          </a>
          <a href="/portal/quarantine?filter=hamburg&lang=${lang}" class="zoom-btn" style="${filter === "hamburg" ? "background:#0284C7; color:#FFFFFF; border-color:#38BDF8;" : ""}">
            ${isDe ? "Seehafen Hamburg (2)" : "Hamburg Seaport (2)"}
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
            <!-- Case 1: Active Discrepancy (VGM Weight Delta) -->
            <tr>
              <td>
                <strong style="color:#0284C7;">SHP-SIS-1049</strong>
                <div style="font-size:11px; color:var(--color-text-muted);">Hamburg CTA (Altenwerder)</div>
              </td>
              <td>
                <code style="font-size:12px; font-weight:700;">MSKU7829104</code>
                <div style="font-size:11px; color:var(--color-text-muted);">Maersk Line (Ocean Feeder)</div>
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="color:#F59E0B; font-weight:700;"><i class="fa-regular fa-clock"></i> ${isDe ? "48h verbleibend" : "48h remaining"}</span>
                </div>
                <div style="font-size:11px; color:var(--color-text-muted);">${isDe ? "Freitage bis 20. Okt 18:00" : "Free days until Oct 20, 18:00"}</div>
              </td>
              <td>
                <span class="stage-badge-pill hold"><i class="fa-solid fa-triangle-exclamation"></i> +220 kg VGM Delta</span>
                <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${isDe ? "B/L: 24.500 kg vs Packliste: 24.720 kg" : "B/L: 24,500 kg vs Packing list: 24,720 kg"}</div>
              </td>
              <td style="text-align:right; font-weight:700; color:#EF4444;">
                ${isDe ? "350 € / Tag" : "350 € / day"}
              </td>
              <td style="text-align:center;">
                <span class="stage-badge-pill hold">${isDe ? "QUARANTÄNE" : "QUARANTINE"}</span>
              </td>
              <td style="text-align:right;">
                <button type="button" class="zoom-btn" onclick="openAdspModal('MSKU7829104')" style="color:#EF4444; border-color:#DC2626; display:inline-flex; align-items:center; gap:4px;">
                  <i class="fa-solid fa-scale-balanced"></i> ${isDe ? "Haftungsanzeige" : "ADSp Claim"}
                </button>
                <button type="button" class="zoom-btn" onclick="openSupervisorOverrideModal('SHP-SIS-1049')" style="margin-left:4px; display:inline-flex; align-items:center; gap:4px;">
                  <i class="fa-solid fa-lock-open"></i> ${isDe ? "Freigabe" : "Override"}
                </button>
              </td>
            </tr>

            <!-- Case 2: Missing Commercial Invoice -->
            <tr>
              <td>
                <strong style="color:#0284C7;">SHP-SIS-1052</strong>
                <div style="font-size:11px; color:var(--color-text-muted);">Hamburg CTB (Burchardkai)</div>
              </td>
              <td>
                <code style="font-size:12px; font-weight:700;">HLXU9201472</code>
                <div style="font-size:11px; color:var(--color-text-muted);">Hapag-Lloyd</div>
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="color:#EF4444; font-weight:800;"><i class="fa-solid fa-triangle-exclamation"></i> ${isDe ? "8h Frist (AKUT)" : "8h Deadline (CRITICAL)"}</span>
                </div>
                <div style="font-size:11px; color:var(--color-text-muted);">${isDe ? "Freitage laufen heute 18:00 ab" : "Free days expire today at 18:00"}</div>
              </td>
              <td>
                <span class="stage-badge-pill hold"><i class="fa-regular fa-file-lines"></i> ${isDe ? "Fehlende Handelsrechnung" : "Missing Commercial Invoice"}</span>
                <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${isDe ? "Zollwert für ATLAS 9.1 nicht deklariert" : "Customs value undeclared for ATLAS 9.1"}</div>
              </td>
              <td style="text-align:right; font-weight:700; color:#EF4444;">
                ${isDe ? "180 € / Tag" : "180 € / day"}
              </td>
              <td style="text-align:center;">
                <span class="stage-badge-pill hold">${isDe ? "AKUT" : "CRITICAL"}</span>
              </td>
              <td style="text-align:right;">
                <button type="button" class="zoom-btn" onclick="openAdspModal('HLXU9201472')" style="color:#EF4444; border-color:#DC2626; display:inline-flex; align-items:center; gap:4px;">
                  <i class="fa-solid fa-scale-balanced"></i> ${isDe ? "Haftungsanzeige" : "ADSp Claim"}
                </button>
                <button type="button" class="zoom-btn" onclick="openSupervisorOverrideModal('SHP-SIS-1052')" style="margin-left:4px; display:inline-flex; align-items:center; gap:4px;">
                  <i class="fa-solid fa-lock-open"></i> ${isDe ? "Freigabe" : "Override"}
                </button>
              </td>
            </tr>

            <!-- Case 3: Hazardous Goods Segregation Alert -->
            <tr>
              <td>
                <strong style="color:#0284C7;">SHP-SIS-1055</strong>
                <div style="font-size:11px; color:var(--color-text-muted);">Eurogate Waltershof</div>
              </td>
              <td>
                <code style="font-size:12px; font-weight:700;">TGHU4182901</code>
                <div style="font-size:11px; color:var(--color-text-muted);">S-Group Feeder Truck</div>
              </td>
              <td>
                <div style="display:flex; align-items:center; gap:6px;">
                  <span style="color:#F59E0B; font-weight:700;"><i class="fa-regular fa-clock"></i> ${isDe ? "72h verbleibend" : "72h remaining"}</span>
                </div>
                <div style="font-size:11px; color:var(--color-text-muted);">${isDe ? "Freitage bis 21. Okt 12:00" : "Free days until Oct 21, 12:00"}</div>
              </td>
              <td>
                <span class="stage-badge-pill hold"><i class="fa-solid fa-biohazard"></i> ${isDe ? "ADR Klasse 3 Segregation" : "ADR Class 3 Segregation"}</span>
                <div style="font-size:11px; color:var(--color-text-muted); margin-top:2px;">${isDe ? "Entzündbare Flüssigkeiten ohne DGD-Zertifikat" : "Flammable liquids without DGD certificate"}</div>
              </td>
              <td style="text-align:right; font-weight:700; color:#EF4444;">
                ${isDe ? "450 € / Tag" : "450 € / day"}
              </td>
              <td style="text-align:center;">
                <span class="stage-badge-pill hold">ADR HOLD</span>
              </td>
              <td style="text-align:right;">
                <button type="button" class="zoom-btn" onclick="openAdspModal('TGHU4182901')" style="color:#EF4444; border-color:#DC2626; display:inline-flex; align-items:center; gap:4px;">
                  <i class="fa-solid fa-scale-balanced"></i> ${isDe ? "Haftungsanzeige" : "ADSp Claim"}
                </button>
                <button type="button" class="zoom-btn" onclick="openSupervisorOverrideModal('SHP-SIS-1055')" style="margin-left:4px; display:inline-flex; align-items:center; gap:4px;">
                  <i class="fa-solid fa-lock-open"></i> ${isDe ? "Freigabe" : "Override"}
                </button>
              </td>
            </tr>
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
                ${isDe ? "Offizielle Haftungsanzeige nach ADSp 2017 Ziff. 19 & § 412 HGB" : "Official Notice of Demurrage Claim (ADSp 2017 & § 412 HGB)"}
              </strong>
            </div>
            <button type="button" onclick="closeAdspModal()" class="zoom-btn" style="padding:4px 8px;">✕</button>
          </div>

          <div style="background:#05080E; border:1px solid #1E293B; border-radius:8px; padding:16px; margin:16px 0; font-family:monospace; font-size:12px; color:#E2E8F0; line-height:1.6; max-height:360px; overflow-y:auto;" id="adsp-claim-text">
            ${isDe ? `
              <strong>SCHÄFER & SIS INTERLOGISTIK GMBH</strong><br>
              Abteilung Seehafen-Spedition & Zollabwicklung • Hamburg Hub<br>
              Datum: 18. Oktober 2026<br><br>
              <strong>VORBEHALTS- UND HAFTUNGSANZEIGE GEMÄSS ADSp 2017 ZIFF. 19 / § 412 HGB</strong><br>
              Bezug: Container-ID <span id="adsp-container-ref">MSKU7829104</span> / Sendung SHP-SIS-1049<br>
              Terminal: CTA Hamburg (Altenwerder)<br><br>
              Sehr geehrte Damen und Herren,<br><br>
              bei der deterministischen 3-Wege-Prüfung der Frachtdokumente vor Terminal Gate-in wurde eine 
              unzulässige Gewichtsdiskrepanz von <strong>+220 kg</strong> zwischen Frachturkunde (B/L) und Packliste festgestellt.<br><br>
              Gemäß Ziffer 19 ADSp 2017 sowie § 412 HGB haftet der Auftraggeber/Verlader für alle Schäden und 
              Kosten, die durch unrichtige oder unvollständige Angaben im Frachtbrief entstehen.<br><br>
              Wir zeigen hiermit vorsorglich an, dass sämtliche anfallenden Stand- und Liegegelder 
              (Demurrage/Detention) in Höhe von aktuell <strong>350,00 EUR pro Kalendertag</strong> sowie 
              etwaige ATLAS-Nachverzollungskosten zu Ihren Lasten gehen.<br><br>
              Mit freundlichen Grüßen,<br>
              Schäfer & SIS Interlogistik GmbH • Automatisierter Zoll-Leitstand
            ` : `
              <strong>SCHÄFER & SIS INTERLOGISTIK GMBH</strong><br>
              Seaport Forwarding & Customs Department • Hamburg Hub<br>
              Date: 18 October 2026<br><br>
              <strong>DEMURRAGE CLAIM AND RESERVATION OF RIGHTS (ADSp 2017 SEC. 19 / § 412 HGB)</strong><br>
              Reference: Container <span id="adsp-container-ref">MSKU7829104</span> / Shipment SHP-SIS-1049<br>
              Terminal: CTA Hamburg (Altenwerder)<br><br>
              Dear Sir or Madam,<br><br>
              During deterministic 3-way cross-check of transport documentation prior to terminal gate-in, an inadmissible 
              gross weight discrepancy of <strong>+220 kg</strong> was detected between bill of lading (B/L) and packing list.<br><br>
              Pursuant to Clause 19 ADSp 2017 and § 412 of the German Commercial Code (HGB), shipper/consignor is strictly liable for 
              all damages and costs incurred from inaccurate or incomplete transport declarations.<br><br>
              Notice is hereby given that all demurrage and detention charges amounting to currently 
              <strong>EUR 350.00 per calendar day</strong> as well as secondary customs inspection expenses will be debited to your account.<br><br>
              Yours faithfully,<br>
              Schäfer & SIS Interlogistik GmbH • Automated Customs Cockpit
            `}
          </div>

          <div style="display:flex; justify-content:flex-end; gap:8px;">
            <button type="button" class="zoom-btn" onclick="copyAdspClaimText()" style="background:#0284C7; color:#FFFFFF; border-color:#38BDF8; padding:8px 14px; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-regular fa-copy"></i> ${isDe ? "In Zwischenablage kopieren" : "Copy to Clipboard"}
            </button>
            <button type="button" class="zoom-btn" onclick="window.print()" style="padding:8px 14px; display:inline-flex; align-items:center; gap:6px;">
              <i class="fa-solid fa-print"></i> ${isDe ? "Drucken" : "Print"}
            </button>
            <button type="button" class="zoom-btn" onclick="closeAdspModal()" style="padding:8px 14px;">
              ${isDe ? "Schließen" : "Close"}
            </button>
          </div>
        </div>
      </div>

      </div>
    </div>
  `;
}
