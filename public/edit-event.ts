type CatalogType = "services" | "hosts" | "owners" | "tags";

type MainCaseRow = {
  id: number | string;
  main_case_ref: string;
  summary: string;
};

type EventRow = {
  id: number | string;
  case_id: string;
  main_case_id: number | string | null;
  occurred_at: string;
  severity: string;
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

const form = byId<HTMLFormElement>("edit-event-form");
const statusEl = byId<HTMLDivElement>("edit-status");
const metaEl = byId<HTMLParagraphElement>("edit-meta");

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
const saveButton = byId<HTMLButtonElement>("save-edit-btn");

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

function nowForInput(date: Date): string {
  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 19);
}

function fillDatalist(id: string, values: string[]): void {
  const element = byId<HTMLDataListElement>(id);
  element.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
}

function joinCsv(values: unknown): string {
  if (!Array.isArray(values)) {
    return "";
  }

  return values
    .map((value) => String(value).trim())
    .filter(Boolean)
    .join(", ");
}

function mainCaseLabel(mainCase: MainCaseRow): string {
  const summary = mainCase.summary?.trim() || "No summary";
  const shortSummary = summary.length > 52 ? `${summary.slice(0, 52)}...` : summary;
  return `${mainCase.main_case_ref} | ${shortSummary}`;
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

async function loadMainCases(): Promise<MainCaseRow[]> {
  const response = await fetch("/api/main-cases");
  if (!response.ok) {
    throw new Error("Failed to load cases.");
  }

  const data = (await response.json()) as { mainCases?: MainCaseRow[] };
  const mainCases = Array.isArray(data.mainCases) ? data.mainCases : [];

  if (mainCases.length === 0) {
    mainCaseSelect.innerHTML = `<option value="">No cases available</option>`;
    mainCaseSelect.disabled = true;
    saveButton.disabled = true;
    return [];
  }

  mainCaseSelect.innerHTML = mainCases
    .map((mainCase) => {
      const id = toNumericId(mainCase.id);
      if (!id) {
        return "";
      }

      return `<option value="${id}">${escapeHtml(mainCaseLabel(mainCase))}</option>`;
    })
    .join("");

  mainCaseSelect.disabled = false;
  saveButton.disabled = false;
  return mainCases;
}

async function loadEvent(eventId: number): Promise<EventRow> {
  const response = await fetch(`/api/events/${eventId}`);
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error || "Failed to load event.");
  }

  return (await response.json()) as EventRow;
}

async function init(): Promise<void> {
  const params = new URLSearchParams(window.location.search);
  const eventId = toNumericId(params.get("id"));

  if (!eventId) {
    setStatus("Missing or invalid event ID in URL.", true);
    saveButton.disabled = true;
    return;
  }

  try {
    await Promise.all([loadCatalogOptions(), loadMainCases()]);
    const event = await loadEvent(eventId);

    const mainCaseId = toNumericId(event.main_case_id);
    if (mainCaseId) {
      mainCaseSelect.value = String(mainCaseId);
    }

    timeInput.value = nowForInput(new Date(event.occurred_at));
    severityInput.value = event.severity;
    teamNumberInput.value = String(event.team_number);
    eventTypeInput.value = event.event_type;
    summaryInput.value = event.summary || "";
    detailsInput.value = event.details || "";
    servicesInput.value = joinCsv(event.services);
    hostsInput.value = joinCsv(event.hosts);
    ownersInput.value = joinCsv(event.owners);
    tagsInput.value = joinCsv(event.tags);

    metaEl.innerHTML = `<strong>Event:</strong> ${escapeHtml(event.case_id)}`;

    form.addEventListener("submit", async (submitEvent) => {
      submitEvent.preventDefault();
      setStatus();

      const selectedMainCase = toNumericId(mainCaseSelect.value);
      if (!selectedMainCase) {
        setStatus("Case is required.", true);
        return;
      }

      const payload = {
        mainCaseId: selectedMainCase,
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
        const response = await fetch(`/api/events/${eventId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as {
          caseId?: string;
          error?: string;
        };

        if (!response.ok) {
          throw new Error(result.error || "Could not update event.");
        }

        setStatus(`Event updated: ${result.caseId || event.case_id}`);
      } catch (error) {
        setStatus(getErrorMessage(error, "Could not update event."), true);
      }
    });
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not initialize editor."), true);
    saveButton.disabled = true;
  }
}

void init();
