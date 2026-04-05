"""
LinkedIn Job Scraper - Fetches public job listings from LinkedIn.
Uses LinkedIn's public guest API (no login required for job search).
"""

import json
import os
import re
import time
import random
import logging
from datetime import datetime
from urllib.parse import quote_plus

import requests
from bs4 import BeautifulSoup
import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


def get_all_target_companies(config):
    """Flatten all company lists into a single set (lowercased for matching)."""
    companies = set()
    for category in config.get("companies", {}).values():
        for name in category:
            companies.add(name.lower())
    return companies


def _delay(config):
    lo = config.get("scraping", {}).get("delay_min", 2)
    hi = config.get("scraping", {}).get("delay_max", 5)
    time.sleep(random.uniform(lo, hi))


class LinkedInJobScraper:
    SEARCH_URL = "https://www.linkedin.com/jobs-guest/jobs/api/seeMoreJobPostings/search"
    JOB_DETAIL_URL = "https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{}"
    JOB_VIEW_URL = "https://www.linkedin.com/jobs/view/{}"

    def __init__(self, config=None):
        self.config = config or load_config()
        self.session = requests.Session()
        ua = self.config.get("scraping", {}).get(
            "user_agent",
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
        )
        self.session.headers.update({
            "User-Agent": ua,
            "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
            "Accept-Language": "en-US,en;q=0.9",
        })
        self.target_companies = get_all_target_companies(self.config)

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def scrape_all(self):
        """Run a full scrape using two strategies and return all jobs."""
        all_jobs = {}

        # Strategy 1: Search by role keywords (broad - keep ALL results)
        keywords = self.config.get("search", {}).get("keywords", [])
        max_per_kw = self.config.get("search", {}).get("max_results_per_keyword", 100)

        for kw in keywords:
            logger.info("Searching role keyword: %s", kw)
            jobs = self._search_keyword(kw, max_results=max_per_kw)
            for job in jobs:
                if job["id"] not in all_jobs:
                    all_jobs[job["id"]] = job
            logger.info("  Found %d jobs for '%s' (total unique: %d)", len(jobs), kw, len(all_jobs))

        # Strategy 2: Search by company name + broad role terms
        # Pick a subset of top companies to search directly
        company_lists = self.config.get("companies", {})
        role_terms = ["sales", "business development", "pre-sales"]
        companies_to_search = []
        for category in company_lists.values():
            companies_to_search.extend(category[:10])  # top 10 per category

        for company in companies_to_search:
            for role in role_terms:
                query = f"{company} {role}"
                logger.info("Searching company+role: %s", query)
                jobs = self._search_keyword(query, max_results=25)
                for job in jobs:
                    if job["id"] not in all_jobs:
                        all_jobs[job["id"]] = job
                if jobs:
                    logger.info("  Found %d jobs for '%s'", len(jobs), query)

        logger.info("Total unique jobs found before filtering: %d", len(all_jobs))

        # Filter out engineering/technical roles (but keep sales engineer, solutions engineer, etc.)
        business_engineer_titles = {"sales engineer", "solutions engineer", "customer engineer", "field engineer", "se "}
        engineering_terms = {"software engineer", "devops", "backend engineer", "frontend engineer",
                            "full stack", "fullstack", "data engineer", "ml engineer", "machine learning engineer",
                            "sre", "site reliability", "platform engineer", "infrastructure engineer",
                            "qa engineer", "test engineer", "automation engineer", "security engineer",
                            "network engineer", "cloud engineer", "systems engineer", "embedded engineer",
                            "firmware engineer", "hardware engineer", "developer", "architect",
                            "engineering manager", "r&d", "research and development", "algorithm",
                            "data scientist", "develope"}

        filtered_jobs = {}
        for jid, job in all_jobs.items():
            title_lower = job.get("title", "").lower()
            # Keep if it's a business-facing "engineer" role
            is_business_eng = any(bt in title_lower for bt in business_engineer_titles)
            # Skip if it's a technical/engineering role
            is_tech = any(et in title_lower for et in engineering_terms)
            if is_tech and not is_business_eng:
                continue
            filtered_jobs[jid] = job

        all_jobs = filtered_jobs
        logger.info("After filtering engineering roles: %d jobs", len(all_jobs))

        # Score ALL jobs
        resume_keywords = self.config.get("resume", {}).get("skills", [])
        for job in all_jobs.values():
            is_target = self._matches_target_company(job)
            job["is_target_company"] = is_target
            job["match_score"] = self._score_job(job, resume_keywords, is_target)

        # Sort by score
        results = sorted(all_jobs.values(), key=lambda j: j.get("match_score", 0), reverse=True)

        # Fetch details for top 30 jobs to improve scoring
        for job in results[:30]:
            if not job.get("description_full"):
                try:
                    detail = self._get_job_detail(job["id"])
                    job.update(detail)
                    is_target = job.get("is_target_company", False)
                    job["match_score"] = self._score_job(job, resume_keywords, is_target)
                    _delay(self.config)
                except Exception as e:
                    logger.warning("Could not fetch detail for job %s: %s", job["id"], e)

        results.sort(key=lambda j: j.get("match_score", 0), reverse=True)
        return results

    def save_jobs(self, jobs, path=None):
        path = path or os.path.join(DATA_DIR, "jobs.json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(jobs, f, indent=2, ensure_ascii=False, default=str)
        logger.info("Saved %d jobs to %s", len(jobs), path)

    # ------------------------------------------------------------------
    # Search
    # ------------------------------------------------------------------

    def _search_keyword(self, keyword, max_results=100):
        jobs = []
        location = self.config.get("search", {}).get("location", "Israel")
        geo_id = self.config.get("search", {}).get("geo_id", "101620260")

        for start in range(0, max_results, 25):
            params = {
                "keywords": keyword,
                "location": location,
                "geoId": geo_id,
                "start": start,
                "f_TPR": "r2592000",  # Past month
            }
            try:
                resp = self.session.get(self.SEARCH_URL, params=params, timeout=15)
                if resp.status_code != 200:
                    logger.warning("Search returned %d for '%s' at offset %d", resp.status_code, keyword, start)
                    break

                page_jobs = self._parse_search_results(resp.text, keyword)
                if not page_jobs:
                    break
                jobs.extend(page_jobs)
                _delay(self.config)
            except Exception as e:
                logger.error("Error searching '%s' at offset %d: %s", keyword, start, e)
                break

        return jobs

    def _parse_search_results(self, html, keyword):
        soup = BeautifulSoup(html, "lxml")
        # Find all job listing items
        cards = soup.find_all("div", class_="base-card")
        if not cards:
            cards = soup.find_all("li")

        jobs = []
        for card in cards:
            try:
                job = self._parse_card(card, keyword)
                if job:
                    jobs.append(job)
            except Exception:
                continue
        return jobs

    def _parse_card(self, card, keyword):
        # Try multiple selectors for robustness
        title_el = card.find("h3", class_="base-search-card__title") or card.find("h3")
        company_el = card.find("h4", class_="base-search-card__subtitle") or card.find("h4")
        location_el = (
            card.find("span", class_="job-search-card__location")
            or card.find("span", class_="base-search-card__metadata")
        )
        link_el = card.find("a", class_="base-card__full-link") or card.find("a", href=True)
        time_el = card.find("time")

        if not title_el:
            return None

        title = title_el.get_text(strip=True)
        if not title:
            return None

        company = company_el.get_text(strip=True) if company_el else "Unknown"
        location = location_el.get_text(strip=True) if location_el else ""
        posted = time_el.get("datetime", "") if time_el else ""

        # Get link and extract job ID
        link = ""
        job_id = ""
        if link_el:
            link = link_el.get("href", "")

        # Also check the card's data attribute for job ID
        entity_urn = card.get("data-entity-urn", "")
        m_urn = re.search(r"jobPosting:(\d+)", entity_urn)
        if m_urn:
            job_id = m_urn.group(1)

        if not job_id and link:
            m = re.search(r"/jobs/view/[^/]*?(\d+)", link)
            if m:
                job_id = m.group(1)
            else:
                m2 = re.search(r"currentJobId=(\d+)", link)
                if m2:
                    job_id = m2.group(1)

        if not job_id:
            return None

        return {
            "id": job_id,
            "title": title,
            "company": company,
            "location": location,
            "url": self.JOB_VIEW_URL.format(job_id),
            "posted": posted,
            "search_keyword": keyword,
            "description_full": "",
            "match_score": 0,
            "is_target_company": False,
            "scraped_at": datetime.now().isoformat(),
        }

    # ------------------------------------------------------------------
    # Job detail
    # ------------------------------------------------------------------

    def _get_job_detail(self, job_id):
        url = self.JOB_DETAIL_URL.format(job_id)
        resp = self.session.get(url, timeout=15)
        if resp.status_code != 200:
            return {}

        soup = BeautifulSoup(resp.text, "lxml")
        desc_el = (
            soup.find("div", class_="show-more-less-html__markup")
            or soup.find("div", class_="description__text")
            or soup.find("section", class_="description")
        )

        description = desc_el.get_text(separator="\n", strip=True) if desc_el else ""

        criteria_items = soup.find_all("li", class_="description__job-criteria-item")
        seniority = ""
        employment_type = ""
        industry = ""
        for item in criteria_items:
            header = item.find("h3")
            value = item.find("span")
            if header and value:
                h = header.get_text(strip=True).lower()
                v = value.get_text(strip=True)
                if "seniority" in h:
                    seniority = v
                elif "employment" in h:
                    employment_type = v
                elif "industr" in h:
                    industry = v

        return {
            "description_full": description,
            "seniority": seniority,
            "employment_type": employment_type,
            "industry": industry,
        }

    # ------------------------------------------------------------------
    # Matching helpers
    # ------------------------------------------------------------------

    def _matches_target_company(self, job):
        company = job.get("company", "").lower()
        for target in self.target_companies:
            if target in company or company in target:
                return True
        return False

    def _score_job(self, job, resume_keywords, is_target_company=False):
        text = " ".join([
            job.get("title", ""),
            job.get("description_full", ""),
            job.get("company", ""),
            job.get("industry", ""),
        ]).lower()

        if not text.strip():
            return 10 if is_target_company else 5

        # Base score from resume keyword matches
        hits = sum(1 for kw in resume_keywords if kw.lower() in text)
        score = round(hits / max(len(resume_keywords), 1) * 60)

        # Bonus for target company (+30)
        if is_target_company:
            score += 30

        # Bonus for defense/security/cyber in title or description (+10)
        defense_terms = ["defense", "defence", "security", "cyber", "military", "intelligence", "aerospace"]
        if any(t in text for t in defense_terms):
            score += 10

        return min(score, 100)


# ------------------------------------------------------------------
# CLI entry point
# ------------------------------------------------------------------

def main():
    config = load_config()
    scraper = LinkedInJobScraper(config)
    jobs = scraper.scrape_all()
    scraper.save_jobs(jobs)
    print(f"\nDone! Found {len(jobs)} jobs. Results saved to data/jobs.json")
    print("Run the dashboard with: python src/app.py")


if __name__ == "__main__":
    main()
