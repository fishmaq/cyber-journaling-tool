type NetworkDeviceType =
  | "Internet"
  | "Router"
  | "Firewall"
  | "DMZ"
  | "Server"
  | "Workstations";

type NetworkDeviceStatus = {
  isOut: boolean;
  isCompromised: boolean;
  sourceEventId: number | null;
  sourceOccurredAt: string | null;
};

type NetworkDevice = {
  id: number | string;
  name: string;
  type: NetworkDeviceType;
  ipAddress: string;
  team?: string;
  teamNumber?: number | null;
  zone?: string;
  posX?: number | null;
  posY?: number | null;
  displayOrder: number;
  status?: NetworkDeviceStatus;
};

type NetworkLink = {
  id?: number | string;
  fromName: string;
  fromTeam?: string;
  toName: string;
  toTeam?: string;
  label?: string;
  sortOrder?: number;
};

type NetworkTopologyResponse = {
  devices?: NetworkDevice[];
  links?: NetworkLink[];
  error?: string;
};

type NetworkDeviceEvent = {
  id: number;
  caseId: string;
  mainCaseRef: string | null;
  occurredAt: string | null;
  severity: string;
  teamNumber: number;
  eventType: string;
  summary: string;
  details: string;
  tags: string[];
};

type NetworkDeviceEventsResponse = {
  events?: NetworkDeviceEvent[];
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

type AdminApiResponse = {
  ok?: boolean;
  id?: number;
  name?: string;
  error?: string;
};

type NetworkImportDevice = {
  name: string;
  type: NetworkDeviceType;
  ipAddress: string;
  team?: string;
  zone?: string;
  x?: number;
  y?: number;
};

type NetworkImportLink = {
  from: string;
  fromTeam?: string;
  to: string;
  toTeam?: string;
  label?: string;
};

type NetworkImportPayload = {
  devices: NetworkImportDevice[];
  links: NetworkImportLink[];
};

const NETWORK_ORDER: NetworkDeviceType[] = [
  "Internet",
  "Router",
  "Firewall",
  "DMZ",
  "Server",
  "Workstations",
];

const CYGWDEX_TEMPLATE: NetworkImportPayload = {
  devices: [
    { name: "Simulated Internet", type: "Internet", ipAddress: "Gamenet", x: 740, y: 20, team: "Shared", zone: "Internet" },
    { name: "Access Router", type: "Router", ipAddress: "10.0.253.141/24, 10.1.0.254/24, 10.1.1.254/24", x: 100, y: 340, team: "Team 1", zone: "Infra" },
    { name: "Access Router", type: "Router", ipAddress: "10.0.253.102/24, 10.2.0.254/24, 10.2.1.254/24", x: 1380, y: 340, team: "Team 2", zone: "Infra" },
    { name: "Linux Firewall", type: "Firewall", ipAddress: "10.0.254.118/24, 10.1.0.1/24, 10.1.1.1/24", x: 600, y: 330, team: "Team 1", zone: "Infra" },
    { name: "Linux Firewall", type: "Firewall", ipAddress: "10.0.254.119/24, 10.2.0.1/24, 10.2.1.1/24", x: 900, y: 330, team: "Team 2", zone: "Infra" },
    { name: "tips Webserver", type: "DMZ", ipAddress: "10.1.0.10/24", x: 340, y: 130, team: "Team 1", zone: "DMZ" },
    { name: "tips Webserver", type: "DMZ", ipAddress: "10.2.0.10/24", x: 1160, y: 130, team: "Team 2", zone: "DMZ" },
    { name: "Fileserver", type: "Server", ipAddress: "10.1.1.11", x: 110, y: 820, team: "Team 1", zone: "INT" },
    { name: "Fileserver", type: "Server", ipAddress: "10.2.1.11", x: 970, y: 820, team: "Team 2", zone: "INT" },

    { name: "Linux Workstation 1", type: "Workstations", ipAddress: "10.1.1.51", x: 110, y: 570, team: "Team 1", zone: "INT" },
    { name: "Linux Workstation 2", type: "Workstations", ipAddress: "10.1.1.52", x: 230, y: 570, team: "Team 1", zone: "INT" },
    { name: "Linux Workstation 3", type: "Workstations", ipAddress: "10.1.1.53", x: 350, y: 570, team: "Team 1", zone: "INT" },
    { name: "Linux Workstation 4", type: "Workstations", ipAddress: "10.1.1.54", x: 470, y: 570, team: "Team 1", zone: "INT" },
    { name: "Linux Workstation 5", type: "Workstations", ipAddress: "10.1.1.55", x: 590, y: 570, team: "Team 1", zone: "INT" },

    { name: "Win Workstation 1", type: "Workstations", ipAddress: "10.1.1.101", x: 110, y: 700, team: "Team 1", zone: "INT" },
    { name: "Win Workstation 2", type: "Workstations", ipAddress: "10.1.1.102", x: 230, y: 700, team: "Team 1", zone: "INT" },
    { name: "Win Workstation 3", type: "Workstations", ipAddress: "10.1.1.103", x: 350, y: 700, team: "Team 1", zone: "INT" },
    { name: "Win Workstation 4", type: "Workstations", ipAddress: "10.1.1.104", x: 470, y: 700, team: "Team 1", zone: "INT" },
    { name: "Win Workstation 5", type: "Workstations", ipAddress: "10.1.1.105", x: 590, y: 700, team: "Team 1", zone: "INT" },

    { name: "Linux Workstation 1", type: "Workstations", ipAddress: "10.2.1.51", x: 970, y: 570, team: "Team 2", zone: "INT" },
    { name: "Linux Workstation 2", type: "Workstations", ipAddress: "10.2.1.52", x: 1090, y: 570, team: "Team 2", zone: "INT" },
    { name: "Linux Workstation 3", type: "Workstations", ipAddress: "10.2.1.53", x: 1210, y: 570, team: "Team 2", zone: "INT" },
    { name: "Linux Workstation 4", type: "Workstations", ipAddress: "10.2.1.54", x: 1330, y: 570, team: "Team 2", zone: "INT" },
    { name: "Linux Workstation 5", type: "Workstations", ipAddress: "10.2.1.55", x: 1450, y: 570, team: "Team 2", zone: "INT" },

    { name: "Win Workstation 1", type: "Workstations", ipAddress: "10.2.1.101", x: 970, y: 700, team: "Team 2", zone: "INT" },
    { name: "Win Workstation 2", type: "Workstations", ipAddress: "10.2.1.102", x: 1090, y: 700, team: "Team 2", zone: "INT" },
    { name: "Win Workstation 3", type: "Workstations", ipAddress: "10.2.1.103", x: 1210, y: 700, team: "Team 2", zone: "INT" },
    { name: "Win Workstation 4", type: "Workstations", ipAddress: "10.2.1.104", x: 1330, y: 700, team: "Team 2", zone: "INT" },
    { name: "Win Workstation 5", type: "Workstations", ipAddress: "10.2.1.105", x: 1450, y: 700, team: "Team 2", zone: "INT" },
  ],
  links: [
    { from: "Simulated Internet", to: "Access Router", toTeam: "Team 1", label: "VPN" },
    { from: "Simulated Internet", to: "Access Router", toTeam: "Team 2", label: "VPN" },
    { from: "Access Router", fromTeam: "Team 1", to: "Linux Firewall", toTeam: "Team 1", label: "" },
    { from: "Access Router", fromTeam: "Team 2", to: "Linux Firewall", toTeam: "Team 2", label: "" },
    { from: "Linux Firewall", fromTeam: "Team 1", to: "tips Webserver", toTeam: "Team 1", label: "DMZ" },
    { from: "Linux Firewall", fromTeam: "Team 2", to: "tips Webserver", toTeam: "Team 2", label: "DMZ" },
    { from: "Linux Firewall", fromTeam: "Team 1", to: "Fileserver", toTeam: "Team 1", label: "INT" },
    { from: "Linux Firewall", fromTeam: "Team 2", to: "Fileserver", toTeam: "Team 2", label: "INT" },
  ],
};

const CYGWDEX_X_SCALE = 1;
const CYGWDEX_Y_SCALE = 1;
const MIN_TOPOLOGY_ZOOM = 0.35;
const MAX_TOPOLOGY_ZOOM = 2.5;
const DEFAULT_TOPOLOGY_ZOOM = 1;

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const headerClock = byId<HTMLElement>("header-clock");
const lastSyncEl = byId<HTMLElement>("network-last-sync");
const statusEl = byId<HTMLDivElement>("network-status");
const importTextEl = byId<HTMLTextAreaElement>("network-import-json");
const loadSampleButton = byId<HTMLButtonElement>("network-load-sample");
const loadCygwdexButton = byId<HTMLButtonElement>("network-load-cygwdex");
const importButton = byId<HTMLButtonElement>("network-import-btn");
const refreshButton = byId<HTMLButtonElement>("network-refresh-btn");
const fullscreenButton = byId<HTMLButtonElement>("network-fullscreen-btn");
const adminToggleButton = byId<HTMLButtonElement>("network-admin-toggle");
const adminPopover = byId<HTMLDivElement>("network-admin-popover");
const adminForm = byId<HTMLFormElement>("network-admin-form");
const adminPasswordInput = byId<HTMLInputElement>("network-admin-password");
const adminStatusEl = byId<HTMLDivElement>("network-admin-status");
const enableEditModeButton = byId<HTMLButtonElement>("network-edit-enable-btn");
const disableEditModeButton = byId<HTMLButtonElement>("network-edit-disable-btn");
const boardEl = byId<HTMLElement>("network-board");
const boardPanelEl = byId<HTMLElement>("network-board-panel");
const deviceEventsDialog = byId<HTMLDialogElement>("network-device-events-dialog");
const deviceEventsTitleEl = byId<HTMLHeadingElement>("network-device-events-title");
const deviceEventsCloseButton = byId<HTMLButtonElement>("network-device-events-close");
const deviceEventsStatusEl = byId<HTMLDivElement>("network-device-events-status");
const deviceEventsListEl = byId<HTMLDivElement>("network-device-events-list");

let lastChangeSignature = "";
let currentDevices: NetworkDevice[] = [];
let currentLinks: NetworkLink[] = [];
let editModeEnabled = false;
let adminPasswordCache = "";
let adminBusy = false;
let topologyZoom = DEFAULT_TOPOLOGY_ZOOM;
let topologyBaseWidth = 0;
let topologyBaseHeight = 0;
let topologyScrollEl: HTMLDivElement | null = null;
let topologyStageEl: HTMLDivElement | null = null;
let topologyCanvasEl: HTMLDivElement | null = null;
let isPanningTopology = false;
let panStartX = 0;
let panStartY = 0;
let panStartScrollLeft = 0;
let panStartScrollTop = 0;
let topologyUserAdjustedZoom = false;

function buildScaledCygwdexTemplate(): NetworkImportPayload {
  const devices = CYGWDEX_TEMPLATE.devices.map((device) => ({
    ...device,
    x: typeof device.x === "number" ? Math.round(device.x * CYGWDEX_X_SCALE) : undefined,
    y: typeof device.y === "number" ? Math.round(device.y * CYGWDEX_Y_SCALE) : undefined,
  }));

  const links = CYGWDEX_TEMPLATE.links.map((link) => ({ ...link }));
  return { devices, links };
}

function setImportPayload(payload: unknown): void {
  importTextEl.value = JSON.stringify(payload, null, 2);
}

function escapeHtml(value: unknown): string {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function toNumericId(value: unknown): number | null {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
}

function formatDate(value: string | null | undefined): string {
  if (!value) {
    return "-";
  }

  const date = new Date(value);
  if (Number.isNaN(date.valueOf())) {
    return "-";
  }

  return date.toLocaleString();
}

function eventRef(value: number | null | undefined): string {
  if (!value) {
    return "-";
  }

  return `EV-${String(value).padStart(4, "0")}`;
}

function iconForType(type: NetworkDeviceType): string {
  switch (type) {
    case "Internet":
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="12" r="8"></circle>
          <path d="M4 12h16"></path>
          <path d="M12 4a12 12 0 0 1 0 16"></path>
          <path d="M12 4a12 12 0 0 0 0 16"></path>
        </svg>
      `;
    case "Router":
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="9" width="16" height="8" rx="2"></rect>
          <path d="M9 9V7l3-2 3 2v2"></path>
          <circle cx="9" cy="13" r="1"></circle>
          <circle cx="12" cy="13" r="1"></circle>
          <circle cx="15" cy="13" r="1"></circle>
        </svg>
      `;
    case "Firewall":
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2"></rect>
          <path d="M4 10h16M4 15h16M9 4v6M14 10v5M9 15v5M14 4v6"></path>
        </svg>
      `;
    case "DMZ":
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z"></path>
          <path d="M9.5 12.5l1.8 1.8 3.2-3.2"></path>
        </svg>
      `;
    case "Server":
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="4" width="16" height="6" rx="1.5"></rect>
          <rect x="4" y="14" width="16" height="6" rx="1.5"></rect>
          <circle cx="8" cy="7" r="0.8"></circle>
          <circle cx="8" cy="17" r="0.8"></circle>
          <path d="M11 7h6M11 17h6"></path>
        </svg>
      `;
    case "Workstations":
      return `
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4" y="5" width="16" height="10" rx="1.5"></rect>
          <path d="M9 19h6M12 15v4"></path>
        </svg>
      `;
    default:
      return "";
  }
}

function setStatus(message = "", isError = false): void {
  statusEl.textContent = message;
  statusEl.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
}

function setAdminStatus(message = "", isError = false): void {
  adminStatusEl.textContent = message;
  adminStatusEl.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
}

function setDeviceEventsStatus(message = "", isError = false): void {
  deviceEventsStatusEl.textContent = message;
  deviceEventsStatusEl.className = `status ${message ? (isError ? "error" : "ok") : ""}`;
}

function setAdminBusy(disabled: boolean): void {
  adminBusy = disabled;
  enableEditModeButton.disabled = disabled || editModeEnabled;
  disableEditModeButton.disabled = disabled || !editModeEnabled;
}

function normalizeTeam(team: string | null | undefined): string {
  return typeof team === "string" ? team.trim() : "";
}

function parseTeamNumber(teamLabel: string | null | undefined): number | null {
  const normalized = normalizeTeam(teamLabel).toLowerCase();
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

function teamThemeClass(team: string | null | undefined): string {
  const normalized = normalizeTeam(team).toLowerCase();
  if (normalized.includes("team 1") || normalized.includes("team1")) {
    return "team-1";
  }
  if (normalized.includes("team 2") || normalized.includes("team2")) {
    return "team-2";
  }
  if (normalized.includes("shared")) {
    return "team-shared";
  }
  return "team-generic";
}

function zoneThemeClass(zone: string | null | undefined): string {
  const normalized = normalizeTeam(zone).toLowerCase();
  if (normalized === "dmz") {
    return "zone-dmz";
  }
  if (normalized === "internet") {
    return "zone-internet";
  }
  if (normalized === "infra") {
    return "zone-infra";
  }
  if (normalized === "int" || normalized === "internal") {
    return "zone-int";
  }
  return "zone-generic";
}

function networkNodeKey(name: string, team: string | null | undefined): string {
  return `${name.trim().toLowerCase()}::${normalizeTeam(team).toLowerCase()}`;
}

function getErrorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback;
}

function updateFullscreenButtonLabel(): void {
  const active = document.fullscreenElement === boardPanelEl;
  fullscreenButton.textContent = active ? "Exit Fullscreen" : "Fullscreen";
}

function clampTopologyZoom(value: number): number {
  return Math.min(MAX_TOPOLOGY_ZOOM, Math.max(MIN_TOPOLOGY_ZOOM, value));
}

function applyTopologyZoom(): void {
  if (!topologyStageEl || !topologyCanvasEl || !topologyBaseWidth || !topologyBaseHeight) {
    return;
  }

  topologyStageEl.style.width = `${topologyBaseWidth * topologyZoom}px`;
  topologyStageEl.style.height = `${topologyBaseHeight * topologyZoom}px`;
  topologyCanvasEl.style.transform = `scale(${topologyZoom})`;
}

function centerTopologyViewport(): void {
  if (!topologyScrollEl || !topologyStageEl || !topologyBaseWidth || !topologyBaseHeight) {
    return;
  }

  const stageWidth = topologyBaseWidth * topologyZoom;
  const stageHeight = topologyBaseHeight * topologyZoom;
  const padX = Math.max(0, (topologyScrollEl.clientWidth - stageWidth) / 2);
  const padY = Math.max(0, (topologyScrollEl.clientHeight - stageHeight) / 2);
  topologyStageEl.style.marginLeft = `${padX}px`;
  topologyStageEl.style.marginRight = `${padX}px`;
  topologyStageEl.style.marginTop = `${padY}px`;
  topologyStageEl.style.marginBottom = `${padY}px`;

  const contentWidth = stageWidth + padX * 2;
  const contentHeight = stageHeight + padY * 2;
  topologyScrollEl.scrollLeft = Math.max(0, (contentWidth - topologyScrollEl.clientWidth) / 2);
  topologyScrollEl.scrollTop = Math.max(0, (contentHeight - topologyScrollEl.clientHeight) / 2);
}

function setTopologyZoom(
  nextZoom: number,
  options?: {
    viewportX?: number;
    viewportY?: number;
    markUser?: boolean;
    centerViewport?: boolean;
  },
): void {
  if (!topologyScrollEl || !topologyStageEl || !topologyCanvasEl) {
    return;
  }

  const prevZoom = topologyZoom;
  topologyZoom = clampTopologyZoom(nextZoom);
  if (Math.abs(topologyZoom - prevZoom) < 0.001) {
    return;
  }

  const centerViewport = options?.centerViewport !== false;
  if (centerViewport) {
    applyTopologyZoom();
    centerTopologyViewport();
    if (options?.markUser !== false) {
      topologyUserAdjustedZoom = true;
    }
    return;
  }

  const ratio = topologyZoom / prevZoom;
  const focusX = options?.viewportX ?? topologyScrollEl.clientWidth / 2;
  const focusY = options?.viewportY ?? topologyScrollEl.clientHeight / 2;
  const worldX = topologyScrollEl.scrollLeft + focusX;
  const worldY = topologyScrollEl.scrollTop + focusY;

  applyTopologyZoom();

  topologyScrollEl.scrollLeft = Math.max(0, worldX * ratio - focusX);
  topologyScrollEl.scrollTop = Math.max(0, worldY * ratio - focusY);
  if (options?.markUser !== false) {
    topologyUserAdjustedZoom = true;
  }
}

function fitTopologyToViewport(markUser = true): void {
  if (!topologyScrollEl || !topologyBaseWidth || !topologyBaseHeight) {
    return;
  }

  const availableWidth = Math.max(80, topologyScrollEl.clientWidth - 28);
  const availableHeight = Math.max(80, topologyScrollEl.clientHeight - 28);
  const fit = Math.min(
    availableWidth / topologyBaseWidth,
    availableHeight / topologyBaseHeight,
  );
  setTopologyZoom(clampTopologyZoom(fit), { markUser, centerViewport: true });
}

function stopTopologyPan(): void {
  if (!isPanningTopology) {
    return;
  }

  isPanningTopology = false;
  if (topologyScrollEl) {
    topologyScrollEl.classList.remove("is-panning");
  }
}

function bindTopologyInteractions(scrollEl: HTMLDivElement): void {
  scrollEl.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      const zoomFactor = Math.exp(-event.deltaY * 0.0018);
      setTopologyZoom(topologyZoom * zoomFactor, {
        centerViewport: true,
      });
    },
    { passive: false },
  );

  scrollEl.addEventListener("mousedown", (event) => {
    if (event.button !== 0 && event.button !== 1) {
      return;
    }

    const target = event.target;
    if (
      target instanceof HTMLElement &&
      target.closest(".network-device, button, input, select, textarea, a")
    ) {
      return;
    }

    event.preventDefault();
    isPanningTopology = true;
    panStartX = event.clientX;
    panStartY = event.clientY;
    panStartScrollLeft = scrollEl.scrollLeft;
    panStartScrollTop = scrollEl.scrollTop;
    scrollEl.classList.add("is-panning");
  });
}

function updateHeaderClock(): void {
  headerClock.textContent = new Date().toLocaleString();
}

function updateLastSync(): void {
  lastSyncEl.textContent = `Last sync: ${new Date().toLocaleTimeString()}`;
}

function deviceStatusClass(status: NetworkDeviceStatus | undefined): string {
  if (!status) {
    return "";
  }

  const classes: string[] = [];
  if (status.isCompromised) {
    classes.push("is-compromised");
  }
  if (status.isOut) {
    classes.push("is-out");
  }

  return classes.join(" ");
}

function ipAddressParts(value: string): string[] {
  return value
    .split(/[\n;,]/g)
    .map((part) => part.trim())
    .filter(Boolean);
}

function renderIpAddressHtml(value: string): string {
  const parts = ipAddressParts(value);
  if (parts.length === 0) {
    return "No IP set";
  }

  return parts.map((part) => escapeHtml(part)).join("<br />");
}

function estimateDeviceCardHeight(device: NetworkDevice): number {
  const lineCount = Math.max(1, ipAddressParts(device.ipAddress).length);
  const titleLines = Math.max(1, Math.ceil(device.name.length / 18));
  let estimate = 92 + titleLines * 14 + lineCount * 14;
  // Details action is always visible on topology cards.
  estimate += 26;
  if (device.status && (device.status.isCompromised || device.status.isOut)) {
    estimate += 52;
  }
  if (editModeEnabled && toNumericId(device.id)) {
    estimate += 40;
  }

  return Math.max(136, estimate);
}

function renderDeviceCard(
  device: NetworkDevice,
  extraClass = "",
  minHeight: number | null = null,
): string {
  const status = device.status;
  const statusClass = deviceStatusClass(status);
  const teamLabel = normalizeTeam(device.team) || "Shared";
  const resolvedTeamNumber =
    typeof device.teamNumber === "number" ? device.teamNumber : parseTeamNumber(device.team);
  const numericId = toNumericId(device.id);
  const statusMeta =
    status && (status.isCompromised || status.isOut)
      ? `
        <p class="network-device-meta">
          Source: ${escapeHtml(eventRef(status.sourceEventId))} · ${escapeHtml(
            formatDate(status.sourceOccurredAt),
          )}
        </p>
      `
      : `<p class="network-device-meta muted">No active incident marker.</p>`;
  const renameForm =
    editModeEnabled && numericId
      ? `
        <form class="network-rename-form" data-device-id="${numericId}">
          <input
            class="network-rename-input"
            type="text"
            maxlength="120"
            value="${escapeHtml(device.name)}"
            aria-label="Rename machine"
            required
          />
          <button class="secondary-btn network-mini-btn" type="submit">Save</button>
        </form>
      `
      : "";
  const detailsButton = `
    <button
      class="ghost-btn network-mini-btn network-device-details-btn"
      type="button"
      data-device-name="${escapeHtml(device.name)}"
      data-device-team="${escapeHtml(teamLabel)}"
      data-device-team-number="${resolvedTeamNumber ?? ""}"
      aria-label="Show event history for ${escapeHtml(device.name)}"
    >
      Details
    </button>
  `;
  const style = minHeight ? `style="min-height:${Math.round(minHeight)}px;"` : "";

  return `
    <article class="network-device ${statusClass} ${extraClass}" ${style}>
      <div class="network-device-core">
        <div class="network-device-head">
          <span class="network-device-icon" title="${escapeHtml(device.type)}">
            ${iconForType(device.type)}
          </span>
          <h4>${escapeHtml(device.name)}</h4>
        </div>
        <p class="network-device-team">${escapeHtml(teamLabel)}</p>
        <p class="network-device-ip">${renderIpAddressHtml(device.ipAddress)}</p>
        <div class="network-device-actions">${detailsButton}</div>
      </div>
      ${statusMeta}
      ${renameForm}
    </article>
  `;
}

function sortedDevices(devices: NetworkDevice[]): NetworkDevice[] {
  const copy = [...devices];
  copy.sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }

    const aId = toNumericId(a.id) ?? 0;
    const bId = toNumericId(b.id) ?? 0;
    return aId - bId;
  });
  return copy;
}

function isPositionedDevice(device: NetworkDevice): boolean {
  return typeof device.posX === "number" && typeof device.posY === "number";
}

function isEndpointDevice(device: NetworkDevice): boolean {
  const nameLower = device.name.trim().toLowerCase();
  return device.type === "Workstations" || nameLower.includes("fileserver");
}

function isDnsName(name: string): boolean {
  return name.trim().toLowerCase() === "dns";
}

function renderLaneBoard(devices: NetworkDevice[]): void {
  if (devices.length === 0) {
    boardEl.innerHTML = `<div class="entry-empty">No network devices imported yet.</div>`;
    return;
  }

  const grouped = new Map<NetworkDeviceType, NetworkDevice[]>();
  for (const lane of NETWORK_ORDER) {
    grouped.set(lane, []);
  }

  for (const device of devices) {
    const list = grouped.get(device.type);
    if (!list) {
      continue;
    }
    list.push(device);
  }

  for (const lane of NETWORK_ORDER) {
    const list = grouped.get(lane) ?? [];
    grouped.set(lane, sortedDevices(list));
  }

  boardEl.innerHTML = NETWORK_ORDER
    .map((lane) => {
      const laneDevices = grouped.get(lane) ?? [];
      const cards =
        laneDevices.length === 0
          ? `<div class="entry-empty network-empty">No devices</div>`
          : laneDevices.map((device) => renderDeviceCard(device)).join("");

      return `
      <section class="network-lane">
        <div class="network-lane-head">
          <h3>${escapeHtml(lane)}</h3>
          <span class="muted">${escapeHtml(laneDevices.length)} devices</span>
        </div>
        <div class="network-lane-grid">
          ${cards}
        </div>
      </section>
    `;
    })
    .join("");
}

function renderTopologyBoard(devices: NetworkDevice[], links: NetworkLink[]): void {
  const positioned = sortedDevices(devices).filter(isPositionedDevice);
  if (positioned.length === 0) {
    topologyScrollEl = null;
    topologyStageEl = null;
    topologyCanvasEl = null;
    topologyBaseWidth = 0;
    topologyBaseHeight = 0;
    renderLaneBoard(devices);
    return;
  }

  const CARD_WIDTH = 154;
  const PAD = 34;

  type LayoutItem = {
    device: NetworkDevice;
    x: number;
    y: number;
    width: number;
    height: number;
    cx: number;
    cy: number;
  };

  type NodeRect = {
    x: number;
    y: number;
    cx: number;
    cy: number;
    width: number;
    height: number;
  };

  const rawMinX = Math.min(...positioned.map((device) => device.posX as number));
  const rawMinY = Math.min(...positioned.map((device) => device.posY as number));
  const rawMaxX = Math.max(...positioned.map((device) => device.posX as number));
  const rawMaxY = Math.max(...positioned.map((device) => device.posY as number));
  const rawWidth = rawMaxX - rawMinX + CARD_WIDTH;
  const rawHeight = rawMaxY - rawMinY + 180;
  const SAME_ROW_THRESHOLD = 64;
  let minRowDeltaX = Number.POSITIVE_INFINITY;
  for (let i = 0; i < positioned.length; i += 1) {
    const a = positioned[i];
    if (!a) {
      continue;
    }
    const ax = a.posX as number;
    const ay = a.posY as number;
    for (let j = i + 1; j < positioned.length; j += 1) {
      const b = positioned[j];
      if (!b) {
        continue;
      }
      const by = b.posY as number;
      const deltaY = Math.abs(ay - by);
      if (deltaY > SAME_ROW_THRESHOLD) {
        continue;
      }

      const deltaX = Math.abs(ax - (b.posX as number));
      if (deltaX > 0 && deltaX < minRowDeltaX) {
        minRowDeltaX = deltaX;
      }
    }
  }

  const desiredRowSpacing = CARD_WIDTH + 6;
  const spacingScaleX =
    Number.isFinite(minRowDeltaX) && minRowDeltaX > 0
      ? Math.max(1, desiredRowSpacing / minRowDeltaX)
      : 1;
  const expandedWidth = rawWidth * spacingScaleX;
  const compactScaleX = expandedWidth > 2500 ? 2500 / rawWidth : spacingScaleX;
  const compactScaleY = Math.min(0.9, rawHeight > 980 ? 980 / rawHeight : 0.9);

  const allLayout: LayoutItem[] = positioned.map((device) => {
    const x = PAD + ((device.posX as number) - rawMinX) * compactScaleX;
    const y = PAD + ((device.posY as number) - rawMinY) * compactScaleY;
    const height = estimateDeviceCardHeight(device);
    return {
      device,
      x,
      y,
      width: CARD_WIDTH,
      height,
      cx: x + CARD_WIDTH / 2,
      cy: y + height / 2,
    };
  });

  // Tighten workstation spacing per team/row so endpoint blocks match the reference layout.
  const WORKSTATION_ROW_THRESHOLD = 60;
  const WORKSTATION_HORIZONTAL_GAP = 4;
  const WORKSTATION_VERTICAL_GAP = 8;
  const workstationsByTeam = new Map<string, LayoutItem[]>();
  for (const item of allLayout) {
    if (item.device.type !== "Workstations") {
      continue;
    }
    const team = normalizeTeam(item.device.team) || "Shared";
    const list = workstationsByTeam.get(team) ?? [];
    list.push(item);
    workstationsByTeam.set(team, list);
  }

  for (const items of workstationsByTeam.values()) {
    const sortedByY = [...items].sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });

    const rows: LayoutItem[][] = [];
    for (const item of sortedByY) {
      let placed = false;
      for (const row of rows) {
        const rowY = row.reduce((sum, current) => sum + current.y, 0) / row.length;
        if (Math.abs(item.y - rowY) <= WORKSTATION_ROW_THRESHOLD) {
          row.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([item]);
      }
    }

    for (const row of rows) {
      row.sort((a, b) => a.x - b.x);
      if (row.length < 2) {
        continue;
      }

      const first = row[0];
      const last = row[row.length - 1];
      if (!first || !last) {
        continue;
      }

      const originalMid = (first.x + (last.x + last.width)) / 2;
      let cursor = first.x;
      for (const item of row) {
        item.x = cursor;
        item.cx = item.x + item.width / 2;
        cursor += item.width + WORKSTATION_HORIZONTAL_GAP;
      }

      const rowFirst = row[0];
      const rowLast = row[row.length - 1];
      if (!rowFirst || !rowLast) {
        continue;
      }
      const compactMid = (rowFirst.x + (rowLast.x + rowLast.width)) / 2;
      const offset = originalMid - compactMid;
      for (const item of row) {
        item.x += offset;
        item.cx = item.x + item.width / 2;
      }
    }

    // Keep rows from overlapping when some cards are taller (status/source metadata).
    if (rows.length > 1) {
      const firstRow = rows[0];
      if (!firstRow) {
        continue;
      }
      let nextRowY = Math.min(...firstRow.map((item) => item.y));
      for (const row of rows) {
        const originalTop = Math.min(...row.map((item) => item.y));
        const rowTop = Math.max(originalTop, nextRowY);
        const rowHeight = Math.max(...row.map((item) => item.height));
        for (const item of row) {
          item.y = rowTop;
          item.cy = item.y + item.height / 2;
        }
        nextRowY = rowTop + rowHeight + WORKSTATION_VERTICAL_GAP;
      }
    }
  }

  const setLayoutX = (item: LayoutItem, nextX: number): void => {
    item.x = nextX;
    item.cx = item.x + item.width / 2;
  };

  const setLayoutY = (item: LayoutItem, nextY: number): void => {
    item.y = nextY;
    item.cy = item.y + item.height / 2;
  };

  const enforceRowNonOverlap = (
    items: LayoutItem[],
    options?: { rowThreshold?: number; minGapX?: number; minGapY?: number },
  ): void => {
    if (items.length < 2) {
      return;
    }

    const rowThreshold = options?.rowThreshold ?? 56;
    const minGapX = options?.minGapX ?? 12;
    const minGapY = options?.minGapY ?? 10;
    const sorted = [...items].sort((a, b) => {
      if (a.y !== b.y) {
        return a.y - b.y;
      }
      return a.x - b.x;
    });

    const rows: LayoutItem[][] = [];
    for (const item of sorted) {
      let placed = false;
      for (const row of rows) {
        const rowY = row.reduce((sum, current) => sum + current.y, 0) / row.length;
        if (Math.abs(item.y - rowY) <= rowThreshold) {
          row.push(item);
          placed = true;
          break;
        }
      }
      if (!placed) {
        rows.push([item]);
      }
    }

    for (const row of rows) {
      if (row.length < 2) {
        continue;
      }
      row.sort((a, b) => a.x - b.x);

      const first = row[0];
      const last = row[row.length - 1];
      if (!first || !last) {
        continue;
      }
      const originalMid = (first.x + (last.x + last.width)) / 2;

      let previousRight = first.x + first.width;
      for (let index = 1; index < row.length; index += 1) {
        const item = row[index];
        if (!item) {
          continue;
        }
        const minimumX = previousRight + minGapX;
        if (item.x < minimumX) {
          setLayoutX(item, minimumX);
        }
        previousRight = item.x + item.width;
      }

      const compactFirst = row[0];
      const compactLast = row[row.length - 1];
      if (!compactFirst || !compactLast) {
        continue;
      }
      const compactMid = (compactFirst.x + (compactLast.x + compactLast.width)) / 2;
      const offset = originalMid - compactMid;
      for (const item of row) {
        setLayoutX(item, item.x + offset);
      }
    }

    const rowBlocks = rows
      .map((row) => ({
        row,
        top: Math.min(...row.map((item) => item.y)),
        height: Math.max(...row.map((item) => item.height)),
      }))
      .sort((a, b) => a.top - b.top);

    let nextTop: number | null = null;
    for (const block of rowBlocks) {
      let top = Math.min(...block.row.map((item) => item.y));
      if (nextTop !== null && top < nextTop) {
        const shift = nextTop - top;
        for (const item of block.row) {
          setLayoutY(item, item.y + shift);
        }
        top += shift;
      }
      nextTop = top + block.height + minGapY;
    }
  };

  // Topology tuning per team:
  // - reduce router/firewall gap
  // - keep DMZ centered between them
  // - place fileserver directly under left Win workstation
  const layoutByTeam = new Map<string, LayoutItem[]>();
  for (const item of allLayout) {
    const team = normalizeTeam(item.device.team) || "Shared";
    const list = layoutByTeam.get(team) ?? [];
    list.push(item);
    layoutByTeam.set(team, list);
  }

  for (const [teamName, teamItems] of layoutByTeam.entries()) {
    const router = teamItems.find((item) =>
      item.device.name.trim().toLowerCase().includes("router"),
    );
    const firewall = teamItems.find((item) =>
      item.device.name.trim().toLowerCase().includes("firewall"),
    );
    const dmz = teamItems.find(
      (item) =>
        item.device.type === "DMZ" ||
        normalizeTeam(item.device.zone).toLowerCase() === "dmz",
    );
    if (router && firewall) {
      const infraRowY = Math.min(router.y, firewall.y);
      setLayoutY(router, infraRowY);
      setLayoutY(firewall, infraRowY);

      const centerBetween = (router.cx + firewall.cx) / 2;
      const teamClass = teamThemeClass(teamName);
      let leftItem = router.x <= firewall.x ? router : firewall;
      let rightItem = leftItem === router ? firewall : router;
      if (teamClass === "team-1") {
        leftItem = router;
        rightItem = firewall;
      } else if (teamClass === "team-2") {
        leftItem = firewall;
        rightItem = router;
      }
      if (dmz) {
        const gapToDmz = 20;
        setLayoutX(
          leftItem,
          centerBetween - dmz.width / 2 - gapToDmz - leftItem.width,
        );
        setLayoutX(rightItem, centerBetween + dmz.width / 2 + gapToDmz);
        setLayoutX(dmz, centerBetween - dmz.width / 2);
        setLayoutY(dmz, infraRowY);
      } else {
        const targetGap = 92;
        const leftRightEdge = centerBetween - targetGap / 2;
        const rightLeftEdge = centerBetween + targetGap / 2;
        setLayoutX(leftItem, leftRightEdge - leftItem.width);
        setLayoutX(rightItem, rightLeftEdge);
      }

      const lowerItem = router.cy >= firewall.cy ? router : firewall;
      const upperItem = lowerItem === router ? firewall : router;
      if (Math.abs(router.cy - firewall.cy) > 0.5) {
        setLayoutY(lowerItem, upperItem.y);
      }

      if (dmz) {
        const dmzCenter = (router.cx + firewall.cx) / 2;
        setLayoutX(dmz, dmzCenter - dmz.width / 2);
      }
    }

    const fileserver = teamItems.find((item) =>
      item.device.name.trim().toLowerCase().includes("fileserver"),
    );
    const winWorkstations = teamItems
      .filter((item) => item.device.name.trim().toLowerCase().includes("win workstation"))
      .sort((a, b) => {
        if (a.y !== b.y) {
          return a.y - b.y;
        }
        return a.x - b.x;
      });
    if (fileserver && winWorkstations.length > 0) {
      const leftWin = winWorkstations[0];
      if (leftWin) {
        const winBottom = Math.max(
          ...winWorkstations.map((item) => item.y + item.height),
        );
        setLayoutX(fileserver, leftWin.x);
        setLayoutY(fileserver, winBottom + 8);
      }
    }
  }

  const infraItems = allLayout.filter((item) => {
    const name = item.device.name.trim().toLowerCase();
    return name.includes("router") || name.includes("firewall");
  });
  if (infraItems.length > 0) {
    const sharedInfraY = Math.min(...infraItems.map((item) => item.y));
    for (const item of infraItems) {
      setLayoutY(item, sharedInfraY);
    }
  }

  const dmzItems = allLayout.filter(
    (item) =>
      item.device.type === "DMZ" ||
      normalizeTeam(item.device.zone).toLowerCase() === "dmz",
  );
  if (dmzItems.length > 0) {
    const sharedDmzY =
      infraItems.length > 0
        ? Math.min(...infraItems.map((item) => item.y))
        : Math.min(...dmzItems.map((item) => item.y));
    for (const item of dmzItems) {
      setLayoutY(item, sharedDmzY);
    }
  }

  const moveItemsX = (items: LayoutItem[], offsetX: number): void => {
    if (offsetX === 0) {
      return;
    }
    for (const item of items) {
      setLayoutX(item, item.x + offsetX);
    }
  };

  const team1Items = allLayout.filter((item) => teamThemeClass(item.device.team) === "team-1");
  const team2Items = allLayout.filter((item) => teamThemeClass(item.device.team) === "team-2");
  if (team1Items.length > 0 && team2Items.length > 0) {
    const team1Right = Math.max(...team1Items.map((item) => item.x + item.width));
    const team2Left = Math.min(...team2Items.map((item) => item.x));
    const currentGap = team2Left - team1Right;
    const targetGap = 28;
    if (currentGap > targetGap) {
      const shift = (currentGap - targetGap) / 2;
      moveItemsX(team1Items, shift);
      moveItemsX(team2Items, -shift);
    }
  }

  for (const teamItems of layoutByTeam.values()) {
    const nonEndpointItems = teamItems.filter((item) => !isEndpointDevice(item.device));
    enforceRowNonOverlap(nonEndpointItems, {
      rowThreshold: 52,
      minGapX: 14,
      minGapY: 12,
    });
  }

  const internetItem = allLayout.find(
    (item) =>
      item.device.type === "Internet" ||
      normalizeTeam(item.device.zone).toLowerCase() === "internet",
  );
  if (internetItem && team1Items.length > 0 && team2Items.length > 0) {
    const team1Center =
      (Math.min(...team1Items.map((item) => item.x)) +
        Math.max(...team1Items.map((item) => item.x + item.width))) /
      2;
    const team2Center =
      (Math.min(...team2Items.map((item) => item.x)) +
        Math.max(...team2Items.map((item) => item.x + item.width))) /
      2;
    const internetCenter = (team1Center + team2Center) / 2;
    setLayoutX(internetItem, internetCenter - internetItem.width / 2);
    if (dmzItems.length > 0) {
      const dmzTopY = Math.min(...dmzItems.map((item) => item.y));
      setLayoutY(internetItem, Math.max(PAD, dmzTopY - internetItem.height - 28));
    }
  }

  const endpointLayout = allLayout.filter((item) => isEndpointDevice(item.device));
  const endpointLayoutByTeam = new Map<string, LayoutItem[]>();
  const endpointNameSet = new Set<string>();
  for (const item of endpointLayout) {
    const team = normalizeTeam(item.device.team) || "Shared";
    const list = endpointLayoutByTeam.get(team) ?? [];
    list.push(item);
    endpointLayoutByTeam.set(team, list);
    endpointNameSet.add(item.device.name.trim().toLowerCase());
  }

  const endpointRects = Array.from(endpointLayoutByTeam.entries()).map(([team, items]) => {
    const left = Math.min(...items.map((item) => item.x)) - 6;
    const top = Math.min(...items.map((item) => item.y)) - 6;
    const right = Math.max(...items.map((item) => item.x + item.width)) + 6;
    const bottom = Math.max(...items.map((item) => item.y + item.height)) + 6;
    return {
      team,
      left,
      top,
      right,
      bottom,
      cx: (left + right) / 2,
    };
  });

  const layoutRects: Array<{ x: number; y: number; width: number; height: number }> = [...allLayout];
  const canvasWidth = Math.max(...layoutRects.map((item) => item.x + item.width)) + PAD;
  const canvasHeight = Math.max(...layoutRects.map((item) => item.y + item.height)) + PAD;

  const keyedRect = new Map<string, NodeRect>();
  const namedRect = new Map<string, NodeRect>();
  for (const item of allLayout) {
    const rect: NodeRect = {
      x: item.x,
      y: item.y,
      cx: item.cx,
      cy: item.cy,
      width: item.width,
      height: item.height,
    };
    keyedRect.set(networkNodeKey(item.device.name, item.device.team), rect);
    const nameKey = item.device.name.trim().toLowerCase();
    if (!namedRect.has(nameKey)) {
      namedRect.set(nameKey, rect);
    }
  }

  const teamGroups = new Map<string, Array<{ x: number; y: number; width: number; height: number }>>();
  const zoneGroups = new Map<string, Array<{ x: number; y: number; width: number; height: number }>>();
  const teamFirewall = new Map<string, NodeRect>();
  const teamRouter = new Map<string, NodeRect>();
  for (const item of allLayout) {
    const { device, x, y, width, height } = item;
    const team = normalizeTeam(device.team) || "Shared";
    const zone = normalizeTeam(device.zone);

    const teamList = teamGroups.get(team) ?? [];
    teamList.push({ x, y, width, height });
    teamGroups.set(team, teamList);

    if (zone) {
      const zoneKey = `${team}::${zone}`;
      const zoneList = zoneGroups.get(zoneKey) ?? [];
      zoneList.push({ x, y, width, height });
      zoneGroups.set(zoneKey, zoneList);
    }

    if (device.name.trim().toLowerCase().includes("firewall")) {
      teamFirewall.set(team, {
        x,
        y,
        cx: item.cx,
        cy: item.cy,
        width,
        height,
      });
    }

    if (device.name.trim().toLowerCase().includes("router")) {
      teamRouter.set(team, {
        x,
        y,
        cx: item.cx,
        cy: item.cy,
        width,
        height,
      });
    }
  }

  const teamBounds = Array.from(teamGroups.entries()).map(([team, points]) => {
    const left = Math.min(...points.map((point) => point.x)) - 8;
    const top = Math.min(...points.map((point) => point.y)) - 10;
    const right = Math.max(...points.map((point) => point.x + point.width)) + 8;
    const bottom = Math.max(...points.map((point) => point.y + point.height)) + 8;
    const teamClass = teamThemeClass(team);
    return { team, teamClass, left, top, right, bottom };
  });
  const team1Bound = teamBounds.find((bound) => bound.teamClass === "team-1");
  const team2Bound = teamBounds.find((bound) => bound.teamClass === "team-2");
  if (team1Bound && team2Bound) {
    const sharedTop = Math.min(team1Bound.top, team2Bound.top);
    const sharedBottom = Math.max(team1Bound.bottom, team2Bound.bottom);
    team1Bound.top = sharedTop;
    team2Bound.top = sharedTop;
    team1Bound.bottom = sharedBottom;
    team2Bound.bottom = sharedBottom;
  }
  const teamBoxes = teamBounds
    .map((bound) => {
      return `
        <div class="network-team-box ${bound.teamClass}" style="left:${bound.left}px;top:${bound.top}px;width:${bound.right - bound.left}px;height:${bound.bottom - bound.top}px;">
          <span>${escapeHtml(bound.team)}</span>
        </div>
      `;
    })
    .join("");

  const zoneBounds = Array.from(zoneGroups.entries())
    .map(([key, points]) => {
      const [team, zone] = key.split("::");
      const zoneName = normalizeTeam(zone).toLowerCase();
      if (zoneName === "infra") {
        return null;
      }
      const padX = zoneName === "internet" ? 11 : zoneName === "dmz" ? 7 : 6;
      const padY = zoneName === "internet" ? 12 : zoneName === "dmz" ? 7 : 6;
      const left = Math.min(...points.map((point) => point.x)) - padX;
      const top = Math.min(...points.map((point) => point.y)) - padY;
      const right = Math.max(...points.map((point) => point.x + point.width)) + padX;
      const bottom = Math.max(...points.map((point) => point.y + point.height)) + padY;
      const teamClass = teamThemeClass(team);
      const zoneClass = zoneThemeClass(zone);
      return { team, zone, zoneName, teamClass, zoneClass, left, top, right, bottom };
    })
    .filter(
      (
        bound,
      ): bound is {
        team: string;
        zone: string;
        zoneName: string;
        teamClass: string;
        zoneClass: string;
        left: number;
        top: number;
        right: number;
        bottom: number;
      } => Boolean(bound),
    );
  const dmz1 = zoneBounds.find(
    (bound) => bound.zoneName === "dmz" && bound.teamClass === "team-1",
  );
  const dmz2 = zoneBounds.find(
    (bound) => bound.zoneName === "dmz" && bound.teamClass === "team-2",
  );
  if (dmz1 && dmz2) {
    const sharedTop = Math.min(dmz1.top, dmz2.top);
    const sharedBottom = Math.max(dmz1.bottom, dmz2.bottom);
    dmz1.top = sharedTop;
    dmz2.top = sharedTop;
    dmz1.bottom = sharedBottom;
    dmz2.bottom = sharedBottom;
  }
  const zoneBoxes = zoneBounds
    .map((bound) => {
      return `
        <div class="network-zone-box ${bound.teamClass} ${bound.zoneClass}" style="left:${bound.left}px;top:${bound.top}px;width:${bound.right - bound.left}px;height:${bound.bottom - bound.top}px;">
          <span>${escapeHtml(bound.zone)} · ${escapeHtml(bound.team)}</span>
        </div>
      `;
    })
    .join("");

  const endpointBoxes = endpointRects
    .map((box) => {
      const teamClass = teamThemeClass(box.team);
      return `
        <div class="network-endpoint-box ${teamClass}" style="left:${box.left}px;top:${box.top}px;width:${box.right - box.left}px;height:${box.bottom - box.top}px;">
          <span>Linux + Win + Fileserver · ${escapeHtml(box.team)}</span>
        </div>
      `;
    })
    .join("");

  const endpointConnectorLines = endpointRects
    .map((box) => {
      const router = teamRouter.get(box.team);
      const firewall = teamFirewall.get(box.team);
      if (!router && !firewall) {
        return "";
      }

      const targetY = box.top + 2;
      const lines: string[] = [];
      const anchors = [router, firewall]
        .filter((node): node is NodeRect => Boolean(node))
        .sort((a, b) => a.cx - b.cx);

      if (anchors.length === 1) {
        const only = anchors[0];
        if (!only) {
          return "";
        }
        const startY = only.cy + only.height / 2 - 5;
        lines.push(
          `<line class="network-group-link" x1="${only.cx}" y1="${startY}" x2="${box.cx}" y2="${targetY}"></line>`,
        );
      } else if (anchors.length >= 2) {
        const left = anchors[0];
        const right = anchors[anchors.length - 1];
        if (!left || !right) {
          return "";
        }
        const leftStartY = left.cy + left.height / 2 - 5;
        const rightStartY = right.cy + right.height / 2 - 5;
        lines.push(
          `<line class="network-group-link" x1="${left.cx}" y1="${leftStartY}" x2="${box.cx - 34}" y2="${targetY}"></line>`,
        );
        lines.push(
          `<line class="network-group-link" x1="${right.cx}" y1="${rightStartY}" x2="${box.cx + 34}" y2="${targetY}"></line>`,
        );
      }

      return lines.join("");
    })
    .join("");

  const edgePoint = (from: NodeRect, to: NodeRect): { x: number; y: number } => {
    const dx = to.cx - from.cx;
    const dy = to.cy - from.cy;
    if (dx === 0 && dy === 0) {
      return { x: from.cx, y: from.cy };
    }

    const scale = 1 / Math.max(Math.abs(dx) / (from.width / 2), Math.abs(dy) / (from.height / 2));
    return {
      x: from.cx + dx * scale,
      y: from.cy + dy * scale,
    };
  };

  const renderedLineKeys = new Set<string>();
  const svgLines = links
    .map((link) => {
      const fromNameKey = link.fromName.trim().toLowerCase();
      const toNameKey = link.toName.trim().toLowerCase();
      if (endpointNameSet.has(fromNameKey) || endpointNameSet.has(toNameKey)) {
        return "";
      }

      const fromRect =
        keyedRect.get(networkNodeKey(link.fromName, link.fromTeam)) ??
        namedRect.get(fromNameKey);
      const toRect =
        keyedRect.get(networkNodeKey(link.toName, link.toTeam)) ??
        namedRect.get(toNameKey);
      if (!fromRect || !toRect) {
        return "";
      }

      const from = edgePoint(fromRect, toRect);
      const to = edgePoint(toRect, fromRect);
      const dedupeKey = `${Math.round(from.x)}:${Math.round(from.y)}:${Math.round(to.x)}:${Math.round(to.y)}`;
      if (renderedLineKeys.has(dedupeKey)) {
        return "";
      }
      renderedLineKeys.add(dedupeKey);
      return `
        <line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>
      `;
    })
    .join("");

  const cards = allLayout
    .map((item) => {
      const zoneClass = zoneThemeClass(item.device.zone);
      const teamClass = teamThemeClass(item.device.team);
      const wrapClass = [
        "network-topology-device-wrap",
        item.device.type === "Internet" || zoneClass === "zone-internet" ? "is-internet" : "",
        item.device.name.trim().toLowerCase().includes("router") ? "is-router" : "",
        item.device.name.trim().toLowerCase().includes("firewall") ? "is-firewall" : "",
        zoneClass === "zone-dmz" ? "is-dmz" : "",
        teamClass,
      ]
        .filter(Boolean)
        .join(" ");
      return `
        <div class="${wrapClass}" style="left:${item.x}px;top:${item.y}px;width:${item.width}px;">
          ${renderDeviceCard(item.device, "network-topology-device", item.height)}
        </div>
      `;
    })
    .join("");

  boardEl.innerHTML = `
    <div class="network-topology-scroll">
      <div class="network-topology-stage">
        <div class="network-topology-canvas" style="width:${canvasWidth}px;height:${canvasHeight}px;">
          ${teamBoxes}
          ${zoneBoxes}
          ${endpointBoxes}
          <svg class="network-link-layer" width="${canvasWidth}" height="${canvasHeight}" viewBox="0 0 ${canvasWidth} ${canvasHeight}" preserveAspectRatio="none">
            <defs>
              <marker id="network-arrow-head" viewBox="0 0 10 10" refX="8.5" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                <path d="M0 0 L10 5 L0 10 z"></path>
              </marker>
            </defs>
            ${svgLines}
            ${endpointConnectorLines}
          </svg>
          ${cards}
        </div>
      </div>
    </div>
  `;

  topologyBaseWidth = canvasWidth;
  topologyBaseHeight = canvasHeight;
  topologyScrollEl = boardEl.querySelector<HTMLDivElement>(".network-topology-scroll");
  topologyStageEl = boardEl.querySelector<HTMLDivElement>(".network-topology-stage");
  topologyCanvasEl = boardEl.querySelector<HTMLDivElement>(".network-topology-canvas");
  if (topologyScrollEl && topologyStageEl && topologyCanvasEl) {
    bindTopologyInteractions(topologyScrollEl);
    if (topologyZoom < MIN_TOPOLOGY_ZOOM || topologyZoom > MAX_TOPOLOGY_ZOOM) {
      topologyZoom = DEFAULT_TOPOLOGY_ZOOM;
    }
    applyTopologyZoom();
    centerTopologyViewport();
    if (!topologyUserAdjustedZoom) {
      fitTopologyToViewport(false);
    }
  }
}

function renderBoard(devices: NetworkDevice[], links: NetworkLink[]): void {
  if (devices.some(isPositionedDevice)) {
    renderTopologyBoard(devices, links);
    return;
  }

  topologyScrollEl = null;
  topologyStageEl = null;
  topologyCanvasEl = null;
  topologyBaseWidth = 0;
  topologyBaseHeight = 0;
  renderLaneBoard(devices);
}

function severityBadgeClass(severity: string): string {
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

function renderDeviceEventItems(events: NetworkDeviceEvent[]): string {
  if (events.length === 0) {
    return `<div class="entry-empty">No events found for this machine.</div>`;
  }

  return events
    .map((event) => {
      const tags = Array.isArray(event.tags) ? event.tags : [];
      const tagHtml =
        tags.length > 0
          ? tags.map((tag) => `<span class="pill">${escapeHtml(tag)}</span>`).join("")
          : `<span class="muted">No tags</span>`;
      return `
        <article class="network-event-item">
          <div class="network-event-item-head">
            <div>
              <div class="entry-case">${escapeHtml(eventRef(event.id))}</div>
              <div class="muted">${escapeHtml(formatDate(event.occurredAt))}</div>
              <div class="muted"><strong>Case:</strong> ${escapeHtml(event.mainCaseRef || "-")}</div>
            </div>
            <div class="entry-flags">
              <span class="badge ${severityBadgeClass(event.severity)}">${escapeHtml(event.severity)}</span>
              <span class="badge">Team ${escapeHtml(event.teamNumber)}</span>
              <span class="badge">${escapeHtml(event.eventType)}</span>
            </div>
          </div>
          <p class="entry-summary">${escapeHtml(event.summary || "-")}</p>
          <details class="network-event-more">
            <summary>More detail</summary>
            <p class="entry-details">${escapeHtml(event.details || "No additional details.")}</p>
            <div class="context-tags">${tagHtml}</div>
          </details>
        </article>
      `;
    })
    .join("");
}

async function openDeviceEvents(
  hostName: string,
  teamNumber: number | null,
  teamLabel: string,
): Promise<void> {
  const name = hostName.trim();
  if (!name) {
    return;
  }

  const titleTeam = teamLabel ? ` · ${teamLabel}` : "";
  deviceEventsTitleEl.textContent = `Device Events: ${name}${titleTeam}`;
  setDeviceEventsStatus("Loading device history...");
  deviceEventsListEl.innerHTML = `<div class="entry-empty">Loading...</div>`;
  if (!deviceEventsDialog.open) {
    deviceEventsDialog.showModal();
  }

  try {
    const params = new URLSearchParams({ host: name });
    if (teamNumber) {
      params.set("teamNumber", String(teamNumber));
    }
    const response = await fetch(`/api/network/device-events?${params.toString()}`);
    const payload = (await response.json()) as NetworkDeviceEventsResponse;
    if (!response.ok) {
      throw new Error(payload.error || "Could not load device events.");
    }

    const events = Array.isArray(payload.events) ? payload.events : [];
    deviceEventsListEl.innerHTML = renderDeviceEventItems(events);
    setDeviceEventsStatus(
      `${events.length} event${events.length === 1 ? "" : "s"} for ${name}.`,
    );
  } catch (error) {
    deviceEventsListEl.innerHTML = `<div class="entry-empty">Could not load events.</div>`;
    setDeviceEventsStatus(getErrorMessage(error, "Could not load device events."), true);
  }
}

async function loadTopology(showStatusMessage = false): Promise<void> {
  const response = await fetch("/api/network/topology");
  const payload = (await response.json()) as NetworkTopologyResponse;
  if (!response.ok) {
    throw new Error(payload.error || "Could not load network topology.");
  }

  const devicesRaw = Array.isArray(payload.devices) ? payload.devices : [];
  const devices = devicesRaw.filter((device) => !isDnsName(device.name));
  const links: NetworkLink[] = [];
  if (Array.isArray(payload.links)) {
    for (const raw of payload.links) {
      const item = raw as Partial<NetworkLink> & {
        from?: unknown;
        to?: unknown;
        fromTeamLabel?: unknown;
        from_team?: unknown;
        toTeamLabel?: unknown;
        to_team?: unknown;
      };
      const fromName =
        typeof item.fromName === "string"
          ? item.fromName
          : typeof item.from === "string"
            ? item.from
            : "";
      const toName =
        typeof item.toName === "string"
          ? item.toName
          : typeof item.to === "string"
            ? item.to
            : "";
      if (!fromName || !toName) {
        continue;
      }
      if (isDnsName(fromName) || isDnsName(toName)) {
        continue;
      }

      links.push({
        id: item.id,
        fromName,
        fromTeam:
          typeof item.fromTeam === "string"
            ? item.fromTeam
            : typeof item.fromTeamLabel === "string"
              ? item.fromTeamLabel
              : typeof item.from_team === "string"
                ? item.from_team
                : "",
        toName,
        toTeam:
          typeof item.toTeam === "string"
            ? item.toTeam
            : typeof item.toTeamLabel === "string"
              ? item.toTeamLabel
              : typeof item.to_team === "string"
                ? item.to_team
                : "",
        label: typeof item.label === "string" ? item.label : "",
        sortOrder: typeof item.sortOrder === "number" ? item.sortOrder : undefined,
      });
    }
  }
  currentDevices = devices;
  currentLinks = links;
  renderBoard(currentDevices, currentLinks);
  updateLastSync();
  if (showStatusMessage) {
    setStatus("Network view refreshed.");
  }
}

function loadSample(): void {
  const sample: NetworkImportPayload = {
    devices: [
      { name: "Internet", type: "Internet", ipAddress: "0.0.0.0/0" },
      { name: "Edge-Router", type: "Router", ipAddress: "10.0.255.1" },
      { name: "FW-Core", type: "Firewall", ipAddress: "10.0.255.254" },
      { name: "DMZ-Web-1", type: "DMZ", ipAddress: "10.0.10.10" },
      { name: "APP-Server-1", type: "Server", ipAddress: "10.0.20.10" },
      { name: "WS-01", type: "Workstations", ipAddress: "10.0.30.11" },
    ],
    links: [],
  };

  topologyUserAdjustedZoom = false;
  setImportPayload(sample);
}

function loadCygwdexTemplate(): void {
  topologyUserAdjustedZoom = false;
  setImportPayload(buildScaledCygwdexTemplate());
  setStatus("CyGWDEx network template loaded. Press Import Network to apply.");
}

async function importNetwork(): Promise<void> {
  setStatus();
  let parsed: unknown;
  try {
    parsed = JSON.parse(importTextEl.value || "{}");
  } catch (error) {
    setStatus("Import JSON is invalid.", true);
    return;
  }

  importButton.disabled = true;
  try {
    const response = await fetch("/api/network/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(parsed),
    });
    const payload = (await response.json()) as { imported?: number; error?: string };
    if (!response.ok) {
      throw new Error(payload.error || "Could not import network topology.");
    }

    topologyUserAdjustedZoom = false;
    await loadTopology();
    setStatus(`Imported ${payload.imported ?? 0} network devices.`);
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not import network topology.", true);
  } finally {
    importButton.disabled = false;
  }
}

async function enableEditMode(): Promise<void> {
  setAdminStatus();
  const password = adminPasswordInput.value.trim();
  if (!password) {
    setAdminStatus("Admin password is required.", true);
    return;
  }

  setAdminBusy(true);
  try {
    const response = await fetch("/api/admin/network/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const payload = (await response.json()) as AdminApiResponse;
    if (!response.ok) {
      throw new Error(payload.error || "Could not verify admin password.");
    }

    adminPasswordCache = password;
    adminPasswordInput.value = "";
    editModeEnabled = true;
    setAdminBusy(false);
    setAdminStatus("Edit mode enabled.");
    renderBoard(currentDevices, currentLinks);
  } catch (error) {
    setAdminStatus(getErrorMessage(error, "Could not enable edit mode."), true);
    setAdminBusy(false);
  }
}

function disableEditMode(): void {
  editModeEnabled = false;
  adminPasswordCache = "";
  setAdminBusy(false);
  setAdminStatus("Edit mode disabled.");
  renderBoard(currentDevices, currentLinks);
}

async function renameDevice(deviceId: number, nextName: string): Promise<void> {
  const response = await fetch("/api/admin/network/rename-device", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      password: adminPasswordCache,
      deviceId,
      name: nextName,
    }),
  });

  const payload = (await response.json()) as AdminApiResponse;
  if (!response.ok) {
    if (response.status === 403) {
      editModeEnabled = false;
      adminPasswordCache = "";
      setAdminBusy(false);
      renderBoard(currentDevices, currentLinks);
    }

    throw new Error(payload.error || "Could not rename machine.");
  }
}

async function handleRenameSubmit(form: HTMLFormElement): Promise<void> {
  if (!editModeEnabled || !adminPasswordCache) {
    setStatus("Edit mode is disabled. Enable it via Admin first.", true);
    return;
  }

  const deviceId = toNumericId(form.dataset.deviceId);
  const input = form.querySelector<HTMLInputElement>(".network-rename-input");
  const button = form.querySelector<HTMLButtonElement>("button[type='submit']");
  const nextName = input?.value.trim() ?? "";
  if (!deviceId || !input || !button) {
    return;
  }

  if (!nextName) {
    setStatus("Machine name cannot be empty.", true);
    return;
  }

  input.disabled = true;
  button.disabled = true;
  try {
    await renameDevice(deviceId, nextName);
    await loadTopology();
    setStatus(`Machine renamed to "${nextName}".`);
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not rename machine."), true);
  } finally {
    input.disabled = false;
    button.disabled = false;
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

    if (target.closest("#network-admin-toggle") || target.closest("#network-admin-popover")) {
      return;
    }

    adminPopover.classList.add("hidden");
  });
}

async function toggleBoardFullscreen(): Promise<void> {
  try {
    if (document.fullscreenElement === boardPanelEl) {
      await document.exitFullscreen();
    } else {
      await boardPanelEl.requestFullscreen();
    }
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not switch fullscreen mode."), true);
  } finally {
    updateFullscreenButtonLabel();
  }
}

async function pollChanges(): Promise<void> {
  const response = await fetch("/api/changes");
  if (!response.ok) {
    return;
  }

  const snapshot = (await response.json()) as ChangeSnapshot;
  const nextSignature = JSON.stringify(snapshot);
  if (!lastChangeSignature) {
    lastChangeSignature = nextSignature;
    return;
  }

  if (nextSignature === lastChangeSignature) {
    return;
  }

  lastChangeSignature = nextSignature;
  await loadTopology();
}

loadSampleButton.addEventListener("click", loadSample);
loadCygwdexButton.addEventListener("click", loadCygwdexTemplate);
importButton.addEventListener("click", () => {
  void importNetwork();
});
refreshButton.addEventListener("click", () => {
  void loadTopology(true).catch((error) => {
    setStatus(error instanceof Error ? error.message : "Refresh failed.", true);
  });
});
fullscreenButton.addEventListener("click", () => {
  void toggleBoardFullscreen();
});
enableEditModeButton.addEventListener("click", () => {
  void enableEditMode();
});
disableEditModeButton.addEventListener("click", () => {
  disableEditMode();
});
adminForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void enableEditMode();
});
boardEl.addEventListener("submit", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLFormElement)) {
    return;
  }

  if (!target.classList.contains("network-rename-form")) {
    return;
  }

  event.preventDefault();
  void handleRenameSubmit(target);
});
boardEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLElement)) {
    return;
  }

  const button = target.closest(".network-device-details-btn");
  if (!(button instanceof HTMLButtonElement)) {
    return;
  }

  const hostName = (button.dataset.deviceName || "").trim();
  const teamLabel = (button.dataset.deviceTeam || "").trim();
  const parsedTeam = Number(button.dataset.deviceTeamNumber);
  const teamNumber =
    Number.isInteger(parsedTeam) && parsedTeam > 0 ? parsedTeam : parseTeamNumber(teamLabel);

  void openDeviceEvents(hostName, teamNumber, teamLabel);
});
deviceEventsCloseButton.addEventListener("click", () => {
  deviceEventsDialog.close();
});
deviceEventsDialog.addEventListener("click", (event) => {
  const target = event.target;
  if (target === deviceEventsDialog) {
    deviceEventsDialog.close();
  }
});
document.addEventListener("fullscreenchange", () => {
  updateFullscreenButtonLabel();
  if (topologyScrollEl && !topologyUserAdjustedZoom) {
    window.setTimeout(() => {
      fitTopologyToViewport(false);
    }, 30);
  }
});
window.addEventListener("mousemove", (event) => {
  if (!isPanningTopology || !topologyScrollEl) {
    return;
  }

  const deltaX = event.clientX - panStartX;
  const deltaY = event.clientY - panStartY;
  topologyScrollEl.scrollLeft = panStartScrollLeft - deltaX;
  topologyScrollEl.scrollTop = panStartScrollTop - deltaY;
});
window.addEventListener("mouseup", () => {
  stopTopologyPan();
});
window.addEventListener("mouseleave", () => {
  stopTopologyPan();
});

async function init(): Promise<void> {
  bindAdminPopover();
  setAdminBusy(false);
  updateFullscreenButtonLabel();
  updateHeaderClock();
  window.setInterval(updateHeaderClock, 1000);
  loadCygwdexTemplate();

  try {
    await loadTopology();
    const response = await fetch("/api/changes");
    if (response.ok) {
      const snapshot = (await response.json()) as ChangeSnapshot;
      lastChangeSignature = JSON.stringify(snapshot);
    }
  } catch (error) {
    setStatus(error instanceof Error ? error.message : "Could not load network view.", true);
  }

  window.setInterval(() => {
    if (document.hidden) {
      return;
    }

    void pollChanges().catch(() => {
      // Keep polling silent unless user manually refreshes.
    });
  }, 3000);
}

void init();
