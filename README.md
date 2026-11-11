# UDCPR FSI Calculator Pro (Self-Hosted SaaS)

A streamlined, full-stack **Next.js 14 + TypeScript** architectural business utility for calculating Floor Space Index (FSI) and Built-Up Area (BUA) in strict accordance with the **Unified Development Control and Promotion Regulations (UDCPR)** for Maharashtra State.

Engineered with **100% deterministic mathematical parity** across all three statutory master templates (Regular Table 6-A, TOD Chapter 13, and CBD Commercial Core) and paired with an **architectural color-coded A4 PDF export engine**.

---

## 🚀 Quick Start (Self-Hosting)

### Option 1: Docker Compose

```bash
docker compose up -d --build
```
Your instance is immediately live at `http://localhost:3000`.

### Option 2: Local Development (Node.js or Bun)

```bash
bun install
bun run dev

# Or using npm
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

## 📐 Core Architecture

* **Zero-AI, Zero-Hallucination:** 100% deterministic pure TypeScript calculation engine (`src/lib/udcpr/calculator.ts`). Statutory formulas ($=MIN(C6, C7)$, $C8 - C12$, in-situ credits, TDR schedules, and ancillary loadings) are calculated with mathematical precision.
* **Master Template Parity:**
  * **Regular Zone (53 Rows):** Standard residential/commercial Table 6-A (Slum TDR 30% & Regular TDR 70%, MHADA).
  * **TOD Zone (46 Rows):** Chapter 13 Transit Oriented Development within 500m of Metro/BRTS (Additional FSI up to 2.90x).
  * **CBD Zone (46 Rows):** Commercial Core District (automatic minimum 12m road width enforcement, potential up to 5.00x).
* **Color-Coded A4 Municipal Sanction PDF:**
  * Clean 3-column statutory layout (`Sr No` | `Statutory Description & Basis` | `Area in sq.m`).
  * Color-coded hierarchy (deep navy practice insignia, slate section headers, pastel azure highlights, mint emerald grand totals).
  * Formal 3-slot sign-off block for Draftsman, Liaisoning Planner, and Sanction Architect.
  * Formula syntax hidden on printed PDFs, but retained in the web UI under **"View / Edit Row Overrides"** for internal spreadsheet auditing.

---

## 📁 Source Code Structure

```
├── Dockerfile                   # Multi-stage production container build
├── docker-compose.yml           # Turnkey Docker deployment
├── package.json                 # Next.js 14, React 18, Tailwind, Lucide
├── src/
│   ├── app/
│   │   ├── globals.css          # Blueprint grid, glassmorphism, @media print
│   │   ├── layout.tsx           # Application layout and metadata
│   │   └── page.tsx             # Main dashboard controller
│   ├── components/
│   │   ├── Dashboard.tsx        # 10 Statutory inputs form
│   │   ├── FullTable.tsx        # 53/46-Row statutory table
│   │   ├── GridModal.tsx        # Cell override and formula inspection editor
│   │   ├── MetricCards.tsx      # Real-time summary metrics
│   │   ├── Navbar.tsx           # Clean header and Print action
│   │   └── PrintSection.tsx     # Color-coded A4 print layout
│   └── lib/
│       ├── types/udcpr.ts       # Strict TypeScript interfaces
│       └── udcpr/
│           ├── calculator.ts    # Deterministic UDCPR math engine
│           ├── constants.ts     # Tables, factors, and templates
│           └── rows.ts          # Statutory row definitions & descriptions
```
