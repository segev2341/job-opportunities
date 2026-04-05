"""
Dashboard web application - Displays jobs and connections in a clean UI.
"""

import json
import os
import logging
from datetime import datetime

import yaml
from flask import Flask, render_template, jsonify, request

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

BASE_DIR = os.path.dirname(os.path.dirname(__file__))
DATA_DIR = os.path.join(BASE_DIR, "data")
CONFIG_PATH = os.path.join(BASE_DIR, "config.yaml")

app = Flask(
    __name__,
    template_folder=os.path.join(BASE_DIR, "templates"),
    static_folder=os.path.join(BASE_DIR, "static"),
)


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def load_jobs():
    path = os.path.join(DATA_DIR, "jobs.json")
    if not os.path.exists(path):
        return []
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def load_connections():
    path = os.path.join(DATA_DIR, "connections.json")
    if not os.path.exists(path):
        return {}
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def save_connections(data):
    path = os.path.join(DATA_DIR, "connections.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


def save_jobs(data):
    path = os.path.join(DATA_DIR, "jobs.json")
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False, default=str)


# ------------------------------------------------------------------
# Routes
# ------------------------------------------------------------------

@app.route("/")
def dashboard():
    return render_template("dashboard.html")


@app.route("/api/jobs")
def api_jobs():
    jobs = load_jobs()
    return jsonify(jobs)


@app.route("/api/connections")
def api_connections():
    connections = load_connections()
    return jsonify(connections)


@app.route("/api/stats")
def api_stats():
    jobs = load_jobs()
    connections = load_connections()
    total_connections = sum(len(v) for v in connections.values())
    companies = list(set(j.get("company", "") for j in jobs))

    return jsonify({
        "total_jobs": len(jobs),
        "total_connections": total_connections,
        "total_companies": len(companies),
        "companies": companies,
        "last_updated": max((j.get("scraped_at", "") for j in jobs), default="Never"),
    })


@app.route("/api/scrape", methods=["POST"])
def api_scrape():
    """Trigger a job scrape from the dashboard."""
    try:
        from src.scraper import LinkedInJobScraper, load_config as load_scraper_config

        config = load_scraper_config()
        scraper = LinkedInJobScraper(config)
        jobs = scraper.scrape_all()
        scraper.save_jobs(jobs)
        return jsonify({"status": "ok", "count": len(jobs)})
    except Exception as e:
        logger.error("Scrape failed: %s", e)
        return jsonify({"status": "error", "message": str(e)}), 500


@app.route("/api/jobs/add", methods=["POST"])
def api_add_job():
    """Manually add a job to the list."""
    data = request.json
    jobs = load_jobs()

    job = {
        "id": data.get("id", str(len(jobs) + 1)),
        "title": data.get("title", ""),
        "company": data.get("company", ""),
        "location": data.get("location", "Israel"),
        "url": data.get("url", ""),
        "posted": data.get("posted", ""),
        "description_full": data.get("description", ""),
        "match_score": int(data.get("match_score", 0)),
        "scraped_at": datetime.now().isoformat(),
        "manual": True,
    }
    jobs.append(job)
    save_jobs(jobs)
    return jsonify({"status": "ok", "job": job})


@app.route("/api/connections/add", methods=["POST"])
def api_add_connection():
    """Manually add a connection."""
    data = request.json
    connections = load_connections()
    company = data.get("company", "Unknown")

    conn = {
        "name": data.get("name", ""),
        "url": data.get("url", ""),
        "headline": data.get("headline", ""),
        "location": data.get("location", ""),
        "connection_degree": data.get("degree", "1st"),
        "is_connected": data.get("is_connected", True),
        "background_tags": data.get("background_tags", []),
        "priority": int(data.get("priority", 5)),
        "found_at": datetime.now().isoformat(),
    }

    if company not in connections:
        connections[company] = []
    connections[company].append(conn)
    save_connections(connections)
    return jsonify({"status": "ok", "connection": conn})


@app.route("/api/jobs/<job_id>", methods=["DELETE"])
def api_delete_job(job_id):
    """Remove a job from the list."""
    jobs = load_jobs()
    jobs = [j for j in jobs if j.get("id") != job_id]
    save_jobs(jobs)
    return jsonify({"status": "ok"})


# ------------------------------------------------------------------
# Main
# ------------------------------------------------------------------

def main():
    config = load_config()
    host = config.get("dashboard", {}).get("host", "127.0.0.1")
    port = config.get("dashboard", {}).get("port", 5000)

    print(f"\n{'=' * 50}")
    print(f"  Job Opportunities Dashboard")
    print(f"  Open in browser: http://{host}:{port}")
    print(f"{'=' * 50}\n")

    app.run(host=host, port=port, debug=True)


if __name__ == "__main__":
    main()
