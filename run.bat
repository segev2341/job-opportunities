@echo off
echo ============================================
echo   Job Opportunities - Setup and Launch
echo ============================================
echo.

:: Check Python
python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python is not installed or not in PATH.
    echo Please install Python from https://python.org
    pause
    exit /b 1
)

:: Install dependencies
echo Installing dependencies...
python -m pip install -r requirements.txt --quiet

:: Install Playwright browsers (for connection finder)
echo Installing browser for connection finder...
python -m playwright install chromium --quiet 2>nul

:: Create data directory
if not exist data mkdir data

:: Choose mode
echo.
echo ============================================
echo   What would you like to do?
echo ============================================
echo   1. Open Dashboard (view results)
echo   2. Scrape Jobs (fetch new jobs from LinkedIn)
echo   3. Find Connections (requires LinkedIn login)
echo   4. Full Run (scrape + connections + dashboard)
echo ============================================
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto dashboard
if "%choice%"=="2" goto scrape
if "%choice%"=="3" goto connections
if "%choice%"=="4" goto full

:dashboard
echo.
echo Starting dashboard...
echo Open your browser to: http://127.0.0.1:5000
python src/app.py
goto end

:scrape
echo.
echo Scraping LinkedIn for jobs...
python src/scraper.py
echo.
echo Now starting dashboard...
echo Open your browser to: http://127.0.0.1:5000
python src/app.py
goto end

:connections
echo.
echo Finding connections (a browser window will open)...
python src/connections.py
echo.
echo Now starting dashboard...
echo Open your browser to: http://127.0.0.1:5000
python src/app.py
goto end

:full
echo.
echo Step 1/3: Scraping jobs...
python src/scraper.py
echo.
echo Step 2/3: Finding connections...
python src/connections.py
echo.
echo Step 3/3: Starting dashboard...
echo Open your browser to: http://127.0.0.1:5000
python src/app.py
goto end

:end
pause
