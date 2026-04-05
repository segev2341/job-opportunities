# Job Opportunities

A tool that scrapes LinkedIn for job opportunities in the **defense, cyber security, and defense-tech** industries in **Israel**, focused on **sales enablement, pre-sales, and business development** roles.

Includes a dashboard that shows jobs alongside your LinkedIn connections at each company, prioritized by background (IAF, IAF Special Forces, Tel Aviv University).

## Quick Start (Windows)

1. **Double-click `run.bat`** in the project folder
2. Choose option **4** (Full Run) for the first time
3. Open **http://127.0.0.1:5000** in your browser

That's it! The script will install everything automatically.

## What It Does

### 1. Job Scraper
- Searches LinkedIn's public job listings (no login needed)
- Filters for sales/BD/pre-sales roles at defense and cyber security companies
- Scores each job against your resume keywords
- Saves results to `data/jobs.json`

### 2. Connection Finder
- Opens a browser window for you to log into LinkedIn (one-time)
- Searches for your connections at each company with job openings
- Tags connections by background: IAF, IAF Special Forces, Tel Aviv University
- Prioritizes connections by closeness and relevance
- Saves results to `data/connections.json`

### 3. Dashboard
- Clean web interface at http://127.0.0.1:5000
- Shows all jobs with match scores, descriptions, and direct LinkedIn links
- Shows your connections at each company with LinkedIn profile links
- Color-coded connection strength (green = 1st degree, yellow = 2nd, purple = 3rd)
- Filter by company, search by keyword, sort by match/date/company
- Manually add jobs or connections via the UI

## Connection Priority

| Priority | Source | Status |
|----------|--------|--------|
| 1 | IAF (Israeli Air Force) | Already connected |
| 2 | IAF Special Forces | Not connected |
| 3 | Tel Aviv University | Not connected |
| 4 | Other | Connected |
| 5 | Other | Not connected |

## Manual Setup (if run.bat doesn't work)

```bash
# Install Python dependencies
python -m pip install -r requirements.txt

# Install browser for connection finder
python -m playwright install chromium

# Run the scraper
python src/scraper.py

# Run the connection finder
python src/connections.py

# Start the dashboard
python src/app.py
```

## Configuration

Edit `config.yaml` to customize:
- **Search keywords** - job titles to search for
- **Companies** - add or remove target companies
- **Resume skills** - your skills for job matching
- **Connection keywords** - background tags to look for
- **Scraping delays** - adjust rate limiting

## Adding Data Manually

You can also add jobs and connections directly through the dashboard UI:
- Click **"+ Add Job"** to add a job posting you found
- Click **"+ Add Connection"** to add a LinkedIn connection at a company

## Important Notes

- LinkedIn may rate-limit or block automated requests. The scraper includes delays between requests to be respectful.
- The connection finder requires a one-time manual login to LinkedIn. Your session is saved locally in `playwright_session/` so you don't need to log in every time.
- No data is sent anywhere except to LinkedIn's own servers. All results are stored locally.
