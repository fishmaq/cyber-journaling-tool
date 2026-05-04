type Severity = "Low" | "Medium" | "High" | "Critical";
type CatalogType = "services" | "hosts" | "owners" | "tags";

type MainCaseRow = {
  id: number | string;
  main_case_ref: string;
  summary: string;
};

type JournalEvent = {
  id: number | string;
  case_id: string;
  main_case_id: number | string | null;
  main_case_ref: string | null;
  occurred_at: string;
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

type NetworkTopologyDevice = {
  name: string;
  type?: string;
  team?: string;
  teamNumber?: number | null;
};

type NetworkTopologyResponse = {
  devices?: NetworkTopologyDevice[];
  error?: string;
};

type CreateEventResponse = {
  caseId: string;
  eventId: number;
  mainCaseId: number;
  mainCaseRef: string;
  autoCreatedMainCase: boolean;
  error?: string;
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
type DeviceStatusAction =
  | ""
  | "out"
  | "compromised"
  | "outCompromised"
  | "upAgain"
  | "clean"
  | "upAgainClean";

const CHANGE_POLL_MS = 3000;
const NETWORK_HOST_REFRESH_MS = 30000;

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const eventForm = byId<HTMLFormElement>("event-form");
const quickAddForm = byId<HTMLFormElement>("quick-add-form");
const quickDeleteForm = byId<HTMLFormElement>("quick-delete-form");
const eventsBody = byId<HTMLDivElement>("events-body");

const eventStatusEl = byId<HTMLDivElement>("event-status");
const catalogStatusEl = byId<HTMLDivElement>("catalog-status");

const headerClock = byId<HTMLElement>("header-clock");
const resetTimeButton = byId<HTMLButtonElement>("reset-time");
const refreshEventsButton = byId<HTMLButtonElement>("refresh-events");
const eventsLastSyncEl = byId<HTMLSpanElement>("events-last-sync");

const mainCaseSelect = byId<HTMLSelectElement>("main-case-id");
const allowAutoCaseCreateInput = byId<HTMLInputElement>("allow-auto-case-create");
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
const deviceStatusActionInput = byId<HTMLSelectElement>("device-status-action");

const eventSearchInput = byId<HTMLInputElement>("event-search");
const eventMainCaseFilter = byId<HTMLSelectElement>("event-main-case-filter");
const eventSeverityFilter = byId<HTMLSelectElement>("event-severity-filter");
const eventTeamFilter = byId<HTMLSelectElement>("event-team-filter");
const eventTypeFilter = byId<HTMLSelectElement>("event-type-filter");
const eventSortBy = byId<HTMLSelectElement>("event-sort-by");
const eventSortDir = byId<HTMLSelectElement>("event-sort-dir");
const eventCaseIdFilter = byId<HTMLInputElement>("event-case-id-filter");
const eventCaseRefFilter = byId<HTMLInputElement>("event-case-ref-filter");
const eventSummaryFilter = byId<HTMLInputElement>("event-summary-filter");
const eventDetailsFilter = byId<HTMLInputElement>("event-details-filter");
const eventServiceFilter = byId<HTMLInputElement>("event-service-filter");
const eventHostFilter = byId<HTMLInputElement>("event-host-filter");
const eventOwnerFilter = byId<HTMLInputElement>("event-owner-filter");
const eventTagFilter = byId<HTMLInputElement>("event-tag-filter");
const eventTimeFromFilter = byId<HTMLInputElement>("event-time-from-filter");
const eventTimeToFilter = byId<HTMLInputElement>("event-time-to-filter");
const clearEventFiltersButton = byId<HTMLButtonElement>("clear-event-filters");

const catalogTypeInput = byId<HTMLSelectElement>("catalog-type");
const catalogNameInput = byId<HTMLInputElement>("catalog-name");
const catalogDeleteTypeInput = byId<HTMLSelectElement>("catalog-delete-type");
const catalogDeleteNameInput = byId<HTMLSelectElement>("catalog-delete-name");

let mainCasesCache: MainCaseRow[] = [];
let eventSearchTimer: number | undefined;
let mainCasesSignature = "";
let eventsSignature = "";
let lastChangeSignature = "";
let catalogValuesCache: Record<CatalogType, string[]> = {
  services: [],
  hosts: [],
  owners: [],
  tags: [],
};
let networkHostSuggestions: string[] = [];
let networkHostAliasesByTeam: Record<1 | 2, Map<string, string | null>> = {
  1: new Map<string, string | null>(),
  2: new Map<string, string | null>(),
};
const DEVICE_STATUS_TAGS: Record<Exclude<DeviceStatusAction, "">, string[]> = {
  out: ["out", "offline"],
  compromised: ["compromised", "breach"],
  outCompromised: ["out", "offline", "compromised", "breach"],
  upAgain: ["online", "restored"],
  clean: ["clean", "remediated"],
  upAgainClean: ["online", "restored", "clean", "remediated"],
};

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setStatus(target: HTMLDivElement, message = "", isError = false): void {
  target.textContent = message;
  target.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
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
      const first = all.findIndex((entry) => entry.toLowerCase() === item.toLowerCase());
      return first === index;
    });
}

function normalizeDeviceStatusAction(value: string): DeviceStatusAction {
  if (
    value === "out" ||
    value === "compromised" ||
    value === "outCompromised" ||
    value === "upAgain" ||
    value === "clean" ||
    value === "upAgainClean"
  ) {
    return value;
  }

  return "";
}

function applyDeviceStatusTags(
  tags: string[],
  action: DeviceStatusAction,
): string[] {
  if (!action) {
    return tags;
  }

  const additions = DEVICE_STATUS_TAGS[action] ?? [];
  if (additions.length === 0) {
    return tags;
  }

  const output = [...tags];
  const seen = new Set(output.map((tag) => tag.toLowerCase()));
  for (const tag of additions) {
    const normalized = tag.toLowerCase();
    if (seen.has(normalized)) {
      continue;
    }
    seen.add(normalized);
    output.push(tag);
  }

  return output;
}

function mergeUniqueCaseInsensitive(values: string[]): string[] {
  const output: string[] = [];
  const seen = new Set<string>();
  for (const value of values) {
    const normalized = value.trim();
    if (!normalized) {
      continue;
    }
    const key = normalized.toLowerCase();
    if (seen.has(key)) {
      continue;
    }
    seen.add(key);
    output.push(normalized);
  }

  return output;
}

function parseTeamNumberFromLabel(value: string | null | undefined): 1 | 2 | null {
  const normalized = (value ?? "").trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (
    normalized === "1" ||
    normalized === "team1" ||
    normalized === "team 1" ||
    normalized === "t1"
  ) {
    return 1;
  }
  if (
    normalized === "2" ||
    normalized === "team2" ||
    normalized === "team 2" ||
    normalized === "t2"
  ) {
    return 2;
  }

  return null;
}

function parseDeviceTeamNumber(device: NetworkTopologyDevice): 1 | 2 | null {
  if (device.teamNumber === 1 || device.teamNumber === 2) {
    return device.teamNumber;
  }

  return parseTeamNumberFromLabel(device.team);
}

function isDnsName(value: string): boolean {
  return value.trim().toLowerCase() === "dns";
}

function isWinWorkstationShortAlias(value: string): boolean {
  return /^winws\d+$/i.test(value.trim());
}

function refreshHostFieldOptions(): void {
  const hostValues = mergeUniqueCaseInsensitive([
    ...catalogValuesCache.hosts,
    ...networkHostSuggestions,
  ]).filter((value) => !isDnsName(value) && !isWinWorkstationShortAlias(value));
  fillDatalist("hosts-list", hostValues);
}

function resolveHostAliases(hostValues: string[], teamNumber: number): string[] {
  const team = teamNumber === 1 || teamNumber === 2 ? (teamNumber as 1 | 2) : 1;
  const aliasMap = networkHostAliasesByTeam[team];
  const resolved: string[] = hostValues.map((host) => {
    const key = host.trim().toLowerCase();
    const mapped = aliasMap.get(key);
    if (typeof mapped === "string" && mapped.trim()) {
      return mapped;
    }
    return host;
  });

  return mergeUniqueCaseInsensitive(resolved);
}

function appendCsvValue(raw: string, value: string): string {
  const values = parseCsv(raw);
  const exists = values.some((entry) => entry.toLowerCase() === value.toLowerCase());
  if (!exists) {
    values.push(value);
  }

  return values.join(", ");
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

function fillDatalist(id: string, values: string[]): void {
  const element = byId<HTMLDataListElement>(id);
  element.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function fillSelectOptions(
  select: HTMLSelectElement,
  values: string[],
  emptyLabel: string,
): void {
  const previous = select.value;
  const options = values
    .slice(0, 250)
    .map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`)
    .join("");

  select.innerHTML = `<option value="">${escapeHtml(emptyLabel)}</option>${options}`;
  if (previous && values.includes(previous)) {
    select.value = previous;
  }
}

function refreshDeleteValueOptions(): void {
  const type = catalogDeleteTypeInput.value as CatalogType;
  const values = catalogValuesCache[type] || [];
  fillSelectOptions(catalogDeleteNameInput, values, "Select value to delete...");
}

function mainCaseLabel(mainCase: MainCaseRow): string {
  const summary = mainCase.summary?.trim() || "No summary";
  const shortSummary = summary.length > 40 ? `${summary.slice(0, 40)}...` : summary;
  return `${mainCase.main_case_ref} | ${shortSummary}`;
}

function toMainCasesSignature(mainCases: MainCaseRow[]): string {
  return JSON.stringify(
    mainCases.map((mainCase) => ({
      id: toNumericId(mainCase.id),
      ref: mainCase.main_case_ref,
      summary: mainCase.summary,
    })),
  );
}

function normalizeTags(values: string[]): string[] {
  return [...values].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));
}

function toEventsSignature(events: JournalEvent[]): string {
  return JSON.stringify(
    events.map((event) => ({
      id: toNumericId(event.id),
      mainCaseId: toNumericId(event.main_case_id),
      ref: event.main_case_ref,
      occurredAt: event.occurred_at,
      severity: event.severity,
      team: event.team_number,
      eventType: event.event_type,
      summary: event.summary,
      details: event.details,
      services: normalizeTags(event.services),
      hosts: normalizeTags(event.hosts),
      owners: normalizeTags(event.owners),
      tags: normalizeTags(event.tags),
    })),
  );
}

function updateEventsLastSync(): void {
  eventsLastSyncEl.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
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

function sortEvents(events: JournalEvent[]): JournalEvent[] {
  const sortBy = eventSortBy.value || "createdAt";
  const direction: "asc" | "desc" = eventSortDir.value === "asc" ? "asc" : "desc";
  const output = [...events];

  output.sort((a, b) => {
    switch (sortBy) {
      case "occurredAt":
        return compareByDirection(
          timeValue(a.occurred_at),
          timeValue(b.occurred_at),
          direction,
        );
      case "severity":
        return compareByDirection(severityRank(a.severity), severityRank(b.severity), direction);
      case "teamNumber":
        return compareByDirection(a.team_number, b.team_number, direction);
      case "eventType":
        return compareByDirection(a.event_type, b.event_type, direction);
      case "caseId":
        return compareByDirection(a.case_id, b.case_id, direction);
      case "caseRef":
        return compareByDirection(a.main_case_ref || "", b.main_case_ref || "", direction);
      case "summary":
        return compareByDirection(a.summary, b.summary, direction);
      case "createdAt":
      default:
        return compareByDirection(toNumericId(a.id) || 0, toNumericId(b.id) || 0, direction);
    }
  });

  return output;
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

function populateMainCaseSelects(preferredMainCaseId: number | null = null): void {
  const selectedCreateCaseId = toNumericId(mainCaseSelect.value);
  const selectedFilterCaseId = toNumericId(eventMainCaseFilter.value);

  const createOptions = mainCasesCache
    .map((mainCase) => {
      const id = toNumericId(mainCase.id);
      if (!id) {
        return "";
      }

      return `<option value="${id}">${escapeHtml(mainCaseLabel(mainCase))}</option>`;
    })
    .join("");

  mainCaseSelect.innerHTML =
    `<option value="">Select existing case...</option>${createOptions}`;
  eventMainCaseFilter.innerHTML =
    `<option value="">All Cases</option>${createOptions}`;

  if (
    preferredMainCaseId &&
    mainCasesCache.some((mainCase) => toNumericId(mainCase.id) === preferredMainCaseId)
  ) {
    mainCaseSelect.value = String(preferredMainCaseId);
  } else if (
    selectedCreateCaseId &&
    mainCasesCache.some((mainCase) => toNumericId(mainCase.id) === selectedCreateCaseId)
  ) {
    mainCaseSelect.value = String(selectedCreateCaseId);
  }

  if (
    selectedFilterCaseId &&
    mainCasesCache.some((mainCase) => toNumericId(mainCase.id) === selectedFilterCaseId)
  ) {
    eventMainCaseFilter.value = String(selectedFilterCaseId);
  }
}

function renderEvents(events: JournalEvent[]): void {
  if (events.length === 0) {
    eventsBody.innerHTML = `<div class="entry-empty">No events found.</div>`;
    return;
  }

  eventsBody.innerHTML = events
    .map((event) => {
      const eventId = toNumericId(event.id);
      const details = event.details?.trim() || "No additional details.";
      const mainCaseRef = event.main_case_ref || "Auto-generated";
      const shortEventId = compactCaseId(event.case_id);
      const shortMainCaseId = compactCaseId(event.main_case_ref);
      const editLink = eventId
        ? `<div class="entry-actions"><a class="secondary-btn link-btn" href="/event-edit?id=${eventId}">Edit Event</a></div>`
        : "";

      return `
        <article class="entry-card">
          <div class="entry-head">
            <div>
              <div class="entry-case" title="${escapeHtml(event.case_id)}">EV-${escapeHtml(shortEventId)}</div>
              <div class="muted">${escapeHtml(formatDate(event.occurred_at))}</div>
              <div class="muted"><strong>Case:</strong> <span title="${escapeHtml(mainCaseRef)}">CS-${escapeHtml(shortMainCaseId)}</span></div>
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

async function addCatalogValues(type: CatalogType, values: string[]): Promise<number> {
  if (values.length === 0) {
    return 0;
  }

  let saved = 0;
  await Promise.all(
    values.map(async (name) => {
      const response = await fetch(`/api/catalog/${type}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error || `Could not add value: ${name}`);
      }

      saved += 1;
    }),
  );

  return saved;
}

async function deleteCatalogValue(type: CatalogType, name: string): Promise<void> {
  const response = await fetch(`/api/catalog/${type}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });

  const raw = await response.text();
  let payload: { error?: string } = {};
  if (raw) {
    try {
      payload = JSON.parse(raw) as { error?: string };
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    if (response.status === 404 && raw.trim().toLowerCase() === "not found") {
      throw new Error("Delete endpoint not available. Restart the backend server and try again.");
    }

    throw new Error(payload.error || raw || `Could not delete value: ${name}`);
  }
}

async function loadNetworkHostSuggestions(silent = true): Promise<void> {
  try {
    const response = await fetch("/api/network/topology");
    if (!response.ok) {
      throw new Error("Could not load network host suggestions.");
    }

    const payload = (await response.json()) as NetworkTopologyResponse;
    const devices = Array.isArray(payload.devices) ? payload.devices : [];
    const nextSuggestions: string[] = [];
    const nextAliasesByTeam: Record<1 | 2, Map<string, string | null>> = {
      1: new Map<string, string | null>(),
      2: new Map<string, string | null>(),
    };
    const registerAlias = (team: 1 | 2, alias: string, canonical: string): void => {
      const key = alias.trim().toLowerCase();
      if (!key) {
        return;
      }
      const existing = nextAliasesByTeam[team].get(key);
      if (existing === undefined) {
        nextAliasesByTeam[team].set(key, canonical);
        return;
      }
      if (existing && existing.toLowerCase() !== canonical.toLowerCase()) {
        nextAliasesByTeam[team].set(key, null);
      }
    };

    for (const device of devices) {
      const name = typeof device.name === "string" ? device.name.trim() : "";
      if (!name) {
        continue;
      }
      if (String(device.type || "").trim().toLowerCase() === "internet") {
        continue;
      }
      if (isDnsName(name)) {
        continue;
      }

      nextSuggestions.push(name);

      const teamNumber = parseDeviceTeamNumber(device);
      if (teamNumber) {
        registerAlias(teamNumber, name, name);
      }
    }

    networkHostSuggestions = mergeUniqueCaseInsensitive(nextSuggestions);
    networkHostAliasesByTeam = nextAliasesByTeam;
    refreshHostFieldOptions();
  } catch (error) {
    if (!silent) {
      setStatus(
        catalogStatusEl,
        getErrorMessage(error, "Could not load network host suggestions."),
        true,
      );
    }
  }
}

async function loadCatalogOptions(): Promise<void> {
  const response = await fetch("/api/options");
  if (!response.ok) {
    throw new Error("Failed to load reusable values.");
  }

  const data = (await response.json()) as OptionsResponse;
  catalogValuesCache = {
    services: data.catalog.services || [],
    hosts: data.catalog.hosts || [],
    owners: data.catalog.owners || [],
    tags: data.catalog.tags || [],
  };

  fillDatalist("services-list", catalogValuesCache.services);
  refreshHostFieldOptions();
  fillDatalist("owners-list", catalogValuesCache.owners);
  fillDatalist("tags-list", catalogValuesCache.tags);
  refreshDeleteValueOptions();
}

async function loadMainCases(
  preferredMainCaseId: number | null = null,
  skipIfUnchanged = false,
): Promise<void> {
  const response = await fetch("/api/main-cases");
  if (!response.ok) {
    throw new Error("Failed to load cases.");
  }

  const data = (await response.json()) as { mainCases?: MainCaseRow[] };
  const fetchedMainCases = Array.isArray(data.mainCases) ? data.mainCases : [];
  const nextSignature = toMainCasesSignature(fetchedMainCases);

  if (skipIfUnchanged && preferredMainCaseId === null && nextSignature === mainCasesSignature) {
    return;
  }

  mainCasesSignature = nextSignature;
  mainCasesCache = fetchedMainCases;
  populateMainCaseSelects(preferredMainCaseId);
}

async function loadEvents(skipIfUnchanged = false): Promise<void> {
  const params = new URLSearchParams();
  const search = eventSearchInput.value.trim();
  if (search) {
    params.set("search", search);
  }

  const filterMainCaseId = toNumericId(eventMainCaseFilter.value);
  if (filterMainCaseId) {
    params.set("mainCaseId", String(filterMainCaseId));
  }

  if (eventSeverityFilter.value) {
    params.set("severity", eventSeverityFilter.value);
  }

  if (eventTeamFilter.value) {
    params.set("teamNumber", eventTeamFilter.value);
  }

  if (eventTypeFilter.value) {
    params.set("eventType", eventTypeFilter.value);
  }

  if (eventSortBy.value) {
    params.set("sortBy", eventSortBy.value);
  }

  if (eventSortDir.value) {
    params.set("sortDir", eventSortDir.value);
  }

  if (eventCaseIdFilter.value.trim()) {
    params.set("caseId", eventCaseIdFilter.value.trim());
  }

  if (eventCaseRefFilter.value.trim()) {
    params.set("caseRef", eventCaseRefFilter.value.trim());
  }

  if (eventSummaryFilter.value.trim()) {
    params.set("summary", eventSummaryFilter.value.trim());
  }

  if (eventDetailsFilter.value.trim()) {
    params.set("details", eventDetailsFilter.value.trim());
  }

  if (eventServiceFilter.value.trim()) {
    params.set("service", eventServiceFilter.value.trim());
  }

  if (eventHostFilter.value.trim()) {
    params.set("host", eventHostFilter.value.trim());
  }

  if (eventOwnerFilter.value.trim()) {
    params.set("owner", eventOwnerFilter.value.trim());
  }

  if (eventTagFilter.value.trim()) {
    params.set("tag", eventTagFilter.value.trim());
  }

  if (eventTimeFromFilter.value) {
    params.set("timeFrom", eventTimeFromFilter.value);
  }

  if (eventTimeToFilter.value) {
    params.set("timeTo", eventTimeToFilter.value);
  }

  const endpoint = params.toString()
    ? `/api/events?${params.toString()}`
    : "/api/events";

  const response = await fetch(endpoint);
  if (!response.ok) {
    throw new Error("Failed to load events.");
  }

  const data = (await response.json()) as { events?: JournalEvent[] };
  const events = sortEvents(Array.isArray(data.events) ? data.events : []);
  const nextSignature = toEventsSignature(events);

  if (skipIfUnchanged && nextSignature === eventsSignature) {
    return;
  }

  eventsSignature = nextSignature;
  renderEvents(events);
}

async function loadChangeSnapshot(): Promise<ChangeSnapshot> {
  const response = await fetch("/api/changes");
  if (!response.ok) {
    throw new Error("Failed to load change state.");
  }

  return (await response.json()) as ChangeSnapshot;
}

async function refreshLiveData(force = false): Promise<void> {
  await Promise.all([loadMainCases(null, !force), loadEvents(!force)]);
  updateEventsLastSync();
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
  await refreshLiveData(true);
}

async function handleAddReusableFromButton(button: HTMLButtonElement): Promise<void> {
  const inputId = button.dataset.addInput;
  const type = button.dataset.addType as CatalogType | undefined;

  if (!inputId || !type) {
    return;
  }

  const input = byId<HTMLInputElement>(inputId);
  const values = parseCsv(input.value);
  if (values.length === 0) {
    setStatus(catalogStatusEl, "Enter one or more values first.", true);
    return;
  }

  try {
    const savedCount = await addCatalogValues(type, values);
    await loadCatalogOptions();
    setStatus(catalogStatusEl, `${savedCount} value(s) added to reusable ${type}.`);
  } catch (error) {
    setStatus(
      catalogStatusEl,
      getErrorMessage(error, "Could not add reusable values."),
      true,
    );
  }
}

function bindAddReusableButtons(): void {
  const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>(".add-chip"));
  for (const button of buttons) {
    button.addEventListener("click", () => {
      void handleAddReusableFromButton(button);
    });
  }
}

eventForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(eventStatusEl);

  const selectedMainCaseId = toNumericId(mainCaseSelect.value);
  if (!selectedMainCaseId && !allowAutoCaseCreateInput.checked) {
    setStatus(
      eventStatusEl,
      "Select a case or enable \"Create new case if no case is selected\".",
      true,
    );
    return;
  }

  const rawHostsAffected = parseCsv(hostsInput.value);
  const deviceStatusAction = normalizeDeviceStatusAction(deviceStatusActionInput.value);
  if (deviceStatusAction && rawHostsAffected.length === 0) {
    setStatus(
      eventStatusEl,
      "Add at least one host when using a device status marker.",
      true,
    );
    return;
  }

  const teamNumber = Number(teamNumberInput.value);
  const hostsAffected = resolveHostAliases(rawHostsAffected, teamNumber);

  const payload = {
    mainCaseId: selectedMainCaseId,
    createCaseIfMissing: allowAutoCaseCreateInput.checked,
    time: timeInput.value,
    severity: severityInput.value,
    teamNumber,
    eventType: eventTypeInput.value,
    summary: summaryInput.value,
    details: detailsInput.value,
    servicesAffected: parseCsv(servicesInput.value),
    hostsAffected,
    owners: parseCsv(ownersInput.value),
    tags: applyDeviceStatusTags(parseCsv(tagsInput.value), deviceStatusAction),
  };

  try {
    const response = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const result = (await response.json()) as CreateEventResponse;
    if (!response.ok) {
      throw new Error(result.error || "Could not create event.");
    }

    const message = result.autoCreatedMainCase
      ? `Event ${result.caseId} saved. New case created: ${result.mainCaseRef}.`
      : `Event ${result.caseId} saved under ${result.mainCaseRef}.`;

    const statusMessage = deviceStatusAction ? " Device status marker applied." : "";
    setStatus(eventStatusEl, `${message}${statusMessage}`);

    summaryInput.value = "";
    detailsInput.value = "";
    servicesInput.value = "";
    hostsInput.value = "";
    ownersInput.value = "";
    tagsInput.value = "";
    deviceStatusActionInput.value = "";
    allowAutoCaseCreateInput.checked = false;
    syncTimeInput();

    await Promise.all([
      loadCatalogOptions(),
      loadMainCases(result.mainCaseId),
      loadEvents(),
    ]);
    const snapshot = await loadChangeSnapshot();
    lastChangeSignature = JSON.stringify(snapshot);
    updateEventsLastSync();
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
    await addCatalogValues(type, [name]);
    catalogNameInput.value = "";
    await loadCatalogOptions();
    setStatus(catalogStatusEl, `Saved: ${name}`);
  } catch (error) {
    setStatus(catalogStatusEl, getErrorMessage(error, "Could not save value."), true);
  }
});

quickDeleteForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(catalogStatusEl);

  const type = catalogDeleteTypeInput.value as CatalogType;
  const name = catalogDeleteNameInput.value.trim();
  if (!name) {
    setStatus(catalogStatusEl, "Select a value to delete.", true);
    return;
  }

  try {
    await deleteCatalogValue(type, name);
    await loadCatalogOptions();
    catalogDeleteNameInput.value = "";
    setStatus(catalogStatusEl, `Deleted value: ${name}`);
  } catch (error) {
    setStatus(
      catalogStatusEl,
      getErrorMessage(error, "Could not delete reusable value."),
      true,
    );
  }
});

catalogDeleteTypeInput.addEventListener("change", () => {
  refreshDeleteValueOptions();
});

refreshEventsButton.addEventListener("click", () => {
  void refreshLiveData(true)
    .then(async () => {
      await loadNetworkHostSuggestions();
      const snapshot = await loadChangeSnapshot();
      lastChangeSignature = JSON.stringify(snapshot);
    })
    .catch((error) => {
      setStatus(eventStatusEl, getErrorMessage(error, "Refresh failed."), true);
    });
});

resetTimeButton.addEventListener("click", syncTimeInput);

function triggerFilteredLoad(): void {
  void loadEvents()
    .then(() => {
      updateEventsLastSync();
    })
    .catch((error) => {
      setStatus(eventStatusEl, getErrorMessage(error, "Filter failed."), true);
    });
}

const filterSelects: HTMLSelectElement[] = [
  eventMainCaseFilter,
  eventSeverityFilter,
  eventTeamFilter,
  eventTypeFilter,
  eventSortBy,
  eventSortDir,
];

for (const select of filterSelects) {
  select.addEventListener("change", triggerFilteredLoad);
}

const filterInputs: HTMLInputElement[] = [
  eventSearchInput,
  eventCaseIdFilter,
  eventCaseRefFilter,
  eventSummaryFilter,
  eventDetailsFilter,
  eventServiceFilter,
  eventHostFilter,
  eventOwnerFilter,
  eventTagFilter,
  eventTimeFromFilter,
  eventTimeToFilter,
];

for (const input of filterInputs) {
  const eventName = input.type === "datetime-local" ? "change" : "input";
  input.addEventListener(eventName, () => {
    window.clearTimeout(eventSearchTimer);
    eventSearchTimer = window.setTimeout(() => {
      triggerFilteredLoad();
    }, 220);
  });
}

clearEventFiltersButton.addEventListener("click", () => {
  eventSearchInput.value = "";
  eventMainCaseFilter.value = "";
  eventSeverityFilter.value = "";
  eventTeamFilter.value = "";
  eventTypeFilter.value = "";
  eventSortBy.value = "createdAt";
  eventSortDir.value = "desc";
  eventCaseIdFilter.value = "";
  eventCaseRefFilter.value = "";
  eventSummaryFilter.value = "";
  eventDetailsFilter.value = "";
  eventServiceFilter.value = "";
  eventHostFilter.value = "";
  eventOwnerFilter.value = "";
  eventTagFilter.value = "";
  eventTimeFromFilter.value = "";
  eventTimeToFilter.value = "";
  triggerFilteredLoad();
});

async function init(): Promise<void> {
  bindAddReusableButtons();
  syncTimeInput();
  updateHeaderClock();
  window.setInterval(updateHeaderClock, 1000);

  try {
    await loadCatalogOptions();
    await loadNetworkHostSuggestions();
    await Promise.all([loadMainCases(), loadEvents()]);
    const snapshot = await loadChangeSnapshot();
    lastChangeSignature = JSON.stringify(snapshot);
    updateEventsLastSync();
  } catch (error) {
    setStatus(eventStatusEl, getErrorMessage(error, "Initial load failed."), true);
  }

  window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    void checkForRemoteChanges().catch(() => {
      // Keep silent for polling failures; explicit actions still show errors.
    });
  }, CHANGE_POLL_MS);

  window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    void loadNetworkHostSuggestions().catch(() => {
      // Keep host suggestions refresh silent.
    });
  }, NETWORK_HOST_REFRESH_MS);
}

void init();
