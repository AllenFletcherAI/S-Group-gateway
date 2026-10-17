import { Shipment } from "../../repositories/shipments.js";

export interface Waypoint {
  name: string;
  nameEn: string;
  x: number;
  y: number;
  status: "COMPLETED" | "CURRENT" | "UPCOMING";
  timestamp?: string;
  noteDe?: string;
  noteEn?: string;
}

export interface CorridorProfile {
  corridorTitleDe: string;
  corridorTitleEn: string;
  mode: "OCEAN_VESSEL" | "ROAD_TRUCK";
  vehicleIdentifier: string;
  speedText: string;
  headingText: string;
  signalFix: string;
  distanceRemainingTextDe: string;
  distanceRemainingTextEn: string;
  progressPercent: number;
  pathD: string;
  currentVehiclePos: { x: number; y: number };
  waypoints: Waypoint[];
}

/**
 * Build realistic, sovereign GIS corridor profile for shipment
 * WHY: Adheres to German DSGVO Art. 5 by rendering aggregated macro-corridors
 * rather than minute-by-minute driver tracking trails.
 */
export function getCorridorProfile(shipment: Shipment): CorridorProfile {
  if (shipment.carrier === "MAERSK" || shipment.shipmentId === "SHP-SIS-3310") {
    // Intercontinental Ocean Corridor: Shanghai -> Hamburg
    return {
      corridorTitleDe: "Interkontinentaler Seefracht-Korridor (Asien – Nordeuropa)",
      corridorTitleEn: "Intercontinental Ocean Freight Corridor (Asia – North Europe)",
      mode: "OCEAN_VESSEL",
      vehicleIdentifier: "MV MAERSK MC-KINNEY MØLLER (IMO 9619907)",
      speedText: "19.4 kn (35.9 km/h)",
      headingText: "315° NW (Kurs Nord-West)",
      signalFix: "AIS Satelliten-Ortung (Inmarsat-C)",
      distanceRemainingTextDe: "2.840 Seemeilen (ca. 4 Tage Restlaufzeit)",
      distanceRemainingTextEn: "2,840 nautical miles (approx. 4 days remaining)",
      progressPercent: 65,
      pathD: "M 80 240 Q 250 250 380 180 T 580 120 T 820 70",
      currentVehiclePos: { x: 580, y: 120 },
      waypoints: [
        {
          name: "Shanghai Yangshan Deepwater Terminal",
          nameEn: "Shanghai Yangshan Deepwater Port",
          x: 80,
          y: 240,
          status: "COMPLETED",
          timestamp: "05.10.2026 02:00",
          noteDe: "Container verladen & abgelegt",
          noteEn: "Container loaded & departed",
        },
        {
          name: "Singapur Straße (Bunkerstopp)",
          nameEn: "Singapore Strait Hub",
          x: 280,
          y: 230,
          status: "COMPLETED",
          timestamp: "10.10.2026 14:30",
          noteDe: "Bunkern & Zwischenstopp abgeschlossen",
          noteEn: "Bunkering and passage completed",
        },
        {
          name: "Suezkanal Passage (Port Said)",
          nameEn: "Suez Canal Passage",
          x: 480,
          y: 155,
          status: "COMPLETED",
          timestamp: "16.10.2026 18:00",
          noteDe: "Konvoi-Passage Nordwärts freigegeben",
          noteEn: "Northbound convoy transit cleared",
        },
        {
          name: "Straße von Gibraltar (Mittelmeer-Ausfahrt)",
          nameEn: "Strait of Gibraltar",
          x: 580,
          y: 120,
          status: "CURRENT",
          timestamp: "18.10.2026 02:45",
          noteDe: "Aktuelle AIS-Ortung: Westkurs Atlantik",
          noteEn: "Live AIS Fix: Westbound to Atlantic",
        },
        {
          name: "Hamburg Waltershof Terminal (CTA)",
          nameEn: "Hamburg Waltershof Terminal",
          x: 820,
          y: 70,
          status: "UPCOMING",
          noteDe: "Voraussichtliche Ankunft: 24.10.2026",
          noteEn: "Estimated Arrival: 24.10.2026",
        },
      ],
    };
  }

  if (shipment.carrier === "SCHENKER" || shipment.shipmentId === "SHP-SIS-2088") {
    // Rhine-Alpine Freight Corridor: Stuttgart -> Rotterdam
    return {
      corridorTitleDe: "Rhein-Alpen Frachtkorridor (A61 / A15 Stuttgart – Rotterdam)",
      corridorTitleEn: "Rhine-Alpine Freight Corridor (A61 / A15 Stuttgart – Rotterdam)",
      mode: "ROAD_TRUCK",
      vehicleIdentifier: "Schenker Euro-LKW (Flotte STR-882)",
      speedText: "76 km/h",
      headingText: "325° NW",
      signalFix: "Galileo E1/E5a (DSGVO Art. 5 aggregiert)",
      distanceRemainingTextDe: "92 km (ca. 1 Std. 15 Min.)",
      distanceRemainingTextEn: "92 km (approx. 1h 15m remaining)",
      progressPercent: 80,
      pathD: "M 100 250 Q 300 210 460 170 T 680 110 T 800 80",
      currentVehiclePos: { x: 680, y: 110 },
      waypoints: [
        {
          name: "Stuttgart Industriepark (Abgangsdepot)",
          nameEn: "Stuttgart Industrial Depot",
          x: 100,
          y: 250,
          status: "COMPLETED",
          timestamp: "15.10.2026 14:15",
          noteDe: "CMR Frachtbrief digital verifiziert",
          noteEn: "CMR waybill digitally verified",
        },
        {
          name: "Mannheim Hub (A6 / A61)",
          nameEn: "Mannheim Freight Hub",
          x: 320,
          y: 200,
          status: "COMPLETED",
          timestamp: "16.10.2026 04:30",
          noteDe: "Umschlag & Ladungssicherung geprüft",
          noteEn: "Transit and load securing verified",
        },
        {
          name: "Venlo Grenzübergang (ATLAS Zollabfertigung)",
          nameEn: "Venlo Border Checkpoint",
          x: 520,
          y: 150,
          status: "COMPLETED",
          timestamp: "16.10.2026 16:45",
          noteDe: "Ausfuhrbegleitdokument (ABD) freigegeben",
          noteEn: "Customs export clearance released",
        },
        {
          name: "A15 Korridor Dordrecht (Zulauf Rotterdam)",
          nameEn: "A15 Corridor Dordrecht",
          x: 680,
          y: 110,
          status: "CURRENT",
          timestamp: "18.10.2026 02:50",
          noteDe: "Planmäßiger Hauptlauf auf A15",
          noteEn: "On schedule along A15 motorway",
        },
        {
          name: "Rotterdam Europort (Gate 3)",
          nameEn: "Rotterdam Europort (Gate 3)",
          x: 800,
          y: 80,
          status: "UPCOMING",
          noteDe: "Voraussichtliche Ankunft: 19.10.2026",
          noteEn: "Estimated Arrival: 19.10.2026",
        },
      ],
    };
  }

  // Default: DHL Freight Corridor Hamburg -> Frankfurt (SHP-SIS-1049)
  return {
    corridorTitleDe: "Bundesdeutscher Frachtkorridor A7 / A5 (Hamburg – Frankfurt)",
    corridorTitleEn: "German National Freight Corridor A7 / A5 (Hamburg – Frankfurt)",
    mode: "ROAD_TRUCK",
    vehicleIdentifier: "DHL Euroconnect Express (LKW-HAM-491)",
    speedText: "82 km/h",
    headingText: "185° S (Richtung Kassel / Frankfurt)",
    signalFix: "Galileo E1 / GPS L5 Dual-Band",
    distanceRemainingTextDe: "195 km (ca. 2 Std. 20 Min.)",
    distanceRemainingTextEn: "195 km (approx. 2h 20m remaining)",
    progressPercent: 55,
    pathD: "M 120 70 Q 280 130 460 160 T 660 210 T 780 250",
    currentVehiclePos: { x: 460, y: 160 },
    waypoints: [
      {
        name: "Hamburg Hafen (Terminal Altenwerder)",
        nameEn: "Hamburg Port Terminal Altenwerder",
        x: 120,
        y: 70,
        status: "COMPLETED",
        timestamp: "16.10.2026 08:30",
        noteDe: "Übernahme aus Seehafen-Lager",
        noteEn: "Cargo collected from port warehouse",
      },
      {
        name: "Hannover Autobahn-Knoten A7",
        nameEn: "Hannover Motorway Hub A7",
        x: 290,
        y: 120,
        status: "COMPLETED",
        timestamp: "17.10.2026 01:10",
        noteDe: "Zwischenerfassung Hub Nord",
        noteEn: "Waypoint recorded at Hub North",
      },
      {
        name: "Kassel Raststätte Kirchheim (A7 / A5)",
        nameEn: "Kassel Central Interchange (A7 / A5)",
        x: 460,
        y: 160,
        status: "CURRENT",
        timestamp: "18.10.2026 02:40",
        noteDe: "Aktuelle Telemetrie: Hauptlauf Süd",
        noteEn: "Live Telematics: Southbound corridor",
      },
      {
        name: "Gießen Verteilerzentrum",
        nameEn: "Giessen Distribution Depot",
        x: 640,
        y: 205,
        status: "UPCOMING",
        noteDe: "Erwartet: 18.10.2026 04:30",
        noteEn: "Expected: 18.10.2026 04:30",
      },
      {
        name: "Frankfurt am Main (CargoCity Süd)",
        nameEn: "Frankfurt Airport (CargoCity South)",
        x: 780,
        y: 250,
        status: "UPCOMING",
        noteDe: "Voraussichtliche Ankunft: 20.10.2026",
        noteEn: "Estimated Arrival: 20.10.2026",
      },
    ],
  };
}

/**
 * Render the Sovereign Vector Telematics Map Component
 */
export function renderTelematicsMap(shipment: Shipment, isDe: boolean): string {
  const profile = getCorridorProfile(shipment);
  const modeIcon = profile.mode === "OCEAN_VESSEL" ? "🚢" : "🚛";
  const modeTitle = profile.mode === "OCEAN_VESSEL"
    ? (isDe ? "Seefracht-Containerschiff" : "Ocean Container Vessel")
    : (isDe ? "Fernverkehrs-LKW" : "Heavy Freight Truck");

  // Render Waypoint Markers
  const waypointsSvg = profile.waypoints.map((wp) => {
    const isCompleted = wp.status === "COMPLETED";
    const isCurrent = wp.status === "CURRENT";
    const circleColor = isCurrent ? "#0284C7" : isCompleted ? "#10B981" : "#475569";
    const label = isDe ? wp.name : wp.nameEn;
    const note = isDe ? (wp.noteDe || "") : (wp.noteEn || "");

    return `
      <g class="map-waypoint-group" data-status="${wp.status}">
        <!-- Touch / Hover Target -->
        <circle cx="${wp.x}" cy="${wp.y}" r="14" fill="transparent" class="waypoint-hover-target" />
        
        <!-- Base Circle -->
        <circle cx="${wp.x}" cy="${wp.y}" r="6" fill="${circleColor}" stroke="#FFFFFF" stroke-width="2" class="waypoint-dot" />

        <!-- Checkmark for completed -->
        ${isCompleted ? `<circle cx="${wp.x}" cy="${wp.y}" r="2" fill="#FFFFFF" />` : ""}

        <!-- Text Label -->
        <text x="${wp.x}" y="${wp.y + 20}" text-anchor="middle" class="waypoint-label">${label}</text>
        ${wp.timestamp ? `<text x="${wp.x}" y="${wp.y + 32}" text-anchor="middle" class="waypoint-subtext">${wp.timestamp}</text>` : ""}

        <!-- Interactive SVG Tooltip -->
        <g class="waypoint-tooltip" pointer-events="none">
          <rect x="${wp.x - 90}" y="${wp.y - 42}" width="180" height="32" rx="4" fill="#0B192C" stroke="#38BDF8" stroke-width="1" opacity="0.95" />
          <text x="${wp.x}" y="${wp.y - 28}" text-anchor="middle" fill="#FFFFFF" font-size="10" font-weight="bold">${label}</text>
          <text x="${wp.x}" y="${wp.y - 16}" text-anchor="middle" fill="#94A3B8" font-size="9">${note}</text>
        </g>
      </g>
    `;
  }).join("\n");

  const distanceRemaining = isDe ? profile.distanceRemainingTextDe : profile.distanceRemainingTextEn;
  const corridorTitle = isDe ? profile.corridorTitleDe : profile.corridorTitleEn;

  return `
    <section class="telematics-map-card" aria-label="${isDe ? "Live Telemetrie & Routenkarte" : "Live Telematics & Route Map"}">
      <!-- Map Header -->
      <div class="map-header">
        <div class="map-title-row">
          <div class="map-mode-badge" title="${modeTitle}">
            <span class="mode-icon" aria-hidden="true">${modeIcon}</span>
            <span class="mode-name">${modeTitle}</span>
          </div>
          <h2 class="map-corridor-title">${corridorTitle}</h2>
        </div>

        <div class="map-status-pills">
          <span class="map-live-pulse-badge">
            <span class="live-dot" aria-hidden="true"></span>
            <strong>${isDe ? "LIVE TELEMETRIE" : "LIVE TELEMATICS"}</strong>
          </span>
          <span class="map-satellite-badge">
            🛰️ ${profile.signalFix}
          </span>
        </div>
      </div>

      <!-- Sovereign SVG Vector Canvas -->
      <div class="map-canvas-container" role="img" aria-label="${corridorTitle}">
        <svg viewBox="0 0 900 320" class="telematics-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <!-- Background Map Grid Pattern -->
            <pattern id="telematics-grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" stroke-width="1" />
            </pattern>

            <!-- Route Gradient -->
            <linearGradient id="route-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stop-color="#10B981" />
              <stop offset="${profile.progressPercent}%" stop-color="#0284C7" />
              <stop offset="100%" stop-color="#64748B" />
            </linearGradient>

            <!-- Pulse Radar Filter -->
            <filter id="radar-glow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          <!-- Ocean / Dark Basin Canvas -->
          <rect width="100%" height="100%" fill="#071322" rx="8" />
          <rect width="100%" height="100%" fill="url(#telematics-grid)" rx="8" />

          <!-- Coordinate Axis Labels -->
          <text x="20" y="25" fill="#475569" font-size="10" font-family="monospace">GIS: WGS-84 / ETRS89 PROJECTION</text>
          <text x="760" y="25" fill="#475569" font-size="10" font-family="monospace">CORRIDOR REF: ${shipment.trackingReference}</text>

          <!-- Base Corridor Path (Dashed Background) -->
          <path d="${profile.pathD}" fill="none" stroke="#1E293B" stroke-width="8" stroke-linecap="round" />

          <!-- Active Traveled Path -->
          <path d="${profile.pathD}" fill="none" stroke="url(#route-gradient)" stroke-width="4" stroke-linecap="round" class="route-line-active" />

          <!-- Animated Beacon Dash Line -->
          <path d="${profile.pathD}" fill="none" stroke="#38BDF8" stroke-width="2" stroke-linecap="round" stroke-dasharray="8 12" class="route-dash-pulse" />

          <!-- Waypoints -->
          ${waypointsSvg}

          <!-- Live Vehicle Position Beacon -->
          <g class="live-vehicle-beacon" transform="translate(${profile.currentVehiclePos.x}, ${profile.currentVehiclePos.y})">
            <!-- Pulsing Concentric Radar Waves -->
            <circle cx="0" cy="0" r="16" fill="rgba(2, 132, 199, 0.25)" class="radar-wave wave-1" />
            <circle cx="0" cy="0" r="28" fill="rgba(56, 189, 248, 0.15)" class="radar-wave wave-2" />

            <!-- Core Marker -->
            <circle cx="0" cy="0" r="10" fill="#0284C7" stroke="#FFFFFF" stroke-width="2.5" filter="url(#radar-glow)" />

            <!-- Mode Symbol -->
            <text x="0" y="4" text-anchor="middle" font-size="11" fill="#FFFFFF">${modeIcon}</text>

            <!-- Floating Live Callout Badge -->
            <g transform="translate(0, -22)" class="live-callout-badge">
              <rect x="-65" y="-18" width="130" height="20" rx="4" fill="#0B192C" stroke="#38BDF8" stroke-width="1.5" />
              <text x="0" y="-4" text-anchor="middle" fill="#FFFFFF" font-size="9" font-weight="bold">
                ● ${isDe ? "AKTIVE POSITION" : "ACTIVE POSITION"}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <!-- Telemetry Telemetry HUD (4-Box Grid) -->
      <div class="map-telemetry-hud">
        <div class="hud-box">
          <span class="hud-label">${isDe ? "Transporteinheit" : "Transport Unit"}</span>
          <p class="hud-value"><strong>${profile.vehicleIdentifier}</strong></p>
          <span class="hud-sub">${isDe ? "Aktueller Status:" : "Current Status:"} ${shipment.currentStatus}</span>
        </div>

        <div class="hud-box">
          <span class="hud-label">${isDe ? "Geschwindigkeit & Kurs" : "Speed & Heading"}</span>
          <p class="hud-value text-blue"><strong>${profile.speedText}</strong></p>
          <span class="hud-sub">🧭 ${profile.headingText}</span>
        </div>

        <div class="hud-box">
          <span class="hud-label">${isDe ? "Distanz bis Zielhafen/-depot" : "Distance Remaining"}</span>
          <p class="hud-value text-green"><strong>${distanceRemaining}</strong></p>
          <span class="hud-sub">
            <span class="progress-bar-mini"><span class="progress-fill" style="width: ${profile.progressPercent}%;"></span></span>
            ${profile.progressPercent}% ${isDe ? "absolviert" : "completed"}
          </span>
        </div>

        <div class="hud-box">
          <span class="hud-label">${isDe ? "Datenschutz (DSGVO)" : "Privacy Compliance"}</span>
          <p class="hud-value text-teal"><strong>🛡️ Art. 5 DSGVO konform</strong></p>
          <span class="hud-sub">${isDe ? "Korridor-Aggregation aktiv (Kein Fahrer-Profil)" : "Corridor aggregation active (Zero driver PII)"}</span>
        </div>
      </div>
    </section>
  `;
}
