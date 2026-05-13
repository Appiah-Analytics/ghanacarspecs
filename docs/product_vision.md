Product vision
GhanaCarSpecs.com is a Carfax-style vehicle history and specs platform for Ghana (and later, Africa), built as:

- Public-facing app: VIN/plate lookup, sample reports, education, trust messaging.
- B2B platform: Dealers, banks, insurers, DVLA, garages access APIs/dashboards.
- Data authority: Central store of vehicle events (import, registration, accidents, service, mileage).
  MVP goal:  
  Let a user enter a VIN/plate and get a clean, structured vehicle report from your own database.

---

Core user flows (MVP)

1. Public user (buyer)

- Input: VIN or plate number.
- Flow:
  - User lands on homepage → enters VIN/plate → sees basic free report (specs + limited history).
- Output:
  - Vehicle specs (make, model, year, engine).
  - Basic history: import date, last known mileage, number of recorded events.
  - CTA: “Request full report” (future paid feature).

2. Dealer / partner (future)

- Login → dashboard → search vehicles → view/download reports → bulk VIN upload.
- Billing via subscription or per-report credits.

3. Data ingestion (back-office)

- Admin or automated jobs ingest CSV/API feeds from:
  - Importers
  - Garages
  - Insurers
  - DVLA (when possible)
- Data is normalized and attached to a Vehicle by VIN.

---

Data model (high level)
Core entities:

- Vehicle
  - id
  - vin
  - plate_number (nullable)
  - make, model, year, trim
  - enginetype, enginesize, fuel_type
  - countryoforigin, import_date
- VehicleEvent
  - id
  - vehicle_id (FK → Vehicle)
  - eventtype (IMPORT, REGISTRATION, SERVICE, ACCIDENT, INSURANCECLAIM, MILEAGE_UPDATE, THEFT, etc.)
  - event_date
  - mileage (nullable)
  - source_system (e.g., “Garage X”, “Importer Y”)
  - raw_payload (JSON for traceability)
- Partner
  - id
  - name
  - type (DEALER, GARAGE, INSURER, IMPORTER, GOV)
  - api_key / credentials
- User (for portal)
  - id
  - email
  - role (ADMIN, PARTNER, VIEW_ONLY)

---

Backend architecture on Azure

1. High-level components

- API layer:
  - REST (later GraphQL if needed).
  - Endpoints like:
    - POST /api/v1/lookup (VIN/plate)
    - GET /api/v1/vehicles/{id}
    - GET /api/v1/vehicles/{id}/events
    - POST /api/v1/ingest/events (for partners / internal jobs)
- Services (logical):
  - Lookup Service:
    - Resolve VIN/plate → Vehicle → aggregated history.
  - Specs Service:
    - Decode VIN (internal rules + external data sources later).
  - Ingestion Service:
    - Validate, normalize, and store incoming events.
  - Reporting Service:
    - Build a “human-readable” report object from Vehicle + VehicleEvents.

2. Azure components (MVP-friendly)

- Compute:
  - Azure App Service (or Azure Container Apps)
    - Host backend API (Node/Express, .NET, or whatever you prefer).
- Database:
  - Azure SQL Database or Azure PostgreSQL
    - Store Vehicles, VehicleEvents, Users, Partners.
- Storage & logs:
  - Azure Blob Storage
    - Store raw CSV uploads, raw partner files, backups of raw_payload.
  - Azure Application Insights
    - Monitoring, performance, error tracking.
- Background processing:
  - Azure Functions or Azure WebJobs
    - Nightly ingestion jobs (e.g., process new CSVs, normalize data).
    - Scheduled tasks: deduplication, data quality checks.
- Security & access:
  - Azure AD B2C (optional for later)
    - For partner logins and secure access.
  - API keys / JWT for partner APIs.

---

Frontend architecture

1. Public site (GhanaCarSpecs.com)

- Tech:
  - Squarespace for marketing pages (what you’re setting up now).
  - Embed or link to a separate app frontend (React/Next.js hosted on Azure Static Web Apps or similar) for the VIN lookup experience.
- Key pages:
  - Home:
    - Hero: “Check a car’s history in Ghana.”
    - VIN/plate input box.
    - Short explanation of what a report includes.
  - How it works:
    - Data sources, trust messaging, diagrams.
  - Sample report:
    - Static example of a vehicle report.
  - Partners:
    - For dealers, banks, insurers, garages.
  - About / Contact:
    - For DVLA, regulators, serious partners.

2. Web app (lookup + admin)

- Frontend app (React/Next.js or similar):
  - Public lookup page:
    - Input: VIN/plate.
    - Calls POST /api/v1/lookup.
    - Displays:
      - Vehicle specs.
      - Timeline of events.
      - Flags: mileage inconsistencies, accident count, salvage indicators.
  - Admin/partner portal (later):
    - Login.
    - Vehicle search.
    - Event list per vehicle.
    - Upload CSV (for ingestion).

---

MVP scope (what to build first)
Phase 1 – Foundation

1. Domain + marketing site
   - GhanaCarSpecs.com live on Squarespace.
   - Pages: Home, How it works, Sample report, Contact.
2. Backend skeleton on Azure
   - App Service with a simple API.
   - DB with Vehicle and VehicleEvent tables.
   - Endpoint: POST /api/v1/lookup:
     - Input: { vinOrPlate: string }
     - Output: mock or seeThe data for now.
3. Simple frontend lookup
   - A minimal React page (or even a simple HTML form) that: - Takes VIN/plate.  
      - Calls the API.  
      - Renders a basic report.
     Phase 2 – Real data
4. Build ingestion scripts (Azure Functions) to load:
   - Seed data from public VIN samples or your own test data.
   - Later: importer/garage CSVs.
5. Add event types and simple risk flags:
   - “Accident recorded”
   - “Mileage inconsistency detected.”
   - “Salvage/imported as damaged” (when you have that data).

---

---
