import { test } from "node:test";
import assert from "node:assert/strict";
import { buildServer } from "../src/server.js";
import { DispatchRepository } from "../src/repositories/dispatch.js";

const DEFAULT_TENANT = "DE-SIS-8921";
const COMPETITOR_TENANT = "TENANT-COMPETITOR-XYZ";

test("Slice 8 Dispatch Repository: Enforces physical pallet capacity and gross weight bounds", () => {
  // Test Tour TOUR-FRA-12 starts with 0/24 pallets and 0/18000 kg
  const tour = DispatchRepository.getTourById(DEFAULT_TENANT, "TOUR-FRA-12");
  assert.ok(tour, "Target tour TOUR-FRA-12 must exist");

  // 1. Attempt overload by pallets (e.g., 30 pallets when max is 24)
  const failPallets = DispatchRepository.assignShipmentToTour(
    DEFAULT_TENANT,
    "TOUR-FRA-12",
    "SHP-OVERLOAD-01",
    30,
    5000
  );
  assert.equal(failPallets.success, false);
  assert.match(failPallets.error!, /Kapazitätsüberschreitung.*Paletten/);

  // 2. Attempt overload by gross weight (e.g., 25,000 kg when max is 18,000 kg)
  const failWeight = DispatchRepository.assignShipmentToTour(
    DEFAULT_TENANT,
    "TOUR-FRA-12",
    "SHP-OVERLOAD-02",
    10,
    25000
  );
  assert.equal(failWeight.success, false);
  assert.match(failWeight.error!, /Gewichtsüberschreitung.*kg/);

  // 3. Valid assignment within bounds (e.g. 8 pallets, 3500 kg)
  const initialPallets = tour.capacity.loadedPallets;
  const initialWeight = tour.capacity.loadedWeightKg;
  const successResult = DispatchRepository.assignShipmentToTour(
    DEFAULT_TENANT,
    "TOUR-FRA-12",
    "SHP-VALID-888",
    8,
    3500
  );
  assert.equal(successResult.success, true);
  assert.equal(successResult.tour!.capacity.loadedPallets, initialPallets + 8);
  assert.equal(successResult.tour!.capacity.loadedWeightKg, initialWeight + 3500);
  assert.ok(successResult.tour!.assignedShipments.includes("SHP-VALID-888"));
});

test("Slice 8 Multi-Tenant Isolation: Enforces Zero IDOR between customer tenants", () => {
  // 1. Querying default tenant returns only default tenant tours
  const sisTours = DispatchRepository.getToursByTenant(DEFAULT_TENANT);
  assert.ok(sisTours.length >= 3);
  for (const t of sisTours) {
    assert.equal(t.tenantId, DEFAULT_TENANT);
    assert.notEqual(t.tourId, "TOUR-COMPETITOR-99");
  }

  // 2. Attempting to query competitor tour with default tenant returns null
  const unauthorizedTour = DispatchRepository.getTourById(DEFAULT_TENANT, "TOUR-COMPETITOR-99");
  assert.equal(unauthorizedTour, null);

  // 3. Attempting to assign shipment to competitor tour with default tenant returns unauthorized error
  const unauthorizedAssign = DispatchRepository.assignShipmentToTour(
    DEFAULT_TENANT,
    "TOUR-COMPETITOR-99",
    "SHP-ILLEGAL",
    2,
    500
  );
  assert.equal(unauthorizedAssign.success, false);
  assert.match(unauthorizedAssign.error!, /not found or unauthorized/i);
});

test("Slice 8 Dispatch API: GET /api/v1/dispatch/tours lists tours with tenant scoping and filtering", async () => {
  const app = await buildServer();

  // 1. Fetch all tours for default tenant
  const resAll = await app.inject({
    method: "GET",
    url: "/api/v1/dispatch/tours",
    headers: { "x-tenant-id": DEFAULT_TENANT },
  });

  assert.equal(resAll.statusCode, 200);
  const dataAll = JSON.parse(resAll.payload);
  assert.equal(dataAll.tenantId, DEFAULT_TENANT);
  assert.ok(Array.isArray(dataAll.tours));
  assert.ok(dataAll.count >= 3);

  // 2. Filter by status=EN_ROUTE
  const resFiltered = await app.inject({
    method: "GET",
    url: "/api/v1/dispatch/tours?status=EN_ROUTE",
    headers: { "x-tenant-id": DEFAULT_TENANT },
  });

  assert.equal(resFiltered.statusCode, 200);
  const dataFiltered = JSON.parse(resFiltered.payload);
  for (const tour of dataFiltered.tours) {
    assert.equal(tour.status, "EN_ROUTE");
  }

  await app.close();
});

test("Slice 8 Dispatch API: GET /api/v1/dispatch/tours/:id respects tenant boundaries", async () => {
  const app = await buildServer();

  // 1. Authorized access to own tour
  const resOk = await app.inject({
    method: "GET",
    url: "/api/v1/dispatch/tours/TOUR-HAM-01",
    headers: { "x-tenant-id": DEFAULT_TENANT },
  });
  assert.equal(resOk.statusCode, 200);
  const dataOk = JSON.parse(resOk.payload);
  assert.equal(dataOk.tour.tourId, "TOUR-HAM-01");
  assert.equal(dataOk.tour.tenantId, DEFAULT_TENANT);
  // Verify German DSGVO worker pseudonym
  assert.ok(dataOk.tour.driverPseudonym.startsWith("Fahrer-ID: DRV-"));

  // 2. Unauthorized access to competitor tour returns 404
  const resForbidden = await app.inject({
    method: "GET",
    url: "/api/v1/dispatch/tours/TOUR-COMPETITOR-99",
    headers: { "x-tenant-id": DEFAULT_TENANT },
  });
  assert.equal(resForbidden.statusCode, 404);

  await app.close();
});

test("Slice 8 Dispatch API: POST /api/v1/dispatch/tours/:id/assign enforces validation & capacity", async () => {
  const app = await buildServer();

  // 1. Validation failure: missing fields / negative values
  const resInvalid = await app.inject({
    method: "POST",
    url: "/api/v1/dispatch/tours/TOUR-STR-04/assign",
    headers: { "x-tenant-id": DEFAULT_TENANT },
    payload: { shipmentId: "SHP", pallets: -5, weightKg: 100 },
  });
  assert.equal(resInvalid.statusCode, 400);
  const invalidData = JSON.parse(resInvalid.payload);
  assert.equal(invalidData.error, "Bad Request");

  // 2. Capacity Overload rejection
  const resOverload = await app.inject({
    method: "POST",
    url: "/api/v1/dispatch/tours/TOUR-STR-04/assign",
    headers: { "x-tenant-id": DEFAULT_TENANT },
    payload: { shipmentId: "SHP-TOO-BIG", pallets: 20, weightKg: 1000 },
  });
  assert.equal(resOverload.statusCode, 400);
  const overloadData = JSON.parse(resOverload.payload);
  assert.equal(overloadData.error, "Capacity Overload");
  assert.match(overloadData.message, /Kapazitätsüberschreitung/);

  // 3. Successful assignment
  const resSuccess = await app.inject({
    method: "POST",
    url: "/api/v1/dispatch/tours/TOUR-STR-04/assign",
    headers: { "x-tenant-id": DEFAULT_TENANT },
    payload: { shipmentId: "SHP-SIS-7721", pallets: 2, weightKg: 800 },
  });
  assert.equal(resSuccess.statusCode, 200);
  const successData = JSON.parse(resSuccess.payload);
  assert.equal(successData.success, true);
  assert.ok(successData.tour.assignedShipments.includes("SHP-SIS-7721"));

  await app.close();
});

test("Slice 8 Portal UI: /portal/dispatch renders interactive dispatch board and load meters", async () => {
  const app = await buildServer();

  // 1. German view
  const resDe = await app.inject({
    method: "GET",
    url: "/portal/dispatch?lang=de",
  });
  assert.equal(resDe.statusCode, 200);
  assert.match(resDe.payload, /Disposition & Zubringer-Tourenplanung/);
  assert.match(resDe.payload, /Paletten-Auslastung/);
  assert.match(resDe.payload, /Fahrpersonal \(DSGVO\)/);
  assert.match(resDe.payload, /TOUR-HAM-01/);
  assert.match(resDe.payload, /LKW-Hauptlauf/);
  assert.match(resDe.payload, /Güterbahn-Shuttle/);
  assert.match(resDe.payload, /ADR-Gefahrgutdeklaration/);
  assert.match(resDe.payload, /Sendung zu Tour disponieren/);

  // 2. English view
  const resEn = await app.inject({
    method: "GET",
    url: "/portal/dispatch?lang=en",
  });
  assert.equal(resEn.statusCode, 200);
  assert.match(resEn.payload, /Dispatch & Feeder Fleet Planning/);
  assert.match(resEn.payload, /Pallet Utilization/);
  assert.match(resEn.payload, /Crew \(GDPR Token\)/);
  assert.match(resEn.payload, /Assign Freight to Tour/);

  await app.close();
});
