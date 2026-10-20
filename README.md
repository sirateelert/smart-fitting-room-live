# Smart Fitting Room (SFR) System: Digitalizing In-Room Garment Fulfillment in Fast-Fashion Retail

## Abstract
This project presents a web-based, real-time Service System Design (SSD) and operational prototype created to resolve throughput bottlenecks and social friction within fast-fashion retail fitting rooms. By replacing manual, high-friction staff interactions with an integrated In-Room Customer Kiosk and Staff Operations Dashboard, the system streamlines garment size replacement, reduces fitting room cycle time, and mitigates customer wait friction through dynamic progress tracking.

---

## 1. Problem Statement & Scope

### 1.1 Context & Operational Inefficiencies
In high-volume fast-fashion environments (e.g., Uniqlo, Zara, H&M), customers routinely enter fitting rooms with suboptimal garment sizes. Under conventional operating models, acquiring an alternative size introduces significant system inefficiencies:
* **Customer Friction & Social Hesitation:** Customers experience discomfort when calling for staff or leaving the fitting room partially undressed to retrieve alternative sizes.
* **Inefficient Staff Transit:** Store personnel perform redundant back-and-forth trips between fitting cubicles and sales floors to determine customer requirements before retrieving inventory.
* **Queue Accumulation:** Extended cubicle occupancy directly causes bottlenecks and inflated queue times for waiting shoppers outside.

### 1.2 Target Audience & Boundary Conditions
* **Target Environment:** High-density, fast-fashion retail environments prioritizing queue efficiency and high operational throughput.
* **Out-of-Scope:** Small boutiques or luxury retail stores where highly personalized, one-on-one staff conversation constitutes a core element of the value proposition.

---

## 2. System Architecture & Service Blueprint

The Smart Fitting Room ecosystem establishes a direct digital link between the customer cubicle, staff fulfillment workflows, and active store inventory systems.
### 2.1 The Four Core Service Moments
The system maps customer and staff actions across four distinct operational phases:

1. **Arrive:** The customer enters the cubicle; the system links the in-room tablet to active store inventory and room status systems.
2. **Interact:** The customer scans the garment's QR/barcode, selects a replacement size or style, and submits a digital fulfillment request.
3. **Deliver:** The staff dashboard receives an immediate event alert containing room number and SKU details. Staff retrieve the requested item and deliver it directly to the cubicle door.
4. **Finish:** The customer completes the fitting session, retains selected items, deposits unwanted garments in designated return bins, and exits.

---

## 3. Demand & Queue Management Strategies

### 3.1 Peak Hours Operational Logic
System fulfillment capacities are constrained by staff runner availability during peak foot-traffic intervals. The system embeds algorithmic wait-time estimation calibrated to store traffic patterns:

| Day Classification | Peak Time Intervals | Operational State | Fulfillment Latency Target |
| :--- | :--- | :--- | :--- |
| **Weekdays** | 11:30 AM – 2:00 PM (Lunch Rush)<br>5:00 PM – 8:00 PM (Post-Work) | High Traffic | 4–6 Minutes |
| **Weekends** | 2:00 PM – 7:00 PM (Peak Footfall) | High Traffic | 4–6 Minutes |
| **Off-Peak** | All Other Operating Hours (10:00 AM – 10:00 PM) | Standard | 1–2 Minutes |

### 3.2 Cognitive Wait Mitigation
To optimize customer perception during fulfillment delays, the interface incorporates operational psychology principles:
* **Occupied Time Strategy:** Interactive digital catalog navigation allows customers to browse matching garments or supplementary styles while awaiting delivery.
* **Uncertainty Reduction Strategy:** Real-time state updates (*Request Received* → *Preparing Item* → *On the Way*) provide feedback transparency to eliminate perceived delay anxiety.

---

## 4. Exception Handling & Out-of-Stock Recovery

When a requested SKU or size is unavailable in backroom inventory, the system executes an automated fallback protocol:
1. **Real-Time Inventory Query:** The backend verifies stock availability immediately upon request submission.
2. **Automated Alternative Recommendation:** If out of stock, the tablet UI presents adjacent size options (e.g., $S \rightarrow M$) or equivalent style variations within the same garment category.
3. **Fulfillment Continuity:** Customers can confirm an alternative item directly from the exception alert without re-scanning.

---

## 5. Technical Implementation & Artifact Structure

The prototype is a small Vite + React app (`npm install`, then `npm run dev`; `npm run build` outputs `dist/`). Tailwind is loaded from the CDN in `index.html`. Pushes to `main` deploy via `.github/workflows/pages.yml` (set Pages source to "GitHub Actions").

### 5.1 Technology Stack
* **Frontend Framework:** React 18 + Vite.
* **Styling & Layout:** Tailwind CSS (CDN), split-screen customer tablet and staff dashboard.
* **State Engine:** One reducer (`src/state/reducer.js`) shared by both screens. Request statuses and legal transitions live in `src/lib/status.js`.
* **Wait estimates:** derived, not fixed. `src/lib/wait.js` uses queue length ahead, runners on shift x capacity, and peak vs normal hours, so the figures move with Auto-Pilot traffic. The table in section 3 gives target ranges only.
* **Inventory:** stock per SKU and size (`src/lib/inventory.js`). Stock is reduced on delivery or staging, sold-out sizes are disabled, and out-of-stock recovery suggests in-stock sizes and styles.

### 5.2 System Demonstration Views
* **Customer Tablet View:** QR scan simulation, Category > Style > Size picker (up to 3 items), live tracking, out-of-stock recovery, "items staged for your next room" reservation, assistance calls, configurable inactivity timeout and an offline state.
* **Staff Operations Dashboard:** request cards with SLA timers, runner load, claim / deliver actions and stock flags.
* **Two-tab mode:** open `?view=customer` and `?view=staff` in separate tabs of the same browser; state syncs through `BroadcastChannel` (last write wins). Auto-Pilot runs only in the staff / combined tab.
* **Scripted visitors:** Demo Controls has Run Visitor 1 / 2 / 3, each a fixed timed sequence that starts from a clean reset.
* **Runners and metrics:** runners are objects (id, name, status, capacity); new orders go to the on-shift runner with the lowest load, and total capacity feeds the wait estimate. The staff view shows average wait, SLA breach rate (> 4 min) and peak vs normal latency.
* **Language:** TH / EN toggle in the header (`src/lib/i18n.js`).
* **Demo Controls (drawer):** traffic simulator, Auto-Pilot, runners on shift, stock override, geofence, offline and timeout settings. These stay out of the customer view.

---

## 6. Academic & Institutional Context

* **Course / Context:** Service Science Research Group
* **Project Reference:** Team 2 — Service System Design Consult-2
* **Project Team:** Nonny, Gop, Vic, Nini, Ming
* **Live Deployment:** [https://sirateelert.github.io/smart-fitting-room/](https://sirateelert.github.io/smart-fitting-room/)
