type Severity = "Low" | "Medium" | "High" | "Critical";
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

type OptionsResponse = {
  catalog: {
    owners: string[];
  };
};

type WikiAccessResponse = {
  enabled?: boolean;
  redirectUrl?: string;
  updatedAt?: string | null;
  ok?: boolean;
  error?: string;
};

type CaseTimelineEvent = {
  id: number | string;
  case_id: string;
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

type ChangeSnapshot = {
  caseCount: number;
  latestCaseId: number | null;
  latestCaseCreatedAt: string | null;
  latestCaseUpdatedAt: string | null;
  eventCount: number;
  latestEventId: number | null;
  latestEventCreatedAt: string | null;
  latestEventUpdatedAt: string | null;
};

const CHANGE_POLL_MS = 3000;

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const form = byId<HTMLFormElement>("main-case-form");
const statusEl = byId<HTMLDivElement>("main-case-status");
const casesBody = byId<HTMLDivElement>("main-cases-body");
const adminForm = byId<HTMLFormElement>("reset-db-form");
const adminStatusEl = byId<HTMLDivElement>("admin-status");
const adminPasswordInput = byId<HTMLInputElement>("admin-password");
const resetDbButton = byId<HTMLButtonElement>("reset-db-btn");
const deleteEventsButton = byId<HTMLButtonElement>("delete-events-btn");
const deleteCasesButton = byId<HTMLButtonElement>("delete-cases-btn");
const enableWikiButton = byId<HTMLButtonElement>("enable-wiki-btn");
const disableWikiButton = byId<HTMLButtonElement>("disable-wiki-btn");
const wikiAccessStateEl = byId<HTMLElement>("wiki-access-state");
const adminToggleButton = byId<HTMLButtonElement>("admin-toggle");
const adminPopover = byId<HTMLDivElement>("admin-popover");
const casesLastSyncEl = byId<HTMLSpanElement>("cases-last-sync");
const csvStatusEl = byId<HTMLDivElement>("csv-status");
const importCasesForm = byId<HTMLFormElement>("import-cases-form");
const importEventsForm = byId<HTMLFormElement>("import-events-form");
const importCasesFile = byId<HTMLInputElement>("import-cases-file");
const importEventsFile = byId<HTMLInputElement>("import-events-file");

const caseTeamInput = byId<HTMLSelectElement>("case-team-number");
const caseSeverityInput = byId<HTMLSelectElement>("case-severity");
const caseStatusInput = byId<HTMLSelectElement>("case-status");
const caseOwnerInput = byId<HTMLInputElement>("case-owner");
const caseActionInput = byId<HTMLInputElement>("case-current-action");
const caseSummaryInput = byId<HTMLInputElement>("case-summary");
const caseDetailsInput = byId<HTMLTextAreaElement>("case-details");

const caseSearchInput = byId<HTMLInputElement>("case-search");
const refreshCasesButton = byId<HTMLButtonElement>("refresh-cases");
const caseSeverityFilter = byId<HTMLSelectElement>("case-severity-filter");
const caseTeamFilter = byId<HTMLSelectElement>("case-team-filter");
const caseStatusFilter = byId<HTMLSelectElement>("case-status-filter");
const caseSortBy = byId<HTMLSelectElement>("case-sort-by");
const caseSortDir = byId<HTMLSelectElement>("case-sort-dir");
const caseRefFilter = byId<HTMLInputElement>("case-ref-filter");
const caseOwnerFilter = byId<HTMLInputElement>("case-owner-filter");
const caseSummaryFilter = byId<HTMLInputElement>("case-summary-filter");
const caseDetailsFilter = byId<HTMLInputElement>("case-details-filter");
const caseActionFilter = byId<HTMLInputElement>("case-action-filter");
const caseFirstReportedFromFilter = byId<HTMLInputElement>("case-first-reported-from-filter");
const caseFirstReportedToFilter = byId<HTMLInputElement>("case-first-reported-to-filter");
const caseLastUpdatedFromFilter = byId<HTMLInputElement>("case-last-updated-from-filter");
const caseLastUpdatedToFilter = byId<HTMLInputElement>("case-last-updated-to-filter");
const clearCaseFiltersButton = byId<HTMLButtonElement>("clear-case-filters");

let searchTimer: number | undefined;
let casesSignature = "";
let lastChangeSignature = "";
const timelineLoaded = new Set<number>();
let adminBusy = false;
let wikiEnabled = false;
let wikiRedirectUrl = "http://10.0.255.20:3000";

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setStatus(message = "", isError = false): void {
  statusEl.textContent = message;
  statusEl.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
}

function setCsvStatus(message = "", isError = false): void {
  csvStatusEl.textContent = message;
  csvStatusEl.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function toNumericId(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function parseCsv(raw: string): string[] {
  return raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item, index, all) => {
      const first = all.findIndex((entry) => entry.toLowerCase() === item.toLowerCase());
      return first === index;
    });
}

function compactCaseId(raw: string | null): string {
  if (!raw) {
    return "AUTO";
  }

  const digits = raw.replace(/\D/g, "");
  if (digits.length > 0) {
    return digits.slice(-4).padStart(4, "0");
  }

  const alnum = raw.replace(/[^a-zA-Z0-9]/g, "");
  if (!alnum) {
    return "0000";
  }

  return alnum.slice(-4).toUpperCase();
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

function severityRank(severity: Severity): number {
  switch (severity) {
    case "Low":
      return 1;
    case "Medium":
      return 2;
    case "High":
      return 3;
    case "Critical":
      return 4;
    default:
      return 0;
  }
}

function statusRank(status: MainCaseStatus): number {
  switch (status) {
    case "Triage":
      return 1;
    case "Event":
      return 2;
    case "Incident":
      return 3;
    case "Critical":
      return 4;
    case "Review":
      return 5;
    case "Closed":
      return 6;
    default:
      return 99;
  }
}

function compareByDirection(
  left: string | number,
  right: string | number,
  direction: "asc" | "desc",
): number {
  if (left === right) {
    return 0;
  }

  if (typeof left === "number" && typeof right === "number") {
    return direction === "asc" ? left - right : right - left;
  }

  const comparison = String(left).localeCompare(String(right), undefined, {
    sensitivity: "base",
    numeric: true,
  });
  return direction === "asc" ? comparison : -comparison;
}

function timeValue(value: string | null | undefined): number {
  if (!value) {
    return 0;
  }

  const parsed = new Date(value).valueOf();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortMainCases(mainCases: MainCaseRow[]): MainCaseRow[] {
  const sortBy = caseSortBy.value || "lastUpdated";
  const direction: "asc" | "desc" = caseSortDir.value === "asc" ? "asc" : "desc";
  const output = [...mainCases];

  output.sort((a, b) => {
    switch (sortBy) {
      case "firstReported":
        return compareByDirection(
          timeValue(a.first_reported || a.last_updated),
          timeValue(b.first_reported || b.last_updated),
          direction,
        );
      case "eventCount":
        return compareByDirection(a.event_count || 0, b.event_count || 0, direction);
      case "severity":
        return compareByDirection(severityRank(a.severity), severityRank(b.severity), direction);
      case "teamNumber":
        return compareByDirection(a.team_number || 0, b.team_number || 0, direction);
      case "status":
        return compareByDirection(statusRank(a.status), statusRank(b.status), direction);
      case "caseRef":
        return compareByDirection(a.main_case_ref, b.main_case_ref, direction);
      case "owner":
        return compareByDirection(a.owner, b.owner, direction);
      case "createdAt":
        return compareByDirection(toNumericId(a.id) || 0, toNumericId(b.id) || 0, direction);
      case "lastUpdated":
      default:
        return compareByDirection(
          timeValue(a.last_updated || a.first_reported),
          timeValue(b.last_updated || b.first_reported),
          direction,
        );
    }
  });

  return output;
}

function toCasesSignature(mainCases: MainCaseRow[]): string {
  return JSON.stringify(
    mainCases.map((mainCase) => ({
      id: mainCase.id,
      ref: mainCase.main_case_ref,
      severity: mainCase.severity,
      status: mainCase.status,
      owner: mainCase.owner,
      summary: mainCase.summary,
      details: mainCase.details,
      action: mainCase.current_action,
      firstReported: mainCase.first_reported,
      lastUpdated: mainCase.last_updated,
      eventCount: mainCase.event_count,
    })),
  );
}

function updateCasesLastSync(): void {
  casesLastSyncEl.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
}

function fillOwnerDatalist(values: string[]): void {
  const datalist = byId<HTMLDataListElement>("owners-list");
  datalist.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function renderMainCases(mainCases: MainCaseRow[]): void {
  if (mainCases.length === 0) {
    casesBody.innerHTML = `<div class="entry-empty">No cases found.</div>`;
    return;
  }

  casesBody.innerHTML = mainCases
    .map((mainCase) => {
      const details = mainCase.details?.trim() || "No additional details.";
      const currentAction =
        mainCase.current_action?.trim() || "No current action / next step provided.";
      const summary = mainCase.summary?.trim() || "No summary provided.";
      const shortSummary = summary.length > 120 ? `${summary.slice(0, 120)}...` : summary;
      const caseId = toNumericId(mainCase.id);
      const shortCaseRef = compactCaseId(mainCase.main_case_ref);
      const timelineControls = caseId
        ? `
            <div class="entry-actions timeline-actions">
              <button class="secondary-btn timeline-toggle" type="button" data-case-id="${caseId}">
                View Timeline
              </button>
            </div>
            <div class="case-timeline hidden" id="case-timeline-${caseId}"></div>
          `
        : "";
      const editLink =
        caseId
          ? `<div class="entry-actions"><a class="secondary-btn link-btn" href="/case-edit?id=${caseId}">Edit Case</a></div>`
          : "";

      return `
        <article class="main-case-card">
          <div class="case-head">
            <div>
              <div class="case-ref" title="${escapeHtml(mainCase.main_case_ref)}">CS-${escapeHtml(shortCaseRef)}</div>
              <p class="case-summary">${escapeHtml(shortSummary)}</p>
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
              <div class="meta-label">Events</div>
              <div class="meta-value">${escapeHtml(mainCase.event_count)}</div>
            </div>
          </div>

          <p class="muted"><strong>Owner:</strong> ${escapeHtml(mainCase.owner)}</p>
          <details class="case-more">
            <summary>More detail</summary>
            <p class="muted"><strong>Reference:</strong> ${escapeHtml(mainCase.main_case_ref)}</p>
            <p class="muted"><strong>Current Action:</strong> ${escapeHtml(currentAction)}</p>
            <p class="case-details">${escapeHtml(details)}</p>
            ${timelineControls}
            ${editLink}
          </details>
        </article>
      `;
    })
    .join("");
}

function renderTimelineContext(label: string, values: unknown): string {
  if (!Array.isArray(values) || values.length === 0) {
    return `<div class="timeline-context-line"><strong>${escapeHtml(label)}:</strong> -</div>`;
  }

  const text = values.map((value) => String(value)).join(", ");
  return `<div class="timeline-context-line"><strong>${escapeHtml(label)}:</strong> ${escapeHtml(text)}</div>`;
}

function renderCaseTimeline(target: HTMLDivElement, events: CaseTimelineEvent[]): void {
  if (events.length === 0) {
    target.innerHTML = `<div class="entry-empty">No events in timeline.</div>`;
    return;
  }

  target.innerHTML = `
    <div class="timeline-list">
      ${events
        .map((event) => {
          const details = event.details?.trim() || "No additional details.";
          const shortEventCaseId = compactCaseId(event.case_id);
          return `
            <article class="timeline-item">
              <div class="timeline-dot" aria-hidden="true"></div>
              <div class="timeline-content">
                <div class="timeline-header">
                  <span class="timeline-id" title="${escapeHtml(event.case_id)}">EV-${escapeHtml(shortEventCaseId)}</span>
                  <span class="timeline-time">${escapeHtml(formatDate(event.occurred_at))}</span>
                  <span class="badge ${severityClass(event.severity)}">${escapeHtml(event.severity)}</span>
                  <span class="badge">Team ${escapeHtml(event.team_number)}</span>
                  <span class="badge">${escapeHtml(event.event_type)}</span>
                </div>
                <div class="timeline-summary">${escapeHtml(event.summary)}</div>
                <details class="timeline-more">
                  <summary>More detail</summary>
                  <p class="timeline-details">${escapeHtml(details)}</p>
                  ${renderTimelineContext("Services", event.services)}
                  ${renderTimelineContext("Hosts", event.hosts)}
                  ${renderTimelineContext("Owners", event.owners)}
                  ${renderTimelineContext("Tags", event.tags)}
                </details>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

async function loadCaseTimeline(caseId: number): Promise<CaseTimelineEvent[]> {
  const response = await fetch(`/api/main-cases/${caseId}/timeline`);
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error || "Could not load case timeline.");
  }

  const data = (await response.json()) as { events?: CaseTimelineEvent[] };
  return Array.isArray(data.events) ? data.events : [];
}

async function toggleCaseTimeline(caseId: number, button: HTMLButtonElement): Promise<void> {
  const target = byId<HTMLDivElement>(`case-timeline-${caseId}`);
  const isHidden = target.classList.contains("hidden");

  if (!isHidden) {
    target.classList.add("hidden");
    button.textContent = "View Timeline";
    return;
  }

  target.classList.remove("hidden");
  button.textContent = "Hide Timeline";

  if (timelineLoaded.has(caseId)) {
    return;
  }

  target.innerHTML = `<div class="muted">Loading timeline...</div>`;
  const events = await loadCaseTimeline(caseId);
  renderCaseTimeline(target, events);
  timelineLoaded.add(caseId);
}

async function loadChangeSnapshot(): Promise<ChangeSnapshot> {
  const response = await fetch("/api/changes");
  if (!response.ok) {
    throw new Error("Failed to load change state.");
  }

  return (await response.json()) as ChangeSnapshot;
}

async function addOwnerReusable(values: string[]): Promise<void> {
  await Promise.all(
    values.map(async (name) => {
      const response = await fetch("/api/catalog/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || `Could not add owner: ${name}`);
      }
    }),
  );
}

async function loadOwnerOptions(): Promise<void> {
  const response = await fetch("/api/options");
  if (!response.ok) {
    throw new Error("Failed to load reusable owners.");
  }

  const data = (await response.json()) as OptionsResponse;
  const owners = data.catalog.owners || [];
  fillOwnerDatalist(owners);
}

async function loadMainCases(skipIfUnchanged = false): Promise<void> {
  const params = new URLSearchParams();
  const search = caseSearchInput.value.trim();
  if (search) {
    params.set("search", search);
  }

  if (caseSeverityFilter.value) {
    params.set("severity", caseSeverityFilter.value);
  }

  if (caseTeamFilter.value) {
    params.set("teamNumber", caseTeamFilter.value);
  }

  if (caseStatusFilter.value) {
    params.set("status", caseStatusFilter.value);
  }

  if (caseSortBy.value) {
    params.set("sortBy", caseSortBy.value);
  }

  if (caseSortDir.value) {
    params.set("sortDir", caseSortDir.value);
  }

  if (caseRefFilter.value.trim()) {
    params.set("caseRef", caseRefFilter.value.trim());
  }

  if (caseOwnerFilter.value.trim()) {
    params.set("owner", caseOwnerFilter.value.trim());
  }

  if (caseSummaryFilter.value.trim()) {
    params.set("summary", caseSummaryFilter.value.trim());
  }

  if (caseDetailsFilter.value.trim()) {
    params.set("details", caseDetailsFilter.value.trim());
  }

  if (caseActionFilter.value.trim()) {
    params.set("currentAction", caseActionFilter.value.trim());
  }

  if (caseFirstReportedFromFilter.value) {
    params.set("firstReportedFrom", caseFirstReportedFromFilter.value);
  }

  if (caseFirstReportedToFilter.value) {
    params.set("firstReportedTo", caseFirstReportedToFilter.value);
  }

  if (caseLastUpdatedFromFilter.value) {
    params.set("lastUpdatedFrom", caseLastUpdatedFromFilter.value);
  }

  if (caseLastUpdatedToFilter.value) {
    params.set("lastUpdatedTo", caseLastUpdatedToFilter.value);
  }

  const endpoint = params.toString()
    ? `/api/main-cases?${params.toString()}`
    : "/api/main-cases";

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to load cases.");
  }

  const data = (await response.json()) as { mainCases?: MainCaseRow[] };
  const mainCases = sortMainCases(Array.isArray(data.mainCases) ? data.mainCases : []);
  const nextSignature = toCasesSignature(mainCases);

  if (skipIfUnchanged && nextSignature === casesSignature) {
    return;
  }

  casesSignature = nextSignature;
  timelineLoaded.clear();
  renderMainCases(mainCases);
}

async function refreshLiveCases(force = false): Promise<void> {
  await loadMainCases(!force);
  updateCasesLastSync();
}

async function checkForRemoteChanges(): Promise<void> {
  const snapshot = await loadChangeSnapshot();
  const nextSignature = JSON.stringify(snapshot);

  if (!lastChangeSignature) {
    lastChangeSignature = nextSignature;
    return;
  }

  if (nextSignature === lastChangeSignature) {
    return;
  }

  lastChangeSignature = nextSignature;
  await refreshLiveCases(true);
}

async function handleAddOwnerFromButton(button: HTMLButtonElement): Promise<void> {
  const inputId = button.dataset.addInput;
  const type = button.dataset.addType;
  if (!inputId || type !== "owners") {
    return;
  }

  const input = byId<HTMLInputElement>(inputId);
  const values = parseCsv(input.value);
  if (values.length === 0) {
    setStatus("Enter owner value first.", true);
    return;
  }

  try {
    await addOwnerReusable(values);
    await loadOwnerOptions();
    setStatus(`${values.length} owner value(s) added to reusable list.`);
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not add reusable owner."), true);
  }
}

function bindAddOwnerButtons(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".add-chip"));
  for (const button of buttons) {
    button.addEventListener("click", () => {
      void handleAddOwnerFromButton(button);
    });
  }
}

function bindAdminPopover(): void {
  adminToggleButton.addEventListener("click", () => {
    adminPopover.classList.toggle("hidden");
  });

  document.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) {
      return;
    }

    if (target.closest("#admin-toggle") || target.closest("#admin-popover")) {
      return;
    }

    adminPopover.classList.add("hidden");
  });
}

function applyAdminButtonState(): void {
  resetDbButton.disabled = adminBusy;
  deleteEventsButton.disabled = adminBusy;
  deleteCasesButton.disabled = adminBusy;
  enableWikiButton.disabled = adminBusy || wikiEnabled;
  disableWikiButton.disabled = adminBusy || !wikiEnabled;
}

function setAdminBusy(disabled: boolean): void {
  adminBusy = disabled;
  applyAdminButtonState();
}

function renderWikiAccessState(enabled: boolean, redirectUrl: string): void {
  wikiEnabled = enabled;
  wikiRedirectUrl = redirectUrl || wikiRedirectUrl;
  wikiAccessStateEl.textContent = enabled ? "Activated" : "Deactivated";
  wikiAccessStateEl.className = `admin-wiki-state ${
    enabled ? "is-enabled" : "is-disabled"
  }`;
  wikiAccessStateEl.title = enabled
    ? "Wiki is currently active."
    : `Wiki redirects to ${wikiRedirectUrl}`;
  applyAdminButtonState();
}

async function loadWikiAccessState(): Promise<void> {
  const response = await fetch("/api/admin/wiki-access");
  const payload = (await response.json()) as WikiAccessResponse;
  if (!response.ok) {
    throw new Error(payload.error || "Could not load wiki access state.");
  }

  renderWikiAccessState(payload.enabled === true, payload.redirectUrl || wikiRedirectUrl);
}

async function toggleWikiAccess(enabled: boolean): Promise<void> {
  adminStatusEl.className = "status";
  adminStatusEl.textContent = "";

  const password = adminPasswordInput.value.trim();
  if (!password) {
    adminStatusEl.className = "status error";
    adminStatusEl.textContent = "Admin password is required.";
    return;
  }

  const question = enabled
    ? "Activate wiki access?"
    : `Deactivate wiki access and redirect /wiki to ${wikiRedirectUrl}?`;
  if (!window.confirm(question)) {
    return;
  }

  setAdminBusy(true);
  try {
    const response = await fetch("/api/admin/wiki-access", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password, enabled }),
    });
    const payload = (await response.json()) as WikiAccessResponse;
    if (!response.ok) {
      throw new Error(payload.error || "Could not update wiki access state.");
    }

    adminPasswordInput.value = "";
    renderWikiAccessState(payload.enabled === true, payload.redirectUrl || wikiRedirectUrl);
    adminStatusEl.className = "status ok";
    adminStatusEl.textContent =
      payload.enabled === true ? "Wiki activated." : "Wiki deactivated.";
  } catch (error) {
    adminStatusEl.className = "status error";
    adminStatusEl.textContent = getErrorMessage(error, "Admin action failed.");
  } finally {
    setAdminBusy(false);
  }
}

async function runAdminAction(
  endpoint: string,
  confirmationText: string,
  successText: string,
): Promise<void> {
  adminStatusEl.className = "status";
  adminStatusEl.textContent = "";

  const password = adminPasswordInput.value.trim();
  if (!password) {
    adminStatusEl.className = "status error";
    adminStatusEl.textContent = "Admin password is required.";
    return;
  }

  if (!window.confirm(confirmationText)) {
    return;
  }

  setAdminBusy(true);
  try {
    const response = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });

    const payload = (await response.json()) as { ok?: boolean; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Admin action failed.");
    }

    adminPasswordInput.value = "";
    adminStatusEl.className = "status ok";
    adminStatusEl.textContent = successText;
    adminPopover.classList.add("hidden");

    await Promise.all([loadMainCases(), loadOwnerOptions()]);
    const snapshot = await loadChangeSnapshot();
    lastChangeSignature = JSON.stringify(snapshot);
    updateCasesLastSync();
    await loadWikiAccessState();
  } catch (error) {
    adminStatusEl.className = "status error";
    adminStatusEl.textContent = getErrorMessage(error, "Admin action failed.");
  } finally {
    setAdminBusy(false);
  }
}

async function readFileAsText(file: File): Promise<string> {
  return await file.text();
}

async function importCsv(endpoint: string, file: File): Promise<string> {
  const csvText = await readFileAsText(file);
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "text/csv; charset=utf-8" },
    body: csvText,
  });

  const payload = (await response.json()) as Record<string, unknown> & { error?: string };
  if (!response.ok) {
    throw new Error(payload.error || "CSV import failed.");
  }

  const parts: string[] = [];
  if (typeof payload.imported === "number") {
    parts.push(`imported: ${payload.imported}`);
  }
  if (typeof payload.updated === "number") {
    parts.push(`updated: ${payload.updated}`);
  }
  if (typeof payload.skipped === "number") {
    parts.push(`skipped: ${payload.skipped}`);
  }

  return parts.join(", ") || "Import complete.";
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus();

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

    const result = (await response.json()) as {
      id?: number | string;
      mainCaseRef?: string;
      error?: string;
    };

    if (!response.ok) {
      throw new Error(result.error || "Could not create case.");
    }

    setStatus(`Case created: ${result.mainCaseRef || "n/a"}`);

    caseSummaryInput.value = "";
    caseDetailsInput.value = "";
    caseActionInput.value = "";

    await Promise.all([loadMainCases(), loadOwnerOptions()]);
    const snapshot = await loadChangeSnapshot();
    lastChangeSignature = JSON.stringify(snapshot);
    updateCasesLastSync();
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not create case."), true);
  }
});

adminForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  await runAdminAction(
    "/api/admin/reset-database",
    "This will delete all cases, events, and reusable values. Continue?",
    "Database reset complete.",
  );
});

deleteEventsButton.addEventListener("click", () => {
  void runAdminAction(
    "/api/admin/delete-events",
    "This will delete all events. Cases and reusable values stay. Continue?",
    "All events deleted.",
  );
});

deleteCasesButton.addEventListener("click", () => {
  void runAdminAction(
    "/api/admin/delete-cases",
    "This will delete all cases and events. Reusable values stay. Continue?",
    "All cases and events deleted.",
  );
});

enableWikiButton.addEventListener("click", () => {
  void toggleWikiAccess(true);
});

disableWikiButton.addEventListener("click", () => {
  void toggleWikiAccess(false);
});

refreshCasesButton.addEventListener("click", () => {
  void refreshLiveCases(true)
    .then(async () => {
      const snapshot = await loadChangeSnapshot();
      lastChangeSignature = JSON.stringify(snapshot);
    })
    .catch((error) => {
      setStatus(getErrorMessage(error, "Refresh failed."), true);
    });
});

casesBody.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>(".timeline-toggle");
  if (!button) {
    return;
  }

  const caseId = toNumericId(button.dataset.caseId);
  if (!caseId) {
    return;
  }

  void toggleCaseTimeline(caseId, button).catch((error) => {
    setStatus(getErrorMessage(error, "Could not load timeline."), true);
  });
});

function triggerCaseFilterLoad(): void {
  void loadMainCases()
    .then(() => {
      updateCasesLastSync();
    })
    .catch((error) => {
      setStatus(getErrorMessage(error, "Filter failed."), true);
    });
}

const caseSelectFilters: HTMLSelectElement[] = [
  caseSeverityFilter,
  caseTeamFilter,
  caseStatusFilter,
  caseSortBy,
  caseSortDir,
];

for (const select of caseSelectFilters) {
  select.addEventListener("change", triggerCaseFilterLoad);
}

const caseTextFilters: HTMLInputElement[] = [
  caseSearchInput,
  caseRefFilter,
  caseOwnerFilter,
  caseSummaryFilter,
  caseDetailsFilter,
  caseActionFilter,
  caseFirstReportedFromFilter,
  caseFirstReportedToFilter,
  caseLastUpdatedFromFilter,
  caseLastUpdatedToFilter,
];

for (const input of caseTextFilters) {
  const eventName = input.type === "datetime-local" ? "change" : "input";
  input.addEventListener(eventName, () => {
    window.clearTimeout(searchTimer);
    searchTimer = window.setTimeout(() => {
      triggerCaseFilterLoad();
    }, 220);
  });
}

clearCaseFiltersButton.addEventListener("click", () => {
  caseSearchInput.value = "";
  caseSeverityFilter.value = "";
  caseTeamFilter.value = "";
  caseStatusFilter.value = "";
  caseSortBy.value = "lastUpdated";
  caseSortDir.value = "desc";
  caseRefFilter.value = "";
  caseOwnerFilter.value = "";
  caseSummaryFilter.value = "";
  caseDetailsFilter.value = "";
  caseActionFilter.value = "";
  caseFirstReportedFromFilter.value = "";
  caseFirstReportedToFilter.value = "";
  caseLastUpdatedFromFilter.value = "";
  caseLastUpdatedToFilter.value = "";
  triggerCaseFilterLoad();
});

importCasesForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setCsvStatus();

  const file = importCasesFile.files?.[0];
  if (!file) {
    setCsvStatus("Select a CSV file for cases import.", true);
    return;
  }

  void importCsv("/api/import/cases.csv", file)
    .then(async (message) => {
      setCsvStatus(`Cases CSV import complete (${message}).`);
      importCasesFile.value = "";
      await refreshLiveCases(true);
      const snapshot = await loadChangeSnapshot();
      lastChangeSignature = JSON.stringify(snapshot);
    })
    .catch((error) => {
      setCsvStatus(getErrorMessage(error, "Could not import cases CSV."), true);
    });
});

importEventsForm.addEventListener("submit", (event) => {
  event.preventDefault();
  setCsvStatus();

  const file = importEventsFile.files?.[0];
  if (!file) {
    setCsvStatus("Select a CSV file for events import.", true);
    return;
  }

  void importCsv("/api/import/events.csv", file)
    .then(async (message) => {
      setCsvStatus(`Events CSV import complete (${message}).`);
      importEventsFile.value = "";
      await refreshLiveCases(true);
      const snapshot = await loadChangeSnapshot();
      lastChangeSignature = JSON.stringify(snapshot);
    })
    .catch((error) => {
      setCsvStatus(getErrorMessage(error, "Could not import events CSV."), true);
    });
});

async function init(): Promise<void> {
  bindAddOwnerButtons();
  bindAdminPopover();
  applyAdminButtonState();
  try {
    await Promise.all([loadOwnerOptions(), loadMainCases(), loadWikiAccessState()]);
    const snapshot = await loadChangeSnapshot();
    lastChangeSignature = JSON.stringify(snapshot);
    updateCasesLastSync();
  } catch (error) {
    setStatus(getErrorMessage(error, "Initial load failed."), true);
  }

  window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    void checkForRemoteChanges().catch(() => {
      // Polling should stay silent unless user triggers manual action.
    });
  }, CHANGE_POLL_MS);
}

void init();
