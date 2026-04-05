/* ============================================================
   Job Opportunities Dashboard - Frontend Logic
   ============================================================ */

let allJobs = [];
let allConnections = {};

// ------------------------------------------------------------------
// Initialization
// ------------------------------------------------------------------

document.addEventListener("DOMContentLoaded", () => {
    loadData();
});

async function loadData() {
    try {
        const [jobsRes, connectionsRes, statsRes] = await Promise.all([
            fetch("/api/jobs"),
            fetch("/api/connections"),
            fetch("/api/stats"),
        ]);

        allJobs = await jobsRes.json();
        allConnections = await connectionsRes.json();
        const stats = await statsRes.json();

        updateStats(stats);
        populateFilters();
        renderJobs(allJobs);
    } catch (err) {
        document.getElementById("jobs-container").innerHTML =
            '<div class="empty-state"><h3>Could not load data</h3><p>Make sure you\'ve run the scraper first, or add jobs manually.</p></div>';
    }
}

// ------------------------------------------------------------------
// Stats
// ------------------------------------------------------------------

function updateStats(stats) {
    document.getElementById("stat-jobs").textContent = stats.total_jobs || 0;
    document.getElementById("stat-companies").textContent = stats.total_companies || 0;
    document.getElementById("stat-connections").textContent = stats.total_connections || 0;

    const updated = stats.last_updated;
    if (updated && updated !== "Never") {
        const d = new Date(updated);
        document.getElementById("stat-updated").textContent = d.toLocaleDateString();
    } else {
        document.getElementById("stat-updated").textContent = "-";
    }
}

// ------------------------------------------------------------------
// Filters
// ------------------------------------------------------------------

function populateFilters() {
    const select = document.getElementById("filter-company");
    const companies = [...new Set(allJobs.map(j => j.company).filter(Boolean))].sort();

    companies.forEach(c => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        select.appendChild(opt);
    });
}

function applyFilters() {
    const search = document.getElementById("filter-search").value.toLowerCase();
    const company = document.getElementById("filter-company").value;
    const sort = document.getElementById("filter-sort").value;

    let filtered = allJobs.filter(job => {
        if (company && job.company !== company) return false;
        if (search) {
            const text = `${job.title} ${job.company} ${job.description_full || ""}`.toLowerCase();
            if (!text.includes(search)) return false;
        }
        return true;
    });

    switch (sort) {
        case "match":
            filtered.sort((a, b) => (b.match_score || 0) - (a.match_score || 0));
            break;
        case "date":
            filtered.sort((a, b) => (b.posted || "").localeCompare(a.posted || ""));
            break;
        case "company":
            filtered.sort((a, b) => (a.company || "").localeCompare(b.company || ""));
            break;
    }

    renderJobs(filtered);
}

// ------------------------------------------------------------------
// Render Jobs
// ------------------------------------------------------------------

function renderJobs(jobs) {
    const container = document.getElementById("jobs-container");

    if (!jobs.length) {
        container.innerHTML =
            '<div class="empty-state"><h3>No jobs found</h3><p>Run the scraper or add jobs manually to get started.</p></div>';
        return;
    }

    container.innerHTML = jobs.map(job => renderJobCard(job)).join("");
}

function renderJobCard(job) {
    const matchClass = job.match_score >= 60 ? "match-high" : job.match_score >= 30 ? "match-medium" : "match-low";
    const matchLabel = job.match_score >= 60 ? "Strong Match" : job.match_score >= 30 ? "Partial Match" : "Low Match";
    const connections = getConnectionsForCompany(job.company);

    const description = job.description_full
        ? `<div class="job-description" id="desc-${job.id}">${escapeHtml(job.description_full.substring(0, 300))}${job.description_full.length > 300 ? "..." : ""}</div>
           ${job.description_full.length > 300 ? `<button class="expand-btn" onclick="toggleDescription('${job.id}')">Show more</button>` : ""}`
        : "";

    const connectionsHtml = connections.length
        ? `<div class="connections-section">
               <div class="connections-title">Connections at ${escapeHtml(job.company)} (${connections.length})</div>
               <div class="connections-list">
                   ${connections.map(c => renderConnectionChip(c)).join("")}
               </div>
           </div>`
        : `<div class="connections-section">
               <div class="connections-title">Connections</div>
               <div class="no-connections">No connections found at ${escapeHtml(job.company)} yet</div>
           </div>`;

    return `
        <div class="job-card">
            <div class="job-header">
                <div>
                    <div class="job-title">
                        <a href="${escapeHtml(job.url)}" target="_blank" rel="noopener">${escapeHtml(job.title)}</a>
                    </div>
                    <div class="job-company">${escapeHtml(job.company)}</div>
                    <div class="job-meta">
                        <span>${escapeHtml(job.location || "Israel")}</span>
                        ${job.seniority ? `<span>${escapeHtml(job.seniority)}</span>` : ""}
                        ${job.employment_type ? `<span>${escapeHtml(job.employment_type)}</span>` : ""}
                        ${job.posted ? `<span>Posted: ${formatDate(job.posted)}</span>` : ""}
                    </div>
                </div>
                <div style="display:flex; align-items:center; gap:8px;">
                    <span class="match-badge ${matchClass}">${job.match_score || 0}% ${matchLabel}</span>
                    <button class="delete-btn" onclick="deleteJob('${job.id}')" title="Remove">&times;</button>
                </div>
            </div>
            ${description}
            ${connectionsHtml}
        </div>
    `;
}

function renderConnectionChip(conn) {
    const degreeClass = conn.connection_degree === "1st" ? "conn-1st"
        : conn.connection_degree === "2nd" ? "conn-2nd"
        : "conn-3rd";

    const tags = (conn.background_tags || []).map(tag => {
        const label = tag.replace("_", " ").replace("iaf", "IAF").replace("tel aviv university", "TAU");
        return `<span class="conn-tag">${escapeHtml(formatTag(tag))}</span>`;
    }).join("");

    const href = conn.url || "#";
    const connectedLabel = conn.is_connected ? "Connected" : "Not connected";

    return `
        <a href="${escapeHtml(href)}" target="_blank" rel="noopener" class="connection-chip ${degreeClass}" title="${escapeHtml(conn.headline || "")} - ${connectedLabel}">
            <span class="conn-degree">${escapeHtml(conn.connection_degree)}</span>
            <span>${escapeHtml(conn.name)}</span>
            ${tags}
        </a>
    `;
}

// ------------------------------------------------------------------
// Connection helpers
// ------------------------------------------------------------------

function getConnectionsForCompany(companyName) {
    if (!companyName || !allConnections) return [];

    const key = Object.keys(allConnections).find(k =>
        k.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(k.toLowerCase())
    );

    if (!key) return [];

    const conns = allConnections[key] || [];
    return conns.sort((a, b) => (a.priority || 99) - (b.priority || 99));
}

function formatTag(tag) {
    const map = {
        "iaf": "IAF",
        "iaf_special_forces": "IAF SF",
        "tel_aviv_university": "TAU",
    };
    return map[tag] || tag;
}

// ------------------------------------------------------------------
// Actions
// ------------------------------------------------------------------

async function runScrape() {
    const btn = document.getElementById("btn-scrape");
    btn.classList.add("loading");
    btn.innerHTML = '<span class="btn-icon">&#x23F3;</span> Scraping...';

    try {
        const res = await fetch("/api/scrape", { method: "POST" });
        const data = await res.json();

        if (data.status === "ok") {
            showToast(`Found ${data.count} matching jobs!`, "success");
            loadData();
        } else {
            showToast(`Error: ${data.message}`, "error");
        }
    } catch (err) {
        showToast("Scraping failed. Check console for details.", "error");
    } finally {
        btn.classList.remove("loading");
        btn.innerHTML = '<span class="btn-icon">&#x1F50D;</span> Scrape Jobs';
    }
}

async function deleteJob(jobId) {
    try {
        await fetch(`/api/jobs/${jobId}`, { method: "DELETE" });
        allJobs = allJobs.filter(j => j.id !== jobId);
        applyFilters();
        showToast("Job removed", "success");
    } catch (err) {
        showToast("Failed to remove job", "error");
    }
}

async function submitJob(event) {
    event.preventDefault();

    const data = {
        title: document.getElementById("job-title").value,
        company: document.getElementById("job-company").value,
        url: document.getElementById("job-url").value,
        location: document.getElementById("job-location").value,
        description: document.getElementById("job-description").value,
    };

    try {
        const res = await fetch("/api/jobs/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (result.status === "ok") {
            showToast("Job added!", "success");
            closeModal("add-job-modal");
            event.target.reset();
            loadData();
        }
    } catch (err) {
        showToast("Failed to add job", "error");
    }
}

async function submitConnection(event) {
    event.preventDefault();

    const checkboxes = document.querySelectorAll('#add-connection-modal .checkbox-group input:checked');
    const tags = Array.from(checkboxes).map(cb => cb.value);

    const data = {
        name: document.getElementById("conn-name").value,
        company: document.getElementById("conn-company").value,
        url: document.getElementById("conn-url").value,
        headline: document.getElementById("conn-headline").value,
        degree: document.getElementById("conn-degree").value,
        is_connected: document.getElementById("conn-degree").value === "1st",
        background_tags: tags,
    };

    try {
        const res = await fetch("/api/connections/add", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(data),
        });
        const result = await res.json();

        if (result.status === "ok") {
            showToast("Connection added!", "success");
            closeModal("add-connection-modal");
            event.target.reset();
            loadData();
        }
    } catch (err) {
        showToast("Failed to add connection", "error");
    }
}

function toggleDescription(jobId) {
    const el = document.getElementById(`desc-${jobId}`);
    if (!el) return;

    const job = allJobs.find(j => j.id === jobId);
    if (!job) return;

    if (el.classList.contains("expanded")) {
        el.classList.remove("expanded");
        el.textContent = job.description_full.substring(0, 300) + "...";
        el.nextElementSibling.textContent = "Show more";
    } else {
        el.classList.add("expanded");
        el.textContent = job.description_full;
        el.nextElementSibling.textContent = "Show less";
    }
}

// ------------------------------------------------------------------
// Modal helpers
// ------------------------------------------------------------------

function openModal(id) {
    document.getElementById(id).classList.add("active");
}

function closeModal(id) {
    document.getElementById(id).classList.remove("active");
}

function closeModalOutside(event) {
    if (event.target.classList.contains("modal")) {
        event.target.classList.remove("active");
    }
}

// ------------------------------------------------------------------
// Utility
// ------------------------------------------------------------------

function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.className = `toast visible ${type}`;
    setTimeout(() => { toast.className = "toast"; }, 3000);
}

function escapeHtml(text) {
    if (!text) return "";
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateStr) {
    if (!dateStr) return "";
    try {
        const d = new Date(dateStr);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
    } catch {
        return dateStr;
    }
}
