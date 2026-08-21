# Group members
1- Dagim Derbe - CTC-3976-26(leader)
2- Bekam Dawit - CTC-6256-26
3- Daniel Worku - CTC-1453-26
4- Ebisa Mitiku - CTC-064-26
5- Desta Hailemariam - CTC-1641-26
6- Desalegn Teresa - CTC-2097-26

# BloodBank_hub

BloodBank_hub is a secure, coordinated web application designed to manage the lifecycle of emergency blood supplies. In medical crises such as postpartum hemorrhage and trauma accidents, delays in securing blood directly impact survival rates. This platform coordinates six key user roles to establish a traceable, validated, and fast-response blood supply chain. It bridges the gap between hospitals, donation stations, testing laboratories, central warehouses, and voluntary blood donors.

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
