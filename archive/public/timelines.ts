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

type TimelineEvent = {
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

type CaseTheme = {
  colors: [string, string, string, string, string, string];
  node: string;
  stem: string;
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

type FullscreenViewId = "cases" | "events";
type CaseFullscreenItem = {
  id: number;
  ref: string;
  summary: string;
};

const CHANGE_POLL_MS = 3000;

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const headerClock = byId<HTMLElement>("header-clock");
const timelineStatusEl = byId<HTMLDivElement>("timeline-status");
const timelineLastSyncEl = byId<HTMLSpanElement>("timeline-last-sync");
const refreshButton = byId<HTMLButtonElement>("refresh-timelines");
const clearFiltersButton = byId<HTMLButtonElement>("clear-timeline-filters");
const detachOverviewButton = byId<HTMLButtonElement>("toggle-overview-detach");
const casesFullscreenButton = byId<HTMLButtonElement>("toggle-cases-fullscreen");
const eventsFullscreenButton = byId<HTMLButtonElement>("toggle-events-fullscreen");
const autoScrollButton = byId<HTMLButtonElement>("toggle-autoscroll");
const compactToggle = byId<HTMLInputElement>("timeline-compact-toggle");
const compactSlider = byId<HTMLInputElement>("timeline-compact-slider");
const compactValueEl = byId<HTMLSpanElement>("timeline-compact-value");

const searchInput = byId<HTMLInputElement>("timeline-search");
const severityFilter = byId<HTMLSelectElement>("timeline-severity");
const teamFilter = byId<HTMLSelectElement>("timeline-team");
const statusFilter = byId<HTMLSelectElement>("timeline-status-filter");
const orderFilter = byId<HTMLSelectElement>("timeline-order");

const timelineContainer = byId<HTMLElement>("cases-timeline");
const timelineOverviewContainer = byId<HTMLElement>("timeline-overview");
const timelineEventsOverviewContainer = byId<HTMLElement>("timeline-events-overview");
const timelineEventsOverviewPanel = byId<HTMLElement>("timeline-events-overview-panel");
const timelinePage = document.querySelector<HTMLElement>(".timeline-page");

const TIMELINE_COMPACT_STORAGE_KEY = "timelineCompactEnabled";
const TIMELINE_DENSITY_STORAGE_KEY = "timelineDensityPercent";
const TIMELINE_AUTOSCROLL_STORAGE_KEY = "timelineAutoScrollEnabled";
const TIMELINE_DENSITY_DEFAULT = 50;
const TIMELINE_DENSITY_MIN = 0;
const TIMELINE_DENSITY_MAX = 100;
const TIMELINE_COMPACT_DEFAULT = true;
const TIMELINE_AUTOSCROLL_DEFAULT = true;
const TIMELINE_OVERVIEW_DETACHED_KEY = "timelineOverviewDetached";
const TIMELINE_OVERVIEW_DETACHED_DEFAULT = false;
const FULLSCREEN_VIEW_ORDER: FullscreenViewId[] = ["cases", "events"];

let filterTimer: number | undefined;
let casesSignature = "";
let lastChangeSnapshot: ChangeSnapshot | null = null;
let caseFullscreenItems: CaseFullscreenItem[] = [];
let caseFullscreenIndex = 0;
let autoScrollEnabled = TIMELINE_AUTOSCROLL_DEFAULT;

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setStatus(message = "", isError = false): void {
  timelineStatusEl.textContent = message;
  timelineStatusEl.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
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

function compactCaseId(raw: string | null): string {
  if (!raw) {
    return "0000";
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

function shortText(value: string, maxLength: number): string {
  const text = value.trim();
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 3)}...`;
}

function firstWords(value: string, count: number): string {
  const text = value.trim();
  if (!text) {
    return "No summary";
  }

  const words = text.split(/\s+/g);
  if (words.length <= count) {
    return text;
  }

  return `${words.slice(0, count).join(" ")}...`;
}

function renderSeverityPrefix(severity: Severity | string): string {
  const label = String(severity).trim() || "Unknown";
  return `<span class="summary-severity ${severityClass(label)}">${escapeHtml(label)}</span>`;
}

function severityPriority(severity: Severity | string): number {
  switch (String(severity).trim().toLowerCase()) {
    case "critical":
      return 4;
    case "high":
      return 3;
    case "medium":
      return 2;
    case "low":
      return 1;
    default:
      return 0;
  }
}

function timestampValue(value: string | null): number {
  if (!value) {
    return 0;
  }

  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function isClosedCase(mainCase: MainCaseRow): boolean {
  return String(mainCase.status).trim().toLowerCase() === "closed";
}

function pickEventOverviewCases(mainCases: MainCaseRow[]): MainCaseRow[] {
  const maxCases = 6;
  const openCases = mainCases.filter((mainCase) => !isClosedCase(mainCase));
  if (openCases.length <= maxCases) {
    return openCases.slice(0, maxCases);
  }

  return [...openCases]
    .sort((a, b) => {
      const bySeverity = severityPriority(b.severity) - severityPriority(a.severity);
      if (bySeverity !== 0) {
        return bySeverity;
      }

      const byLastUpdated =
        timestampValue(b.last_updated) - timestampValue(a.last_updated);
      if (byLastUpdated !== 0) {
        return byLastUpdated;
      }

      const byFirstReported =
        timestampValue(b.first_reported) - timestampValue(a.first_reported);
      if (byFirstReported !== 0) {
        return byFirstReported;
      }

      return (toNumericId(b.id) ?? 0) - (toNumericId(a.id) ?? 0);
    })
    .slice(0, maxCases);
}

function pickQuickOverviewCases(mainCases: MainCaseRow[]): MainCaseRow[] {
  const maxCases = 6;
  return mainCases
    .filter((mainCase) => !isClosedCase(mainCase))
    .sort((a, b) => {
      const bySeverity = severityPriority(b.severity) - severityPriority(a.severity);
      if (bySeverity !== 0) {
        return bySeverity;
      }

      const byLastUpdated =
        timestampValue(b.last_updated) - timestampValue(a.last_updated);
      if (byLastUpdated !== 0) {
        return byLastUpdated;
      }

      const byFirstReported =
        timestampValue(b.first_reported) - timestampValue(a.first_reported);
      if (byFirstReported !== 0) {
        return byFirstReported;
      }

      return (toNumericId(b.id) ?? 0) - (toNumericId(a.id) ?? 0);
    })
    .slice(0, maxCases);
}

function clampNumber(value: number, min: number, max: number): number {
  if (value < min) {
    return min;
  }

  if (value > max) {
    return max;
  }

  return value;
}

function readStoredDensity(): number {
  const raw = window.localStorage.getItem(TIMELINE_DENSITY_STORAGE_KEY);
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return TIMELINE_DENSITY_DEFAULT;
  }

  return clampNumber(
    Math.round(parsed),
    TIMELINE_DENSITY_MIN,
    TIMELINE_DENSITY_MAX,
  );
}

function readStoredCompactEnabled(): boolean {
  const raw = window.localStorage.getItem(TIMELINE_COMPACT_STORAGE_KEY);
  if (raw === null) {
    return TIMELINE_COMPACT_DEFAULT;
  }

  return raw === "1";
}

function readStoredAutoScrollEnabled(): boolean {
  const raw = window.localStorage.getItem(TIMELINE_AUTOSCROLL_STORAGE_KEY);
  if (raw === null) {
    return TIMELINE_AUTOSCROLL_DEFAULT;
  }

  return raw === "1";
}

function applyCompactDensity(enabled: boolean, densityPercent: number): void {
  const normalizedPercent = clampNumber(
    Math.round(densityPercent),
    TIMELINE_DENSITY_MIN,
    TIMELINE_DENSITY_MAX,
  );
  const densityValue = enabled ? normalizedPercent / 100 : 0;
  const host = timelinePage ?? document.documentElement;

  host.style.setProperty("--timeline-density", densityValue.toFixed(2));

  compactToggle.checked = enabled;
  compactSlider.value = String(normalizedPercent);
  compactSlider.disabled = !enabled;
  compactValueEl.textContent = `${normalizedPercent}%`;
  compactValueEl.classList.toggle("muted", !enabled);

  window.localStorage.setItem(
    TIMELINE_COMPACT_STORAGE_KEY,
    enabled ? "1" : "0",
  );
  window.localStorage.setItem(
    TIMELINE_DENSITY_STORAGE_KEY,
    String(normalizedPercent),
  );
}

function initCompactControls(): void {
  const density = readStoredDensity();
  const enabled = readStoredCompactEnabled();
  applyCompactDensity(enabled, density);

  compactToggle.addEventListener("change", () => {
    applyCompactDensity(compactToggle.checked, Number(compactSlider.value));
  });

  compactSlider.addEventListener("input", () => {
    applyCompactDensity(compactToggle.checked, Number(compactSlider.value));
  });
}

function applyAutoScrollEnabled(enabled: boolean): void {
  autoScrollEnabled = enabled;
  autoScrollButton.textContent = enabled ? "Auto-scroll: On" : "Auto-scroll: Off";
  autoScrollButton.setAttribute("aria-pressed", enabled ? "true" : "false");
  window.localStorage.setItem(
    TIMELINE_AUTOSCROLL_STORAGE_KEY,
    enabled ? "1" : "0",
  );
}

function initAutoScrollControl(): void {
  applyAutoScrollEnabled(readStoredAutoScrollEnabled());
  autoScrollButton.addEventListener("click", () => {
    applyAutoScrollEnabled(!autoScrollEnabled);
  });
}

function readStoredOverviewDetached(): boolean {
  const raw = window.localStorage.getItem(TIMELINE_OVERVIEW_DETACHED_KEY);
  if (raw === null) {
    return TIMELINE_OVERVIEW_DETACHED_DEFAULT;
  }

  return raw === "1";
}

function applyOverviewDetached(detached: boolean): void {
  if (timelinePage) {
    timelinePage.classList.toggle("overview-detached", detached);
  }

  detachOverviewButton.textContent = detached
    ? "Attach Overview"
    : "Detach Overview";
  detachOverviewButton.setAttribute("aria-pressed", detached ? "true" : "false");

  window.localStorage.setItem(
    TIMELINE_OVERVIEW_DETACHED_KEY,
    detached ? "1" : "0",
  );
}

function initOverviewDetachControl(): void {
  applyOverviewDetached(readStoredOverviewDetached());

  detachOverviewButton.addEventListener("click", () => {
    const isDetached = timelinePage?.classList.contains("overview-detached") ?? false;
    applyOverviewDetached(!isDetached);
  });
}

function moveCaseFullscreen(step: 1 | -1): void {
  if (caseFullscreenItems.length === 0) {
    return;
  }

  caseFullscreenIndex =
    (caseFullscreenIndex + step + caseFullscreenItems.length) %
    caseFullscreenItems.length;
  applyCaseFullscreenView();
}

function applyCaseFullscreenScale(): void {
  const blocks = Array.from(
    timelineContainer.querySelectorAll<HTMLElement>(".timeline-case-block"),
  );
  const isCasesFullscreen = getActiveFullscreenView() === "cases";

  for (const block of blocks) {
    const scroll = block.querySelector<HTMLElement>(".case-infographic-scroll");
    const hidden = block.classList.contains("case-fullscreen-hidden");
    if (!scroll) {
      continue;
    }

    scroll.classList.toggle("case-fullscreen-fit", isCasesFullscreen && !hidden);
    scroll.style.removeProperty("--case-fullscreen-scale");
    scroll.style.removeProperty("--case-fullscreen-height");
  }
}

function scheduleCaseFullscreenLayout(): void {
  window.requestAnimationFrame(() => {
    applyCaseFullscreenScale();
  });
}

function findCaseFullscreenIndex(query: string): number {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return -1;
  }

  for (let index = 0; index < caseFullscreenItems.length; index += 1) {
    const item = caseFullscreenItems[index];
    if (!item) {
      continue;
    }

    const shortRef = compactCaseId(item.ref).toLowerCase();
    const ref = item.ref.toLowerCase();
    const summary = item.summary.toLowerCase();
    if (
      shortRef.includes(normalized) ||
      ref.includes(normalized) ||
      summary.includes(normalized)
    ) {
      return index;
    }
  }

  return -1;
}

function jumpCaseFullscreenByQuery(rawQuery: string): void {
  const query = rawQuery.trim();
  if (!query) {
    return;
  }

  const nextIndex = findCaseFullscreenIndex(query);
  if (nextIndex < 0) {
    setStatus(`No case found for "${query}".`, true);
    return;
  }

  caseFullscreenIndex = nextIndex;
  applyCaseFullscreenView();
}

function applyCaseFullscreenView(): void {
  const nav = timelineContainer.querySelector<HTMLElement>("#case-fullscreen-nav");
  const label = timelineContainer.querySelector<HTMLElement>("#case-fullscreen-label");
  const prevButton = timelineContainer.querySelector<HTMLButtonElement>(
    '[data-case-nav="prev"]',
  );
  const nextButton = timelineContainer.querySelector<HTMLButtonElement>(
    '[data-case-nav="next"]',
  );
  const blocks = Array.from(
    timelineContainer.querySelectorAll<HTMLElement>(".timeline-case-block"),
  );
  const isCasesFullscreen = getActiveFullscreenView() === "cases";
  const canShowNav = isCasesFullscreen && caseFullscreenItems.length > 0;

  if (nav) {
    nav.classList.toggle("hidden", !canShowNav);
  }

  if (!canShowNav) {
    for (const block of blocks) {
      block.classList.remove("case-fullscreen-hidden");
    }
    scheduleCaseFullscreenLayout();
    return;
  }

  if (caseFullscreenIndex >= caseFullscreenItems.length) {
    caseFullscreenIndex = caseFullscreenItems.length - 1;
  }

  const selected = caseFullscreenItems[caseFullscreenIndex];
  if (!selected) {
    return;
  }

  for (const block of blocks) {
    const blockId = Number(block.dataset.caseItemId);
    const showBlock = Number.isInteger(blockId) && blockId === selected.id;
    block.classList.toggle("case-fullscreen-hidden", !showBlock);
  }

  if (label) {
    label.textContent = `CS-${compactCaseId(selected.ref)} (${caseFullscreenIndex + 1}/${caseFullscreenItems.length})`;
  }

  if (prevButton) {
    prevButton.disabled = caseFullscreenItems.length <= 1;
  }

  if (nextButton) {
    nextButton.disabled = caseFullscreenItems.length <= 1;
  }

  scheduleCaseFullscreenLayout();
}

function fullscreenSupported(): boolean {
  return Boolean(document.fullscreenEnabled);
}

function getFullscreenTarget(viewId: FullscreenViewId): HTMLElement {
  return viewId === "cases" ? timelineContainer : timelineEventsOverviewPanel;
}

function getActiveFullscreenView(): FullscreenViewId | null {
  const activeElement = document.fullscreenElement;
  if (!activeElement) {
    return null;
  }

  if (activeElement === timelineContainer) {
    return "cases";
  }

  if (activeElement === timelineEventsOverviewPanel) {
    return "events";
  }

  return null;
}

function updateFullscreenButtons(): void {
  const activeView = getActiveFullscreenView();
  const casesActive = activeView === "cases";
  const eventsActive = activeView === "events";

  casesFullscreenButton.textContent = casesActive
    ? "Exit Cases Fullscreen"
    : "Cases Fullscreen";
  casesFullscreenButton.setAttribute("aria-pressed", casesActive ? "true" : "false");

  eventsFullscreenButton.textContent = eventsActive
    ? "Exit Event Fullscreen"
    : "Event Fullscreen";
  eventsFullscreenButton.setAttribute("aria-pressed", eventsActive ? "true" : "false");

  if (!fullscreenSupported()) {
    casesFullscreenButton.disabled = true;
    eventsFullscreenButton.disabled = true;
    casesFullscreenButton.title = "Fullscreen not supported by this browser.";
    eventsFullscreenButton.title = "Fullscreen not supported by this browser.";
  } else {
    casesFullscreenButton.disabled = false;
    eventsFullscreenButton.disabled = false;
    casesFullscreenButton.title = "";
    eventsFullscreenButton.title = "";
  }

  applyCaseFullscreenView();
}

async function requestFullscreenForView(viewId: FullscreenViewId): Promise<void> {
  if (!fullscreenSupported()) {
    throw new Error("Fullscreen mode is not supported in this browser.");
  }

  const target = getFullscreenTarget(viewId);
  const activeView = getActiveFullscreenView();

  if (activeView === viewId) {
    if (document.fullscreenElement) {
      await document.exitFullscreen();
    }
    return;
  }

  if (document.fullscreenElement) {
    await document.exitFullscreen();
  }

  await target.requestFullscreen();
}

async function switchFullscreenView(direction: 1 | -1): Promise<void> {
  const activeView = getActiveFullscreenView();
  if (!activeView || !document.fullscreenElement) {
    return;
  }

  const currentIndex = FULLSCREEN_VIEW_ORDER.indexOf(activeView);
  if (currentIndex < 0) {
    return;
  }

  const nextIndex =
    (currentIndex + direction + FULLSCREEN_VIEW_ORDER.length) %
    FULLSCREEN_VIEW_ORDER.length;
  const nextView = FULLSCREEN_VIEW_ORDER[nextIndex];
  if (!nextView) {
    return;
  }

  await requestFullscreenForView(nextView);
}

function initFullscreenControls(): void {
  updateFullscreenButtons();

  if (!fullscreenSupported()) {
    return;
  }

  casesFullscreenButton.addEventListener("click", () => {
    void requestFullscreenForView("cases").catch((error) => {
      setStatus(getErrorMessage(error, "Could not toggle cases fullscreen."), true);
    });
  });

  eventsFullscreenButton.addEventListener("click", () => {
    void requestFullscreenForView("events").catch((error) => {
      setStatus(getErrorMessage(error, "Could not toggle event fullscreen."), true);
    });
  });

  document.addEventListener("fullscreenchange", updateFullscreenButtons);

  window.addEventListener("keydown", (event) => {
    if (!document.fullscreenElement) {
      return;
    }

    if (event.key !== "ArrowRight" && event.key !== "ArrowLeft") {
      return;
    }

    event.preventDefault();
    const direction: 1 | -1 = event.key === "ArrowRight" ? 1 : -1;

    if (getActiveFullscreenView() === "cases") {
      moveCaseFullscreen(direction);
      return;
    }

    void switchFullscreenView(direction).catch((error) => {
      setStatus(getErrorMessage(error, "Could not switch fullscreen view."), true);
    });
  });

  window.addEventListener("resize", () => {
    if (getActiveFullscreenView() === "cases") {
      scheduleCaseFullscreenLayout();
    }
  });
}

function updateHeaderClock(): void {
  headerClock.textContent = new Date().toLocaleString();
}

function updateTimelineLastSync(): void {
  timelineLastSyncEl.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
}

function severityClass(severity: string): string {
  switch (String(severity).trim().toLowerCase()) {
    case "low":
      return "sev-low";
    case "medium":
      return "sev-medium";
    case "high":
      return "sev-high";
    case "critical":
      return "sev-critical";
    default:
      return "";
  }
}

function statusClass(status: string): string {
  return `status-${status.toLowerCase()}`;
}

function timelineNodeClass(severity: Severity | string): string {
  switch (String(severity).trim().toLowerCase()) {
    case "low":
      return "node-low";
    case "medium":
      return "node-medium";
    case "high":
      return "node-high";
    case "critical":
      return "node-critical";
    default:
      return "node-medium";
  }
}

function timelinePaletteClass(index: number): string {
  return `palette-${(index % 6) + 1}`;
}

const DEFAULT_CASE_THEME: CaseTheme = {
  colors: ["#e53935", "#f4511e", "#ff7043", "#ff8f00", "#f7b801", "#ff6f00"],
  node: "#df3a3a",
  stem: "#6b4133",
};

const CASE_THEMES: CaseTheme[] = [
  DEFAULT_CASE_THEME,
  {
    colors: ["#1e88e5", "#2196f3", "#29b6f6", "#26c6da", "#00acc1", "#1976d2"],
    node: "#1e88e5",
    stem: "#2c4f6c",
  },
  {
    colors: ["#0f9d58", "#34a853", "#66bb6a", "#8bc34a", "#43a047", "#2e7d32"],
    node: "#2f9b61",
    stem: "#2e5a45",
  },
  {
    colors: ["#6a1b9a", "#8e24aa", "#ab47bc", "#5c6bc0", "#3949ab", "#7e57c2"],
    node: "#7b3fb2",
    stem: "#4d3f69",
  },
];

function hashString(value: string): number {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(index);
    hash |= 0;
  }

  return Math.abs(hash);
}

function pickTheme(seed: string): CaseTheme {
  const index = hashString(seed) % CASE_THEMES.length;
  return CASE_THEMES[index] ?? DEFAULT_CASE_THEME;
}

function themeStyle(theme: CaseTheme): string {
  return [
    `--case-color-1:${theme.colors[0]}`,
    `--case-color-2:${theme.colors[1]}`,
    `--case-color-3:${theme.colors[2]}`,
    `--case-color-4:${theme.colors[3]}`,
    `--case-color-5:${theme.colors[4]}`,
    `--case-color-6:${theme.colors[5]}`,
    `--case-node:${theme.node}`,
    `--case-stem:${theme.stem}`,
  ].join(";");
}

function toCasesSignature(mainCases: MainCaseRow[]): string {
  return JSON.stringify(
    mainCases.map((mainCase) => ({
      id: toNumericId(mainCase.id),
      ref: mainCase.main_case_ref,
      team: mainCase.team_number,
      severity: mainCase.severity,
      status: mainCase.status,
      owner: mainCase.owner,
      summary: mainCase.summary,
      firstReported: mainCase.first_reported,
      lastUpdated: mainCase.last_updated,
      eventCount: mainCase.event_count,
    })),
  );
}

function eventSortTimestamp(event: TimelineEvent): number {
  const createdAtMs = Date.parse(event.created_at);
  if (Number.isFinite(createdAtMs)) {
    return createdAtMs;
  }

  const occurredAtMs = Date.parse(event.occurred_at);
  if (Number.isFinite(occurredAtMs)) {
    return occurredAtMs;
  }

  return 0;
}

function findLatestEventCaseId(eventsByCaseId: Map<number, TimelineEvent[]>): number | null {
  let latestCaseId: number | null = null;
  let latestTime = -1;
  let latestEventId = -1;

  for (const [caseId, events] of eventsByCaseId.entries()) {
    for (const event of events) {
      const time = eventSortTimestamp(event);
      const eventId = toNumericId(event.id) ?? 0;
      const isMoreRecent =
        time > latestTime || (time === latestTime && eventId > latestEventId);

      if (!isMoreRecent) {
        continue;
      }

      latestTime = time;
      latestEventId = eventId;
      latestCaseId = caseId;
    }
  }

  return latestCaseId;
}

function needsHorizontalScroll(container: HTMLElement): boolean {
  return container.scrollWidth - container.clientWidth > 2;
}

function scrollElementIntoHorizontalView(
  container: HTMLElement,
  element: HTMLElement,
): boolean {
  if (!needsHorizontalScroll(container)) {
    return false;
  }

  const containerRect = container.getBoundingClientRect();
  const elementRect = element.getBoundingClientRect();
  const rightOverflow = elementRect.right - containerRect.right;
  const leftOverflow = containerRect.left - elementRect.left;
  if (rightOverflow <= 2 && leftOverflow <= 2) {
    return false;
  }

  const padding = 14;
  const delta =
    rightOverflow > 2
      ? rightOverflow + padding
      : -(leftOverflow + padding);
  const maxLeft = Math.max(0, container.scrollWidth - container.clientWidth);
  const targetLeft = Math.min(maxLeft, Math.max(0, container.scrollLeft + delta));
  if (Math.abs(targetLeft - container.scrollLeft) <= 2) {
    return false;
  }

  container.scrollTo({
    left: targetLeft,
    behavior: "smooth",
  });
  return true;
}

function autoScrollToLatestEvent(caseId: number): void {
  window.requestAnimationFrame(() => {
    const caseBlock = timelineContainer.querySelector<HTMLElement>(
      `.timeline-case-block[data-case-item-id="${caseId}"]`,
    );
    if (!caseBlock) {
      return;
    }

    const caseTimelineScroll = caseBlock.querySelector<HTMLElement>(
      ".case-infographic-scroll",
    );
    const eventOverviewRow = timelineEventsOverviewContainer.querySelector<HTMLElement>(
      `.timeline-events-overview-row[data-overview-case-id="${caseId}"]`,
    );
    const eventOverviewScroll = eventOverviewRow?.querySelector<HTMLElement>(
      ".timeline-events-row-scroll",
    );

    if (caseTimelineScroll) {
      const timelineEvents = caseTimelineScroll.querySelectorAll<HTMLElement>(
        ".case-infographic-item",
      );
      const latestTimelineEvent = timelineEvents[timelineEvents.length - 1];
      if (latestTimelineEvent) {
        scrollElementIntoHorizontalView(caseTimelineScroll, latestTimelineEvent);
      }
    }

    if (eventOverviewScroll) {
      const overviewEvents = eventOverviewScroll.querySelectorAll<HTMLElement>(
        ".timeline-event-mini",
      );
      const latestOverviewEvent = overviewEvents[overviewEvents.length - 1];
      if (latestOverviewEvent) {
        scrollElementIntoHorizontalView(eventOverviewScroll, latestOverviewEvent);
      }
    }
  });
}

function hasNewEvent(previous: ChangeSnapshot, next: ChangeSnapshot): boolean {
  return (
    next.eventCount > previous.eventCount ||
    next.latestEventId !== previous.latestEventId ||
    next.latestEventCreatedAt !== previous.latestEventCreatedAt
  );
}

async function loadCaseEvents(mainCaseId: number): Promise<TimelineEvent[]> {
  const response = await fetch(`/api/main-cases/${mainCaseId}/timeline`);
  if (!response.ok) {
    return [];
  }

  const payload = (await response.json()) as { events?: TimelineEvent[] };
  return Array.isArray(payload.events) ? payload.events : [];
}

function renderCaseEventTimeline(events: TimelineEvent[], theme: CaseTheme): string {
  if (events.length === 0) {
    return `<div class="entry-empty">No events logged for this case yet.</div>`;
  }

  const segments = events
    .map((_, index) => `<span class="case-track-segment ${timelinePaletteClass(index)}"></span>`)
    .join("");

  const items = events
    .map((event, index) => {
      const position = index % 2 === 0 ? "top" : "bottom";
      const shortEventId = compactCaseId(event.case_id);
      const summary = shortText(event.summary || "No summary provided.", 72);
      const details = event.details?.trim() || "No additional details.";

      const card = `
        <div class="case-infographic-card">
          <div class="case-infographic-time">${escapeHtml(formatDate(event.occurred_at))}</div>
          <div class="case-infographic-headline">${escapeHtml(summary)}</div>
          <div class="case-flags">
            <span class="badge ${severityClass(event.severity)}">${escapeHtml(event.severity)}</span>
            <span class="badge">${escapeHtml(event.event_type)}</span>
            <span class="badge">Team ${escapeHtml(event.team_number)}</span>
          </div>
          <details class="case-infographic-more">
            <summary>More detail</summary>
            <p class="case-details">${escapeHtml(details)}</p>
          </details>
        </div>
      `;

      const node = `
        <div class="case-infographic-node ${timelineNodeClass(event.severity)}" title="${escapeHtml(event.case_id)}">
          EV-${escapeHtml(shortEventId)}
        </div>
      `;

      return `
        <article class="case-infographic-item ${position}" style="grid-column: ${index + 1};">
          ${position === "top" ? `${card}<div class="case-infographic-stem"></div>${node}` : `${node}<div class="case-infographic-stem"></div>${card}`}
        </article>
      `;
    })
    .join("");

  return `
    <div class="case-infographic-scroll">
      <div class="case-infographic" style="--cols:${events.length};${themeStyle(theme)}">
        <div class="case-track">${segments}</div>
        ${items}
      </div>
    </div>
  `;
}

function renderCaseTimelines(
  mainCases: MainCaseRow[],
  eventsByCaseId: Map<number, TimelineEvent[]>,
): void {
  const previousSelectedCaseId = caseFullscreenItems[caseFullscreenIndex]?.id ?? null;
  const nextCaseFullscreenItems = mainCases
    .map((mainCase) => {
      const id = toNumericId(mainCase.id);
      if (!id) {
        return null;
      }

      return {
        id,
        ref: mainCase.main_case_ref,
        summary: mainCase.summary,
      } satisfies CaseFullscreenItem;
    })
    .filter((item): item is CaseFullscreenItem => item !== null);

  caseFullscreenItems = nextCaseFullscreenItems;

  if (caseFullscreenItems.length === 0) {
    caseFullscreenIndex = 0;
  } else if (previousSelectedCaseId !== null) {
    const preservedIndex = caseFullscreenItems.findIndex(
      (item) => item.id === previousSelectedCaseId,
    );
    if (preservedIndex >= 0) {
      caseFullscreenIndex = preservedIndex;
    } else if (caseFullscreenIndex >= caseFullscreenItems.length) {
      caseFullscreenIndex = caseFullscreenItems.length - 1;
    }
  } else if (caseFullscreenIndex >= caseFullscreenItems.length) {
    caseFullscreenIndex = caseFullscreenItems.length - 1;
  }

  if (mainCases.length === 0) {
    timelineContainer.innerHTML = `<div class="entry-empty">No cases found.</div>`;
    return;
  }

  timelineContainer.innerHTML = `
    <div id="case-fullscreen-nav" class="timeline-case-fullscreen-nav hidden">
      <button class="secondary-btn" type="button" data-case-nav="prev">Prev Case</button>
      <span id="case-fullscreen-label" class="timeline-case-fullscreen-label">-</span>
      <button class="secondary-btn" type="button" data-case-nav="next">Next Case</button>
      <input
        class="timeline-case-fullscreen-search"
        type="search"
        placeholder="Search case ID or summary..."
        data-case-nav="search"
      />
    </div>
    <section class="timeline-case-board">
      ${mainCases
        .map((mainCase) => {
          const caseId = toNumericId(mainCase.id);
          const shortRef = compactCaseId(mainCase.main_case_ref);
          const summary = mainCase.summary?.trim() || "No summary provided.";
          const action = mainCase.current_action?.trim() || "No current action provided.";
          const events = caseId ? eventsByCaseId.get(caseId) || [] : [];
          const themeSeed = `${mainCase.main_case_ref}-${caseId ?? "0"}`;
          const theme = pickTheme(themeSeed);
          const openLink = caseId
            ? `<a class="secondary-btn link-btn" href="/case-edit?id=${caseId}">Open Case</a>`
            : "";
          const caseAnchor = caseId ? `id="timeline-case-${caseId}"` : "";

          return `
            <article ${caseAnchor} class="timeline-case-block ${severityClass(mainCase.severity)}" data-case-item-id="${caseId ?? ""}">
              <div class="timeline-case-header">
                <div>
                  <div class="timeline-case-ref" title="${escapeHtml(mainCase.main_case_ref)}">CS-${escapeHtml(shortRef)}</div>
                  <h3 class="timeline-case-title" title="${escapeHtml(summary)}">${renderSeverityPrefix(mainCase.severity)}<span>${escapeHtml(shortText(summary, 140))}</span></h3>
                  <p class="muted">First Reported: ${escapeHtml(formatDate(mainCase.first_reported))}</p>
                </div>
                <div class="case-flags">
                  <span class="badge ${severityClass(mainCase.severity)}">${escapeHtml(mainCase.severity)}</span>
                  <span class="badge ${statusClass(mainCase.status)}">${escapeHtml(mainCase.status)}</span>
                  <span class="badge">Team ${escapeHtml(mainCase.team_number)}</span>
                </div>
              </div>

              <div class="timeline-case-submeta">
                <span><strong>Owner:</strong> ${escapeHtml(mainCase.owner)}</span>
                <span><strong>Events:</strong> ${escapeHtml(mainCase.event_count)}</span>
                <span><strong>Last Updated:</strong> ${escapeHtml(formatDate(mainCase.last_updated))}</span>
                <span><strong>Current Action:</strong> ${escapeHtml(shortText(action, 96))}</span>
              </div>

              ${renderCaseEventTimeline(events, theme)}

              <div class="entry-actions">
                ${openLink}
              </div>
            </article>
          `;
        })
        .join("")}
    </section>
  `;

  applyCaseFullscreenView();
}

function renderOverview(mainCases: MainCaseRow[]): void {
  if (mainCases.length === 0) {
    timelineOverviewContainer.innerHTML = `<div class="entry-empty">No cases for overview.</div>`;
    return;
  }

  const visibleCases = pickQuickOverviewCases(mainCases);
  if (visibleCases.length === 0) {
    timelineOverviewContainer.innerHTML = `<div class="entry-empty">No open cases for overview.</div>`;
    return;
  }

  timelineOverviewContainer.innerHTML = `
    <div class="timeline-overview-grid">
      ${visibleCases
        .map((mainCase) => {
          const caseId = toNumericId(mainCase.id);
          const shortRef = compactCaseId(mainCase.main_case_ref);
          const summary = mainCase.summary?.trim() || "No summary provided.";
          const shortSummary = firstWords(summary, 15);
          const detailLink = caseId
            ? `<a class="primary-btn link-btn" href="/case-edit?id=${caseId}">More detail</a>`
            : "";
          const jumpLink = caseId
            ? `<a class="secondary-btn link-btn" href="#timeline-case-${caseId}">Open timeline</a>`
            : "";

          return `
            <article class="timeline-overview-card ${severityClass(mainCase.severity)}">
              <div class="timeline-overview-top">
                <div class="timeline-overview-circle ${timelineNodeClass(mainCase.severity)}" title="${escapeHtml(mainCase.severity)}">
                  CS-${escapeHtml(shortRef)}
                </div>
                <div class="timeline-overview-meta">
                  <p class="timeline-overview-summary" title="${escapeHtml(summary)}">${renderSeverityPrefix(mainCase.severity)}<span>${escapeHtml(shortSummary)}</span></p>
                  <p class="muted">Team ${escapeHtml(mainCase.team_number)} · ${escapeHtml(mainCase.status)}</p>
                </div>
              </div>
              <div class="timeline-overview-actions">
                ${jumpLink}
                ${detailLink}
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderEventOverview(
  mainCases: MainCaseRow[],
  eventsByCaseId: Map<number, TimelineEvent[]>,
): void {
  if (mainCases.length === 0) {
    timelineEventsOverviewContainer.innerHTML = `<div class="entry-empty">No case events for overview.</div>`;
    updateFullscreenButtons();
    return;
  }

  const visibleCases = pickEventOverviewCases(mainCases);
  if (visibleCases.length === 0) {
    timelineEventsOverviewContainer.innerHTML = `<div class="entry-empty">No open case events for overview.</div>`;
    updateFullscreenButtons();
    return;
  }

  timelineEventsOverviewContainer.innerHTML = `
    <div class="timeline-events-overview-stack">
      ${visibleCases
        .map((mainCase) => {
          const caseId = toNumericId(mainCase.id);
          const shortRef = compactCaseId(mainCase.main_case_ref);
          const caseSummary = mainCase.summary?.trim() || "No summary provided.";
          const caseTitle = shortText(caseSummary, 48);
          const events = caseId ? eventsByCaseId.get(caseId) || [] : [];

          if (events.length === 0) {
            return `
              <article class="timeline-events-overview-row ${severityClass(mainCase.severity)}" data-overview-case-id="${caseId ?? ""}">
                <div class="timeline-events-row-head">
                  <div class="timeline-events-row-head-left">
                    <span class="timeline-events-row-ref">CS-${escapeHtml(shortRef)}</span>
                    <span class="timeline-events-row-title" title="${escapeHtml(caseSummary)}">
                      ${renderSeverityPrefix(mainCase.severity)}<span>${escapeHtml(caseTitle)}</span>
                    </span>
                  </div>
                  <span class="muted">0 events</span>
                </div>
                <div class="entry-empty">No events logged yet.</div>
              </article>
            `;
          }

          return `
            <article class="timeline-events-overview-row ${severityClass(mainCase.severity)}" data-overview-case-id="${caseId ?? ""}">
              <div class="timeline-events-row-head">
                <div class="timeline-events-row-head-left">
                  <span class="timeline-events-row-ref">CS-${escapeHtml(shortRef)}</span>
                  <span class="timeline-events-row-title" title="${escapeHtml(caseSummary)}">
                    ${renderSeverityPrefix(mainCase.severity)}<span>${escapeHtml(caseTitle)}</span>
                  </span>
                </div>
                <span class="muted">${escapeHtml(events.length)} events</span>
              </div>
              <div class="timeline-events-row-scroll">
                <div class="timeline-events-row-track">
                  ${events
                    .map((event, index) => {
                      const eventSummary = firstWords(event.summary || "No summary provided.", 5);
                      const connector =
                        index < events.length - 1
                          ? `
                            <div class="timeline-event-flow" aria-hidden="true">
                              <span class="timeline-event-flow-line"></span>
                              <span class="timeline-event-flow-tip"></span>
                            </div>
                          `
                          : "";

                      return `
                        <article class="timeline-event-mini">
                          <div class="timeline-overview-circle ${timelineNodeClass(event.severity)}" title="${escapeHtml(event.severity)}">
                            EV-${escapeHtml(compactCaseId(event.case_id))}
                          </div>
                          <p class="timeline-event-mini-summary" title="${escapeHtml(event.summary || "")}">${escapeHtml(eventSummary)}</p>
                        </article>
                        ${connector}
                      `;
                    })
                    .join("")}
                </div>
              </div>
            </article>
          `;
        })
        .join("")}
    </div>
  `;

  updateFullscreenButtons();
}

async function loadCases(
  skipIfUnchanged = false,
  autoScrollToNewestEvent = false,
): Promise<void> {
  const params = new URLSearchParams();

  const search = searchInput.value.trim();
  if (search) {
    params.set("search", search);
  }

  if (severityFilter.value) {
    params.set("severity", severityFilter.value);
  }

  if (teamFilter.value) {
    params.set("teamNumber", teamFilter.value);
  }

  if (statusFilter.value) {
    params.set("status", statusFilter.value);
  }

  params.set("sortBy", "firstReported");
  params.set("sortDir", orderFilter.value === "desc" ? "desc" : "asc");

  const response = await fetch(`/api/main-cases?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Failed to load case timelines.");
  }

  const payload = (await response.json()) as { mainCases?: MainCaseRow[] };
  const mainCases = Array.isArray(payload.mainCases) ? payload.mainCases : [];
  const nextSignature = toCasesSignature(mainCases);

  if (skipIfUnchanged && nextSignature === casesSignature) {
    return;
  }

  renderOverview(mainCases);

  if (mainCases.length === 0) {
    renderEventOverview(mainCases, new Map<number, TimelineEvent[]>());
    casesSignature = nextSignature;
    renderCaseTimelines(mainCases, new Map<number, TimelineEvent[]>());
    return;
  }

  const eventsByCaseId = new Map<number, TimelineEvent[]>();
  await Promise.all(
    mainCases.map(async (mainCase) => {
      const caseId = toNumericId(mainCase.id);
      if (!caseId) {
        return;
      }

      const events = await loadCaseEvents(caseId);
      eventsByCaseId.set(caseId, events);
    }),
  );

  const latestEventCaseId = autoScrollToNewestEvent
    ? findLatestEventCaseId(eventsByCaseId)
    : null;
  casesSignature = nextSignature;
  renderEventOverview(mainCases, eventsByCaseId);
  renderCaseTimelines(mainCases, eventsByCaseId);
  if (latestEventCaseId) {
    autoScrollToLatestEvent(latestEventCaseId);
  }
}

async function loadChangeSnapshot(): Promise<ChangeSnapshot> {
  const response = await fetch("/api/changes");
  if (!response.ok) {
    throw new Error("Failed to load change state.");
  }

  return (await response.json()) as ChangeSnapshot;
}

async function refreshTimeline(
  force = false,
  autoScrollToNewestEvent = false,
): Promise<void> {
  await loadCases(!force, autoScrollToNewestEvent);
  updateTimelineLastSync();
}

async function checkForRemoteChanges(): Promise<void> {
  const snapshot = await loadChangeSnapshot();

  if (!lastChangeSnapshot) {
    lastChangeSnapshot = snapshot;
    return;
  }

  const nextSignature = JSON.stringify(snapshot);
  const previousSignature = JSON.stringify(lastChangeSnapshot);
  if (nextSignature === previousSignature) {
    return;
  }

  const autoScrollToNewestEvent =
    autoScrollEnabled && hasNewEvent(lastChangeSnapshot, snapshot);
  await refreshTimeline(true, autoScrollToNewestEvent);
  lastChangeSnapshot = snapshot;
}

function triggerFilteredLoad(): void {
  void loadCases()
    .then(() => {
      updateTimelineLastSync();
    })
    .catch((error) => {
      setStatus(getErrorMessage(error, "Could not filter timelines."), true);
    });
}

searchInput.addEventListener("input", () => {
  window.clearTimeout(filterTimer);
  filterTimer = window.setTimeout(triggerFilteredLoad, 220);
});

const selectFilters: HTMLSelectElement[] = [
  severityFilter,
  teamFilter,
  statusFilter,
  orderFilter,
];

for (const select of selectFilters) {
  select.addEventListener("change", triggerFilteredLoad);
}

clearFiltersButton.addEventListener("click", () => {
  searchInput.value = "";
  severityFilter.value = "";
  teamFilter.value = "";
  statusFilter.value = "";
  orderFilter.value = "asc";
  triggerFilteredLoad();
});

refreshButton.addEventListener("click", () => {
  void refreshTimeline(true)
    .then(async () => {
      const snapshot = await loadChangeSnapshot();
      lastChangeSnapshot = snapshot;
    })
    .catch((error) => {
      setStatus(getErrorMessage(error, "Refresh failed."), true);
    });
});

timelineContainer.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("[data-case-nav]");
  if (!button) {
    return;
  }

  const direction = button.dataset.caseNav === "next" ? 1 : -1;
  moveCaseFullscreen(direction);
});

timelineContainer.addEventListener("keydown", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.dataset.caseNav !== "search") {
    return;
  }

  if (event.key !== "Enter") {
    return;
  }

  event.preventDefault();
  jumpCaseFullscreenByQuery(target.value);
});

async function init(): Promise<void> {
  updateHeaderClock();
  window.setInterval(updateHeaderClock, 1000);
  initCompactControls();
  initAutoScrollControl();
  initOverviewDetachControl();
  initFullscreenControls();

  try {
    await loadCases(true);
    const snapshot = await loadChangeSnapshot();
    lastChangeSnapshot = snapshot;
    updateTimelineLastSync();
  } catch (error) {
    setStatus(getErrorMessage(error, "Initial timeline load failed."), true);
  }

  window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    void checkForRemoteChanges().catch(() => {
      // Keep polling silent unless user manually triggers refresh.
    });
  }, CHANGE_POLL_MS);
}

void init();
