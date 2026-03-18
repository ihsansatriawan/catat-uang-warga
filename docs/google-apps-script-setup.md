# Google Apps Script Setup Guide

Automates the data pipeline: validation in Google Sheet → JSON push to GitHub → Netlify deploy.

## Prerequisites

- Google Sheet with IPL payment data (raw + Validated tabs)
- GitHub account with access to `ihsansatriawan/catat-uang-warga` repo

## Step 1: Create GitHub Personal Access Token

1. Go to https://github.com/settings/tokens?type=beta (fine-grained tokens)
2. Click **Generate new token**
3. Settings:
   - **Token name:** `ipl-sheet-deploy`
   - **Expiration:** 90 days (or custom)
   - **Repository access:** Only select repositories → `catat-uang-warga`
   - **Permissions:** Contents → Read and write
4. Click **Generate token** and copy the token immediately

## Step 2: Add validationStatus Column to Raw Tab

1. Open your Google Sheet
2. In the raw data tab (`Form_Responses`), add a new column at the end
3. Set the header to: `validationStatus`
4. Add data validation (dropdown) to the entire column:
   - Select the column → Data → Data validation → Dropdown
   - Options: `Pending`, `Valid`, `Invalid`

## Step 3: Set Up Apps Script

1. In Google Sheet → **Extensions** → **Apps Script**
2. Delete any existing code in `Code.gs`
3. Paste the contents of `scripts/google-apps-script/Code.gs` from this repo
4. The script is pre-configured for tab name `Form_Responses`. Update `CONFIG.RAW_TAB` if your tab has a different name

## Step 4: Store Credentials in Script Properties

1. In Apps Script editor → **Project Settings** (gear icon on the left)
2. Scroll to **Script Properties** → **Add a property**
3. Add two properties:

| Property | Value |
|----------|-------|
| `GITHUB_TOKEN` | Your personal access token from Step 1 |
| `GITHUB_REPO` | `ihsansatriawan/catat-uang-warga` |

## Step 5: Set Up Installable onEdit Trigger

The `onEditHandler` function needs an installable trigger (simple triggers can't access other sheets).

1. In Apps Script editor → **Triggers** (clock icon on the left)
2. Click **+ Add Trigger**
3. Settings:
   - **Function:** `onEditHandler`
   - **Event source:** From spreadsheet
   - **Event type:** On edit
4. Click **Save** and authorize when prompted

## Step 6: Test the Setup

### Test auto-copy:
1. Go to your raw data tab
2. Find a row and set `validationStatus` to `Valid`
3. Check the `Validated` tab — the row should appear at the bottom with all raw columns + parsed `B`, `Nomor rumah`, `Nama Pemilik`

### Test deploy:
1. Reload the Google Sheet (to load the custom menu)
2. Click **IPL Tools** → **Deploy to Site**
3. Confirm the dialog
4. Wait for the toast notification ("X records deployed successfully!")
5. Check the site: https://ipl-talago.netlify.app

## Troubleshooting

### "Missing GITHUB_TOKEN or GITHUB_REPO"
- Check Script Properties (Step 4) — make sure both properties exist with correct values

### "GitHub API error (409)"
- This means a conflict. Try again — it usually resolves on retry

### "GitHub API error (403)"
- Token might be expired or lack permissions. Generate a new one (Step 1)

### Menu "IPL Tools" not showing
- Reload the Google Sheet. The menu loads via `onOpen()` which runs on page load

### Auto-copy not working
- Verify the trigger exists (Step 5)
- Make sure the column header is exactly `validationStatus` (case-sensitive)
- Make sure `CONFIG.RAW_TAB` matches your actual tab name

## Daily Workflow

1. Open Google Sheet
2. Review new form submissions in raw tab
3. Check bukti bayar (screenshot) for each entry
4. Set `validationStatus` to `Valid` or `Invalid` — valid entries auto-copy to Validated tab
5. When done reviewing, click **IPL Tools** → **Deploy to Site**
6. Site updates automatically via Netlify
