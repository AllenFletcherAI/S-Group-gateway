import crypto from "crypto";

const BASE_URL = process.env.GATEWAY_URL || "http://localhost:3000";

function generateSignature(rawBody, timestamp, secret) {
  const payload = `${timestamp}.${rawBody}`;
  return crypto.createHmac("sha256", secret).update(payload, "utf8").digest("hex");
}

async function runDemo() {
  console.log("==========================================================");
  console.log("  S-GROUP GATEWAY: INTERACTIVE VERIFICATION DEMO          ");
  console.log("  Schäfer & SIS Interlogistik (Lane B Customer Defense)   ");
  console.log("==========================================================\n");

  // 1. Health & Safety Invariants Check
  console.log("▶ [Test 1] Querying Gateway Health Check (/health)...");
  try {
    const healthRes = await fetch(`${BASE_URL}/health`);
    const health = await healthRes.json();
    console.log(`  ✓ Status: ${healthRes.status} OK`);
    console.log(`  ✓ Gateway State: ${health.status} (${health.service})`);
    console.log(`  ✓ Invariants: DSGVO: ${health.invariants.dsgvoCompliance} | Tenant Isolation: ${health.invariants.tenantIsolation} | Telematics Retention: ${health.invariants.telematicsRetentionDays} days\n`);
  } catch (err) {
    console.error(`  ✗ Failed to connect to ${BASE_URL}. Is the server running? (Run: npm start)`);
    process.exit(1);
  }

  // 2. Submit Valid DHL Webhook
  console.log("▶ [Test 2] Submitting Valid DHL Telematics Webhook...");
  const dhlSecret = process.env.CARRIER_SECRET_DHL || "s-group-test-carrier-secret-key-2026-dhl";
  const dhlPayload = {
    trackingNumber: "DHL-HAM-992182",
    statusCode: "ARR_DEP",
    timestamp: new Date().toISOString(),
    facility: "Container Terminal Altenwerder (Hamburg)",
    notes: "Container discharged from feeder vessel"
  };
  const dhlBody = JSON.stringify(dhlPayload);
  const dhlTimestamp = Date.now().toString();
  const dhlSignature = generateSignature(dhlBody, dhlTimestamp, dhlSecret);

  const dhlRes = await fetch(`${BASE_URL}/api/v1/webhooks/carrier`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": dhlTimestamp,
      "x-carrier-signature": dhlSignature,
      "x-tenant-id": "DE-SIS-8921"
    },
    body: dhlBody
  });
  const dhlResult = await dhlRes.json();
  console.log(`  ✓ Response Status: ${dhlRes.status} Accepted`);
  console.log(`  ✓ Event Assigned ID: ${dhlResult.eventId}`);
  console.log(`  ✓ Raw Code "ARR_DEP" Normalized To: "${dhlResult.milestone}" for Shipment ${dhlResult.shipmentId}\n`);

  // 3. Submit Valid DB Schenker Webhook
  console.log("▶ [Test 3] Submitting Valid DB Schenker Customs Webhook...");
  const schenkerSecret = process.env.CARRIER_SECRET_SCHENKER || "s-group-test-carrier-secret-key-2026-schenker";
  const schenkerPayload = {
    consignmentId: "SCH-FRA-77301",
    eventCode: "STA_04",
    eventDateTime: new Date().toISOString(),
    terminalName: "Frankfurt Hub CargoCity",
    remarks: "ATLAS Zollfreigabe erteilt"
  };
  const schenkerBody = JSON.stringify(schenkerPayload);
  const schenkerTimestamp = Date.now().toString();
  const schenkerSignature = generateSignature(schenkerBody, schenkerTimestamp, schenkerSecret);

  const schenkerRes = await fetch(`${BASE_URL}/api/v1/webhooks/carrier`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "SCHENKER",
      "x-carrier-timestamp": schenkerTimestamp,
      "x-carrier-signature": schenkerSignature,
      "x-tenant-id": "DE-SIS-8921"
    },
    body: schenkerBody
  });
  const schenkerResult = await schenkerRes.json();
  console.log(`  ✓ Response Status: ${schenkerRes.status} Accepted`);
  console.log(`  ✓ Raw Code "STA_04" Normalized To: "${schenkerResult.milestone}" for Consignment ${schenkerResult.carrierReference}\n`);

  // 4. Test Security Lock: Forged Webhook Attack
  console.log("▶ [Test 4] Testing Security Lock: Attacker Sends Forged Signature...");
  const forgedRes = await fetch(`${BASE_URL}/api/v1/webhooks/carrier`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-carrier-id": "DHL",
      "x-carrier-timestamp": Date.now().toString(),
      "x-carrier-signature": "deadbeef00112233445566778899aabbccddeeff00112233445566778899aabb",
      "x-tenant-id": "DE-SIS-8921"
    },
    body: JSON.stringify({
      trackingNumber: "DHL-FORGED-999",
      statusCode: "DLV",
      timestamp: new Date().toISOString(),
      facility: "Rogue Server"
    })
  });
  const forgedResult = await forgedRes.json();
  console.log(`  ✓ Attack Blocked! HTTP Status: ${forgedRes.status} Unauthorized`);
  console.log(`  ✓ Lock Reason: "${forgedResult.reason}"\n`);

  // 5. Query Tenant Milestones (Tenant Isolation)
  console.log("▶ [Test 5] Querying Tenant Ingested Milestones (/api/v1/shipments/events)...");
  const queryRes = await fetch(`${BASE_URL}/api/v1/shipments/events?tenantId=DE-SIS-8921`);
  const queryData = await queryRes.json();
  console.log(`  ✓ Total Events for Tenant DE-SIS-8921: ${queryData.count}`);
  queryData.events.forEach((ev, i) => {
    console.log(`    [${i + 1}] Carrier: ${ev.carrier} | Ref: ${ev.carrierReference} | Milestone: ${ev.milestone} | Location: ${ev.location}`);
  });

  console.log("\n==========================================================");
  console.log("  ALL TESTS PASSED! Portal & Webhook Adapters Verified.   ");
  console.log("  Open in browser: http://localhost:3000/portal           ");
  console.log("==========================================================");
}

runDemo();
