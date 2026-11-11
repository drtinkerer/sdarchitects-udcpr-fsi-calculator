# UDCPR FSI Area Calculator - User & QA Testing Guide

**S D ARCHITECTS Architectural Business Utility Application**  
*Floor Space Index (FSI) & Built-Up Area (BUA) Calculation Engine based on UDCPR Maharashtra Guidelines*

---

## 🚀 Quick Start (How to Launch)

There are multiple ways to run and test this software on any computer (Windows, macOS, Linux):

### Option 1: One-Click Windows Launcher (Easiest)
- Double-click **`Launch-FSI-Calculator.bat`** in the root directory.
- It will automatically open the application in your default web browser (Chrome, Edge, Firefox, Brave, Safari).

### Option 2: Single-File Standalone HTML
- Double-click **`UDCPR-FSI-Calculator-Standalone.html`**.
- It is a 100% self-contained single-file application with zero dependencies. No installation, server, or configuration required.

### Option 3: Modular Development Source
- Open **`index.html`** in your browser. (Pairs with `app.js` and `styles.css`).

---

## 🔑 Default Credentials

- **Admin Firewall Password:** `1760`
  - Required to unlock the **Settings** menu, configure directories, and access structural settings.
  - Can be changed via the built-in **Change Password** flow inside Settings (requires entering `1760` first).

---

## 🎯 Key Test Scenarios & What to Verify

### Test Scenario 1: Zone Selection & Template Routing Parity
The application connects to 3 distinct backend master Google Sheet templates:
1. **Regular Zone Template:** (53 Rows, UDCPR Table 6-A standard)
2. **TOD Zone Template:** (46 Rows, UDCPR Chapter 13 Transit Oriented Development within 500m of Metro/BRTS)
3. **CBD Zone Template:** (46 Rows, Commercial Core District, road width $\ge 12\,\text{m}$)

**Steps to Test:**
- Click **Regular Zone**: Verify road width options show from `6m` up to `Above 30m`.
- Click **CBD Zone**: Notice the Road Width dropdown automatically filters out roads under 12m (statutory UDCPR requirement).
- Notice the **Target Master Template** indicator in the banner changes to match the selected zone.

---

### Test Scenario 2: Live Real-Time Calculation Sync
**Steps to Test:**
1. Keep the default values or enter new numbers:
   - **Plot Area (7/12):** `2071.27`
   - **Plot Area (Site Measurement):** `2071.27`
   - **Plot under Road Widening:** `171.10`
   - **Road Width:** `24.00 m`
   - **Project Type:** `Residential`
   - **Green FSI Type:** `GRIHA 4-Star / IGBC Gold (+5%)`
2. Change the **Plot Area (7/12)** or **Road Widening** value.
3. Observe the summary metric cards updating **live** without needing to refresh or press any submit button!

---

### Test Scenario 3: "Generate / View Full Table" Workflow
**Steps to Test:**
1. Click the dark button: **"Generate / View Full Table"**.
2. Notice the table expands smoothly into view directly below the form.
3. Observe the 4 summary metric cards:
   - **Gross Net Plot (3.0):** `1900.17 sq.m`
   - **Net Permissible FSI (13.0):** `5612.29 sq.m`
   - **Total with Ancillary (15.0):** `8979.67 sq.m`
   - **Total Saleable Area:** `111,156 sq.ft` (`10326.62 sq.m`)
4. Verify the formula parity column displaying native spreadsheet formulas: `=MIN(C6,C7)`, `=C8-C12`, `=IF(...)`, `=C22*1.1`.
5. Click **"Hide Table"** or click the button again: notice the UI cleanly collapses back to the minimalistic parameter dashboard.

---

### Test Scenario 4: "View / Edit in Google Sheets" (Overrides & Formula Audit)
**Steps to Test:**
1. Click **"View / Edit in Google Sheets"**.
2. A spreadsheet grid modal opens with row numbers, item tags, descriptions, editable override inputs, and underlying formulas.
3. Try modifying a value in an editable cell (e.g. Row 10 Road Widening). Notice the dependent rows recalculate live!
4. Click **"Reset Overrides"** in the top alert bar to restore live calculations from the form parameters.
5. Click **"Open in Google Sheets ↗"** to deep-link directly into the read-only master Google Sheet template.

---

### Test Scenario 5: "Expand / Attach Sheet" (Auxiliary Tabs)
**Steps to Test:**
1. Click **"Expand / Attach Sheet"**.
2. The modal presents:
   - **Section 1:** Additional Zone Templates (Regular, TOD, CBD).
   - **Section 2:** Auxiliary Regulation Tabs (*TOD Transit Impact*, *Ancillary & Fungible Breakdown*, *UDCPR Table 6-J Parking Matrix*, *Special Building Schedule*).
3. Click any auxiliary card (e.g. **UDCPR Parking, Basement & Fire Core Matrix**).
4. Notice the new auxiliary tab is appended to the project file and a badge appears in the calculation view!

---

### Test Scenario 6: "Print to PDF" (Strict A4 Layout)
**Steps to Test:**
1. Click **"Print to PDF"**.
2. Your browser's print dialog opens.
3. Verify the layout:
   - Formatted strictly for **A4 portrait**.
   - Clean black/slate borders matching native Google Sheets export.
   - Header metadata (`FSI AREA STATEMENT`, `CLIENT`, `PROJECT NAME`, `ROAD WIDTH`).
   - Grand Total rows formatted with prominent fills and double bottom borders.
   - Statutory footer disclaimer block at the bottom.
4. Save as PDF or cancel to return to the app.

---

### Test Scenario 7: Settings & Directory Engine (Interactive Folder Picker)
**Steps to Test:**
1. Click **"Settings"** in the top navigation bar.
2. Enter master password: **`1760`** and click **Unlock Settings**.
3. Inside the Settings modal:
   - View default destination options: **Google Drive**, **Synology Drive**, **Local Computer Drive**.
   - Click **"Browse / Select Folder"** to launch the **Interactive Native Folder-Picker Dialogue Box**.
   - Navigate folder breadcrumbs, enter subdirectories, click **"New Folder"** to create a custom path.
   - For Local Computer Drive, click **"Open Windows Explorer Dialogue"** (uses the HTML5 File System Access API).
   - Click **"Designate This Path"** to commit the chosen directory.
4. Toggle the **"Ask Every Time"** switch:
   - When active, whenever you click **"Generate / View Full Table"** or **"Print to PDF"**, the system will prompt you with the destination routing modal first.

---

### Test Scenario 8: Security & Change Password Flow
**Steps to Test:**
1. Inside **Settings**, scroll to **Admin Firewall & Credentials**.
2. Click **"Change Password"**.
3. Try entering an incorrect current password: verify it rejects the attempt with an error message.
4. Enter `1760` as the current password, then enter a new password (min 4 characters) and confirm it.
5. Save settings, log out, and verify that the new password unlocks the Settings menu!

---

## 📂 Backend Master Google Sheet Templates (Source of Truth)

| Zone | Google Sheet Link |
|---|---|
| **Regular Zone** | [https://docs.google.com/spreadsheets/d/1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1oxSdBMpkKZoedKF_ZQML9VmnfFs9GCmezFbTRhJFK_U/edit?usp=sharing) |
| **TOD Zone** | [https://docs.google.com/spreadsheets/d/1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1BqH4UBcsN6e1pVYeBX7uv981Gz_ntjaZLJwppKHlFWU/edit?usp=sharing) |
| **CBD Zone** | [https://docs.google.com/spreadsheets/d/1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ/edit?usp=sharing](https://docs.google.com/spreadsheets/d/1YzlhYEzpCDIfKuyP9H8Fwmk8PaARaoa54jFU22CruqQ/edit?usp=sharing) |

---
*Developed for S D ARCHITECTS — UDCPR Practice Automation Engine*
