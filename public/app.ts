type Severity = "Low" | "Medium" | "High" | "Critical";
type CatalogType = "services" | "hosts" | "owners" | "tags";
type MainCaseStatus =
  | "Triage"
  | "Event"
  | "Incident"
  | "Critical"
  | "Review"
  | "Closed";

type MainCaseRow = {
  id: number | string;
  main_case_ref: string;
  team_number: number;
  severity: Severity;
  owner: string;
  status: MainCaseStatus;
  current_action: string;
  summary: string;
  details: string;
  first_reported: string | null;
  last_updated: string | null;
  event_count: number;
};

type JournalEvent = {
  id: number | string;
  case_id: string;
  main_case_id: number | string | null;
  main_case_ref: string | null;
  occurred_at: string;
  created_at: string;
  severity: Severity;
  team_number: number;
  event_type: string;
  summary: string;
  details: string;
  services: string[];
  hosts: string[];
  owners: string[];
  tags: string[];
};

type OptionsResponse = {
  catalog: Record<CatalogType, string[]>;
};

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const mainCaseForm = byId<HTMLFormElement>("main-case-form");
const eventForm = byId<HTMLFormElement>("event-form");
const quickAddForm = byId<HTMLFormElement>("quick-add-form");

const mainCasesBody = byId<HTMLDivElement>("main-cases-body");
const eventsBody = byId<HTMLDivElement>("events-body");

const mainCaseStatusEl = byId<HTMLDivElement>("main-case-status");
const eventStatusEl = byId<HTMLDivElement>("event-status");
const catalogStatusEl = byId<HTMLDivElement>("catalog-status");

const headerClock = byId<HTMLElement>("header-clock");
const resetTimeButton = byId<HTMLButtonElement>("reset-time");
const refreshAllButton = byId<HTMLButtonElement>("refresh-all");

const caseTeamInput = byId<HTMLSelectElement>("case-team-number");
const caseSeverityInput = byId<HTMLSelectElement>("case-severity");
const caseStatusInput = byId<HTMLSelectElement>("case-status");
const caseOwnerInput = byId<HTMLInputElement>("case-owner");
const caseActionInput = byId<HTMLInputElement>("case-current-action");
const caseSummaryInput = byId<HTMLInputElement>("case-summary");
const caseDetailsInput = byId<HTMLTextAreaElement>("case-details");

const mainCaseSelect = byId<HTMLSelectElement>("main-case-id");
const timeInput = byId<HTMLInputElement>("time");
const severityInput = byId<HTMLSelectElement>("severity");
const teamNumberInput = byId<HTMLSelectElement>("team-number");
const eventTypeInput = byId<HTMLSelectElement>("event-type");
const summaryInput = byId<HTMLInputElement>("summary");
const detailsInput = byId<HTMLTextAreaElement>("details");
const servicesInput = byId<HTMLInputElement>("services");
const hostsInput = byId<HTMLInputElement>("hosts");
const ownersInput = byId<HTMLInputElement>("owners");
const tagsInput = byId<HTMLInputElement>("tags");
const saveEventButton = byId<HTMLButtonElement>("save-event-btn");

const catalogTypeInput = byId<HTMLSelectElement>("catalog-type");
const catalogNameInput = byId<HTMLInputElement>("catalog-name");

const caseSearchInput = byId<HTMLInputElement>("case-search");
const eventSearchInput = byId<HTMLInputElement>("event-search");
const eventMainCaseFilter = byId<HTMLSelectElement>("event-main-case-filter");

let mainCasesCache: MainCaseRow[] = [];
let eventSearchTimer: number | undefined;
let caseSearchTimer: number | undefined;

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function setStatus(target: HTMLDivElement, message = "", isError = false): void {
  target.textContent = message;
  target.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
}

function toNumericId(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function formatDate(value: string | null): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "-";
  }

  return date.toLocaleString();
}

function nowForInput(date = new Date()): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

function syncTimeInput(): void {
  timeInput.value = nowForInput();
}

function updateHeaderClock(): void {
  headerClock.textContent = new Date().toLocaleString();
}

function parseCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => {
      const firstIndex = all.findIndex(
        (entry) => entry.toLowerCase() === item.toLowerCase(),
      );
      return firstIndex === index;
    });
}

function fillDatalist(id: string, values: string[]): void {
  const element = byId<HTMLDataListElement>(id);
  element.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function mainCaseLabel(mainCase: MainCaseRow): string {
  const summary = mainCase.summary?.trim() || "No summary";
  const shortSummary = summary.length > 46 ? `${summary.slice(0, 46)}...` : summary;
  return `${mainCase.main_case_ref} | ${shortSummary}`;
}

function severityClass(severity: string): string {
  switch (severity) {
    case "Low":
      return "sev-low";
    case "Medium":
      return "sev-medium";
    case "High":
      return "sev-high";
    case "Critical":
      return "sev-critical";
    default:
      return "";
  }
}

function statusClass(status: string): string {
  return `status-${status.toLowerCase()}`;
}

function renderContextGroup(label: string, values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) {
    return `
      <div class="context-group">
        <div class="context-title">${escapeHtml(label)}</div>
        <div class="muted">None</div>
      </div>
    `;
  }

  const pills = values
    .map((value) => `<span class="pill">${escapeHtml(value)}</span>`)
    .join("");

  return `
    <div class="context-group">
      <div class="context-title">${escapeHtml(label)}</div>
      <div class="context-tags">${pills}</div>
    </div>
  `;
}

function populateMainCaseSelectors(preferredMainCaseId: number | null = null): void {
  const previousMainCaseId =
    preferredMainCaseId ?? toNumericId(mainCaseSelect.value) ?? null;
  const previousFilterId = toNumericId(eventMainCaseFilter.value);

  if (mainCasesCache.length === 0) {
    mainCaseSelect.innerHTML = `<option value="">No main cases yet</option>`;
    eventMainCaseFilter.innerHTML = `<option value="">All Main Cases</option>`;
    mainCaseSelect.disabled = true;
    saveEventButton.disabled = true;
    return;
  }

  const optionsHtml = mainCasesCache
    .map((mainCase) => {
      const caseId = toNumericId(mainCase.id);
      if (!caseId) {
        return "";
      }

      return `<option value="${caseId}">${escapeHtml(mainCaseLabel(mainCase))}</option>`;
    })
    .join("");

  mainCaseSelect.innerHTML = optionsHtml;
  eventMainCaseFilter.innerHTML = `<option value="">All Main Cases</option>${optionsHtml}`;

  mainCaseSelect.disabled = false;
  saveEventButton.disabled = false;

  const existingMainCaseId =
    previousMainCaseId &&
    mainCasesCache.some((mainCase) => toNumericId(mainCase.id) === previousMainCaseId)
      ? previousMainCaseId
      : toNumericId(mainCasesCache[0]?.id);

  if (existingMainCaseId) {
    mainCaseSelect.value = String(existingMainCaseId);
  }

  if (
    previousFilterId &&
    mainCasesCache.some((mainCase) => toNumericId(mainCase.id) === previousFilterId)
  ) {
    eventMainCaseFilter.value = String(previousFilterId);
  } else {
    eventMainCaseFilter.value = "";
  }
}

function renderMainCases(mainCases: MainCaseRow[]): void {
  if (mainCases.length === 0) {
    mainCasesBody.innerHTML = `<div class="entry-empty">No main cases found.</div>`;
    return;
  }

  mainCasesBody.innerHTML = mainCases
    .map((mainCase) => {
      const currentAction =
        mainCase.current_action?.trim() || "No current action / next step provided.";
      const details = mainCase.details?.trim() || "No additional details.";

      return `
        <article class="main-case-card">
          <div class="case-head">
            <div>
              <div class="case-ref">${escapeHtml(mainCase.main_case_ref)}</div>
              <p class="case-summary">${escapeHtml(mainCase.summary)}</p>
            </div>
            <div class="case-flags">
              <span class="badge ${severityClass(mainCase.severity)}">${escapeHtml(mainCase.severity)}</span>
              <span class="badge ${statusClass(mainCase.status)}">${escapeHtml(mainCase.status)}</span>
              <span class="badge">Team ${escapeHtml(mainCase.team_number)}</span>
            </div>
          </div>

          <div class="case-meta">
            <div class="meta-item">
              <div class="meta-label">First Reported</div>
              <div class="meta-value">${escapeHtml(formatDate(mainCase.first_reported))}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Last Updated</div>
              <div class="meta-value">${escapeHtml(formatDate(mainCase.last_updated))}</div>
            </div>
            <div class="meta-item">
              <div class="meta-label">Sub Cases</div>
              <div class="meta-value">${escapeHtml(mainCase.event_count)}</div>
            </div>
          </div>

          <p class="muted"><strong>Owner:</strong> ${escapeHtml(mainCase.owner)}</p>
          <p class="muted"><strong>Current Action:</strong> ${escapeHtml(currentAction)}</p>
          <p class="case-details">${escapeHtml(details)}</p>
        </article>
      `;
    })
    .join("");
}

function renderEvents(events: JournalEvent[]): void {
  if (events.length === 0) {
    eventsBody.innerHTML = `<div class="entry-empty">No events found for the current search.</div>`;
    return;
  }

  eventsBody.innerHTML = events
    .map((event) => {
      const eventId = toNumericId(event.id);
      const details = event.details?.trim() || "No additional details.";
      const mainCaseRef = event.main_case_ref || "No Main Case";
      const editLink = eventId
        ? `<div class="entry-actions"><a class="secondary-btn link-btn" href="/event-edit?id=${eventId}">Edit Event</a></div>`
        : "";

      return `
        <article class="entry-card">
          <div class="entry-head">
            <div>
              <div class="entry-case">${escapeHtml(event.case_id)}</div>
              <div class="muted">${escapeHtml(formatDate(event.occurred_at))}</div>
              <div class="muted"><strong>Main:</strong> ${escapeHtml(mainCaseRef)}</div>
            </div>
            <div class="entry-flags">
              <span class="badge ${severityClass(event.severity)}">${escapeHtml(event.severity)}</span>
              <span class="badge">Team ${escapeHtml(event.team_number)}</span>
              <span class="badge">${escapeHtml(event.event_type)}</span>
            </div>
          </div>

          <p class="entry-summary">${escapeHtml(event.summary)}</p>
          <p class="entry-details">${escapeHtml(details)}</p>

          <div class="context-grid">
            ${renderContextGroup("Services", event.services)}
            ${renderContextGroup("Hosts", event.hosts)}
            ${renderContextGroup("Owners", event.owners)}
            ${renderContextGroup("Tags", event.tags)}
          </div>

          ${editLink}
        </article>
      `;
    })
    .join("");
}

async function loadCatalogOptions(): Promise<void> {
  const response = await fetch("/api/options");
  if (!response.ok) {
    throw new Error("Failed to load reusable values.");
  }

  const data = (await response.json()) as OptionsResponse;
  fillDatalist("services-list", data.catalog.services || []);
  fillDatalist("hosts-list", data.catalog.hosts || []);
  fillDatalist("owners-list", data.catalog.owners || []);
  fillDatalist("tags-list", data.catalog.tags || []);
}

async function loadMainCases(preferredMainCaseId: number | null = null): Promise<void> {
  const params = new URLSearchParams();
  const search = caseSearchInput.value.trim();
  if (search) {
    params.set("search", search);
  }

  const endpoint = params.toString()
    ? `/api/main-cases?${params.toString()}`
    : "/api/main-cases";

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to load main cases.");
  }

  const data = (await response.json()) as { mainCases?: MainCaseRow[] };
  mainCasesCache = Array.isArray(data.mainCases) ? data.mainCases : [];

  renderMainCases(mainCasesCache);
  populateMainCaseSelectors(preferredMainCaseId);
}

async function loadEvents(): Promise<void> {
  const params = new URLSearchParams();

  const search = eventSearchInput.value.trim();
  if (search) {
    params.set("search", search);
  }

  const filterMainCaseId = toNumericId(eventMainCaseFilter.value);
  if (filterMainCaseId) {
    params.set("mainCaseId", String(filterMainCaseId));
  }

  const endpoint = params.toString()
    ? `/api/events?${params.toString()}`
    : "/api/events";

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to load events.");
  }

  const data = (await response.json()) as { events?: JournalEvent[] };
  renderEvents(Array.isArray(data.events) ? data.events : []);
}

mainCaseForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(mainCaseStatusEl);

  const payload = {
    teamNumber: Number(caseTeamInput.value),
    severity: caseSeverityInput.value,
    status: caseStatusInput.value,
    owner: caseOwnerInput.value,
    currentAction: caseActionInput.value,
    summary: caseSummaryInput.value,
    details: caseDetailsInput.value,
  };

  try {
    const response = await fetch("/api/main-cases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { id?: number | string; mainCaseRef?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Could not create main case.");
    }

    const newMainCaseId = toNumericId(data.id);
    setStatus(mainCaseStatusEl, `Main case created: ${data.mainCaseRef || "n/a"}`);

    caseSummaryInput.value = "";
    caseDetailsInput.value = "";
    caseActionInput.value = "";

    await Promise.all([
      loadMainCases(newMainCaseId),
      loadEvents(),
    ]);
  } catch (error) {
    setStatus(
      mainCaseStatusEl,
      getErrorMessage(error, "Could not create main case."),
      true,
    );
  }
});

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(eventStatusEl);

  const mainCaseId = toNumericId(mainCaseSelect.value);
  if (!mainCaseId) {
    setStatus(eventStatusEl, "Create a main case first.", true);
    return;
  }

  const payload = {
    mainCaseId,
    time: timeInput.value,
    severity: severityInput.value,
    teamNumber: Number(teamNumberInput.value),
    eventType: eventTypeInput.value,
    summary: summaryInput.value,
    details: detailsInput.value,
    servicesAffected: parseCsv(servicesInput.value),
    hostsAffected: parseCsv(hostsInput.value),
    owners: parseCsv(ownersInput.value),
    tags: parseCsv(tagsInput.value),
  };

  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = (await response.json()) as { caseId?: string; error?: string };
    if (!response.ok) {
      throw new Error(data.error || "Could not create event.");
    }

    setStatus(eventStatusEl, `Sub case event created: ${data.caseId || "n/a"}`);
    summaryInput.value = "";
    detailsInput.value = "";
    servicesInput.value = "";
    hostsInput.value = "";
    ownersInput.value = "";
    tagsInput.value = "";

    syncTimeInput();

    await Promise.all([
      loadCatalogOptions(),
      loadMainCases(mainCaseId),
      loadEvents(),
    ]);
  } catch (error) {
    setStatus(eventStatusEl, getErrorMessage(error, "Could not create event."), true);
  }
});

quickAddForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(catalogStatusEl);

  const type = catalogTypeInput.value as CatalogType;
  const name = catalogNameInput.value.trim();

  if (!name) {
    setStatus(catalogStatusEl, "Value is required.", true);
    return;
  }

  try {
    const response = await fetch(`/api/catalog/${type}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });

    const payload = (await response.json()) as { name?: string; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Could not save value.");
    }

    catalogNameInput.value = "";
    setStatus(catalogStatusEl, `Saved: ${payload.name || name}`);
    await loadCatalogOptions();
  } catch (error) {
    setStatus(catalogStatusEl, getErrorMessage(error, "Could not save value."), true);
  }
});

refreshAllButton.addEventListener("click", async () => {
  setStatus(mainCaseStatusEl);
  setStatus(eventStatusEl);

  try {
    await Promise.all([loadMainCases(), loadEvents()]);
  } catch (error) {
    const message = getErrorMessage(error, "Refresh failed.");
    setStatus(mainCaseStatusEl, message, true);
    setStatus(eventStatusEl, message, true);
  }
});

resetTimeButton.addEventListener("click", syncTimeInput);

eventMainCaseFilter.addEventListener("change", () => {
  void loadEvents().catch((error) => {
    setStatus(eventStatusEl, getErrorMessage(error, "Could not filter events."), true);
  });
});

eventSearchInput.addEventListener("input", () => {
  window.clearTimeout(eventSearchTimer);
  eventSearchTimer = window.setTimeout(() => {
    void loadEvents().catch((error) => {
      setStatus(eventStatusEl, getErrorMessage(error, "Search failed."), true);
    });
  }, 260);
});

caseSearchInput.addEventListener("input", () => {
  window.clearTimeout(caseSearchTimer);
  caseSearchTimer = window.setTimeout(() => {
    void (async () => {
      try {
        await loadMainCases();
        await loadEvents();
      } catch (error) {
        setStatus(
          mainCaseStatusEl,
          getErrorMessage(error, "Main case search failed."),
          true,
        );
      }
    })();
  }, 260);
});

async function init(): Promise<void> {
  syncTimeInput();
  updateHeaderClock();
  window.setInterval(updateHeaderClock, 1000);

  try {
    await Promise.all([loadCatalogOptions(), loadMainCases(), loadEvents()]);
  } catch (error) {
    const message = getErrorMessage(error, "Initial load failed.");
    setStatus(mainCaseStatusEl, message, true);
    setStatus(eventStatusEl, message, true);
  }
}

void init();
