#!/bin/bash
echo "============================================"
echo "  Job Opportunities - Setup and Launch"
echo "============================================"
echo ""

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    echo "ERROR: Python is not installed."
    echo "Please install Python from https://python.org"
    exit 1
fi

PYTHON=$(command -v python3 || command -v python)

# Install dependencies
echo "Installing dependencies..."
$PYTHON -m pip install -r requirements.txt --quiet

# Install Playwright browsers
echo "Installing browser for connection finder..."
$PYTHON -m playwright install chromium 2>/dev/null

# Create data directory
mkdir -p data

echo ""
echo "============================================"
echo "  What would you like to do?"
echo "============================================"
echo "  1. Open Dashboard (view results)"
echo "  2. Scrape Jobs (fetch new jobs from LinkedIn)"
echo "  3. Find Connections (requires LinkedIn login)"
echo "  4. Full Run (scrape + connections + dashboard)"
echo "============================================"
echo ""
read -p "Enter your choice (1-4): " choice

case $choice in
    1)
        echo ""
        echo "Starting dashboard... Open http://127.0.0.1:5000"
        $PYTHON src/app.py
        ;;
    2)
        echo ""
        echo "Scraping LinkedIn for jobs..."
        $PYTHON src/scraper.py
        echo "Starting dashboard... Open http://127.0.0.1:5000"
        $PYTHON src/app.py
        ;;
    3)
        echo ""
        echo "Finding connections (a browser window will open)..."
        $PYTHON src/connections.py
        echo "Starting dashboard... Open http://127.0.0.1:5000"
        $PYTHON src/app.py
        ;;
    4)
        echo ""
        echo "Step 1/3: Scraping jobs..."
        $PYTHON src/scraper.py
        echo "Step 2/3: Finding connections..."
        $PYTHON src/connections.py
        echo "Step 3/3: Starting dashboard... Open http://127.0.0.1:5000"
        $PYTHON src/app.py
        ;;
    *)
        echo "Invalid choice."
        exit 1
        ;;
esac
