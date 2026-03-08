# IPL Dashboard MVP — Design

## Overview
A transparency tool for a housing complex. Residents enter their block (A-F) and house number (1-15) to see their IPL payment status and history.

## Architecture
Single-page React app (Vite + Tailwind CSS) with two state-managed views (no router):

1. **Search View** — hero section with Blok dropdown (A-F) + Nomor Rumah input (1-15)
2. **Dashboard View** — payment summary + transaction history for the selected resident

## Data Layer
- **Static JSON file** (`data/validated.json`) exported from Google Sheets
- Record fields: `timestamp`, `email`, `blok`, `nomorRumah`, `namaPemilik`, `jumlahPembayaran`, `buktiTransfer`
- Lookup: filter by `blok` + `nomorRumah`
- Lunas calculation: sum of `jumlahPembayaran` vs. 12 x 250,000 = 3,000,000 IDR/year

## Design System (Memphis Modern / Playful Geometric)
- **Background**: #FFFDF5 (Warm Cream) with dot grid pattern
- **Text**: #1E293B (Slate 800)
- **Colors**: Violet (#8B5CF6), Pink (#F472B6), Yellow (#FBBF24)
- **Fonts**: Outfit (headings, 700+), Plus Jakarta Sans (body)
- **Hard Shadows**: `4px 4px 0px 0px #1E293B` (no blur)
- **Borders**: 2px solid #1E293B (chunky)
- **Radius**: 16px for cards, rounded-full for buttons (pill)
- **CandyButton**: Primary color, chunky border, hard shadow, translate [-2px, -2px] on hover
- **StickerCard**: White bg, chunky border, offset shadow, subtle wiggle on hover
- **Animations**: Pop-in (scale 0->1 elastic bounce), bouncy modal (cubic-bezier)
- **Icons**: Lucide React, stroke-width 2.5px

## Component Tree
```
App
├── DotGridBackground
├── SearchView (default)
│   ├── HeroHeader ("Cek IPL Perumahan")
│   └── StickerCard (search form)
│       ├── BlokDropdown (A-F)
│       ├── NomorRumahInput (1-15)
│       └── CandyButton ("Cari")
└── DashboardView (after search)
    ├── BackButton
    ├── ResidentHeader (Nama Pemilik + squiggle underline)
    ├── SummaryPills
    │   ├── TotalTerbayar (violet pill)
    │   └── StatusLunas (green/pink pill)
    ├── TransactionTable
    │   └── TransactionRow (date, amount, thumbnail)
    └── ProofModal (bouncy overlay on thumbnail click)
```

## Scope — NOT in MVP
- No authentication
- No real Google Drive images (placeholder images only)
- No router (state-based view switching)
- No data editing or admin panel
- No real-time sheet sync

## Decisions
- Monthly IPL: 250,000 IDR, uniform across all blocks
- Blocks: A through F
- House numbers: 1-15 per block
- Data source: exported JSON (Google Sheets stays private)
- Proof images: placeholder thumbnails with full modal UI ready
