# PT Prospect Manager

A simple web application to manage physical therapist prospects, filter them by location and experience, and send bulk emails.

## Features

- 📊 **View & Filter** 13,682+ PT prospects by state, city, zip code, and years licensed
- 🔍 **Quick Search** across names, emails, license numbers
- ✉️ **Send Bulk Emails** via Microsoft Graph API (OAuth2)
- 📤 **Export to Excel** - export filtered or selected prospects
- 🎨 **Professional UI** with email templates included
- 💾 **Excel Sync** - all changes automatically save back to Data.xlsx
- ✅ **Email Tracking** - track when emails were sent to each prospect
- 🚫 **Block List** - mark prospects to prevent sending emails
- ➕ **Add Prospects** - manually add new prospects through the UI

### 🔄 Data Flow

**Excel is your master database!** Everything syncs back automatically:

```
Data.xlsx ←→ prospects.json ←→ Application
     ↑                              ↓
     └──────── All updates ─────────┘
```

When you:
- ✅ Send an email → Updates Excel with timestamp
- 🚫 Block a prospect → Updates Excel with "Yes"
- ➕ Add a new prospect → Adds new row to Excel
- 📝 Any change → Syncs to Excel immediately

---

## Quick Setup (5 minutes)

> **⚠️ Important:** The `Data.xlsx` file is not included in this repository (too large for GitHub).  
> You need to obtain this file separately and place it in the project root before running the app.

### Step 0: Get the Data File

1. **Obtain `Data.xlsx`** from the project owner (via email, Dropbox, Google Drive, etc.)
2. **Place it in the project root** (same folder as this README)
3. **Run the conversion script:**
   ```bash
   node convert-data.js
   ```
   
   This script will:
   - ✅ Read your Excel file
   - ✅ Clean and normalize the data
   - ✅ Add 2 new tracking columns to Excel: `email_sent` and `blocked`
   - ✅ Create JSON files for the application
   
   **Important:** After running this once, all future updates (emails sent, blocks, new prospects) will automatically sync back to `Data.xlsx`. You don't need to run this again unless you get a fresh Excel file with new prospects.

### Step 1: Install Dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### Step 2: Configure Office365 Email

You need Azure AD credentials to send emails. Follow these steps:

#### A. Register App in Azure Portal

1. Go to https://portal.azure.com
2. Search for "App registrations" → Click "+ New registration"
3. Name: `PT Prospect Manager`
4. Click "Register"

#### B. Get Your Credentials

After registration, copy these values:

- **Application (client) ID** - Copy this
- **Directory (tenant) ID** - Copy this

#### C. Create Client Secret

1. Go to "Certificates & secrets"
2. Click "+ New client secret"
3. Description: `Email Secret`
4. Expires: 24 months
5. Click "Add"
6. **Copy the Value immediately** (you can't see it again!)

#### D. Add Permissions

1. Go to "API permissions"
2. Click "+ Add a permission"
3. Choose "Microsoft Graph"
4. Choose "Application permissions"
5. Search and select: **Mail.Send**
6. Click "Add permissions"
7. Click "Grant admin consent" (green checkmark should appear)

#### E. Update Your .env File

Edit `.env` in the project root:

```env
OFFICE365_CLIENT_ID=your-client-id-here
OFFICE365_CLIENT_SECRET=your-secret-value-here
OFFICE365_TENANT_ID=your-tenant-id-here
OFFICE365_USER_EMAIL=your-email@yourcompany.com
PORT=3001
```

### Step 3: Run the Application

**Option 1: Use the start script (Recommended)**
```bash
./start.sh
```

This automatically kills old processes and starts fresh servers. Press Ctrl+C to stop both.

**Option 2: Start with separate logs (for debugging)**
```bash
./start-with-logs.sh
```

Logs are saved to `logs/backend.log` and `logs/frontend.log`. View them:
```bash
tail -f logs/backend.log   # Watch backend logs
tail -f logs/frontend.log  # Watch frontend logs
```

**Option 3: Manual start (two terminals)**

Terminal 1 - Backend:
```bash
cd backend
npm start
```

Terminal 2 - Frontend:
```bash
cd frontend
npm run dev
```

### Step 4: Open the App

The app will automatically open, or go to: **http://localhost:5173**

---

## How to Use

### Filter Prospects
1. Use the left sidebar to filter by:
   - State (dropdown)
   - Cities (select multiple)
   - Zip code
   - Years since license (select multiple ranges)

### Select Prospects
- Click checkboxes next to prospects
- Or click the header checkbox to select all visible

### View Details
- Click any row to see full prospect details
- Shows: name, address, email, license info

### Send Emails
1. Select prospects
2. Click "Send Email" button at bottom
3. Choose a template or write your own
4. Add/remove recipients as needed
5. Click "Send Emails"

### Export Data
- **Export Filtered** - exports all prospects matching your current filters
- **Export Selected** - exports only checked prospects
- Files saved as Excel (.xlsx) with timestamp

---

## Email Templates

Two templates are included:

1. **Default Hiring Template** - Professional recruitment message
2. **Follow-Up Template** - For non-responsive prospects

Templates are fully editable. You can modify them in:
`frontend/src/templates/emailTemplates.js`

---

## Troubleshooting

### How to View Logs

When email fails (e.g., "0 sent, 1 failed"), check the logs:

**Option 1: Run with separate logs**
```bash
./start-with-logs.sh
```

Then in another terminal, watch the logs:
```bash
tail -f logs/backend.log   # See backend errors
tail -f logs/frontend.log  # See frontend errors
```

**Option 2: Run backend manually**
```bash
# Stop start.sh (Ctrl+C)
cd backend
npm start
# Now you'll see all backend errors clearly
```

**Option 3: Browser console**
- Press F12 in browser
- Go to Console tab
- Try sending email
- Look for error messages

### Email Not Sending?

**Step 1: Test Connection**
Open http://localhost:3001/api/email/test

✅ **Success looks like:**
```json
{
  "success": true,
  "message": "Microsoft Graph API connection successful. Connected as: Your Name (your.email@company.com)"
}
```

❌ **Failure looks like:**
```json
{
  "success": false,
  "message": "Error details here"
}
```

**Step 2: Check Backend Logs**
Look at the terminal where backend is running. You'll see detailed error messages like:
- "Failed to acquire OAuth2 access token" → OAuth setup incomplete
- "invalid_client" → Client secret wrong
- "insufficient privileges" → Admin consent not granted for Mail.Send
- "The user or administrator has not consented" → Need admin consent
- "mailbox not found" → Wrong email address

**Step 3: Verify .env File**
```bash
cat .env
```

Make sure it has all 4 values filled in (not the placeholder text):
- `OFFICE365_CLIENT_ID` (not "your-client-id-here")
- `OFFICE365_CLIENT_SECRET` (not "your-secret-here")
- `OFFICE365_TENANT_ID` (not "your-tenant-id-here")
- `OFFICE365_USER_EMAIL` (not "your-email@company.com")

**Common Issues:**

1. **"Failed to acquire OAuth2 access token"**
   - Check `.env` has all 4 credentials with real values
   - Verify client secret is correct (create new one if needed)
   - Ensure tenant ID is correct

2. **"Insufficient privileges"**
   - Make sure "Mail.Send" permission is granted with admin consent
   - Green checkmark should appear in Azure AD
   - This is an **Application permission**, not Delegated

3. **"Mailbox not found"** or **"User not found"**
   - Verify the email address matches your Office365 account
   - Make sure it's the full email (user@company.com)

4. **"Rate limit exceeded"**
   - Microsoft Graph has rate limits (typically 10,000 emails/day)
   - Try sending to fewer recipients at once

### Can't See Data?

Make sure `prospects.json` exists:
```bash
ls -lh prospects.json
```

If missing, regenerate it:
```bash
node convert-data.js
```

### Frontend Won't Start?

```bash
cd frontend
rm -rf node_modules
npm install
npm run dev
```

### Backend Won't Start?

```bash
cd backend
rm -rf node_modules
npm install
npm start
```

---

## Project Structure

```
NJCA/
├── Data.xlsx              # Master Excel file (syncs with all changes!)
├── prospects.json         # JSON copy (synced from Excel)
├── convert-data.js        # Script to convert Excel → JSON + add columns
├── .env                   # Your credentials (DO NOT COMMIT!)
├── .env.example           # Template for credentials
├── backend/               # Node.js/Express API
│   ├── server.js         # API server
│   ├── emailService.js   # Graph API email service
│   └── dataSync.js       # Excel sync logic (writes back to Data.xlsx)
└── frontend/             # React UI
    ├── src/
    │   ├── components/   # UI components
    │   ├── context/      # State management
    │   ├── templates/    # Email templates
    │   └── utils/        # Export helpers
    └── public/
        └── prospects.json # Frontend copy (synced from Excel)
```

---

## 📊 Excel Integration & New Columns

### New Tracking Columns in Data.xlsx

After running `node convert-data.js`, your Excel file will have **2 new columns**:

| Column | Description | Values |
|--------|-------------|--------|
| `email_sent` | Timestamp when email was sent | ISO date string or empty |
| `blocked` | Whether prospect is blocked from emails | "Yes" or "No" |

### How Excel Sync Works

**Every action in the app updates Excel automatically:**

1. **Send Email** → Excel updates with timestamp in `email_sent` column
2. **Block Prospect** → Excel updates with "Yes" in `blocked` column
3. **Unblock Prospect** → Excel updates with "No" in `blocked` column
4. **Add New Prospect** → New row added to Excel with all fields

**You can:**
- ✅ Open `Data.xlsx` anytime to see current status
- ✅ Share the Excel file with your team
- ✅ Use Excel for reports and analysis
- ✅ Edit in Excel and re-run `node convert-data.js` to sync back

**Excel is your single source of truth!**

---

## Important Notes

### Security
- ⚠️ **Never commit `.env` file** - it contains secrets
- ⚠️ Keep your client secret secure
- ⚠️ Client secrets expire after 24 months - set a reminder

### Data
- The app shows 13,682 PT prospects from New Jersey
- ~90% have email addresses (12,329 records)
- Data is automatically cleaned (city names normalized, etc.)
- **All changes sync back to Data.xlsx automatically**

### Email Limits
- Office365 allows 10,000 emails/day (varies by plan)
- App limits: 50 recipients per send
- Emails are sent individually for privacy

---

## Sharing with Others

To share this with colleagues:

1. **Push to GitHub:**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin your-repo-url
   git push -u origin main
   ```

2. **Share the repo URL** with your team

3. **They clone and run:**
   ```bash
   git clone your-repo-url
   cd NJCA
   # Follow "Quick Setup" steps above
   ```

4. **They need:**
   - Their own Office365 credentials (or use yours)
   - Node.js installed on their machine

---

## Need Help?

### Common Issues

**"Authentication failed"**
→ Check your client secret is correct

**"Consent required"**
→ Make sure admin consent is granted for Mail.Send permission

**"Cannot find module"**
→ Run `npm install` in backend and frontend folders

**"Port already in use"**
→ Kill the process: `lsof -ti:3001 | xargs kill`

---

## Requirements

- Node.js 18 or higher
- Office365/Microsoft 365 business account
- Admin access to Azure AD (for app registration)

---

## License

For internal use only.

---

## Quick Commands Reference

```bash
# Setup (first time only)
cd backend && npm install
cd ../frontend && npm install

# Run the app
./start.sh                       # Normal start
./start-with-logs.sh            # Start with log files (for debugging)

# View logs (if using start-with-logs.sh)
tail -f logs/backend.log        # Watch backend logs
tail -f logs/frontend.log       # Watch frontend logs

# Test email connection
curl http://localhost:3001/api/email/test

# Regenerate data (if Excel file changes)
node convert-data.js

# Stop servers
# Press Ctrl+C (if using start.sh)
# Or kill individual processes:
lsof -ti:3001 | xargs kill      # Backend
lsof -ti:5173 | xargs kill      # Frontend
```

---

That's it! Simple and straightforward. 🎉
