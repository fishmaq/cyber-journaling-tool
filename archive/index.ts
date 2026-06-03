import { Pool, type PoolClient } from "pg";

const PORT = Number(process.env.PORT ?? 3000);
const HOST = process.env.HOST ?? "0.0.0.0";
const DATABASE_URL =
  process.env.DATABASE_URL ??
  "postgresql://journaling:journaling@localhost:5432/journaling";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const WIKI_DISABLED_REDIRECT_URL =
  process.env.WIKI_DISABLED_REDIRECT_URL ?? "http://10.0.255.20:3000";

type Severity = "Low" | "Medium" | "High" | "Critical";
type EventType =
  | "Finding/ Evidence"
  | "Action"
  | "Decision"
  | "Meeting"
  | "Join/Leave"
  | "Comms"
  | "Note";
type MainCaseStatus =
  | "Triage"
  | "Event"
  | "Incident"
  | "Critical"
  | "Review"
  | "Closed";
type NetworkDeviceType =
  | "Firewall"
  | "DMZ"
  | "Server"
  | "Workstations"
  | "Router"
  | "Internet";

type CatalogType = "services" | "hosts" | "owners" | "tags";

const SEVERITY_VALUES: Severity[] = ["Low", "Medium", "High", "Critical"];
const EVENT_TYPE_VALUES: EventType[] = [
  "Finding/ Evidence",
  "Action",
  "Decision",
  "Meeting",
  "Join/Leave",
  "Comms",
  "Note",
];
const MAIN_CASE_STATUS_VALUES: MainCaseStatus[] = [
  "Triage",
  "Event",
  "Incident",
  "Critical",
  "Review",
  "Closed",
];
const TEAM_VALUES = [1, 2] as const;
const NETWORK_DEVICE_TYPES: NetworkDeviceType[] = [
  "Internet",
  "Router",
  "Firewall",
  "DMZ",
  "Server",
  "Workstations",
];
const NETWORK_OUT_KEYWORDS = ["out", "offline", "down", "unreachable", "shutdown"];
const NETWORK_OUT_RECOVERY_KEYWORDS = [
  "upagain",
  "online",
  "restored",
  "recovered",
  "reachable",
  "operational",
  "resolved",
];
const NETWORK_COMPROMISED_KEYWORDS = [
  "compromised",
  "breach",
  "infected",
  "malware",
  "ransomware",
  "pwned",
];
const NETWORK_COMPROMISED_RECOVERY_KEYWORDS = [
  "clean",
  "cleaned",
  "cleanup",
  "remediated",
  "remediation",
  "contained",
  "eradicated",
  "reimaged",
  "fixed",
];

const CATALOG_TABLES: Record<CatalogType, string> = {
  services: "services",
  hosts: "hosts",
  owners: "owners",
  tags: "tags",
};

const EVENT_JOIN_TABLES: Record<CatalogType, string> = {
  services: "event_services",
  hosts: "event_hosts",
  owners: "event_owners",
  tags: "event_tags",
};

class HttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

const pool = new Pool({
  connectionString: DATABASE_URL,
});
const frontendTranspiler = new Bun.Transpiler({ loader: "ts" });

function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json; charset=utf-8" },
  });
}

function errorResponse(
  error: unknown,
  fallback: string,
  defaultStatus = 400,
): Response {
  if (error instanceof HttpError) {
    return jsonResponse({ error: error.message }, error.status);
  }

  if (error instanceof Error) {
    return jsonResponse({ error: error.message || fallback }, defaultStatus);
  }

  return jsonResponse({ error: fallback }, defaultStatus);
}

function normalizeNames(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const seen = new Set<string>();
  const output: string[] = [];

  for (const item of value) {
    if (typeof item !== "string") {
      continue;
    }

    const name = item.trim();
    if (!name) {
      continue;
    }

    const lower = name.toLowerCase();
    if (seen.has(lower)) {
      continue;
    }

    seen.add(lower);
    output.push(name);
  }

  return output;
}

function isCatalogType(value: string): value is CatalogType {
  return value in CATALOG_TABLES;
}

function parsePositiveInt(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function parseOptionalPositiveInt(
  value: string | null,
  fieldName: string,
): number | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(400, `${fieldName} must be a positive integer.`);
  }

  return parsed;
}

function parseOptionalTeamNumber(value: string | null): (typeof TEAM_VALUES)[number] | null {
  const parsed = parseOptionalPositiveInt(value, "Team Number");
  if (parsed === null) {
    return null;
  }

  if (!TEAM_VALUES.includes(parsed as (typeof TEAM_VALUES)[number])) {
    throw new HttpError(400, "Team Number must be 1 or 2.");
  }

  return parsed as (typeof TEAM_VALUES)[number];
}

function parseOptionalSeverity(value: string | null): Severity | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  if (!SEVERITY_VALUES.includes(normalized as Severity)) {
    throw new HttpError(400, "Severity must be one of: Low, Medium, High, Critical.");
  }

  return normalized as Severity;
}

function parseOptionalMainCaseStatus(value: string | null): MainCaseStatus | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  if (!MAIN_CASE_STATUS_VALUES.includes(normalized as MainCaseStatus)) {
    throw new HttpError(
      400,
      "Status must be one of: Triage, Event, Incident, Critical, Review, Closed.",
    );
  }

  return normalized as MainCaseStatus;
}

function parseOptionalEventType(value: string | null): EventType | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const normalized = value.trim();
  if (!EVENT_TYPE_VALUES.includes(normalized as EventType)) {
    throw new HttpError(
      400,
      "Event Type must be one of: Finding/ Evidence, Action, Decision, Meeting, Join/Leave, Comms, Note.",
    );
  }

  return normalized as EventType;
}

function parseOptionalDateTime(value: string | null, fieldName: string): string | null {
  if (value === null || value.trim() === "") {
    return null;
  }

  const parsed = new Date(value.trim());
  if (Number.isNaN(parsed.valueOf())) {
    throw new HttpError(400, `${fieldName} must be a valid date/time.`);
  }

  return parsed.toISOString();
}

function parseOptionalCsvNames(value: unknown): string[] {
  if (typeof value !== "string" || value.trim() === "") {
    return [];
  }

  const rawParts = value
    .split(/[\n\r,;|]/g)
    .map((part) => part.trim())
    .filter(Boolean);

  return normalizeNames(rawParts);
}

function parseNetworkDeviceType(value: unknown): NetworkDeviceType {
  const normalized = typeof value === "string" ? value.trim() : "";
  if (!NETWORK_DEVICE_TYPES.includes(normalized as NetworkDeviceType)) {
    throw new HttpError(
      400,
      "Network device type must be one of: Internet, Router, Firewall, DMZ, Server, Workstations.",
    );
  }

  return normalized as NetworkDeviceType;
}

function parseNetworkDeviceName(value: unknown): string {
  const name = typeof value === "string" ? value.trim() : "";
  if (!name) {
    throw new HttpError(400, "Network device name is required.");
  }

  if (name.length > 120) {
    throw new HttpError(400, "Network device name is too long (max 120 characters).");
  }

  return name;
}

function parseNetworkDeviceIp(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Network device IP address must be a string.");
  }

  const ipAddress = value.trim();
  if (ipAddress.length > 80) {
    throw new HttpError(400, "Network device IP address is too long (max 80 characters).");
  }

  return ipAddress;
}

function parseOptionalNetworkMeta(value: unknown, fieldName: string): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new HttpError(400, `${fieldName} must be a string.`);
  }

  const text = value.trim();
  if (text.length > 120) {
    throw new HttpError(400, `${fieldName} is too long (max 120 characters).`);
  }

  return text;
}

function parseOptionalCoordinate(value: unknown, fieldName: string): number | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!Number.isFinite(parsed)) {
    throw new HttpError(400, `${fieldName} must be a valid number.`);
  }

  return Math.round(parsed * 1000) / 1000;
}

function parseOptionalNetworkTeamNumber(
  value: unknown,
  fieldName: string,
): (typeof TEAM_VALUES)[number] | null {
  if (value === undefined || value === null || value === "") {
    return null;
  }

  const parsed = Number(value);
  if (!TEAM_VALUES.includes(parsed as (typeof TEAM_VALUES)[number])) {
    throw new HttpError(400, `${fieldName} must be 1 or 2.`);
  }

  return parsed as (typeof TEAM_VALUES)[number];
}

function includesAnyKeyword(text: string, keywords: string[]): boolean {
  const haystack = text.trim().toLowerCase();
  if (!haystack) {
    return false;
  }

  const tokens = haystack.split(/[^a-z0-9]+/g).filter(Boolean);
  if (tokens.length === 0) {
    return false;
  }

  return keywords.some((keyword) => tokens.includes(keyword));
}

function parseTeamNumberFromLabel(value: string): (typeof TEAM_VALUES)[number] | null {
  const label = value.trim().toLowerCase();
  if (!label) {
    return null;
  }

  const normalized = label.replace(/[_-]+/g, " ").replace(/\s+/g, " ").trim();

  if (
    normalized === "1" ||
    normalized === "team1" ||
    normalized === "team 1" ||
    normalized === "t1" ||
    /\bteam\s*1\b/.test(normalized) ||
    /\bt1\b/.test(normalized)
  ) {
    return 1;
  }
  if (
    normalized === "2" ||
    normalized === "team2" ||
    normalized === "team 2" ||
    normalized === "t2" ||
    /\bteam\s*2\b/.test(normalized) ||
    /\bt2\b/.test(normalized)
  ) {
    return 2;
  }

  return null;
}

function buildNetworkSignalKey(hostName: string, teamNumber: number | null): string {
  return `${teamNumber ?? 0}::${hostName.trim().toLowerCase()}`;
}

function formatOrdinalId(value: number): string {
  return String(value).padStart(4, "0");
}

function generateCaseIdFromOrdinal(value: number): string {
  return `EVENT-${formatOrdinalId(value)}`;
}

function generateMainCaseRefFromOrdinal(value: number): string {
  return `CASE-${formatOrdinalId(value)}`;
}

function parseSequenceNumber(value: unknown, fieldName: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new HttpError(500, `Could not allocate next ${fieldName}.`);
  }

  return parsed;
}

async function reserveMainCaseIdentity(
  client: PoolClient,
): Promise<{ id: number; ref: string }> {
  const sequenceResult = await client.query<{ next_id: number }>(
    `SELECT nextval(pg_get_serial_sequence('main_cases', 'id'))::int AS next_id`,
  );
  const nextId = parseSequenceNumber(sequenceResult.rows[0]?.next_id, "case ID");
  return { id: nextId, ref: generateMainCaseRefFromOrdinal(nextId) };
}

async function reserveEventIdentity(
  client: PoolClient,
): Promise<{ id: number; caseId: string }> {
  const sequenceResult = await client.query<{ next_id: number }>(
    `SELECT nextval(pg_get_serial_sequence('journal_events', 'id'))::int AS next_id`,
  );
  const nextId = parseSequenceNumber(sequenceResult.rows[0]?.next_id, "event ID");
  return { id: nextId, caseId: generateCaseIdFromOrdinal(nextId) };
}

async function ensureCatalogNames(
  client: PoolClient,
  type: CatalogType,
  names: string[],
): Promise<number[]> {
  if (names.length === 0) {
    return [];
  }

  const table = CATALOG_TABLES[type];
  const ids: number[] = [];

  for (const name of names) {
    await client.query(
      `INSERT INTO ${table} (name)
       VALUES ($1)
       ON CONFLICT DO NOTHING`,
      [name],
    );

    const result = await client.query<{ id: number }>(
      `SELECT id::int AS id
       FROM ${table}
       WHERE LOWER(name) = LOWER($1)
       LIMIT 1`,
      [name],
    );

    const id = result.rows[0]?.id;
    if (id) {
      ids.push(id);
    }
  }

  return ids;
}

async function linkEventCatalog(
  client: PoolClient,
  eventId: number,
  type: CatalogType,
  catalogIds: number[],
): Promise<void> {
  if (catalogIds.length === 0) {
    return;
  }

  const joinTable = EVENT_JOIN_TABLES[type];

  for (const catalogId of catalogIds) {
    await client.query(
      `INSERT INTO ${joinTable} (event_id, ${type.slice(0, -1)}_id)
       VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [eventId, catalogId],
    );
  }
}

async function clearEventCatalogLinks(
  client: PoolClient,
  eventId: number,
): Promise<void> {
  await Promise.all([
    client.query(`DELETE FROM event_services WHERE event_id = $1`, [eventId]),
    client.query(`DELETE FROM event_hosts WHERE event_id = $1`, [eventId]),
    client.query(`DELETE FROM event_owners WHERE event_id = $1`, [eventId]),
    client.query(`DELETE FROM event_tags WHERE event_id = $1`, [eventId]),
  ]);
}

async function getCatalogValues(type: CatalogType): Promise<string[]> {
  const table = CATALOG_TABLES[type];
  const result = await pool.query<{ name: string }>(
    `SELECT name
     FROM ${table}
     ORDER BY LOWER(name) ASC`,
  );

  return result.rows.map((row) => row.name);
}

async function getOptions(): Promise<Record<string, unknown>> {
  const [services, hosts, owners, tags] = await Promise.all([
    getCatalogValues("services"),
    getCatalogValues("hosts"),
    getCatalogValues("owners"),
    getCatalogValues("tags"),
  ]);

  return {
    severity: SEVERITY_VALUES,
    teamNumber: TEAM_VALUES,
    eventType: EVENT_TYPE_VALUES,
    mainCaseStatus: MAIN_CASE_STATUS_VALUES,
    catalog: {
      services,
      hosts,
      owners,
      tags,
    },
  };
}

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

type WikiPageRow = {
  id: number;
  title: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type WikiChecklistItemRow = {
  id: number;
  text: string;
  details: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type WikiAccessState = {
  enabled: boolean;
  redirectUrl: string;
  updatedAt: string | null;
};

type NetworkDeviceRow = {
  id: number;
  name: string;
  type: NetworkDeviceType;
  ipAddress: string;
  team: string;
  teamNumber: number | null;
  zone: string;
  posX: number | null;
  posY: number | null;
  displayOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type NetworkLinkRow = {
  id: number;
  fromName: string;
  fromTeam: string;
  toName: string;
  toTeam: string;
  label: string;
  sortOrder: number;
};

type NetworkHostSignalRow = {
  hostKey: string;
  teamNumber: number | null;
  eventId: number;
  occurredAt: string | null;
  summary: string;
  details: string;
  tags: string[];
};

type NetworkDeviceStatus = {
  isOut: boolean;
  isCompromised: boolean;
  sourceEventId: number | null;
  sourceOccurredAt: string | null;
};

type NetworkDeviceEventRow = {
  id: number;
  caseId: string;
  mainCaseRef: string | null;
  occurredAt: string | null;
  severity: Severity;
  teamNumber: (typeof TEAM_VALUES)[number];
  eventType: EventType;
  summary: string;
  details: string;
  tags: string[];
};

function escapeCsvCell(value: unknown): string {
  const text = value === null || value === undefined ? "" : String(value);
  if (!/[",\n\r]/.test(text)) {
    return text;
  }

  return `"${text.replace(/"/g, '""')}"`;
}

function buildCsv(headers: string[], rows: Array<Record<string, unknown>>): string {
  const headerLine = headers.map(escapeCsvCell).join(",");
  const bodyLines = rows.map((row) =>
    headers.map((header) => escapeCsvCell(row[header])).join(","),
  );

  return `${headerLine}\n${bodyLines.join("\n")}\n`;
}

function parseCsvText(input: string): {
  headers: string[];
  rows: Array<Record<string, string>>;
} {
  const matrix: string[][] = [];
  let field = "";
  let row: string[] = [];
  let inQuotes = false;

  for (let i = 0; i < input.length; i += 1) {
    const ch = input[i];
    const next = input[i + 1];

    if (inQuotes) {
      if (ch === '"') {
        if (next === '"') {
          field += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
      continue;
    }

    if (ch === '"') {
      inQuotes = true;
      continue;
    }

    if (ch === ",") {
      row.push(field);
      field = "";
      continue;
    }

    if (ch === "\n") {
      row.push(field);
      matrix.push(row);
      row = [];
      field = "";
      continue;
    }

    if (ch === "\r") {
      continue;
    }

    field += ch;
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    matrix.push(row);
  }

  if (matrix.length === 0) {
    throw new HttpError(400, "CSV is empty.");
  }

  const headerRow = matrix[0];
  if (!headerRow) {
    throw new HttpError(400, "CSV header row is empty.");
  }

  const rawHeaders = headerRow.map((header) => header.trim());
  if (rawHeaders.length === 0 || rawHeaders.every((header) => !header)) {
    throw new HttpError(400, "CSV header row is empty.");
  }

  const headers = rawHeaders.map((header) =>
    header
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_"),
  );

  const rows: Array<Record<string, string>> = [];
  for (let rowIndex = 1; rowIndex < matrix.length; rowIndex += 1) {
    const values = matrix[rowIndex];
    if (!values) {
      continue;
    }

    const mapped: Record<string, string> = {};
    let hasAnyValue = false;

    for (let col = 0; col < headers.length; col += 1) {
      const header = headers[col];
      if (!header) {
        continue;
      }

      const value = (values[col] ?? "").trim();
      mapped[header] = value;
      if (value) {
        hasAnyValue = true;
      }
    }

    if (hasAnyValue) {
      rows.push(mapped);
    }
  }

  return { headers, rows };
}

function pickCsvValue(row: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const found = row[key];
    if (typeof found === "string" && found.trim() !== "") {
      return found.trim();
    }
  }

  return "";
}

async function getChangeSnapshot(): Promise<ChangeSnapshot> {
  const result = await pool.query<{
    case_count: number;
    latest_case_id: number | null;
    latest_case_created_at: string | null;
    latest_case_updated_at: string | null;
    event_count: number;
    latest_event_id: number | null;
    latest_event_created_at: string | null;
    latest_event_updated_at: string | null;
  }>(
    `SELECT
       (SELECT COUNT(*)::int FROM main_cases) AS case_count,
       (SELECT MAX(id)::int FROM main_cases) AS latest_case_id,
       (SELECT MAX(created_at)::text FROM main_cases) AS latest_case_created_at,
       (SELECT MAX(updated_at)::text FROM main_cases) AS latest_case_updated_at,
       (SELECT COUNT(*)::int FROM journal_events) AS event_count,
       (SELECT MAX(id)::int FROM journal_events) AS latest_event_id,
       (SELECT MAX(created_at)::text FROM journal_events) AS latest_event_created_at,
       (SELECT MAX(updated_at)::text FROM journal_events) AS latest_event_updated_at`,
  );

  const row = result.rows[0];
  if (!row) {
    return {
      caseCount: 0,
      latestCaseId: null,
      latestCaseCreatedAt: null,
      latestCaseUpdatedAt: null,
      eventCount: 0,
      latestEventId: null,
      latestEventCreatedAt: null,
      latestEventUpdatedAt: null,
    };
  }

  return {
    caseCount: row.case_count,
    latestCaseId: row.latest_case_id,
    latestCaseCreatedAt: row.latest_case_created_at,
    latestCaseUpdatedAt: row.latest_case_updated_at,
    eventCount: row.event_count,
    latestEventId: row.latest_event_id,
    latestEventCreatedAt: row.latest_event_created_at,
    latestEventUpdatedAt: row.latest_event_updated_at,
  };
}

async function listNetworkDevices(): Promise<NetworkDeviceRow[]> {
  const result = await pool.query<NetworkDeviceRow>(
    `SELECT
       id::int AS id,
       device_name AS name,
       device_type AS type,
       ip_address AS "ipAddress",
       team_label AS team,
       team_number::int AS "teamNumber",
       zone_label AS zone,
       pos_x::float AS "posX",
       pos_y::float AS "posY",
       display_order::int AS "displayOrder",
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"
     FROM network_devices
     ORDER BY
       CASE device_type
         WHEN 'Internet' THEN 1
         WHEN 'Router' THEN 2
         WHEN 'Firewall' THEN 3
         WHEN 'DMZ' THEN 4
         WHEN 'Server' THEN 5
         WHEN 'Workstations' THEN 6
         ELSE 99
       END,
       display_order ASC,
       id ASC`,
  );

  return result.rows;
}

async function listNetworkLinks(): Promise<NetworkLinkRow[]> {
  const result = await pool.query<NetworkLinkRow>(
    `SELECT
       id::int AS id,
       from_device_name AS "fromName",
       from_team_label AS "fromTeam",
       to_device_name AS "toName",
       to_team_label AS "toTeam",
       edge_label AS label,
       sort_order::int AS "sortOrder"
     FROM network_links
     ORDER BY sort_order ASC, id ASC`,
  );

  return result.rows;
}

async function listLatestNetworkHostSignals(): Promise<NetworkHostSignalRow[]> {
  const result = await pool.query<NetworkHostSignalRow>(
    `SELECT DISTINCT ON (LOWER(h.name), e.team_number)
       LOWER(h.name) AS "hostKey",
       e.team_number::int AS "teamNumber",
       e.id::int AS "eventId",
       e.occurred_at::text AS "occurredAt",
       e.summary,
       e.details,
       COALESCE(
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT LOWER(t.name)), NULL),
         ARRAY[]::text[]
       ) AS tags
     FROM event_hosts eh
     JOIN hosts h ON h.id = eh.host_id
     JOIN journal_events e ON e.id = eh.event_id
     LEFT JOIN event_tags et ON et.event_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     GROUP BY LOWER(h.name), e.team_number, e.id, e.occurred_at, e.summary, e.details
     ORDER BY LOWER(h.name), e.team_number, e.occurred_at DESC, e.id DESC`,
  );

  return result.rows;
}

async function listNetworkDeviceEvents(
  hostName: string,
  teamNumber: (typeof TEAM_VALUES)[number] | null,
): Promise<NetworkDeviceEventRow[]> {
  const normalizedHost = hostName.trim();
  if (!normalizedHost) {
    throw new HttpError(400, "Host name is required.");
  }

  const params: Array<string | number> = [normalizedHost];
  const teamClause =
    teamNumber !== null
      ? (() => {
          params.push(teamNumber);
          return `AND e.team_number = $${params.length}`;
        })()
      : "";

  const result = await pool.query<NetworkDeviceEventRow>(
    `SELECT
       e.id::int AS id,
       e.case_id AS "caseId",
       mc.main_case_ref AS "mainCaseRef",
       e.occurred_at::text AS "occurredAt",
       e.severity,
       e.team_number::int AS "teamNumber",
       e.event_type AS "eventType",
       e.summary,
       e.details,
       COALESCE(
         ARRAY_REMOVE(ARRAY_AGG(DISTINCT t.name), NULL),
         ARRAY[]::text[]
       ) AS tags
     FROM journal_events e
     JOIN event_hosts eh ON eh.event_id = e.id
     JOIN hosts h ON h.id = eh.host_id
     LEFT JOIN main_cases mc ON mc.id = e.main_case_id
     LEFT JOIN event_tags et ON et.event_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     WHERE LOWER(h.name) = LOWER($1)
     ${teamClause}
     GROUP BY e.id, mc.main_case_ref
     ORDER BY e.occurred_at DESC, e.id DESC
     LIMIT 300`,
    params,
  );

  return result.rows;
}

function buildNetworkStatus(
  signal: NetworkHostSignalRow | undefined,
): NetworkDeviceStatus {
  if (!signal) {
    return {
      isOut: false,
      isCompromised: false,
      sourceEventId: null,
      sourceOccurredAt: null,
    };
  }

  const joinedTags = signal.tags.join(" ");
  const joinedText = `${signal.summary} ${signal.details}`.toLowerCase();
  const isOutSignal =
    includesAnyKeyword(joinedTags, NETWORK_OUT_KEYWORDS) ||
    includesAnyKeyword(joinedText, NETWORK_OUT_KEYWORDS);
  const isOutRecoverySignal =
    includesAnyKeyword(joinedTags, NETWORK_OUT_RECOVERY_KEYWORDS) ||
    includesAnyKeyword(joinedText, NETWORK_OUT_RECOVERY_KEYWORDS);
  const isCompromisedSignal =
    includesAnyKeyword(joinedTags, NETWORK_COMPROMISED_KEYWORDS) ||
    includesAnyKeyword(joinedText, NETWORK_COMPROMISED_KEYWORDS);
  const isCompromisedRecoverySignal =
    includesAnyKeyword(joinedTags, NETWORK_COMPROMISED_RECOVERY_KEYWORDS) ||
    includesAnyKeyword(joinedText, NETWORK_COMPROMISED_RECOVERY_KEYWORDS);
  const isOut = isOutSignal && !isOutRecoverySignal;
  const isCompromised = isCompromisedSignal && !isCompromisedRecoverySignal;

  return {
    isOut,
    isCompromised,
    sourceEventId: signal.eventId,
    sourceOccurredAt: signal.occurredAt,
  };
}

async function getNetworkTopology(): Promise<{ devices: unknown[]; links: unknown[] }> {
  const [devices, signals, links] = await Promise.all([
    listNetworkDevices(),
    listLatestNetworkHostSignals(),
    listNetworkLinks(),
  ]);

  const signalMap = new Map<string, NetworkHostSignalRow>();
  for (const signal of signals) {
    signalMap.set(buildNetworkSignalKey(signal.hostKey, signal.teamNumber), signal);
  }

  const mapped = devices.map((device) => {
    const teamNumber =
      device.teamNumber !== null && device.teamNumber !== undefined
        ? device.teamNumber
        : parseTeamNumberFromLabel(device.team);
    const hostKey = device.name.trim().toLowerCase();
    const signal = signalMap.get(buildNetworkSignalKey(hostKey, teamNumber));
    const status = buildNetworkStatus(signal);
    return {
      ...device,
      status,
    };
  });

  return { devices: mapped, links };
}

async function importNetworkTopology(payload: unknown): Promise<{ imported: number }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const rawDevices = data.devices;
  if (!Array.isArray(rawDevices)) {
    throw new HttpError(400, "Network import requires a devices array.");
  }

  if (rawDevices.length === 0) {
    throw new HttpError(400, "Network import devices array cannot be empty.");
  }

  const devices = rawDevices.map((raw, index) => {
    if (!raw || typeof raw !== "object") {
      throw new HttpError(400, `Device at index ${index + 1} is invalid.`);
    }

    const item = raw as Record<string, unknown>;
    const team = parseOptionalNetworkMeta(item.team, "Network device team");
    const explicitTeamNumber = parseOptionalNetworkTeamNumber(
      item.teamNumber ?? item.team_number,
      "Network device team number",
    );
    const teamNumber =
      explicitTeamNumber !== null
        ? explicitTeamNumber
        : parseTeamNumberFromLabel(team);
    return {
      name: parseNetworkDeviceName(item.name),
      type: parseNetworkDeviceType(item.type),
      ipAddress: parseNetworkDeviceIp(item.ipAddress ?? item.ip ?? item.address),
      team,
      teamNumber,
      zone: parseOptionalNetworkMeta(item.zone, "Network device zone"),
      posX: parseOptionalCoordinate(item.x ?? item.posX, "Network device x"),
      posY: parseOptionalCoordinate(item.y ?? item.posY, "Network device y"),
      displayOrder: index + 1,
    };
  });

  const deduped = new Map<
    string,
    {
      name: string;
      type: NetworkDeviceType;
      ipAddress: string;
      team: string;
      teamNumber: number | null;
      zone: string;
      posX: number | null;
      posY: number | null;
      displayOrder: number;
    }
  >();
  for (const device of devices) {
    const teamKey =
      device.teamNumber !== null && device.teamNumber !== undefined
        ? String(device.teamNumber)
        : device.team.toLowerCase();
    const key = `${device.name.toLowerCase()}::${teamKey}`;
    deduped.set(key, device);
  }
  const finalDevices = Array.from(deduped.values());

  const rawLinks = Array.isArray(data.links) ? data.links : [];
  const links = rawLinks
    .map((raw, index) => {
      if (!raw || typeof raw !== "object") {
        throw new HttpError(400, `Link at index ${index + 1} is invalid.`);
      }

      const item = raw as Record<string, unknown>;
      const from = parseOptionalNetworkMeta(
        item.from ?? item.fromName,
        "Network link from",
      );
      const fromTeam = parseOptionalNetworkMeta(
        item.fromTeam ?? item.from_team ?? item.fromTeamLabel,
        "Network link from team",
      );
      const to = parseOptionalNetworkMeta(item.to ?? item.toName, "Network link to");
      const toTeam = parseOptionalNetworkMeta(
        item.toTeam ?? item.to_team ?? item.toTeamLabel,
        "Network link to team",
      );
      const label = parseOptionalNetworkMeta(item.label, "Network link label");
      if (!from || !to) {
        throw new HttpError(400, `Link at index ${index + 1} needs from and to names.`);
      }

      return {
        from,
        fromTeam,
        to,
        toTeam,
        label,
        sortOrder: index + 1,
      };
    })
    .filter((link, index, all) => {
      const key = [
        link.from.toLowerCase(),
        link.fromTeam.toLowerCase(),
        link.to.toLowerCase(),
        link.toTeam.toLowerCase(),
        link.label.toLowerCase(),
      ].join("::");
      return all.findIndex((entry) =>
        [
          entry.from.toLowerCase(),
          entry.fromTeam.toLowerCase(),
          entry.to.toLowerCase(),
          entry.toTeam.toLowerCase(),
          entry.label.toLowerCase(),
        ].join("::") === key,
      ) === index;
    });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`TRUNCATE TABLE network_devices RESTART IDENTITY`);
    await client.query(`TRUNCATE TABLE network_links RESTART IDENTITY`);

    for (const device of finalDevices) {
      await client.query(
        `INSERT INTO network_devices
           (device_name, device_type, ip_address, team_label, team_number, zone_label, pos_x, pos_y, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          device.name,
          device.type,
          device.ipAddress,
          device.team,
          device.teamNumber,
          device.zone,
          device.posX,
          device.posY,
          device.displayOrder,
        ],
      );
    }

    for (const link of links) {
      await client.query(
        `INSERT INTO network_links
           (from_device_name, from_team_label, to_device_name, to_team_label, edge_label, sort_order)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [link.from, link.fromTeam, link.to, link.toTeam, link.label, link.sortOrder],
      );
    }

    await client.query("COMMIT");
    return { imported: finalDevices.length };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function verifyAdminPassword(payload: unknown): Promise<{ ok: true }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const password = typeof data.password === "string" ? data.password : "";
  assertAdminPassword(password);
  return { ok: true };
}

async function renameNetworkDevice(payload: unknown): Promise<{ id: number; name: string }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const password = typeof data.password === "string" ? data.password : "";
  const deviceId = parsePositiveInt(data.deviceId, "Network device ID");
  const nextName = parseNetworkDeviceName(data.name);

  assertAdminPassword(password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<{ name: string; team: string }>(
      `SELECT
         device_name AS name,
         team_label AS team
       FROM network_devices
       WHERE id = $1
       LIMIT 1`,
      [deviceId],
    );
    const currentName = existing.rows[0]?.name;
    const currentTeam = existing.rows[0]?.team ?? "";
    if (!currentName) {
      throw new HttpError(404, "Network device not found.");
    }

    await client.query(
      `UPDATE network_devices
       SET device_name = $2, updated_at = NOW()
       WHERE id = $1`,
      [deviceId, nextName],
    );

    await client.query(
      `UPDATE network_links
       SET from_device_name = $1, updated_at = NOW()
       WHERE LOWER(from_device_name) = LOWER($2)
         AND LOWER(from_team_label) = LOWER($3)`,
      [nextName, currentName, currentTeam],
    );

    await client.query(
      `UPDATE network_links
       SET to_device_name = $1, updated_at = NOW()
       WHERE LOWER(to_device_name) = LOWER($2)
         AND LOWER(to_team_label) = LOWER($3)`,
      [nextName, currentName, currentTeam],
    );

    await client.query("COMMIT");
    return { id: deviceId, name: nextName };
  } catch (error) {
    await client.query("ROLLBACK");

    if (
      error instanceof Error &&
      /network_devices_name_team_lower_uniq|duplicate key value/i.test(error.message)
    ) {
      throw new HttpError(
        409,
        "A network device with this name already exists for the same team.",
      );
    }

    throw error;
  } finally {
    client.release();
  }
}

function parseWikiPageTitle(value: unknown): string {
  const title = typeof value === "string" ? value.trim() : "";
  if (!title) {
    throw new HttpError(400, "Wiki page title is required.");
  }

  if (title.length > 180) {
    throw new HttpError(400, "Wiki page title is too long (max 180 characters).");
  }

  return title;
}

function parseWikiPageContent(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Wiki page content must be a string.");
  }

  return value;
}

function parseWikiChecklistText(value: unknown): string {
  const text = typeof value === "string" ? value.trim() : "";
  if (!text) {
    throw new HttpError(400, "Checklist task text is required.");
  }

  if (text.length > 240) {
    throw new HttpError(400, "Checklist task text is too long (max 240 characters).");
  }

  return text;
}

function parseWikiChecklistDetails(value: unknown): string {
  if (value === undefined || value === null) {
    return "";
  }

  if (typeof value !== "string") {
    throw new HttpError(400, "Checklist details must be a string.");
  }

  return value.trim();
}

function parseWikiChecklistSortOrder(value: unknown): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) {
    throw new HttpError(400, "Checklist sort order must be a non-negative integer.");
  }

  return parsed;
}

async function listWikiPages(): Promise<WikiPageRow[]> {
  const result = await pool.query<WikiPageRow>(
    `SELECT
       id::int AS id,
       title,
       content,
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"
     FROM wiki_pages
     ORDER BY updated_at DESC, id DESC`,
  );

  return result.rows;
}

async function listWikiChecklistItems(): Promise<WikiChecklistItemRow[]> {
  const result = await pool.query<WikiChecklistItemRow>(
    `SELECT
       id::int AS id,
       item_text AS text,
       details,
       is_done AS "isDone",
       sort_order AS "sortOrder",
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"
     FROM wiki_checklist_items
     ORDER BY
       is_done ASC,
       sort_order ASC,
       updated_at DESC,
       id DESC`,
  );

  return result.rows;
}

async function getWikiState(): Promise<{
  pages: WikiPageRow[];
  checklist: WikiChecklistItemRow[];
}> {
  const [pages, checklist] = await Promise.all([
    listWikiPages(),
    listWikiChecklistItems(),
  ]);

  return { pages, checklist };
}

async function getWikiAccessState(): Promise<WikiAccessState> {
  const result = await pool.query<{ enabled: boolean; updatedAt: string | null }>(
    `SELECT
       wiki_enabled AS enabled,
       updated_at::text AS "updatedAt"
     FROM app_config
     WHERE id = 1
     LIMIT 1`,
  );

  const row = result.rows[0];
  return {
    enabled: row?.enabled ?? false,
    redirectUrl: WIKI_DISABLED_REDIRECT_URL,
    updatedAt: row?.updatedAt ?? null,
  };
}

async function assertWikiEnabled(): Promise<void> {
  const state = await getWikiAccessState();
  if (state.enabled) {
    return;
  }

  throw new HttpError(
    403,
    `Wiki is disabled by admin. Redirect target: ${WIKI_DISABLED_REDIRECT_URL}`,
  );
}

async function createWikiPage(payload: unknown): Promise<{ page: WikiPageRow }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const title = parseWikiPageTitle(data.title);
  const content = parseWikiPageContent(data.content);

  const inserted = await pool.query<WikiPageRow>(
    `INSERT INTO wiki_pages (title, content)
     VALUES ($1, $2)
     RETURNING
       id::int AS id,
       title,
       content,
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"`,
    [title, content],
  );

  const page = inserted.rows[0];
  if (!page) {
    throw new HttpError(500, "Could not create wiki page.");
  }

  return { page };
}

async function updateWikiPage(
  pageId: number,
  payload: unknown,
): Promise<{ page: WikiPageRow }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("title" in data) {
    const title = parseWikiPageTitle(data.title);
    values.push(title);
    updates.push(`title = $${values.length}`);
  }

  if ("content" in data) {
    const content = parseWikiPageContent(data.content);
    values.push(content);
    updates.push(`content = $${values.length}`);
  }

  if (updates.length === 0) {
    throw new HttpError(400, "No wiki page fields provided.");
  }

  values.push(pageId);
  const updated = await pool.query<WikiPageRow>(
    `UPDATE wiki_pages
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING
       id::int AS id,
       title,
       content,
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"`,
    values,
  );

  const page = updated.rows[0];
  if (!page) {
    throw new HttpError(404, "Wiki page not found.");
  }

  return { page };
}

async function deleteWikiPage(pageId: number): Promise<{ id: number }> {
  const deleted = await pool.query<{ id: number }>(
    `DELETE FROM wiki_pages
     WHERE id = $1
     RETURNING id::int AS id`,
    [pageId],
  );

  const row = deleted.rows[0];
  if (!row?.id) {
    throw new HttpError(404, "Wiki page not found.");
  }

  return { id: row.id };
}

async function createWikiChecklistItem(
  payload: unknown,
): Promise<{ item: WikiChecklistItemRow }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const text = parseWikiChecklistText(data.text);
  const details = parseWikiChecklistDetails(data.details);

  const sortResult = await pool.query<{ next_sort_order: number }>(
    `SELECT COALESCE(MAX(sort_order), 0)::int + 1 AS next_sort_order
     FROM wiki_checklist_items`,
  );
  const sortOrder = sortResult.rows[0]?.next_sort_order ?? 1;

  const inserted = await pool.query<WikiChecklistItemRow>(
    `INSERT INTO wiki_checklist_items (item_text, details, is_done, sort_order)
     VALUES ($1, $2, FALSE, $3)
     RETURNING
       id::int AS id,
       item_text AS text,
       details,
       is_done AS "isDone",
       sort_order AS "sortOrder",
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"`,
    [text, details, sortOrder],
  );

  const item = inserted.rows[0];
  if (!item) {
    throw new HttpError(500, "Could not create checklist item.");
  }

  return { item };
}

async function updateWikiChecklistItem(
  itemId: number,
  payload: unknown,
): Promise<{ item: WikiChecklistItemRow }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("text" in data) {
    const text = parseWikiChecklistText(data.text);
    values.push(text);
    updates.push(`item_text = $${values.length}`);
  }

  if ("details" in data) {
    const details = parseWikiChecklistDetails(data.details);
    values.push(details);
    updates.push(`details = $${values.length}`);
  }

  if ("isDone" in data) {
    if (typeof data.isDone !== "boolean") {
      throw new HttpError(400, "Checklist isDone must be true or false.");
    }

    values.push(data.isDone);
    updates.push(`is_done = $${values.length}`);
  }

  if ("sortOrder" in data) {
    const sortOrder = parseWikiChecklistSortOrder(data.sortOrder);
    values.push(sortOrder);
    updates.push(`sort_order = $${values.length}`);
  }

  if (updates.length === 0) {
    throw new HttpError(400, "No checklist fields provided.");
  }

  values.push(itemId);
  const updated = await pool.query<WikiChecklistItemRow>(
    `UPDATE wiki_checklist_items
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING
       id::int AS id,
       item_text AS text,
       details,
       is_done AS "isDone",
       sort_order AS "sortOrder",
       created_at::text AS "createdAt",
       updated_at::text AS "updatedAt"`,
    values,
  );

  const item = updated.rows[0];
  if (!item) {
    throw new HttpError(404, "Checklist item not found.");
  }

  return { item };
}

async function deleteWikiChecklistItem(itemId: number): Promise<{ id: number }> {
  const deleted = await pool.query<{ id: number }>(
    `DELETE FROM wiki_checklist_items
     WHERE id = $1
     RETURNING id::int AS id`,
    [itemId],
  );

  const row = deleted.rows[0];
  if (!row?.id) {
    throw new HttpError(404, "Checklist item not found.");
  }

  return { id: row.id };
}

type MainCaseFilters = {
  search?: string;
  caseRef?: string;
  teamNumber?: (typeof TEAM_VALUES)[number] | null;
  severity?: Severity | null;
  status?: MainCaseStatus | null;
  owner?: string;
  summary?: string;
  details?: string;
  currentAction?: string;
  firstReportedFrom?: string | null;
  firstReportedTo?: string | null;
  lastUpdatedFrom?: string | null;
  lastUpdatedTo?: string | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

async function listMainCases(filters: MainCaseFilters = {}): Promise<unknown[]> {
  const params: Array<string | number> = [];
  const whereConditions: string[] = [];
  const havingConditions: string[] = [];

  const search = filters.search?.trim() ?? "";
  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;
    whereConditions.push(`(
      mc.main_case_ref ILIKE ${searchParam}
      OR mc.summary ILIKE ${searchParam}
      OR mc.details ILIKE ${searchParam}
      OR mc.owner ILIKE ${searchParam}
      OR mc.status ILIKE ${searchParam}
      OR mc.current_action ILIKE ${searchParam}
    )`);
  }

  const caseRef = filters.caseRef?.trim() ?? "";
  if (caseRef) {
    params.push(`%${caseRef}%`);
    whereConditions.push(`mc.main_case_ref ILIKE $${params.length}`);
  }

  if (filters.teamNumber !== null && filters.teamNumber !== undefined) {
    params.push(filters.teamNumber);
    whereConditions.push(`mc.team_number = $${params.length}`);
  }

  if (filters.severity) {
    params.push(filters.severity);
    whereConditions.push(`mc.severity = $${params.length}`);
  }

  if (filters.status) {
    params.push(filters.status);
    whereConditions.push(`mc.status = $${params.length}`);
  }

  const owner = filters.owner?.trim() ?? "";
  if (owner) {
    params.push(`%${owner}%`);
    whereConditions.push(`mc.owner ILIKE $${params.length}`);
  }

  const summary = filters.summary?.trim() ?? "";
  if (summary) {
    params.push(`%${summary}%`);
    whereConditions.push(`mc.summary ILIKE $${params.length}`);
  }

  const details = filters.details?.trim() ?? "";
  if (details) {
    params.push(`%${details}%`);
    whereConditions.push(`mc.details ILIKE $${params.length}`);
  }

  const currentAction = filters.currentAction?.trim() ?? "";
  if (currentAction) {
    params.push(`%${currentAction}%`);
    whereConditions.push(`mc.current_action ILIKE $${params.length}`);
  }

  if (filters.firstReportedFrom) {
    params.push(filters.firstReportedFrom);
    havingConditions.push(
      `COALESCE(MIN(e.occurred_at), mc.created_at) >= $${params.length}::timestamptz`,
    );
  }

  if (filters.firstReportedTo) {
    params.push(filters.firstReportedTo);
    havingConditions.push(
      `COALESCE(MIN(e.occurred_at), mc.created_at) <= $${params.length}::timestamptz`,
    );
  }

  if (filters.lastUpdatedFrom) {
    params.push(filters.lastUpdatedFrom);
    havingConditions.push(
      `GREATEST(mc.updated_at, COALESCE(MAX(e.updated_at), mc.updated_at)) >= $${params.length}::timestamptz`,
    );
  }

  if (filters.lastUpdatedTo) {
    params.push(filters.lastUpdatedTo);
    havingConditions.push(
      `GREATEST(mc.updated_at, COALESCE(MAX(e.updated_at), mc.updated_at)) <= $${params.length}::timestamptz`,
    );
  }

  const whereClause = whereConditions.length
    ? `WHERE ${whereConditions.join(" AND ")}`
    : "";
  const havingClause = havingConditions.length
    ? `HAVING ${havingConditions.join(" AND ")}`
    : "";

  const direction = filters.sortDir === "asc" ? "ASC" : "DESC";
  const caseSortMap: Record<string, string> = {
    lastUpdated: `GREATEST(mc.updated_at, COALESCE(MAX(e.updated_at), mc.updated_at))`,
    firstReported: `COALESCE(MIN(e.occurred_at), mc.created_at)`,
    eventCount: `COUNT(e.id)`,
    severity: `CASE mc.severity
      WHEN 'Low' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'High' THEN 3
      WHEN 'Critical' THEN 4
      ELSE 0
    END`,
    teamNumber: `mc.team_number`,
    status: `CASE mc.status
      WHEN 'Triage' THEN 1
      WHEN 'Event' THEN 2
      WHEN 'Incident' THEN 3
      WHEN 'Critical' THEN 4
      WHEN 'Review' THEN 5
      WHEN 'Closed' THEN 6
      ELSE 99
    END`,
    caseRef: `LOWER(mc.main_case_ref)`,
    createdAt: `mc.created_at`,
    owner: `LOWER(mc.owner)`,
  };
  const sortExpression = caseSortMap[filters.sortBy ?? "lastUpdated"] ?? caseSortMap.lastUpdated;
  const orderByClause = `ORDER BY ${sortExpression} ${direction}, mc.id ${direction}`;

  const query = `
    SELECT
      mc.id::int AS id,
      mc.main_case_ref,
      mc.team_number,
      mc.severity,
      mc.owner,
      mc.status,
      mc.current_action,
      mc.summary,
      mc.details,
      mc.created_at,
      COALESCE(MIN(e.occurred_at), mc.created_at) AS first_reported,
      GREATEST(mc.updated_at, COALESCE(MAX(e.updated_at), mc.updated_at)) AS last_updated,
      COUNT(e.id)::int AS event_count
    FROM main_cases mc
    LEFT JOIN journal_events e ON e.main_case_id = mc.id
    ${whereClause}
    GROUP BY
      mc.id,
      mc.main_case_ref,
      mc.team_number,
      mc.severity,
      mc.owner,
      mc.status,
      mc.current_action,
      mc.summary,
      mc.details,
      mc.created_at,
      mc.updated_at
    ${havingClause}
    ${orderByClause}
    LIMIT 300
  `;

  const result = await pool.query(query, params);
  return result.rows;
}

async function getMainCaseById(mainCaseId: number): Promise<unknown> {
  const result = await pool.query(
    `SELECT
       mc.id::int AS id,
       mc.main_case_ref,
       mc.team_number,
       mc.severity,
       mc.owner,
       mc.status,
       mc.current_action,
       mc.summary,
       mc.details,
       mc.created_at,
       COALESCE(MIN(e.occurred_at), mc.created_at) AS first_reported,
       GREATEST(mc.updated_at, COALESCE(MAX(e.updated_at), mc.updated_at)) AS last_updated,
       COUNT(e.id)::int AS event_count
     FROM main_cases mc
     LEFT JOIN journal_events e ON e.main_case_id = mc.id
     WHERE mc.id = $1
     GROUP BY
       mc.id,
       mc.main_case_ref,
       mc.team_number,
       mc.severity,
       mc.owner,
       mc.status,
       mc.current_action,
       mc.summary,
       mc.details,
       mc.created_at,
       mc.updated_at
     LIMIT 1`,
    [mainCaseId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new HttpError(404, "Case not found.");
  }

  return row;
}

async function createMainCase(
  payload: unknown,
): Promise<{ id: number; mainCaseRef: string }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const teamNumber = Number(data.teamNumber);
  const severity = data.severity;
  const status = data.status;
  const owner = typeof data.owner === "string" ? data.owner.trim() : "";
  const summary = typeof data.summary === "string" ? data.summary.trim() : "";
  const details = typeof data.details === "string" ? data.details.trim() : "";
  const currentAction =
    typeof data.currentAction === "string" ? data.currentAction.trim() : "";

  if (!TEAM_VALUES.includes(teamNumber as (typeof TEAM_VALUES)[number])) {
    throw new HttpError(400, "Team Number must be 1 or 2.");
  }

  if (!SEVERITY_VALUES.includes(severity as Severity)) {
    throw new HttpError(400, "Severity must be one of: Low, Medium, High, Critical.");
  }

  if (!MAIN_CASE_STATUS_VALUES.includes(status as MainCaseStatus)) {
    throw new HttpError(
      400,
      "Status must be one of: Triage, Event, Incident, Critical, Review, Closed.",
    );
  }

  if (!owner) {
    throw new HttpError(400, "Owner is required for the case.");
  }

  if (!summary) {
    throw new HttpError(400, "Summary is required for the case.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const identity = await reserveMainCaseIdentity(client);

    const insert = await client.query<{ id: number; main_case_ref: string }>(
      `INSERT INTO main_cases
       (id, main_case_ref, team_number, severity, owner, status, current_action, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::int AS id, main_case_ref`,
      [
        identity.id,
        identity.ref,
        teamNumber,
        severity,
        owner,
        status,
        currentAction,
        summary,
        details,
      ],
    );

    const row = insert.rows[0];
    if (!row?.id) {
      throw new HttpError(500, "Could not create case.");
    }

    await client.query("COMMIT");
    return { id: row.id, mainCaseRef: row.main_case_ref };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateMainCase(
  mainCaseId: number,
  payload: unknown,
): Promise<{ id: number; mainCaseRef: string }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const updates: string[] = [];
  const values: unknown[] = [];

  if ("teamNumber" in data) {
    const teamNumber = Number(data.teamNumber);
    if (!TEAM_VALUES.includes(teamNumber as (typeof TEAM_VALUES)[number])) {
      throw new HttpError(400, "Team Number must be 1 or 2.");
    }

    values.push(teamNumber);
    updates.push(`team_number = $${values.length}`);
  }

  if ("severity" in data) {
    const severity = data.severity;
    if (!SEVERITY_VALUES.includes(severity as Severity)) {
      throw new HttpError(
        400,
        "Severity must be one of: Low, Medium, High, Critical.",
      );
    }

    values.push(severity);
    updates.push(`severity = $${values.length}`);
  }

  if ("status" in data) {
    const status = data.status;
    if (!MAIN_CASE_STATUS_VALUES.includes(status as MainCaseStatus)) {
      throw new HttpError(
        400,
        "Status must be one of: Triage, Event, Incident, Critical, Review, Closed.",
      );
    }

    values.push(status);
    updates.push(`status = $${values.length}`);
  }

  if ("owner" in data) {
    const owner = typeof data.owner === "string" ? data.owner.trim() : "";
    if (!owner) {
      throw new HttpError(400, "Owner cannot be empty.");
    }

    values.push(owner);
    updates.push(`owner = $${values.length}`);
  }

  if ("summary" in data) {
    const summary = typeof data.summary === "string" ? data.summary.trim() : "";
    if (!summary) {
      throw new HttpError(400, "Summary cannot be empty.");
    }

    values.push(summary);
    updates.push(`summary = $${values.length}`);
  }

  if ("details" in data) {
    const details = typeof data.details === "string" ? data.details.trim() : "";
    values.push(details);
    updates.push(`details = $${values.length}`);
  }

  if ("currentAction" in data) {
    const currentAction =
      typeof data.currentAction === "string" ? data.currentAction.trim() : "";
    values.push(currentAction);
    updates.push(`current_action = $${values.length}`);
  }

  if (updates.length === 0) {
    throw new HttpError(400, "No valid fields provided for update.");
  }

  values.push(mainCaseId);

  const update = await pool.query<{ id: number; main_case_ref: string }>(
    `UPDATE main_cases
     SET ${updates.join(", ")}, updated_at = NOW()
     WHERE id = $${values.length}
     RETURNING id::int AS id, main_case_ref`,
    values,
  );

  const row = update.rows[0];
  if (!row?.id) {
    throw new HttpError(404, "Case not found.");
  }

  return { id: row.id, mainCaseRef: row.main_case_ref };
}

type EventFilters = {
  search?: string;
  mainCaseId?: number | null;
  caseId?: string;
  caseRef?: string;
  severity?: Severity | null;
  teamNumber?: (typeof TEAM_VALUES)[number] | null;
  eventType?: EventType | null;
  summary?: string;
  details?: string;
  service?: string;
  host?: string;
  owner?: string;
  tag?: string;
  timeFrom?: string | null;
  timeTo?: string | null;
  sortBy?: string;
  sortDir?: "asc" | "desc";
};

async function listEvents(filters: EventFilters = {}): Promise<unknown[]> {
  const params: Array<string | number> = [];
  const conditions: string[] = [];

  const search = filters.search?.trim() ?? "";
  const mainCaseId = filters.mainCaseId ?? null;
  const caseId = filters.caseId?.trim() ?? "";
  const caseRef = filters.caseRef?.trim() ?? "";
  const summary = filters.summary?.trim() ?? "";
  const details = filters.details?.trim() ?? "";
  const service = filters.service?.trim() ?? "";
  const host = filters.host?.trim() ?? "";
  const owner = filters.owner?.trim() ?? "";
  const tag = filters.tag?.trim() ?? "";

  if (mainCaseId !== null) {
    params.push(mainCaseId);
    conditions.push(`e.main_case_id = $${params.length}`);
  }

  if (caseId) {
    params.push(`%${caseId}%`);
    conditions.push(`e.case_id ILIKE $${params.length}`);
  }

  if (caseRef) {
    params.push(`%${caseRef}%`);
    conditions.push(`COALESCE(mc.main_case_ref, '') ILIKE $${params.length}`);
  }

  if (filters.severity) {
    params.push(filters.severity);
    conditions.push(`e.severity = $${params.length}`);
  }

  if (filters.teamNumber !== null && filters.teamNumber !== undefined) {
    params.push(filters.teamNumber);
    conditions.push(`e.team_number = $${params.length}`);
  }

  if (filters.eventType) {
    params.push(filters.eventType);
    conditions.push(`e.event_type = $${params.length}`);
  }

  if (summary) {
    params.push(`%${summary}%`);
    conditions.push(`e.summary ILIKE $${params.length}`);
  }

  if (details) {
    params.push(`%${details}%`);
    conditions.push(`e.details ILIKE $${params.length}`);
  }

  if (service) {
    params.push(`%${service}%`);
    const serviceParam = `$${params.length}`;
    conditions.push(`EXISTS (
      SELECT 1
      FROM event_services es2
      JOIN services s2 ON s2.id = es2.service_id
      WHERE es2.event_id = e.id
        AND s2.name ILIKE ${serviceParam}
    )`);
  }

  if (host) {
    params.push(`%${host}%`);
    const hostParam = `$${params.length}`;
    conditions.push(`EXISTS (
      SELECT 1
      FROM event_hosts eh2
      JOIN hosts h2 ON h2.id = eh2.host_id
      WHERE eh2.event_id = e.id
        AND h2.name ILIKE ${hostParam}
    )`);
  }

  if (owner) {
    params.push(`%${owner}%`);
    const ownerParam = `$${params.length}`;
    conditions.push(`EXISTS (
      SELECT 1
      FROM event_owners eo2
      JOIN owners o2 ON o2.id = eo2.owner_id
      WHERE eo2.event_id = e.id
        AND o2.name ILIKE ${ownerParam}
    )`);
  }

  if (tag) {
    params.push(`%${tag}%`);
    const tagParam = `$${params.length}`;
    conditions.push(`EXISTS (
      SELECT 1
      FROM event_tags et2
      JOIN tags t2 ON t2.id = et2.tag_id
      WHERE et2.event_id = e.id
        AND t2.name ILIKE ${tagParam}
    )`);
  }

  if (filters.timeFrom) {
    params.push(filters.timeFrom);
    conditions.push(`e.occurred_at >= $${params.length}::timestamptz`);
  }

  if (filters.timeTo) {
    params.push(filters.timeTo);
    conditions.push(`e.occurred_at <= $${params.length}::timestamptz`);
  }

  if (search) {
    params.push(`%${search}%`);
    const searchParam = `$${params.length}`;
    conditions.push(`(
      e.case_id ILIKE ${searchParam}
      OR e.summary ILIKE ${searchParam}
      OR e.details ILIKE ${searchParam}
      OR e.event_type ILIKE ${searchParam}
      OR COALESCE(mc.main_case_ref, '') ILIKE ${searchParam}
      OR EXISTS (
        SELECT 1
        FROM event_services es2
        JOIN services s2 ON s2.id = es2.service_id
        WHERE es2.event_id = e.id
          AND s2.name ILIKE ${searchParam}
      )
      OR EXISTS (
        SELECT 1
        FROM event_hosts eh2
        JOIN hosts h2 ON h2.id = eh2.host_id
        WHERE eh2.event_id = e.id
          AND h2.name ILIKE ${searchParam}
      )
      OR EXISTS (
        SELECT 1
        FROM event_owners eo2
        JOIN owners o2 ON o2.id = eo2.owner_id
        WHERE eo2.event_id = e.id
          AND o2.name ILIKE ${searchParam}
      )
      OR EXISTS (
        SELECT 1
        FROM event_tags et2
        JOIN tags t2 ON t2.id = et2.tag_id
        WHERE et2.event_id = e.id
          AND t2.name ILIKE ${searchParam}
      )
    )`);
  }

  const whereClause = conditions.length
    ? `WHERE ${conditions.join(" AND ")}`
    : "";

  const direction = filters.sortDir === "asc" ? "ASC" : "DESC";
  const eventSortMap: Record<string, string> = {
    createdAt: `e.created_at`,
    occurredAt: `e.occurred_at`,
    severity: `CASE e.severity
      WHEN 'Low' THEN 1
      WHEN 'Medium' THEN 2
      WHEN 'High' THEN 3
      WHEN 'Critical' THEN 4
      ELSE 0
    END`,
    teamNumber: `e.team_number`,
    eventType: `LOWER(e.event_type)`,
    caseId: `LOWER(e.case_id)`,
    caseRef: `LOWER(COALESCE(mc.main_case_ref, ''))`,
    summary: `LOWER(e.summary)`,
  };
  const sortExpression = eventSortMap[filters.sortBy ?? "createdAt"] ?? eventSortMap.createdAt;
  const orderByClause = `ORDER BY ${sortExpression} ${direction}, e.id ${direction}`;

  const result = await pool.query(
    `SELECT
       e.id::int AS id,
       e.case_id,
       e.main_case_id::int AS main_case_id,
       mc.main_case_ref,
       e.occurred_at,
       e.created_at,
       e.severity,
       e.team_number,
       e.event_type,
       e.summary,
       e.details,
       COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]'::json) AS services,
       COALESCE(json_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '[]'::json) AS hosts,
       COALESCE(json_agg(DISTINCT o.name) FILTER (WHERE o.name IS NOT NULL), '[]'::json) AS owners,
       COALESCE(json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '[]'::json) AS tags
     FROM journal_events e
     LEFT JOIN main_cases mc ON mc.id = e.main_case_id
     LEFT JOIN event_services es ON es.event_id = e.id
     LEFT JOIN services s ON s.id = es.service_id
     LEFT JOIN event_hosts eh ON eh.event_id = e.id
     LEFT JOIN hosts h ON h.id = eh.host_id
     LEFT JOIN event_owners eo ON eo.event_id = e.id
     LEFT JOIN owners o ON o.id = eo.owner_id
     LEFT JOIN event_tags et ON et.event_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     ${whereClause}
     GROUP BY e.id, mc.main_case_ref
     ${orderByClause}
     LIMIT 300`,
    params,
  );

  return result.rows;
}

async function listCaseTimelineEvents(mainCaseId: number): Promise<unknown[]> {
  const result = await pool.query(
    `SELECT
       e.id::int AS id,
       e.case_id,
       e.main_case_id::int AS main_case_id,
       e.occurred_at,
       e.created_at,
       e.severity,
       e.team_number,
       e.event_type,
       e.summary,
       e.details,
       COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]'::json) AS services,
       COALESCE(json_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '[]'::json) AS hosts,
       COALESCE(json_agg(DISTINCT o.name) FILTER (WHERE o.name IS NOT NULL), '[]'::json) AS owners,
       COALESCE(json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '[]'::json) AS tags
     FROM journal_events e
     LEFT JOIN event_services es ON es.event_id = e.id
     LEFT JOIN services s ON s.id = es.service_id
     LEFT JOIN event_hosts eh ON eh.event_id = e.id
     LEFT JOIN hosts h ON h.id = eh.host_id
     LEFT JOIN event_owners eo ON eo.event_id = e.id
     LEFT JOIN owners o ON o.id = eo.owner_id
     LEFT JOIN event_tags et ON et.event_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     WHERE e.main_case_id = $1
     GROUP BY e.id
     ORDER BY e.occurred_at ASC, e.id ASC
     LIMIT 1000`,
    [mainCaseId],
  );

  return result.rows;
}

async function getEventById(eventId: number): Promise<unknown> {
  const result = await pool.query(
    `SELECT
       e.id::int AS id,
       e.case_id,
       e.main_case_id::int AS main_case_id,
       mc.main_case_ref,
       e.occurred_at,
       e.created_at,
       e.severity,
       e.team_number,
       e.event_type,
       e.summary,
       e.details,
       COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]'::json) AS services,
       COALESCE(json_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '[]'::json) AS hosts,
       COALESCE(json_agg(DISTINCT o.name) FILTER (WHERE o.name IS NOT NULL), '[]'::json) AS owners,
       COALESCE(json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '[]'::json) AS tags
     FROM journal_events e
     LEFT JOIN main_cases mc ON mc.id = e.main_case_id
     LEFT JOIN event_services es ON es.event_id = e.id
     LEFT JOIN services s ON s.id = es.service_id
     LEFT JOIN event_hosts eh ON eh.event_id = e.id
     LEFT JOIN hosts h ON h.id = eh.host_id
     LEFT JOIN event_owners eo ON eo.event_id = e.id
     LEFT JOIN owners o ON o.id = eo.owner_id
     LEFT JOIN event_tags et ON et.event_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     WHERE e.id = $1
     GROUP BY e.id, mc.main_case_ref
     LIMIT 1`,
    [eventId],
  );

  const row = result.rows[0];
  if (!row) {
    throw new HttpError(404, "Event not found.");
  }

  return row;
}

type ParsedEventInput = {
  mainCaseId: number | null;
  createCaseIfMissing: boolean;
  severity: Severity;
  eventType: EventType;
  summary: string;
  details: string;
  teamNumber: (typeof TEAM_VALUES)[number];
  occurredAt: Date;
  services: string[];
  hosts: string[];
  owners: string[];
  tags: string[];
};

function parseEventPayload(
  payload: unknown,
  options: { allowMissingMainCase: boolean },
): ParsedEventInput {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const rawMainCaseId = data.mainCaseId;
  const mainCaseId =
    rawMainCaseId === undefined || rawMainCaseId === null || rawMainCaseId === ""
      ? null
      : parsePositiveInt(rawMainCaseId, "Case");
  const createCaseIfMissing = data.createCaseIfMissing === true;
  const severity = data.severity;
  const eventType = data.eventType;
  const summary = typeof data.summary === "string" ? data.summary.trim() : "";
  const details = typeof data.details === "string" ? data.details.trim() : "";
  const teamNumber = Number(data.teamNumber);
  const occurredAtRaw =
    typeof data.time === "string" && data.time.trim() ? data.time.trim() : null;

  if (!SEVERITY_VALUES.includes(severity as Severity)) {
    throw new HttpError(400, "Severity must be one of: Low, Medium, High, Critical.");
  }

  if (!EVENT_TYPE_VALUES.includes(eventType as EventType)) {
    throw new HttpError(
      400,
      "Event Type must be one of: Finding/ Evidence, Action, Decision, Meeting, Join/Leave, Comms, Note.",
    );
  }

  if (!TEAM_VALUES.includes(teamNumber as (typeof TEAM_VALUES)[number])) {
    throw new HttpError(400, "Team Number must be 1 or 2.");
  }

  if (!summary) {
    throw new HttpError(400, "Summary is required.");
  }

  if (!options.allowMissingMainCase && !mainCaseId) {
    throw new HttpError(400, "Case is required.");
  }

  const occurredAt = occurredAtRaw ? new Date(occurredAtRaw) : new Date();
  if (Number.isNaN(occurredAt.valueOf())) {
    throw new HttpError(400, "Invalid time value.");
  }

  return {
    mainCaseId,
    createCaseIfMissing,
    severity: severity as Severity,
    eventType: eventType as EventType,
    summary,
    details,
    teamNumber: teamNumber as (typeof TEAM_VALUES)[number],
    occurredAt,
    services: normalizeNames(data.servicesAffected),
    hosts: normalizeNames(data.hostsAffected),
    owners: normalizeNames(data.owners),
    tags: normalizeNames(data.tags),
  };
}

async function createAutoMainCaseForEvent(
  client: PoolClient,
  input: ParsedEventInput,
): Promise<{ id: number; ref: string }> {
  const owner = input.owners[0] ?? "Unassigned";
  const mainSummary = `Auto Case: ${input.summary}`;
  const mainDetails = [
    "Auto-generated from event because no case was selected.",
    "",
    `Event Summary: ${input.summary}`,
    `Event Details: ${input.details || "n/a"}`,
  ].join("\n");
  const identity = await reserveMainCaseIdentity(client);
  const inserted = await client.query<{ id: number; main_case_ref: string }>(
    `INSERT INTO main_cases
     (id, main_case_ref, team_number, severity, owner, status, current_action, summary, details)
     VALUES ($1, $2, $3, $4, $5, 'Event', 'Review auto-created case and assign owner.', $6, $7)
     RETURNING id::int AS id, main_case_ref`,
    [
      identity.id,
      identity.ref,
      input.teamNumber,
      input.severity,
      owner,
      mainSummary,
      mainDetails,
    ],
  );

  const row = inserted.rows[0];
  if (!row?.id) {
    throw new HttpError(500, "Could not auto-generate a case.");
  }

  return { id: row.id, ref: row.main_case_ref };
}

async function createEvent(payload: unknown): Promise<{
  caseId: string;
  eventId: number;
  mainCaseId: number;
  mainCaseRef: string;
  autoCreatedMainCase: boolean;
}> {
  const input = parseEventPayload(payload, { allowMissingMainCase: true });

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    let selectedMainCaseId = input.mainCaseId;
    let selectedMainCaseRef = "";
    let autoCreatedMainCase = false;

    if (selectedMainCaseId) {
      const mainCaseCheck = await client.query<{ id: number; main_case_ref: string }>(
        `SELECT id::int AS id, main_case_ref
         FROM main_cases
         WHERE id = $1
         LIMIT 1`,
        [selectedMainCaseId],
      );

      const row = mainCaseCheck.rows[0];
      if (!row?.id) {
        throw new HttpError(404, "Case not found.");
      }

      selectedMainCaseRef = row.main_case_ref;
    } else if (input.createCaseIfMissing) {
      const generatedMainCase = await createAutoMainCaseForEvent(client, input);
      selectedMainCaseId = generatedMainCase.id;
      selectedMainCaseRef = generatedMainCase.ref;
      autoCreatedMainCase = true;
    } else {
      throw new HttpError(
        400,
        "Case is required. Enable 'Create new case' in Event Logger if you want auto-creation.",
      );
    }

    if (!selectedMainCaseId) {
      throw new HttpError(500, "Case resolution failed.");
    }

    const eventIdentity = await reserveEventIdentity(client);
    const insertEvent = await client.query<{ id: number; case_id: string }>(
      `INSERT INTO journal_events
       (id, main_case_id, case_id, occurred_at, severity, team_number, event_type, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::int AS id, case_id`,
      [
        eventIdentity.id,
        selectedMainCaseId,
        eventIdentity.caseId,
        input.occurredAt.toISOString(),
        input.severity,
        input.teamNumber,
        input.eventType,
        input.summary,
        input.details,
      ],
    );

    const insertedRow = insertEvent.rows[0];
    if (!insertedRow?.id) {
      throw new HttpError(500, "Could not create event.");
    }

    const eventId = insertedRow.id;
    const caseId = insertedRow.case_id;

    const [serviceIds, hostIds, ownerIds, tagIds] = await Promise.all([
      ensureCatalogNames(client, "services", input.services),
      ensureCatalogNames(client, "hosts", input.hosts),
      ensureCatalogNames(client, "owners", input.owners),
      ensureCatalogNames(client, "tags", input.tags),
    ]);

    await Promise.all([
      linkEventCatalog(client, eventId, "services", serviceIds),
      linkEventCatalog(client, eventId, "hosts", hostIds),
      linkEventCatalog(client, eventId, "owners", ownerIds),
      linkEventCatalog(client, eventId, "tags", tagIds),
    ]);

    await client.query(`UPDATE main_cases SET updated_at = NOW() WHERE id = $1`, [
      selectedMainCaseId,
    ]);

    await client.query("COMMIT");
    return {
      caseId,
      eventId,
      mainCaseId: selectedMainCaseId,
      mainCaseRef: selectedMainCaseRef,
      autoCreatedMainCase,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function updateEvent(
  eventId: number,
  payload: unknown,
): Promise<{ eventId: number; caseId: string }> {
  const input = parseEventPayload(payload, { allowMissingMainCase: false });
  const requiredMainCaseId = input.mainCaseId;
  if (!requiredMainCaseId) {
    throw new HttpError(400, "Case is required.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    const existing = await client.query<{ case_id: string; main_case_id: number | null }>(
      `SELECT case_id, main_case_id::int AS main_case_id
       FROM journal_events
       WHERE id = $1
       LIMIT 1`,
      [eventId],
    );

    const existingRow = existing.rows[0];
    if (!existingRow) {
      throw new HttpError(404, "Event not found.");
    }

    const mainCaseCheck = await client.query(
      `SELECT id::int AS id FROM main_cases WHERE id = $1 LIMIT 1`,
      [requiredMainCaseId],
    );
    if (!mainCaseCheck.rows[0]?.id) {
      throw new HttpError(404, "Case not found.");
    }

    await client.query(
      `UPDATE journal_events
       SET main_case_id = $1,
           occurred_at = $2,
           severity = $3,
           team_number = $4,
           event_type = $5,
           summary = $6,
           details = $7,
           updated_at = NOW()
      WHERE id = $8`,
      [
        requiredMainCaseId,
        input.occurredAt.toISOString(),
        input.severity,
        input.teamNumber,
        input.eventType,
        input.summary,
        input.details,
        eventId,
      ],
    );

    await clearEventCatalogLinks(client, eventId);

    const [serviceIds, hostIds, ownerIds, tagIds] = await Promise.all([
      ensureCatalogNames(client, "services", input.services),
      ensureCatalogNames(client, "hosts", input.hosts),
      ensureCatalogNames(client, "owners", input.owners),
      ensureCatalogNames(client, "tags", input.tags),
    ]);

    await Promise.all([
      linkEventCatalog(client, eventId, "services", serviceIds),
      linkEventCatalog(client, eventId, "hosts", hostIds),
      linkEventCatalog(client, eventId, "owners", ownerIds),
      linkEventCatalog(client, eventId, "tags", tagIds),
    ]);

    await client.query(`UPDATE main_cases SET updated_at = NOW() WHERE id = $1`, [
      requiredMainCaseId,
    ]);

    if (
      existingRow.main_case_id &&
      existingRow.main_case_id !== requiredMainCaseId
    ) {
      await client.query(`UPDATE main_cases SET updated_at = NOW() WHERE id = $1`, [
        existingRow.main_case_id,
      ]);
    }

    await client.query("COMMIT");
    return { eventId, caseId: existingRow.case_id };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function createCatalogValue(
  type: CatalogType,
  payload: unknown,
): Promise<{ name: string }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";

  if (!name) {
    throw new HttpError(400, "Catalog value cannot be empty.");
  }

  const table = CATALOG_TABLES[type];

  await pool.query(
    `INSERT INTO ${table} (name)
     VALUES ($1)
     ON CONFLICT DO NOTHING`,
    [name],
  );

  const result = await pool.query<{ name: string }>(
    `SELECT name
     FROM ${table}
     WHERE LOWER(name) = LOWER($1)
     LIMIT 1`,
    [name],
  );

  const savedName = result.rows[0]?.name;
  if (!savedName) {
    throw new HttpError(500, "Could not save catalog value.");
  }

  return { name: savedName };
}

async function deleteCatalogValue(
  type: CatalogType,
  payload: unknown,
): Promise<{ name: string }> {
  if (!payload || typeof payload !== "object") {
    throw new HttpError(400, "Invalid JSON body.");
  }

  const data = payload as Record<string, unknown>;
  const name = typeof data.name === "string" ? data.name.trim() : "";
  if (!name) {
    throw new HttpError(400, "Catalog value cannot be empty.");
  }

  const table = CATALOG_TABLES[type];
  const deleted = await pool.query<{ name: string }>(
    `DELETE FROM ${table}
     WHERE LOWER(name) = LOWER($1)
     RETURNING name`,
    [name],
  );

  const deletedName = deleted.rows[0]?.name;
  if (!deletedName) {
    throw new HttpError(404, "Catalog value not found.");
  }

  return { name: deletedName };
}

function assertAdminPassword(password: string): void {
  const providedPassword = password.trim();
  if (!ADMIN_PASSWORD) {
    throw new HttpError(
      503,
      "Admin reset is disabled. Set ADMIN_PASSWORD to enable this action.",
    );
  }

  if (!providedPassword || providedPassword !== ADMIN_PASSWORD) {
    throw new HttpError(403, "Invalid admin password.");
  }
}

async function runAdminDelete(
  password: string,
  target: "events" | "cases" | "all",
): Promise<void> {
  assertAdminPassword(password);

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    if (target === "events") {
      await client.query(`
        TRUNCATE TABLE
          event_services,
          event_hosts,
          event_owners,
          event_tags,
          journal_events
        RESTART IDENTITY CASCADE
      `);
    } else if (target === "cases") {
      await client.query(`
        TRUNCATE TABLE
          event_services,
          event_hosts,
          event_owners,
          event_tags,
          journal_events,
          main_cases
        RESTART IDENTITY CASCADE
      `);
    } else {
      await client.query(`
        TRUNCATE TABLE
          event_services,
          event_hosts,
          event_owners,
          event_tags,
          journal_events,
          main_cases,
          services,
          hosts,
          owners,
          tags,
          network_links,
          network_devices,
          wiki_checklist_items,
          wiki_pages
        RESTART IDENTITY CASCADE
      `);
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

async function resetDatabase(password: string): Promise<void> {
  await runAdminDelete(password, "all");
}

async function deleteEvents(password: string): Promise<void> {
  await runAdminDelete(password, "events");
}

async function deleteCases(password: string): Promise<void> {
  await runAdminDelete(password, "cases");
}

async function setWikiAccess(password: string, enabled: boolean): Promise<WikiAccessState> {
  assertAdminPassword(password);

  const updated = await pool.query<{ enabled: boolean; updatedAt: string | null }>(
    `INSERT INTO app_config (id, wiki_enabled, updated_at)
     VALUES (1, $1, NOW())
     ON CONFLICT (id)
     DO UPDATE SET
       wiki_enabled = EXCLUDED.wiki_enabled,
       updated_at = NOW()
     RETURNING
       wiki_enabled AS enabled,
       updated_at::text AS "updatedAt"`,
    [enabled],
  );

  const row = updated.rows[0];
  return {
    enabled: row?.enabled ?? enabled,
    redirectUrl: WIKI_DISABLED_REDIRECT_URL,
    updatedAt: row?.updatedAt ?? null,
  };
}

function normalizeSeverity(value: string): Severity {
  return SEVERITY_VALUES.includes(value as Severity) ? (value as Severity) : "Low";
}

function normalizeStatus(value: string): MainCaseStatus {
  return MAIN_CASE_STATUS_VALUES.includes(value as MainCaseStatus)
    ? (value as MainCaseStatus)
    : "Triage";
}

function normalizeEventType(value: string): EventType {
  return EVENT_TYPE_VALUES.includes(value as EventType)
    ? (value as EventType)
    : "Note";
}

function normalizeTeamNumber(value: string): (typeof TEAM_VALUES)[number] {
  const parsed = Number(value);
  if (TEAM_VALUES.includes(parsed as (typeof TEAM_VALUES)[number])) {
    return parsed as (typeof TEAM_VALUES)[number];
  }

  return 1;
}

async function exportCasesCsv(): Promise<string> {
  const result = await pool.query(
    `SELECT
       mc.main_case_ref,
       mc.team_number,
       mc.severity,
       mc.status,
       mc.owner,
       mc.current_action,
       mc.summary,
       mc.details,
       COALESCE(MIN(e.occurred_at), mc.created_at) AS first_reported,
       GREATEST(mc.updated_at, COALESCE(MAX(e.updated_at), mc.updated_at)) AS last_updated,
       COUNT(e.id)::int AS event_count
     FROM main_cases mc
     LEFT JOIN journal_events e ON e.main_case_id = mc.id
     GROUP BY
       mc.id,
       mc.main_case_ref,
       mc.team_number,
       mc.severity,
       mc.status,
       mc.owner,
       mc.current_action,
       mc.summary,
       mc.details,
       mc.created_at,
       mc.updated_at
     ORDER BY mc.id DESC`,
  );

  const rows = result.rows.map((row) => ({
    case_ref: row.main_case_ref,
    team_number: row.team_number,
    severity: row.severity,
    status: row.status,
    owner: row.owner,
    current_action: row.current_action,
    summary: row.summary,
    details: row.details,
    first_reported: row.first_reported ? String(row.first_reported) : "",
    last_updated: row.last_updated ? String(row.last_updated) : "",
    event_count: row.event_count,
  }));

  return buildCsv(
    [
      "case_ref",
      "team_number",
      "severity",
      "status",
      "owner",
      "current_action",
      "summary",
      "details",
      "first_reported",
      "last_updated",
      "event_count",
    ],
    rows,
  );
}

async function exportEventsCsv(): Promise<string> {
  const result = await pool.query(
    `SELECT
       e.case_id,
       mc.main_case_ref,
       e.occurred_at,
       e.severity,
       e.team_number,
       e.event_type,
       e.summary,
       e.details,
       COALESCE(json_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL), '[]'::json) AS services,
       COALESCE(json_agg(DISTINCT h.name) FILTER (WHERE h.name IS NOT NULL), '[]'::json) AS hosts,
       COALESCE(json_agg(DISTINCT o.name) FILTER (WHERE o.name IS NOT NULL), '[]'::json) AS owners,
       COALESCE(json_agg(DISTINCT t.name) FILTER (WHERE t.name IS NOT NULL), '[]'::json) AS tags
     FROM journal_events e
     LEFT JOIN main_cases mc ON mc.id = e.main_case_id
     LEFT JOIN event_services es ON es.event_id = e.id
     LEFT JOIN services s ON s.id = es.service_id
     LEFT JOIN event_hosts eh ON eh.event_id = e.id
     LEFT JOIN hosts h ON h.id = eh.host_id
     LEFT JOIN event_owners eo ON eo.event_id = e.id
     LEFT JOIN owners o ON o.id = eo.owner_id
     LEFT JOIN event_tags et ON et.event_id = e.id
     LEFT JOIN tags t ON t.id = et.tag_id
     GROUP BY e.id, mc.main_case_ref
     ORDER BY e.created_at DESC, e.id DESC`,
  );

  const rows = result.rows.map((row) => ({
    case_id: row.case_id,
    case_ref: row.main_case_ref ?? "",
    occurred_at: row.occurred_at ? String(row.occurred_at) : "",
    severity: row.severity,
    team_number: row.team_number,
    event_type: row.event_type,
    summary: row.summary,
    details: row.details,
    services: Array.isArray(row.services) ? row.services.join("; ") : "",
    hosts: Array.isArray(row.hosts) ? row.hosts.join("; ") : "",
    owners: Array.isArray(row.owners) ? row.owners.join("; ") : "",
    tags: Array.isArray(row.tags) ? row.tags.join("; ") : "",
  }));

  return buildCsv(
    [
      "case_id",
      "case_ref",
      "occurred_at",
      "severity",
      "team_number",
      "event_type",
      "summary",
      "details",
      "services",
      "hosts",
      "owners",
      "tags",
    ],
    rows,
  );
}

async function importCasesCsv(csvText: string): Promise<{
  imported: number;
  updated: number;
  skipped: number;
}> {
  const { rows } = parseCsvText(csvText);
  let imported = 0;
  let updated = 0;
  let skipped = 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      const caseRef = pickCsvValue(row, ["case_ref", "main_case_ref", "case"]);
      const teamNumber = normalizeTeamNumber(
        pickCsvValue(row, ["team_number", "team"]) || "1",
      );
      const severity = normalizeSeverity(pickCsvValue(row, ["severity"]));
      const status = normalizeStatus(pickCsvValue(row, ["status"]));
      const owner = pickCsvValue(row, ["owner"]) || "Unassigned";
      const currentAction = pickCsvValue(row, [
        "current_action",
        "current_action_next_steps",
        "next_steps",
      ]);
      const summary = pickCsvValue(row, ["summary"]);
      const details = pickCsvValue(row, ["details"]);

      if (!summary) {
        skipped += 1;
        continue;
      }

      await ensureCatalogNames(client, "owners", [owner]);

      if (caseRef) {
        const updatedRow = await client.query<{ id: number }>(
          `UPDATE main_cases
           SET team_number = $2,
               severity = $3,
               status = $4,
               owner = $5,
               current_action = $6,
               summary = $7,
               details = $8,
               updated_at = NOW()
           WHERE main_case_ref = $1
           RETURNING id::int AS id`,
          [caseRef, teamNumber, severity, status, owner, currentAction, summary, details],
        );

        if (updatedRow.rows[0]?.id) {
          updated += 1;
          continue;
        }
      }

      let createdRef = caseRef;
      if (!createdRef) {
        const identity = await reserveMainCaseIdentity(client);
        const insert = await client.query<{ id: number; main_case_ref: string }>(
          `INSERT INTO main_cases
           (id, main_case_ref, team_number, severity, owner, status, current_action, summary, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           RETURNING id::int AS id, main_case_ref`,
          [
            identity.id,
            identity.ref,
            teamNumber,
            severity,
            owner,
            status,
            currentAction,
            summary,
            details,
          ],
        );

        if (insert.rows[0]?.id) {
          createdRef = insert.rows[0].main_case_ref;
        }
      } else {
        const insert = await client.query<{ id: number }>(
          `INSERT INTO main_cases
           (main_case_ref, team_number, severity, owner, status, current_action, summary, details)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
           ON CONFLICT (main_case_ref) DO NOTHING
           RETURNING id::int AS id`,
          [createdRef, teamNumber, severity, owner, status, currentAction, summary, details],
        );

        if (!insert.rows[0]?.id) {
          const fallbackUpdate = await client.query<{ id: number }>(
            `UPDATE main_cases
             SET team_number = $2,
                 severity = $3,
                 status = $4,
                 owner = $5,
                 current_action = $6,
                 summary = $7,
                 details = $8,
                 updated_at = NOW()
             WHERE main_case_ref = $1
             RETURNING id::int AS id`,
            [createdRef, teamNumber, severity, status, owner, currentAction, summary, details],
          );
          if (fallbackUpdate.rows[0]?.id) {
            updated += 1;
            continue;
          }
        }
      }

      if (createdRef) {
        imported += 1;
      } else {
        skipped += 1;
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { imported, updated, skipped };
}

async function resolveCaseForImportedEvent(
  client: PoolClient,
  row: Record<string, string>,
  input: ParsedEventInput,
): Promise<{ id: number; ref: string }> {
  const refFromCsv = pickCsvValue(row, ["case_ref", "main_case_ref", "case"]);
  if (refFromCsv) {
    const existing = await client.query<{ id: number; main_case_ref: string }>(
      `SELECT id::int AS id, main_case_ref
       FROM main_cases
       WHERE main_case_ref = $1
       LIMIT 1`,
      [refFromCsv],
    );

    const existingRow = existing.rows[0];
    if (existingRow?.id) {
      return { id: existingRow.id, ref: existingRow.main_case_ref };
    }

    const owner = (input.owners[0] ?? pickCsvValue(row, ["owner"])) || "Unassigned";
    const summary = pickCsvValue(row, ["case_summary"]) || `Imported Case: ${input.summary}`;
    const details =
      pickCsvValue(row, ["case_details"]) ||
      "Created automatically while importing events CSV.";

    await ensureCatalogNames(client, "owners", [owner]);

    const inserted = await client.query<{ id: number; main_case_ref: string }>(
      `INSERT INTO main_cases
       (main_case_ref, team_number, severity, owner, status, current_action, summary, details)
       VALUES ($1, $2, $3, $4, 'Event', 'Review imported event.', $5, $6)
       RETURNING id::int AS id, main_case_ref`,
      [refFromCsv, input.teamNumber, input.severity, owner, summary, details],
    );

    const insertedRow = inserted.rows[0];
    if (!insertedRow?.id) {
      throw new HttpError(500, "Could not create case for imported event.");
    }

    return { id: insertedRow.id, ref: insertedRow.main_case_ref };
  }

  return createAutoMainCaseForEvent(client, input);
}

async function insertImportedEvent(
  client: PoolClient,
  desiredCaseId: string,
  mainCaseId: number,
  input: ParsedEventInput,
): Promise<{ eventId: number; caseId: string }> {
  let preferredCaseId = desiredCaseId.trim();
  if (!preferredCaseId) {
    const identity = await reserveEventIdentity(client);
    const insert = await client.query<{ id: number; case_id: string }>(
      `INSERT INTO journal_events
       (id, main_case_id, case_id, occurred_at, severity, team_number, event_type, summary, details)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING id::int AS id, case_id`,
      [
        identity.id,
        mainCaseId,
        identity.caseId,
        input.occurredAt.toISOString(),
        input.severity,
        input.teamNumber,
        input.eventType,
        input.summary,
        input.details,
      ],
    );

    const row = insert.rows[0];
    if (!row?.id) {
      throw new HttpError(500, "Could not insert imported event.");
    }

    return { eventId: row.id, caseId: row.case_id };
  }

  const insert = await client.query<{ id: number; case_id: string }>(
    `INSERT INTO journal_events
     (main_case_id, case_id, occurred_at, severity, team_number, event_type, summary, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
     ON CONFLICT (case_id) DO NOTHING
     RETURNING id::int AS id, case_id`,
    [
      mainCaseId,
      preferredCaseId,
      input.occurredAt.toISOString(),
      input.severity,
      input.teamNumber,
      input.eventType,
      input.summary,
      input.details,
    ],
  );

  const row = insert.rows[0];
  if (row?.id) {
    return { eventId: row.id, caseId: row.case_id };
  }

  const fallbackIdentity = await reserveEventIdentity(client);
  const fallbackInsert = await client.query<{ id: number; case_id: string }>(
    `INSERT INTO journal_events
     (id, main_case_id, case_id, occurred_at, severity, team_number, event_type, summary, details)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING id::int AS id, case_id`,
    [
      fallbackIdentity.id,
      mainCaseId,
      fallbackIdentity.caseId,
      input.occurredAt.toISOString(),
      input.severity,
      input.teamNumber,
      input.eventType,
      input.summary,
      input.details,
    ],
  );

  const fallbackRow = fallbackInsert.rows[0];
  if (!fallbackRow?.id) {
    throw new HttpError(500, "Could not insert imported event.");
  }

  return { eventId: fallbackRow.id, caseId: fallbackRow.case_id };
}

async function importEventsCsv(csvText: string): Promise<{
  imported: number;
  skipped: number;
}> {
  const { rows } = parseCsvText(csvText);
  let imported = 0;
  let skipped = 0;

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const row of rows) {
      try {
        const summary = pickCsvValue(row, ["summary"]);
        if (!summary) {
          skipped += 1;
          continue;
        }

        const details = pickCsvValue(row, ["details"]);
        const teamNumber = normalizeTeamNumber(
          pickCsvValue(row, ["team_number", "team"]) || "1",
        );
        const severity = normalizeSeverity(pickCsvValue(row, ["severity"]));
        const eventType = normalizeEventType(pickCsvValue(row, ["event_type", "type"]));
        const occurredRaw = pickCsvValue(row, ["occurred_at", "time", "date"]);
        const occurredAt = occurredRaw ? new Date(occurredRaw) : new Date();
        if (Number.isNaN(occurredAt.valueOf())) {
          skipped += 1;
          continue;
        }

        const services = parseOptionalCsvNames(pickCsvValue(row, ["services"]));
        const hosts = parseOptionalCsvNames(pickCsvValue(row, ["hosts"]));
        const owners = parseOptionalCsvNames(
          pickCsvValue(row, ["owners", "owner"]),
        );
        const tags = parseOptionalCsvNames(pickCsvValue(row, ["tags"]));

        const input: ParsedEventInput = {
          mainCaseId: null,
          createCaseIfMissing: false,
          severity,
          eventType,
          summary,
          details,
          teamNumber,
          occurredAt,
          services,
          hosts,
          owners,
          tags,
        };

        const resolvedCase = await resolveCaseForImportedEvent(client, row, input);
        const desiredCaseId = pickCsvValue(row, ["case_id"]);
        const insertedEvent = await insertImportedEvent(
          client,
          desiredCaseId,
          resolvedCase.id,
          input,
        );

        const [serviceIds, hostIds, ownerIds, tagIds] = await Promise.all([
          ensureCatalogNames(client, "services", input.services),
          ensureCatalogNames(client, "hosts", input.hosts),
          ensureCatalogNames(client, "owners", input.owners),
          ensureCatalogNames(client, "tags", input.tags),
        ]);

        await Promise.all([
          linkEventCatalog(client, insertedEvent.eventId, "services", serviceIds),
          linkEventCatalog(client, insertedEvent.eventId, "hosts", hostIds),
          linkEventCatalog(client, insertedEvent.eventId, "owners", ownerIds),
          linkEventCatalog(client, insertedEvent.eventId, "tags", tagIds),
        ]);

        await client.query(`UPDATE main_cases SET updated_at = NOW() WHERE id = $1`, [
          resolvedCase.id,
        ]);

        imported += 1;
      } catch {
        skipped += 1;
      }
    }

    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }

  return { imported, skipped };
}

async function initSchema(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS main_cases (
      id BIGSERIAL PRIMARY KEY,
      main_case_ref TEXT NOT NULL UNIQUE,
      team_number SMALLINT NOT NULL CHECK (team_number IN (1, 2)),
      severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
      owner TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('Triage', 'Event', 'Incident', 'Critical', 'Review', 'Closed')),
      current_action TEXT NOT NULL DEFAULT '',
      summary TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS journal_events (
      id BIGSERIAL PRIMARY KEY,
      main_case_id BIGINT REFERENCES main_cases(id) ON DELETE SET NULL,
      case_id TEXT NOT NULL UNIQUE,
      occurred_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      severity TEXT NOT NULL CHECK (severity IN ('Low', 'Medium', 'High', 'Critical')),
      team_number SMALLINT NOT NULL CHECK (team_number IN (1, 2)),
      event_type TEXT NOT NULL CHECK (event_type IN ('Finding/ Evidence', 'Action', 'Decision', 'Meeting', 'Join/Leave', 'Comms', 'Note')),
      summary TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE journal_events
      ADD COLUMN IF NOT EXISTS main_case_id BIGINT REFERENCES main_cases(id) ON DELETE SET NULL;

    ALTER TABLE journal_events
      ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

    CREATE TABLE IF NOT EXISTS services (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS hosts (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS owners (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id BIGSERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE
    );

    CREATE UNIQUE INDEX IF NOT EXISTS services_name_lower_uniq ON services (LOWER(name));
    CREATE UNIQUE INDEX IF NOT EXISTS hosts_name_lower_uniq ON hosts (LOWER(name));
    CREATE UNIQUE INDEX IF NOT EXISTS owners_name_lower_uniq ON owners (LOWER(name));
    CREATE UNIQUE INDEX IF NOT EXISTS tags_name_lower_uniq ON tags (LOWER(name));

    CREATE INDEX IF NOT EXISTS journal_events_main_case_idx ON journal_events(main_case_id);
    CREATE INDEX IF NOT EXISTS journal_events_created_idx ON journal_events(created_at DESC);

    CREATE TABLE IF NOT EXISTS event_services (
      event_id BIGINT NOT NULL REFERENCES journal_events(id) ON DELETE CASCADE,
      service_id BIGINT NOT NULL REFERENCES services(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, service_id)
    );

    CREATE TABLE IF NOT EXISTS event_hosts (
      event_id BIGINT NOT NULL REFERENCES journal_events(id) ON DELETE CASCADE,
      host_id BIGINT NOT NULL REFERENCES hosts(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, host_id)
    );

    CREATE TABLE IF NOT EXISTS event_owners (
      event_id BIGINT NOT NULL REFERENCES journal_events(id) ON DELETE CASCADE,
      owner_id BIGINT NOT NULL REFERENCES owners(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, owner_id)
    );

    CREATE TABLE IF NOT EXISTS event_tags (
      event_id BIGINT NOT NULL REFERENCES journal_events(id) ON DELETE CASCADE,
      tag_id BIGINT NOT NULL REFERENCES tags(id) ON DELETE CASCADE,
      PRIMARY KEY (event_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS network_devices (
      id BIGSERIAL PRIMARY KEY,
      device_name TEXT NOT NULL,
      device_type TEXT NOT NULL CHECK (
        device_type IN ('Internet', 'Router', 'Firewall', 'DMZ', 'Server', 'Workstations')
      ),
      ip_address TEXT NOT NULL DEFAULT '',
      team_label TEXT NOT NULL DEFAULT '',
      team_number SMALLINT NULL CHECK (team_number IN (1, 2)),
      zone_label TEXT NOT NULL DEFAULT '',
      pos_x DOUBLE PRECISION NULL,
      pos_y DOUBLE PRECISION NULL,
      display_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE network_devices
      ADD COLUMN IF NOT EXISTS team_label TEXT NOT NULL DEFAULT '';
    ALTER TABLE network_devices
      ADD COLUMN IF NOT EXISTS team_number SMALLINT NULL;
    ALTER TABLE network_devices
      ADD COLUMN IF NOT EXISTS zone_label TEXT NOT NULL DEFAULT '';
    ALTER TABLE network_devices
      ADD COLUMN IF NOT EXISTS pos_x DOUBLE PRECISION NULL;
    ALTER TABLE network_devices
      ADD COLUMN IF NOT EXISTS pos_y DOUBLE PRECISION NULL;

    CREATE TABLE IF NOT EXISTS network_links (
      id BIGSERIAL PRIMARY KEY,
      from_device_name TEXT NOT NULL,
      from_team_label TEXT NOT NULL DEFAULT '',
      to_device_name TEXT NOT NULL,
      to_team_label TEXT NOT NULL DEFAULT '',
      edge_label TEXT NOT NULL DEFAULT '',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    ALTER TABLE network_links
      ADD COLUMN IF NOT EXISTS from_team_label TEXT NOT NULL DEFAULT '';
    ALTER TABLE network_links
      ADD COLUMN IF NOT EXISTS to_team_label TEXT NOT NULL DEFAULT '';

    UPDATE network_devices
       SET team_number = CASE
         WHEN LOWER(team_label) IN ('1', 'team1', 'team 1', 't1') THEN 1
         WHEN LOWER(team_label) IN ('2', 'team2', 'team 2', 't2') THEN 2
         WHEN LOWER(team_label) ~ '(^|[^a-z0-9])team[ _-]*1([^a-z0-9]|$)' THEN 1
         WHEN LOWER(team_label) ~ '(^|[^a-z0-9])team[ _-]*2([^a-z0-9]|$)' THEN 2
         ELSE NULL
       END
     WHERE team_number IS NULL
       AND team_label <> '';

    DROP INDEX IF EXISTS network_devices_name_lower_uniq;
    CREATE UNIQUE INDEX IF NOT EXISTS network_devices_name_team_lower_uniq
      ON network_devices (LOWER(device_name), LOWER(team_label));
    CREATE INDEX IF NOT EXISTS network_devices_type_order_idx
      ON network_devices (device_type, display_order, id);
    CREATE INDEX IF NOT EXISTS network_links_sort_idx
      ON network_links (sort_order, id);

    CREATE TABLE IF NOT EXISTS app_config (
      id SMALLINT PRIMARY KEY CHECK (id = 1),
      wiki_enabled BOOLEAN NOT NULL DEFAULT FALSE,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    INSERT INTO app_config (id, wiki_enabled)
    VALUES (1, FALSE)
    ON CONFLICT (id) DO NOTHING;

    CREATE TABLE IF NOT EXISTS wiki_pages (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      content TEXT NOT NULL DEFAULT '',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS wiki_checklist_items (
      id BIGSERIAL PRIMARY KEY,
      item_text TEXT NOT NULL,
      details TEXT NOT NULL DEFAULT '',
      is_done BOOLEAN NOT NULL DEFAULT FALSE,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    CREATE INDEX IF NOT EXISTS wiki_pages_updated_idx ON wiki_pages(updated_at DESC);
    CREATE INDEX IF NOT EXISTS wiki_checklist_done_sort_idx ON wiki_checklist_items(is_done, sort_order);
  `);
}

function getMimeType(pathname: string): string {
  if (pathname.endsWith(".html")) return "text/html; charset=utf-8";
  if (pathname.endsWith(".css")) return "text/css; charset=utf-8";
  if (pathname.endsWith(".js")) return "application/javascript; charset=utf-8";
  if (pathname.endsWith(".json")) return "application/json; charset=utf-8";
  return "text/plain; charset=utf-8";
}

await initSchema();

Bun.serve({
  hostname: HOST,
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    const { pathname, searchParams } = url;

    const eventIdMatch = pathname.match(/^\/api\/events\/(\d+)$/);
    const mainCaseIdMatch = pathname.match(/^\/api\/main-cases\/(\d+)$/);
    const caseTimelineIdMatch = pathname.match(/^\/api\/main-cases\/(\d+)\/timeline$/);
    const wikiPageIdMatch = pathname.match(/^\/api\/wiki\/pages\/(\d+)$/);
    const wikiChecklistIdMatch = pathname.match(/^\/api\/wiki\/checklist\/(\d+)$/);

    if (req.method === "GET" && pathname === "/") {
      return new Response(null, {
        status: 302,
        headers: { location: "/event-logger" },
      });
    }

    if (req.method === "GET" && pathname === "/event-logger") {
      const file = Bun.file("public/event-logger.html");
      return new Response(file, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "GET" && pathname === "/case-logger") {
      const file = Bun.file("public/case-logger.html");
      return new Response(file, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "GET" && pathname === "/timelines") {
      const file = Bun.file("public/timelines.html");
      return new Response(file, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "GET" && pathname === "/network") {
      const file = Bun.file("public/network.html");
      return new Response(file, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "GET" && pathname === "/wiki") {
      try {
        const wikiAccess = await getWikiAccessState();
        if (!wikiAccess.enabled) {
          return new Response(null, {
            status: 302,
            headers: { location: wikiAccess.redirectUrl },
          });
        }

        const file = Bun.file("public/wiki.html");
        return new Response(file, {
          headers: { "content-type": "text/html; charset=utf-8" },
        });
      } catch (error) {
        return errorResponse(error, "Could not load wiki page.", 500);
      }
    }

    if (req.method === "GET" && pathname === "/event-edit") {
      const file = Bun.file("public/event-edit.html");
      return new Response(file, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "GET" && pathname === "/case-edit") {
      const file = Bun.file("public/case-edit.html");
      return new Response(file, {
        headers: { "content-type": "text/html; charset=utf-8" },
      });
    }

    if (req.method === "GET" && pathname.startsWith("/public/")) {
      const filePath = pathname.slice(1);
      const file = Bun.file(filePath);
      if (!(await file.exists())) {
        return new Response("Not found", { status: 404 });
      }

      if (pathname.endsWith(".ts")) {
        const source = await file.text();
        const transpiled = frontendTranspiler.transformSync(source);
        return new Response(transpiled, {
          headers: { "content-type": "application/javascript; charset=utf-8" },
        });
      }

      return new Response(file, {
        headers: { "content-type": getMimeType(pathname) },
      });
    }

    if (req.method === "GET" && pathname === "/api/options") {
      try {
        const options = await getOptions();
        return jsonResponse(options);
      } catch (error) {
        return errorResponse(error, "Could not load options.", 500);
      }
    }

    if (req.method === "GET" && pathname === "/api/changes") {
      try {
        const snapshot = await getChangeSnapshot();
        return jsonResponse(snapshot);
      } catch (error) {
        return errorResponse(error, "Could not load change state.", 500);
      }
    }

    if (req.method === "GET" && pathname === "/api/network/topology") {
      try {
        const topology = await getNetworkTopology();
        return jsonResponse(topology);
      } catch (error) {
        return errorResponse(error, "Could not load network topology.", 500);
      }
    }

    if (req.method === "GET" && pathname === "/api/network/device-events") {
      try {
        const host = searchParams.get("host") ?? "";
        const teamNumber = parseOptionalTeamNumber(searchParams.get("teamNumber"));
        if (!host.trim()) {
          throw new HttpError(400, "Host query parameter is required.");
        }

        const events = await listNetworkDeviceEvents(host, teamNumber);
        return jsonResponse({ events });
      } catch (error) {
        return errorResponse(error, "Could not load device events.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/network/import") {
      try {
        const payload = await req.json();
        const result = await importNetworkTopology(payload);
        return jsonResponse(result, 201);
      } catch (error) {
        return errorResponse(error, "Could not import network topology.", 400);
      }
    }

    const isWikiApiRequest =
      pathname === "/api/wiki" ||
      pathname === "/api/wiki/pages" ||
      pathname === "/api/wiki/checklist" ||
      Boolean(wikiPageIdMatch) ||
      Boolean(wikiChecklistIdMatch);

    if (isWikiApiRequest) {
      try {
        await assertWikiEnabled();
      } catch (error) {
        return errorResponse(error, "Wiki is disabled.", 403);
      }
    }

    if (req.method === "GET" && pathname === "/api/wiki") {
      try {
        const wiki = await getWikiState();
        return jsonResponse(wiki);
      } catch (error) {
        return errorResponse(error, "Could not load wiki.", 500);
      }
    }

    if (req.method === "POST" && pathname === "/api/wiki/pages") {
      try {
        const payload = await req.json();
        const created = await createWikiPage(payload);
        return jsonResponse(created, 201);
      } catch (error) {
        return errorResponse(error, "Could not create wiki page.", 400);
      }
    }

    if (wikiPageIdMatch && req.method === "PATCH") {
      try {
        const pageId = parsePositiveInt(wikiPageIdMatch[1], "Wiki page ID");
        const payload = await req.json();
        const updated = await updateWikiPage(pageId, payload);
        return jsonResponse(updated);
      } catch (error) {
        return errorResponse(error, "Could not update wiki page.", 400);
      }
    }

    if (wikiPageIdMatch && req.method === "DELETE") {
      try {
        const pageId = parsePositiveInt(wikiPageIdMatch[1], "Wiki page ID");
        const deleted = await deleteWikiPage(pageId);
        return jsonResponse(deleted);
      } catch (error) {
        return errorResponse(error, "Could not delete wiki page.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/wiki/checklist") {
      try {
        const payload = await req.json();
        const created = await createWikiChecklistItem(payload);
        return jsonResponse(created, 201);
      } catch (error) {
        return errorResponse(error, "Could not create checklist item.", 400);
      }
    }

    if (wikiChecklistIdMatch && req.method === "PATCH") {
      try {
        const itemId = parsePositiveInt(wikiChecklistIdMatch[1], "Checklist item ID");
        const payload = await req.json();
        const updated = await updateWikiChecklistItem(itemId, payload);
        return jsonResponse(updated);
      } catch (error) {
        return errorResponse(error, "Could not update checklist item.", 400);
      }
    }

    if (wikiChecklistIdMatch && req.method === "DELETE") {
      try {
        const itemId = parsePositiveInt(wikiChecklistIdMatch[1], "Checklist item ID");
        const deleted = await deleteWikiChecklistItem(itemId);
        return jsonResponse(deleted);
      } catch (error) {
        return errorResponse(error, "Could not delete checklist item.", 400);
      }
    }

    if (req.method === "GET" && pathname === "/api/main-cases") {
      try {
        const filters: MainCaseFilters = {
          search: searchParams.get("search") ?? "",
          caseRef: searchParams.get("caseRef") ?? "",
          teamNumber: parseOptionalTeamNumber(searchParams.get("teamNumber")),
          severity: parseOptionalSeverity(searchParams.get("severity")),
          status: parseOptionalMainCaseStatus(searchParams.get("status")),
          owner: searchParams.get("owner") ?? "",
          summary: searchParams.get("summary") ?? "",
          details: searchParams.get("details") ?? "",
          currentAction: searchParams.get("currentAction") ?? "",
          firstReportedFrom: parseOptionalDateTime(
            searchParams.get("firstReportedFrom"),
            "First Reported From",
          ),
          firstReportedTo: parseOptionalDateTime(
            searchParams.get("firstReportedTo"),
            "First Reported To",
          ),
          lastUpdatedFrom: parseOptionalDateTime(
            searchParams.get("lastUpdatedFrom"),
            "Last Updated From",
          ),
          lastUpdatedTo: parseOptionalDateTime(
            searchParams.get("lastUpdatedTo"),
            "Last Updated To",
          ),
          sortBy: searchParams.get("sortBy") ?? "lastUpdated",
          sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
        };

        const mainCases = await listMainCases(filters);
        return jsonResponse({ mainCases });
      } catch (error) {
        return errorResponse(error, "Could not list cases.", 500);
      }
    }

    if (req.method === "POST" && pathname === "/api/main-cases") {
      try {
        const payload = await req.json();
        const created = await createMainCase(payload);
        return jsonResponse(created, 201);
      } catch (error) {
        return errorResponse(error, "Could not create case.", 400);
      }
    }

    if (mainCaseIdMatch && req.method === "GET") {
      try {
        const mainCaseId = parsePositiveInt(mainCaseIdMatch[1], "Case ID");
        const mainCase = await getMainCaseById(mainCaseId);
        return jsonResponse(mainCase);
      } catch (error) {
        return errorResponse(error, "Could not load case.", 400);
      }
    }

    if (mainCaseIdMatch && req.method === "PATCH") {
      try {
        const mainCaseId = parsePositiveInt(mainCaseIdMatch[1], "Case ID");
        const payload = await req.json();
        const updated = await updateMainCase(mainCaseId, payload);
        return jsonResponse(updated);
      } catch (error) {
        return errorResponse(error, "Could not update case.", 400);
      }
    }

    if (caseTimelineIdMatch && req.method === "GET") {
      try {
        const mainCaseId = parsePositiveInt(caseTimelineIdMatch[1], "Case ID");
        const events = await listCaseTimelineEvents(mainCaseId);
        return jsonResponse({ events });
      } catch (error) {
        return errorResponse(error, "Could not load case timeline.", 400);
      }
    }

    if (req.method === "GET" && pathname === "/api/events") {
      try {
        const filters: EventFilters = {
          search: searchParams.get("search") ?? "",
          mainCaseId: parseOptionalPositiveInt(searchParams.get("mainCaseId"), "Case filter"),
          caseId: searchParams.get("caseId") ?? "",
          caseRef: searchParams.get("caseRef") ?? "",
          severity: parseOptionalSeverity(searchParams.get("severity")),
          teamNumber: parseOptionalTeamNumber(searchParams.get("teamNumber")),
          eventType: parseOptionalEventType(searchParams.get("eventType")),
          summary: searchParams.get("summary") ?? "",
          details: searchParams.get("details") ?? "",
          service: searchParams.get("service") ?? "",
          host: searchParams.get("host") ?? "",
          owner: searchParams.get("owner") ?? "",
          tag: searchParams.get("tag") ?? "",
          timeFrom: parseOptionalDateTime(searchParams.get("timeFrom"), "Time From"),
          timeTo: parseOptionalDateTime(searchParams.get("timeTo"), "Time To"),
          sortBy: searchParams.get("sortBy") ?? "createdAt",
          sortDir: searchParams.get("sortDir") === "asc" ? "asc" : "desc",
        };

        const events = await listEvents(filters);
        return jsonResponse({ events });
      } catch (error) {
        return errorResponse(error, "Could not list events.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/events") {
      try {
        const payload = await req.json();
        const created = await createEvent(payload);
        return jsonResponse(created, 201);
      } catch (error) {
        return errorResponse(error, "Could not create journal entry.", 400);
      }
    }

    if (eventIdMatch && req.method === "GET") {
      try {
        const eventId = parsePositiveInt(eventIdMatch[1], "Event ID");
        const event = await getEventById(eventId);
        return jsonResponse(event);
      } catch (error) {
        return errorResponse(error, "Could not load event.", 400);
      }
    }

    if (eventIdMatch && req.method === "PATCH") {
      try {
        const eventId = parsePositiveInt(eventIdMatch[1], "Event ID");
        const payload = await req.json();
        const updated = await updateEvent(eventId, payload);
        return jsonResponse(updated);
      } catch (error) {
        return errorResponse(error, "Could not update event.", 400);
      }
    }

    if (
      (req.method === "POST" || req.method === "DELETE") &&
      pathname.startsWith("/api/catalog/")
    ) {
      const typeText = pathname.replace("/api/catalog/", "");
      if (!isCatalogType(typeText)) {
        return jsonResponse({ error: "Unknown catalog type." }, 404);
      }

      try {
        const payload = await req.json();
        if (req.method === "POST") {
          const created = await createCatalogValue(typeText, payload);
          return jsonResponse(created, 201);
        }

        const deleted = await deleteCatalogValue(typeText, payload);
        return jsonResponse(deleted);
      } catch (error) {
        return errorResponse(error, "Could not modify catalog value.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/admin/network/verify") {
      try {
        const payload = await req.json();
        const result = await verifyAdminPassword(payload);
        return jsonResponse(result);
      } catch (error) {
        return errorResponse(error, "Could not verify admin password.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/admin/network/rename-device") {
      try {
        const payload = await req.json();
        const renamed = await renameNetworkDevice(payload);
        return jsonResponse({ ok: true, ...renamed });
      } catch (error) {
        return errorResponse(error, "Could not rename network device.", 400);
      }
    }

    if (req.method === "GET" && pathname === "/api/admin/wiki-access") {
      try {
        const state = await getWikiAccessState();
        return jsonResponse(state);
      } catch (error) {
        return errorResponse(error, "Could not load wiki access state.", 500);
      }
    }

    if (req.method === "POST" && pathname === "/api/admin/wiki-access") {
      try {
        const payload = await req.json();
        const password =
          payload && typeof payload === "object" && typeof payload.password === "string"
            ? payload.password
            : "";
        const enabled =
          payload && typeof payload === "object" && typeof payload.enabled === "boolean"
            ? payload.enabled
            : null;
        if (enabled === null) {
          throw new HttpError(400, "Wiki access toggle requires enabled=true or false.");
        }

        const state = await setWikiAccess(password, enabled);
        return jsonResponse({ ok: true, ...state });
      } catch (error) {
        return errorResponse(error, "Could not update wiki access state.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/admin/reset-database") {
      try {
        const payload = await req.json();
        const password =
          payload && typeof payload === "object" && typeof payload.password === "string"
            ? payload.password
            : "";

        await resetDatabase(password);
        return jsonResponse({ ok: true });
      } catch (error) {
        return errorResponse(error, "Could not reset database.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/admin/delete-events") {
      try {
        const payload = await req.json();
        const password =
          payload && typeof payload === "object" && typeof payload.password === "string"
            ? payload.password
            : "";

        await deleteEvents(password);
        return jsonResponse({ ok: true });
      } catch (error) {
        return errorResponse(error, "Could not delete events.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/admin/delete-cases") {
      try {
        const payload = await req.json();
        const password =
          payload && typeof payload === "object" && typeof payload.password === "string"
            ? payload.password
            : "";

        await deleteCases(password);
        return jsonResponse({ ok: true });
      } catch (error) {
        return errorResponse(error, "Could not delete cases.", 400);
      }
    }

    if (req.method === "GET" && pathname === "/api/export/cases.csv") {
      try {
        const csv = await exportCasesCsv();
        return new Response(csv, {
          status: 200,
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": 'attachment; filename="cases.csv"',
          },
        });
      } catch (error) {
        return errorResponse(error, "Could not export cases CSV.", 500);
      }
    }

    if (req.method === "GET" && pathname === "/api/export/events.csv") {
      try {
        const csv = await exportEventsCsv();
        return new Response(csv, {
          status: 200,
          headers: {
            "content-type": "text/csv; charset=utf-8",
            "content-disposition": 'attachment; filename="events.csv"',
          },
        });
      } catch (error) {
        return errorResponse(error, "Could not export events CSV.", 500);
      }
    }

    if (req.method === "POST" && pathname === "/api/import/cases.csv") {
      try {
        const csvText = await req.text();
        const summary = await importCasesCsv(csvText);
        return jsonResponse(summary, 201);
      } catch (error) {
        return errorResponse(error, "Could not import cases CSV.", 400);
      }
    }

    if (req.method === "POST" && pathname === "/api/import/events.csv") {
      try {
        const csvText = await req.text();
        const summary = await importEventsCsv(csvText);
        return jsonResponse(summary, 201);
      } catch (error) {
        return errorResponse(error, "Could not import events CSV.", 400);
      }
    }

    return new Response("Not found", { status: 404 });
  },
});

console.log(`Cyber Journal running at http://${HOST}:${PORT}`);
