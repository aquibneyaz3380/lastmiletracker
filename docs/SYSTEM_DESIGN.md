# System Design Write-up — LastMile Delivery Tracker

## 1. Rate Calculation Engine

The rate calculation engine (`backend/src/services/rateCalculation.service.js`) is the financial core of the platform. It runs on every quote request and order creation in five deterministic steps with zero hardcoded values.

**Zone Detection:** Every order carries a pickup pincode and a drop pincode. The engine performs a single indexed lookup on the `Area` table — which stores a unique pincode-to-zone mapping managed entirely by the admin. If a pincode has no zone mapping, the request is rejected with a descriptive error. This makes the system fully configurable: admins add new service pincodes through the Zones UI without touching any code.

**Volumetric Weight Calculation:** The engine computes `(length × breadth × height) ÷ 5000`. This is the logistics industry standard for converting a package's dimensional volume into an equivalent weight in kilograms. The divisor 5000 is the standard air/road freight factor.

**Chargeable Weight Selection:** The engine applies `max(actualWeight, volumetricWeight)`. This protects against under-billing large, lightweight packages (e.g., a 0.5 kg foam box occupying 40,000 cm³ → 8 kg volumetric). The higher value is what the customer is billed on.

**Rate Card Lookup:** The system queries the `RateCard` table using a compound unique key `(orderType, fromZoneId, toZoneId)`. This means B2B and B2C orders are priced independently for every zone pair — including intra-zone (same pickup and drop zone). Admins configure separate `ratePerKg` and `codSurcharge` values for each combination. The engine throws a clear error if no matching rate card exists, preventing silent mispricing.

**Final Charge Formula:**
```
baseCharge   = chargeableWeight × rateCard.ratePerKg
codSurcharge = (paymentType === 'COD') ? rateCard.codSurcharge : 0
totalCharge  = baseCharge + codSurcharge
```

The full quote is returned to the customer via `GET /api/orders/quote` before they confirm, showing volumetric weight, chargeable weight, base charge, COD surcharge, and total — so the customer sees the exact charge before submitting.

---

## 2. Zone Detection Approach

Zones are named administrative regions (e.g., "North Zone", "South Zone"). Each `Area` record holds a unique `pincode` and a `zoneId` foreign key. The admin creates zones via the Zones management UI and assigns pincodes to each zone.

Zone detection is an O(1) indexed lookup on pincode (database unique constraint), returning the parent zone or a descriptive error.

This cleanly separates topology (which pincodes belong to which zone) from pricing (how much to charge between zones) — both configurable by the admin at runtime.

---

## 3. Auto-Assignment Logic

Auto-assignment is implemented in `backend/src/services/assignment.service.js` using a three-tier selection strategy that balances proximity with availability.

**Tier 1 — Zone-Preferred Pool:** All agents with `isAvailable = true` are fetched. The system prefers agents whose `zoneId` matches the order's pickup zone, since a local agent reduces pick-up travel time and cost.

**Tier 2 — Haversine Distance Sort:** If pickup coordinates are available and agents have recorded GPS coordinates (updated via `PATCH /api/agent/location` using the browser Geolocation API), the engine computes the great-circle distance between the pickup point and each candidate agent using the Haversine formula. Agents are sorted ascending by distance and the closest is selected.

**Tier 3 — Fallback:** If no GPS coordinates are available, the first agent in the zone-preferred pool is selected. If no same-zone agents are available, any globally available agent is chosen.

**Atomicity:** Assignment is wrapped in a Prisma `$transaction` that simultaneously: updates the order's `agentId` and `status` to `ASSIGNED`; sets the agent's `isAvailable` to `false`; and appends an immutable `TrackingEvent`. This prevents race conditions where two orders could be assigned to the same agent simultaneously.

On delivery completion (`DELIVERED`) or failure (`FAILED`), the agent's `isAvailable` is reset to `true`, making them immediately available for re-assignment.

---

## 4. Failed Delivery Handling

The failed delivery flow is a complete, non-destructive recovery cycle:

**Step 1 — Failure Flagging:** The delivery agent marks the order `FAILED` via `PATCH /api/agent/orders/:id/status`. This triggers: the agent's `isAvailable` resets to `true`; an immutable `TrackingEvent` is appended with status, actor ID, actor role, and timestamp; email and SMS notifications are dispatched to the customer.

**Step 2 — Customer Reschedule:** The customer (or admin) submits a new delivery date via `POST /api/orders/:id/reschedule`. The system validates that the current status is `FAILED`, then transitions the order to `RESCHEDULED`, stores the new `scheduledDate`, and clears the `agentId`.

**Step 3 — Automatic Agent Reassignment:** Immediately after the reschedule, the system calls `findNearestAgent` on the pickup zone and, if an agent is available, calls `assignAgentToOrder` to reassign atomically. The customer receives both a "rescheduled" notification and an "agent assigned" notification. If no agent is available at the time of reschedule, the order remains `RESCHEDULED` and the admin can trigger assignment from the dashboard.

**Immutable History:** The `TrackingEvent` table is strictly append-only. Every status transition is permanently recorded with `actorId`, `actorRole`, and `createdAt`, providing a complete audit trail.

---