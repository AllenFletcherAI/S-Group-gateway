/**
 * S-Group Branding & Theme Tokens
 * Schäfer & SIS Interlogistik
 *
 * WHY: Centralizes brand colors, typography, and company identifiers in one place
 * to enforce brand consistency across portal screens and prevent ad-hoc CSS styling.
 */

export const S_GROUP_BRAND = {
  companyName: "Schäfer & SIS Interlogistik",
  groupName: "S-GROUP",
  portalTitle: "Enterprise Logistics Gateway & Tracking Portal",
  brandColors: {
    primaryNavy: "#0B192C",      // Deep industrial navy for headers and trust
    accentBlue: "#1E3E62",       // Interactive hover state
    signalBlue: "#0284C7",       // Action buttons and primary indicators
    statusSuccess: "#10B981",    // Active / On Schedule / Delivered
    statusWarning: "#F59E0B",    // Customs Delay / Inspection
    statusAlert: "#EF4444",      // Exception / Critical Hold
    neutralBackground: "#F8FAFC",// High-contrast clean page background
    surfaceWhite: "#FFFFFF",     // Card and modal surface
    borderSlate: "#E2E8F0",      // Clean 1px structural dividers
    textPrimary: "#0F172A",      // High contrast readable body text
    textMuted: "#64748B",        // Secondary metadata text
  },
  typography: {
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    fontSizeBase: "16px",
    lineHeightBase: "1.5",
  },
  legal: {
    jurisdiction: "Germany",
    complianceBadge: "DSGVO / GDPR Compliant",
    retentionNoticeDe: "Telemetriedaten werden nach 90 Tagen automatisch anonymisiert (Art. 5 DSGVO)",
    retentionNoticeEn: "Telematics telemetry anonymized after 90 days pursuant to Art. 5 DSGVO",
    copyright: "© 2026 Schäfer & SIS Interlogistik. Alle Rechte vorbehalten.",
  },
  navigation: [
    { id: "shipments", labelDe: "Sendungen", labelEn: "Shipments", href: "/portal/shipments", active: true },
    { id: "tracking", labelDe: "Live-Tracking", labelEn: "Live Tracking", href: "/portal/tracking", active: false },
    { id: "dispatch", labelDe: "Disposition", labelEn: "Dispatches", href: "/portal/dispatch", active: false },
    { id: "documents", labelDe: "Dokumente & Zoll", labelEn: "Documents & Customs", href: "/portal/documents", active: false },
    { id: "compliance", labelDe: "Datenschutz (DSGVO)", labelEn: "Privacy & DSGVO", href: "/portal/compliance", active: false },
  ]
};
