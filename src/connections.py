"""
LinkedIn Connection Finder - Uses Playwright to find connections at target companies.
Requires a one-time manual LinkedIn login (session is saved for reuse).
"""

import asyncio
import json
import os
import re
import logging
import time
import random
from datetime import datetime

import yaml

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger(__name__)

CONFIG_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), "config.yaml")
DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "data")
SESSION_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "playwright_session")


def load_config():
    with open(CONFIG_PATH, "r", encoding="utf-8") as f:
        return yaml.safe_load(f)


class ConnectionFinder:
    PEOPLE_SEARCH_URL = "https://www.linkedin.com/search/results/people/"

    def __init__(self, config=None):
        self.config = config or load_config()
        self.browser = None
        self.context = None
        self.page = None
        self.background_keywords = self.config.get("connections", {}).get("background_keywords", {})
        self.priorities = self.config.get("connections", {}).get("priorities", [])

    async def initialize(self):
        """Launch browser with persistent session so user only logs in once."""
        from playwright.async_api import async_playwright

        self.pw = await async_playwright().start()
        self.context = await self.pw.chromium.launch_persistent_context(
            user_data_dir=SESSION_DIR,
            headless=False,
            viewport={"width": 1280, "height": 900},
            args=["--disable-blink-features=AutomationControlled"],
        )
        self.page = self.context.pages[0] if self.context.pages else await self.context.new_page()

    async def ensure_logged_in(self):
        """Check if user is logged in to LinkedIn, prompt manual login if not."""
        await self.page.goto("https://www.linkedin.com/feed/", wait_until="domcontentloaded", timeout=30000)
        await self.page.wait_for_timeout(3000)

        url = self.page.url
        if "login" in url or "authwall" in url or "signup" in url:
            logger.info("=" * 60)
            logger.info("NOT LOGGED IN - Please log in to LinkedIn in the browser window.")
            logger.info("After logging in, press Enter in this terminal to continue.")
            logger.info("=" * 60)
            input("\n>>> Press Enter after you have logged into LinkedIn... ")
            await self.page.wait_for_timeout(3000)

        logger.info("LinkedIn session is active.")

    async def find_connections_for_company(self, company_name):
        """Search LinkedIn for people at a specific company who may be connections."""
        connections = []

        # Search 1st-degree connections at company
        first_degree = await self._search_people(company_name, network_depth="F")
        for person in first_degree:
            person["connection_degree"] = "1st"
            person["is_connected"] = True
            person["mutual_connection"] = None
            connections.append(person)

        await self._delay()

        # Search 2nd-degree connections at company
        second_degree = await self._search_people(company_name, network_depth="S")
        for person in second_degree:
            person["connection_degree"] = "2nd"
            person["is_connected"] = False
            person["mutual_connection"] = None
            # Try to find the mutual/bridge connection
            mutual = await self._get_mutual_connection(person)
            if mutual:
                person["mutual_connection"] = mutual
            connections.append(person)
            await self._delay()

        # Categorize by background
        for conn in connections:
            conn["background_tags"] = self._categorize_background(conn)
            conn["priority"] = self._get_priority(conn)

        connections.sort(key=lambda c: c.get("priority", 99))
        return connections

    async def find_all_connections(self, companies=None):
        """Find connections at all target companies (or a specific list)."""
        if companies is None:
            config = self.config
            companies = set()
            for category in config.get("companies", {}).values():
                companies.update(category)

        all_connections = {}

        for company in companies:
            logger.info("Searching connections at: %s", company)
            try:
                conns = await self.find_connections_for_company(company)
                if conns:
                    all_connections[company] = conns
                    logger.info("  Found %d connections at %s", len(conns), company)
                await self._delay()
            except Exception as e:
                logger.warning("Error searching connections at %s: %s", company, e)

        return all_connections

    async def _search_people(self, company_name, network_depth="F", max_pages=2):
        """Search LinkedIn for people at a company within a network depth."""
        people = []

        for page_num in range(max_pages):
            params = f"?keywords={company_name}&network=%5B%22{network_depth}%22%5D&origin=FACETED_SEARCH&page={page_num + 1}"
            url = self.PEOPLE_SEARCH_URL + params

            try:
                await self.page.goto(url, wait_until="domcontentloaded", timeout=20000)
                await self.page.wait_for_timeout(3000)

                # Scroll to load results
                await self.page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
                await self.page.wait_for_timeout(2000)

                # Extract people cards
                cards = await self.page.query_selector_all("div.entity-result__item, li.reusable-search__result-container")

                if not cards:
                    break

                for card in cards:
                    try:
                        person = await self._parse_person_card(card)
                        if person:
                            people.append(person)
                    except Exception:
                        continue

                await self._delay()

            except Exception as e:
                logger.warning("Error on people search page %d: %s", page_num + 1, e)
                break

        return people

    async def _parse_person_card(self, card):
        """Extract person info from a LinkedIn search result card."""
        name_el = await card.query_selector("span.entity-result__title-text a span[aria-hidden='true'], a.app-aware-link span[dir='ltr']")
        link_el = await card.query_selector("a.app-aware-link, a.entity-result__title-link")
        headline_el = await card.query_selector("div.entity-result__primary-subtitle, div.entity-result__summary")
        location_el = await card.query_selector("div.entity-result__secondary-subtitle")

        if not name_el:
            return None

        name = await name_el.inner_text()
        name = name.strip()
        if not name or name.lower() == "linkedin member":
            return None

        link = ""
        if link_el:
            link = await link_el.get_attribute("href") or ""
            # Clean up link
            link = link.split("?")[0]
            if not link.startswith("http"):
                link = "https://www.linkedin.com" + link

        headline = ""
        if headline_el:
            headline = await headline_el.inner_text()
            headline = headline.strip()

        location = ""
        if location_el:
            location = await location_el.inner_text()
            location = location.strip()

        return {
            "name": name,
            "url": link,
            "headline": headline,
            "location": location,
            "company": "",
            "background_tags": [],
            "connection_degree": "",
            "is_connected": False,
            "mutual_connection": None,
            "priority": 99,
            "found_at": datetime.now().isoformat(),
        }

    async def _get_mutual_connection(self, person):
        """Visit a 2nd-degree connection's profile to find the mutual/bridge connection."""
        profile_url = person.get("url", "")
        if not profile_url or "linkedin.com/in/" not in profile_url:
            return None

        try:
            await self.page.goto(profile_url, wait_until="domcontentloaded", timeout=20000)
            await self.page.wait_for_timeout(2000)

            # LinkedIn shows "N mutual connections" link on 2nd-degree profiles
            # Try to find and click the mutual connections link
            mutual_link = await self.page.query_selector(
                "a[href*='facetNetwork'][href*='mutual'], "
                "a[href*='connectionOf'], "
                "span.dist-value:has-text('2nd'), "
                "a:has-text('mutual connection'), "
                "a:has-text('mutual connections')"
            )

            if mutual_link:
                await mutual_link.click()
                await self.page.wait_for_timeout(3000)

                # Parse the first mutual connection shown
                mutual_card = await self.page.query_selector(
                    "div.entity-result__item, li.reusable-search__result-container"
                )
                if mutual_card:
                    mutual_person = await self._parse_person_card(mutual_card)
                    if mutual_person:
                        return {
                            "name": mutual_person["name"],
                            "url": mutual_person["url"],
                            "headline": mutual_person["headline"],
                        }

            # Fallback: try to extract mutual connection text from the profile page itself
            mutual_text_el = await self.page.query_selector(
                "[class*='mutual'] a, "
                "a[href*='mutual']"
            )
            if mutual_text_el:
                text = await mutual_text_el.inner_text()
                href = await mutual_text_el.get_attribute("href") or ""
                if text.strip():
                    return {
                        "name": text.strip(),
                        "url": href if href.startswith("http") else "",
                        "headline": "",
                    }

        except Exception as e:
            logger.warning("Could not get mutual connection for %s: %s", person.get("name"), e)

        return None

    def _categorize_background(self, person):
        """Check person's headline/summary for background keywords."""
        tags = []
        text = " ".join([
            person.get("headline", ""),
            person.get("name", ""),
            person.get("location", ""),
        ]).lower()

        for group_name, keywords in self.background_keywords.items():
            for kw in keywords:
                if kw.lower() in text:
                    tags.append(group_name)
                    break

        return tags

    def _get_priority(self, person):
        """Determine priority based on background and connection status."""
        tags = person.get("background_tags", [])
        is_connected = person.get("is_connected", False)

        for prio_config in self.priorities:
            kw_group = prio_config.get("keywords_group", "")
            needs_connected = prio_config.get("connected", False)

            if kw_group in tags:
                if needs_connected == is_connected:
                    return prio_config["priority"]

        # Default priorities for untagged connections
        if is_connected:
            return 4
        return 5

    async def _delay(self):
        lo = self.config.get("scraping", {}).get("delay_min", 2)
        hi = self.config.get("scraping", {}).get("delay_max", 5)
        await asyncio.sleep(random.uniform(lo, hi))

    async def close(self):
        if self.context:
            await self.context.close()
        if hasattr(self, "pw") and self.pw:
            await self.pw.stop()

    def save_connections(self, connections, path=None):
        path = path or os.path.join(DATA_DIR, "connections.json")
        os.makedirs(os.path.dirname(path), exist_ok=True)
        with open(path, "w", encoding="utf-8") as f:
            json.dump(connections, f, indent=2, ensure_ascii=False, default=str)
        logger.info("Saved connections to %s", path)


# ------------------------------------------------------------------
# CLI entry point
# ------------------------------------------------------------------

async def async_main():
    config = load_config()
    finder = ConnectionFinder(config)

    try:
        await finder.initialize()
        await finder.ensure_logged_in()

        # Load jobs to find relevant companies
        jobs_path = os.path.join(DATA_DIR, "jobs.json")
        if os.path.exists(jobs_path):
            with open(jobs_path, "r", encoding="utf-8") as f:
                jobs = json.load(f)
            companies = list(set(j["company"] for j in jobs if j.get("company")))
            logger.info("Finding connections at %d companies from job results", len(companies))
        else:
            logger.info("No jobs.json found. Searching all configured companies.")
            companies = None

        connections = await finder.find_all_connections(companies)
        finder.save_connections(connections)

        total = sum(len(v) for v in connections.values())
        print(f"\nDone! Found {total} connections across {len(connections)} companies.")
        print("Results saved to data/connections.json")
        print("Run the dashboard with: python src/app.py")

    finally:
        await finder.close()


def main():
    asyncio.run(async_main())


if __name__ == "__main__":
    main()
