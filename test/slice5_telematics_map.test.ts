import { test } from "node:test";
import assert from "node:assert/strict";
import { ShipmentRepository } from "../src/repositories/shipments.js";
import { renderTelematicsMap, getCorridorProfile } from "../src/views/components/telematicsMap.js";
import { buildServer } from "../src/server.js";

test("Slice 5 Telematics Map: Ocean vessel corridor renders container ship GIS profile (Maersk)", () => {
  const details = ShipmentRepository.getShipmentDetails("DE-SIS-8921", "SHP-SIS-3310");
  assert.ok(details, "Maersk shipment must exist");

  const profile = getCorridorProfile(details.shipment);
  assert.equal(profile.mode, "OCEAN_VESSEL");
  assert.match(profile.vehicleIdentifier, /MAERSK/i);
  assert.match(profile.speedText, /19\.4 kn/i);
  assert.ok(profile.waypoints.length >= 4, "Must have at least 4 major maritime waypoints");

  // Verify German and English rendering
  const htmlDe = renderTelematicsMap(details.shipment, true);
  assert.match(htmlDe, /🚢/i, "Must contain vessel icon");
  assert.match(htmlDe, /Seefracht-Containerschiff/i);
  assert.match(htmlDe, /Shanghai/i);
  assert.match(htmlDe, /Suezkanal/i);
  assert.match(htmlDe, /Hamburg Waltershof/i);
  assert.match(htmlDe, /Art\. 5 DSGVO konform/i);

  const htmlEn = renderTelematicsMap(details.shipment, false);
  assert.match(htmlEn, /Ocean Container Vessel/i);
  assert.match(htmlEn, /LIVE TELEMATICS/i);
});

test("Slice 5 Telematics Map: Road freight corridor renders truck GIS profile (DHL & Schenker)", () => {
  const dhlDetails = ShipmentRepository.getShipmentDetails("DE-SIS-8921", "SHP-SIS-1049");
  assert.ok(dhlDetails, "DHL shipment must exist");

  const dhlProfile = getCorridorProfile(dhlDetails.shipment);
  assert.equal(dhlProfile.mode, "ROAD_TRUCK");
  assert.match(dhlProfile.vehicleIdentifier, /LKW-HAM-491/i);
  assert.match(dhlProfile.speedText, /82 km\/h/i);

  const dhlHtml = renderTelematicsMap(dhlDetails.shipment, true);
  assert.match(dhlHtml, /🚛/i, "Must contain truck icon");
  assert.match(dhlHtml, /Fernverkehrs-LKW/i);
  assert.match(dhlHtml, /Hamburg Hafen/i);
  assert.match(dhlHtml, /Frankfurt am Main/i);

  // Schenker check
  const schenkerDetails = ShipmentRepository.getShipmentDetails("DE-SIS-8921", "SHP-SIS-2088");
  assert.ok(schenkerDetails, "Schenker shipment must exist");
  const schenkerHtml = renderTelematicsMap(schenkerDetails.shipment, true);
  assert.match(schenkerHtml, /Rhein-Alpen/i);
  assert.match(schenkerHtml, /Rotterdam Europort/i);
});

test("Slice 5 Telematics Map: SVG Canvas contains vector paths, radar waves, and WGS-84 projection", () => {
  const details = ShipmentRepository.getShipmentDetails("DE-SIS-8921", "SHP-SIS-1049")!;
  const html = renderTelematicsMap(details.shipment, true);

  assert.match(html, /<svg viewBox="0 0 900 320"/i, "Must declare 900x320 SVG viewport");
  assert.match(html, /class="radar-wave wave-1"/i, "Must contain radar animation wave 1");
  assert.match(html, /class="radar-wave wave-2"/i, "Must contain radar animation wave 2");
  assert.match(html, /class="route-dash-pulse"/i, "Must contain animated telemetry pulse path");
  assert.match(html, /WGS-84 \/ ETRS89 PROJECTION/i, "Must declare standard GIS projection reference");
});

test("Slice 5 Telematics Map: German Privacy (DSGVO Art. 5) compliance invariant", () => {
  const details = ShipmentRepository.getShipmentDetails("DE-SIS-8921", "SHP-SIS-1049")!;
  const html = renderTelematicsMap(details.shipment, true);

  // Assert compliance guarantee
  assert.match(html, /Art\. 5 DSGVO konform/i);
  assert.match(html, /Kein Fahrer-Profil/i);

  // Negative assertions: Ensure zero driver personal data is exposed
  assert.doesNotMatch(html, /Fahrer:/i, "Must not display driver names");
  assert.doesNotMatch(html, /Telefon:/i, "Must not display driver phone numbers");
  assert.doesNotMatch(html, /IP:/i, "Must not display client IP addresses");
});

test("Slice 5 Telematics Map: Integration - /portal/tracking renders sovereign map on screen", async () => {
  const app = await buildServer();

  const res = await app.inject({
    method: "GET",
    url: "/portal/tracking?id=SHP-SIS-1049",
  });

  assert.equal(res.statusCode, 200);
  const body = res.body;

  assert.match(body, /class="telematics-map-card"/i, "Portal page must render telematics map card");
  assert.match(body, /class="telematics-svg"/i, "Portal page must render SVG canvas");
  assert.match(body, /href="\/static\/css\/telematicsMap\.css"/i, "Portal page must link telematicsMap.css");
  assert.match(body, /LKW-HAM-491/i, "Portal page must display vehicle identifier");

  await app.close();
});
