# Group members
1- Dagim Derbe - CTC-3976-26(leader)
2- Bekam Dawit - CTC-6256-26
3- Daniel Worku - CTC-1453-26
4- Ebisa Mitiku - CTC-064-26
5- Desta  Hailemariam - CTC-1641-26
6- Desalegn Teresa - CTC-2097-26

# BloodBank_hub

BloodBank_hub is a secure, coordinated web application designed to manage the lifecycle of emergency blood supplies. In medical crises such as postpartum hemorrhage and trauma accidents, delays in securing blood directly impact survival rates. This platform coordinates six key user roles to establish a traceable, validated, and fast-response blood supply chain. It bridges the gap between hospitals, donation stations, testing laboratories, central warehouses, and voluntary blood donors.

---

## Quick Start with Docker (Any Platform)

The entire stack (frontend + backend + PostgreSQL database) runs in containers. Works on **Windows**, **macOS**, and **Linux**.

### 1. Prerequisites

| Platform | What to install |
|----------|----------------|
| Windows 10/11 | [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/) (includes Compose). Use PowerShell or CMD. |
| macOS (Intel / Apple Silicon) | [Docker Desktop](https://docs.docker.com/desktop/install/mac-install/) |
| Linux (Ubuntu/Debian/Fedora etc.) | [Docker Engine](https://docs.docker.com/engine/install/) + the Compose plugin |

Verify the installation:

```bash
docker --version
docker compose version    # if this fails, try: docker-compose --version
```

> Throughout this guide, replace `docker compose` with `docker-compose` if you have the standalone version.

### 2. Get the source code

```bash
git clone <your-repo-url>
cd Bloodbank-hub
```

### 3. Configure environment variables

Create `.env` files from the provided template:

```bash
# macOS / Linux
cp .env.example .env
cp .env.example backend/.env

# Windows (PowerShell)
copy .env.example .env
copy .env.example backend/.env
```

Open `.env` and set:

```env
DB_PASSWORD=your_secret_password
JWT_SECRET=any_long_random_string

# IMPORTANT: inside Docker the database host is "postgres" (NOT localhost).
DATABASE_URL=postgresql://postgres:your_secret_password@postgres:5432/bloodbank?schema=public
LAB_DATABASE_URL=postgresql://postgres:your_secret_password@postgres:5432/bloodbank_lab?schema=public

SEED_DB=true   # set true ONCE to fill the database with sample data
```

Keep the values identical in both `.env` and `backend/.env`.

### 4. Build and start everything

```bash
docker compose up -d --build
```

This starts three services. On first launch the backend automatically:

1. waits for PostgreSQL,
2. generates Prisma clients,
3. applies all database migrations,
4. seeds sample data (if `SEED_DB=true`),
5. starts the API server.

Watch the startup progress:

```bash
docker compose logs -f backend
```

Wait until you see `[API Server] Running on http://localhost:5000`, then press `Ctrl+C` to exit the logs.

### 5. Open the app

| Service | URL | Notes |
|---------|-----|-------|
| Frontend (React/Vite) | http://localhost:5174 | main app |
| Backend REST API | http://localhost:5000 | e.g. `/api/...` endpoints |
| PostgreSQL | localhost:5434 | connect from DB tools with user/password from `.env` |

### Daily commands

```bash
docker compose ps                 # show status of all services
docker compose logs -f backend    # follow backend logs
docker compose stop               # stop containers (data is kept)
docker compose start              # start again
docker compose down               # remove containers (database volume is kept)
docker compose down -v            # WARNING: also deletes ALL database data
```

### Troubleshooting

*   **Changed something in `.env` but nothing happened?** Environment variables are read when a container is *created*, not restarted. Recreate it:
    ```bash
    docker compose up -d --force-recreate backend frontend
    ```
*   **Backend error `P1001: Can't reach database server at localhost:5432`** - your `DATABASE_URL` uses `localhost`. Inside Docker it must be the hostname `postgres`.
*   **Backend error `P1000: Authentication failed`** - the database volume was created earlier with a different password than `.env`. Easiest fix (deletes DB data):
    ```bash
    docker compose down -v && docker compose up -d --build
    ```
*   **Port already in use?** Stop whatever occupies 5000/5174/5434, or change the left side of the port mappings in `docker-compose.yml` (e.g. `"5001:5000"` then use port 5001).
*   **Frontend loads but no data?** Make sure the backend is healthy (`docker compose ps`) and that `VITE_API_URL=http://localhost:5000/api` in `.env`. If you edit `VITE_API_URL` you must rebuild the frontend container.

---

## 1. Key Problems Resolved

*   **Lack of Information Security in Manual Systems:** In legacy paper-based or basic electronic registries, donor personal information and medical records were unsecured. Any general hospital employee or collection station worker could read, copy, or browse private records. The new system enforces strict access control, ensuring that individuals who have no functional relation to the donation case or medical file have limited or no access to that sensitive data.
*   **Maternal Mortality during Hemorrhage:** Severe blood loss during childbirth is a leading cause of maternal mortality. The system facilitates rapid supply sourcing from centralized warehouses to prevent stockout deaths at local clinics.
*   **Fragmented Trauma Response:** Accident victims require immediate transfusions within the critical "golden hour" of care. The platform allows hospitals to check warehouse inventories in real-time or search for matching, eligible donors locally instead of calling individual clinics blindly.
*   **Transfusion-Transmitted Infections:** Direct, unvalidated blood transfers create safety risks. The system mandates laboratory validation and disease screening before blood bags are routed to warehouses.
*   **Donor Outreach Limitations:** Public campaigns are costly and broad. The system provides tools for targeted SMS emergency alerts specifically to local donors matching a depleted blood type, while avoiding unnecessary notifications.

---

## 2. The Coordinated 6-Actor System

The platform defines six distinct user roles, each accessing a dedicated dashboard portal:

1.  **System Administrator:** Manages account verifications for hospitals, stations, laboratories, and warehouses to audit and secure system credentials.
2.  **Donation Station:** Handles donor registration and records temporary blood collections. Uses national identification lookup to pull profiles and registers donor eligibility options.
3.  **Testing Laboratory:** Screens blood samples for infectious agents (such as HIV, Hepatitis, and Syphilis). Safe bags are dispatched to warehouses, while defective samples are discarded, triggering patient health alerts.
4.  **Central Blood Bank Inventory (Warehouse):** Tracks validated blood stock by type, organizes storage, and coordinates fulfillment of hospital orders.
5.  **Hospital:** Tracks internal clinical blood stock, submits supply requests to central inventories, reviews warehouse levels, and accesses the fallback donor registry in emergencies.
6.  **Donor (User):** Tracks personal donation status, reviews safe blood type validation, checks eligibility windows, schedules appointments, and manages emergency alert preferences.

---

## 3. Core Technical Features

### FAYDA National Identification Integration
The registration process integrates a mock database for the Ethiopian National ID (FAYDA). Entering a valid ID automatically retrieves demographic data, including full name, phone number, date of birth, gender, and home address. This speeds up intake and prevents spelling or registration errors at donation stations.

### Blood Expiration Tracking
To ensure patient safety, blood bags validated by laboratories receive an automatic expiration date set to 42 days from the collection date. The backend inventory logic filters out expired bags, removing them from active warehouse stock and marking them for disposal. Warehouses receive visual indicators for bags expiring within five days.

### Request Dispatch and Delivery Lifecycle
Hospital supply requests follow a structured, multi-state transition model: Pending, Dispatched, and Received. When a warehouse fulfills an order, it reserves the bags and marks the request as Dispatched with a transit log. The requesting hospital must click a confirmation button upon physical arrival, shifting the status to Received and completing the audit trail.

### Donor Privacy and Consent Safeguards
During intake at donation stations, donors can choose to opt-in or opt-out of emergency registries. In emergency shortage situations, hospitals see a list of eligible donors matching the required blood type. To protect privacy, phone numbers are masked by default. Hospital staff must click to reveal a phone number, which generates an entry in the backend audit logs to monitor who viewed the contact details.

### Rare Blood Type Broadcast Alerts
When a warehouse has zero stock of a critical, rare blood type, hospitals can trigger an emergency broadcast. This system finds local, eligible, opted-in donors of that specific blood type and dispatches simulated group SMS alerts via the SMSEthiopia API. It prevents donor fatigue by applying a 24-hour rate limit on alerts for the same request.

### Emergency Patient Medical History Lookup
During trauma or hemorrhage emergencies, authorized hospital staff can instantly pull up the stored blood and medical history of any registered donor. The dedicated **"Emergency Lookup"** tab on the Hospital Dashboard supports two search modes: exact match on **FAYDA National ID** and partial, case-insensitive **Full Name** matching — with a disambiguation list when multiple donors share a similar name.

The result is a concise, scannable **summary card** showing: blood type (ABO + Rh), donor eligibility status (Eligible / Temporarily Deferred / Permanently Deferred) derived from `health_status` and the 90-day donation interval, and a generic **screening status badge** ("Cleared" or "Requires Review") without exposing specific disease markers by default. Phone numbers are **masked** and require a separate "Reveal" click. Full laboratory screening details (disease markers, hemoglobin, platelets, allergies) require a second confirmation step. Both reveal actions generate distinct audit log entries.

To prevent misuse, each hospital account is **rate-limited to 10 lookups per 30-minute window**; exceeding the limit returns an anomaly flag and a `429` response. Sensitive cards **auto-clear after 3 minutes of inactivity**. Screening results older than 180 days are flagged as outdated with a recommendation to re-screen. Every lookup — search, record view, phone reveal, and screening reveal — is written to the centralized **audit log** capturing: staff user ID, timestamp, searched identifier, and fields revealed.

---

## 4. Technology Stack

*   **Frontend:** React (Vite), HTML5, CSS3, JavaScript.
*   **Backend:** Node.js, Express (RESTful API).
*   **Database:** PostgreSQL (relational tables, foreign key constraints, unique logs, check constraints).
*   **Messaging:** SMSEthiopia API integration (wrapped and mocked for local development) and Email integrated for               autentication when new users sign in.

---

## 5. Future Improvements

*   **Cold Chain Temperature Monitoring:** Simulated temperature logging for warehouse freezers. If storage units exceed the safe temperature range (2 degrees Celsius to 6 degrees Celsius), the system will trigger warnings and quarantine affected stock.
*   **Administrative Audit Logging:** A centralized log file dashboard for the System Administrator to view compliance checks, database updates, user status changes, and donor privacy access logs.
*   Integrating with  hosipital management system
