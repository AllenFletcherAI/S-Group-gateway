export type TransportMode = "ROAD_FEEDER" | "RAIL_INTERMODAL" | "BARGE_INLAND";
export type TourStatus = "PLANNED" | "EN_ROUTE" | "COMPLETED" | "CANCELLED";

export interface FeederTour {
  tourId: string;
  tenantId: string;
  tourTitleDe: string;
  tourTitleEn: string;
  transportMode: TransportMode;
  corridor: string;
  origin: string;
  destination: string;
  vehicleIdentifier: string;
  driverPseudonym: string; // WHY: German DSGVO Art. 5 mandates pseudonymized worker IDs
  departureTime: string;
  estimatedArrival: string;
  status: TourStatus;
  capacity: {
    maxPallets: number;
    loadedPallets: number;
    maxWeightKg: number;
    loadedWeightKg: number;
  };
  adrHazardousClass: string | null;
  assignedShipments: string[];
}

export interface TourFilterParams {
  status?: string;
  mode?: string;
  search?: string;
}

// Initial seed operations for Schäfer & SIS Interlogistik
const DISPATCH_DATABASE: FeederTour[] = [
  {
    tourId: "TOUR-HAM-01",
    tenantId: "DE-SIS-8921",
    tourTitleDe: "Hauptlauf Nord-Süd A7/A5 (Seehafen-Zubringer)",
    tourTitleEn: "North-South Mainline A7/A5 (Seaport Feeder)",
    transportMode: "ROAD_FEEDER",
    corridor: "Hamburg Hafen ➔ Frankfurt CargoCity Süd",
    origin: "Hamburg Hafen (Terminal Altenwerder)",
    destination: "Frankfurt am Main (CargoCity Süd)",
    vehicleIdentifier: "LKW-HAM-491 (Euro-6 Sattelzug)",
    driverPseudonym: "Fahrer-ID: DRV-HAM-491",
    departureTime: "2026-10-18T22:00:00Z",
    estimatedArrival: "2026-10-20T14:00:00Z",
    status: "EN_ROUTE",
    capacity: {
      maxPallets: 24,
      loadedPallets: 18,
      maxWeightKg: 18000,
      loadedWeightKg: 8400,
    },
    adrHazardousClass: null,
    assignedShipments: ["SHP-SIS-1049"],
  },
  {
    tourId: "TOUR-STR-04",
    tenantId: "DE-SIS-8921",
    tourTitleDe: "Rhein-Alpen Westzubringer (A61/A15)",
    tourTitleEn: "Rhine-Alpine Feeder (A61/A15)",
    transportMode: "ROAD_FEEDER",
    corridor: "Stuttgart Industriepark ➔ Rotterdam Europort",
    origin: "Stuttgart Industriepark",
    destination: "Rotterdam Europort",
    vehicleIdentifier: "LKW-STR-882 (Mega-Trailer)",
    driverPseudonym: "Fahrer-ID: DRV-STR-882",
    departureTime: "2026-10-18T18:30:00Z",
    estimatedArrival: "2026-10-19T18:00:00Z",
    status: "EN_ROUTE",
    capacity: {
      maxPallets: 24,
      loadedPallets: 12,
      maxWeightKg: 18000,
      loadedWeightKg: 4200,
    },
    adrHazardousClass: null,
    assignedShipments: ["SHP-SIS-2088"],
  },
  {
    tourId: "TOUR-RTM-09",
    tenantId: "DE-SIS-8921",
    tourTitleDe: "Intermodaler Güterbahn-Shuttle (Seehafen Rotterdam – Rhein-Ruhr)",
    tourTitleEn: "Intermodal Rail Freight Shuttle (Rotterdam – Rhine-Ruhr)",
    transportMode: "RAIL_INTERMODAL",
    corridor: "Rotterdam Maasvlakte ➔ Duisburg Gateway Terminal",
    origin: "Rotterdam Maasvlakte Terminal",
    destination: "Duisburg Gateway Terminal",
    vehicleIdentifier: "Zug-RTM-112 (E-Lok BR 189 / 22 Waggons)",
    driverPseudonym: "Tf-ID: TF-RTM-912",
    departureTime: "2026-10-19T04:00:00Z",
    estimatedArrival: "2026-10-19T12:00:00Z",
    status: "PLANNED",
    capacity: {
      maxPallets: 66,
      loadedPallets: 44,
      maxWeightKg: 65000,
      loadedWeightKg: 38200,
    },
    adrHazardousClass: "ADR Klasse 9: Verschiedene gefährliche Stoffe (Photovoltaik/Batterien)",
    assignedShipments: ["SHP-SIS-3310"],
  },
  {
    tourId: "TOUR-FRA-12",
    tenantId: "DE-SIS-8921",
    tourTitleDe: "Zubringer Süd A3 (Flughafen Frankfurt – Bayern Hub)",
    tourTitleEn: "Feeder South A3 (Frankfurt Airport – Bavaria Hub)",
    transportMode: "ROAD_FEEDER",
    corridor: "Frankfurt am Main ➔ Nürnberg Güterverkehrszentrum",
    origin: "Frankfurt CargoCity Süd",
    destination: "Nürnberg GVZ",
    vehicleIdentifier: "LKW-FRA-301 (Planenauflieger)",
    driverPseudonym: "Fahrer-ID: DRV-FRA-301",
    departureTime: "2026-10-20T06:00:00Z",
    estimatedArrival: "2026-10-20T11:30:00Z",
    status: "PLANNED",
    capacity: {
      maxPallets: 24,
      loadedPallets: 0,
      maxWeightKg: 18000,
      loadedWeightKg: 0,
    },
    adrHazardousClass: null,
    assignedShipments: [],
  },
  {
    tourId: "TOUR-COMPETITOR-99",
    tenantId: "TENANT-COMPETITOR-XYZ",
    tourTitleDe: "Vertrauliche Konkurrenz-Tour",
    tourTitleEn: "Confidential Competitor Tour",
    transportMode: "ROAD_FEEDER",
    corridor: "Berlin ➔ Leipzig",
    origin: "Berlin Hub",
    destination: "Leipzig Hub",
    vehicleIdentifier: "LKW-BER-99",
    driverPseudonym: "DRV-99",
    departureTime: "2026-10-18T10:00:00Z",
    estimatedArrival: "2026-10-18T14:00:00Z",
    status: "PLANNED",
    capacity: {
      maxPallets: 24,
      loadedPallets: 10,
      maxWeightKg: 18000,
      loadedWeightKg: 5000,
    },
    adrHazardousClass: null,
    assignedShipments: [],
  },
];

export class DispatchRepository {
  /**
   * Fetch all tours matching tenantId and optional filters (enforces Zero IDOR)
   */
  static getToursByTenant(tenantId: string, filter?: TourFilterParams): FeederTour[] {
    let results = DISPATCH_DATABASE.filter((t) => t.tenantId === tenantId);

    if (!filter) return results;

    if (filter.status && filter.status !== "ALL") {
      results = results.filter((t) => t.status === filter.status);
    }

    if (filter.mode && filter.mode !== "ALL") {
      results = results.filter((t) => t.transportMode === filter.mode);
    }

    if (filter.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (t) =>
          t.tourId.toLowerCase().includes(q) ||
          t.corridor.toLowerCase().includes(q) ||
          t.origin.toLowerCase().includes(q) ||
          t.destination.toLowerCase().includes(q) ||
          t.vehicleIdentifier.toLowerCase().includes(q) ||
          t.tourTitleDe.toLowerCase().includes(q)
      );
    }

    return results;
  }

  /**
   * Fetch single tour with strict tenant isolation
   */
  static getTourById(tenantId: string, tourId: string): FeederTour | null {
    const tour = DISPATCH_DATABASE.find(
      (t) => t.tenantId === tenantId && t.tourId === tourId
    );
    return tour || null;
  }

  /**
   * Assign shipment to feeder tour with capacity validation
   * WHY: Enforces physical vehicle capacity and gross weight invariants (D-008)
   */
  static assignShipmentToTour(
    tenantId: string,
    tourId: string,
    shipmentId: string,
    pallets: number,
    weightKg: number
  ): { success: boolean; tour?: FeederTour; error?: string } {
    const tour = this.getTourById(tenantId, tourId);
    if (!tour) {
      return { success: false, error: "Tour not found or unauthorized for tenant" };
    }

    // 1. Capacity check: Pallets
    const newPalletTotal = tour.capacity.loadedPallets + pallets;
    if (newPalletTotal > tour.capacity.maxPallets) {
      return {
        success: false,
        error: `Kapazitätsüberschreitung: Zuladung von ${pallets} Paletten übersteigt Freiraum (${tour.capacity.maxPallets - tour.capacity.loadedPallets} Paletten verbleibend).`,
      };
    }

    // 2. Capacity check: Weight
    const newWeightTotal = tour.capacity.loadedWeightKg + weightKg;
    if (newWeightTotal > tour.capacity.maxWeightKg) {
      return {
        success: false,
        error: `Gewichtsüberschreitung: Zuladung von ${weightKg} kg übersteigt Nutzlast (${tour.capacity.maxWeightKg - tour.capacity.loadedWeightKg} kg verbleibend).`,
      };
    }

    // 3. Update tour
    tour.capacity.loadedPallets = newPalletTotal;
    tour.capacity.loadedWeightKg = newWeightTotal;
    if (!tour.assignedShipments.includes(shipmentId)) {
      tour.assignedShipments.push(shipmentId);
    }

    return { success: true, tour };
  }
}
