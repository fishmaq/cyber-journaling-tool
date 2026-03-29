type Severity = "Low" | "Medium" | "High" | "Critical";
type CaseStatus =
  | "Triage"
  | "Event"
  | "Incident"
  | "Critical"
  | "Review"
  | "Closed";

type CaseRow = {
  id: number | string;
  main_case_ref: string;
  team_number: number;
  severity: Severity;
  owner: string;
  status: CaseStatus;
  current_action: string;
  summary: string;
  details: string;
};

type OptionsResponse = {
  catalog: {
    owners: string[];
  };
};

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const form = byId<HTMLFormElement>("edit-case-form");
const statusEl = byId<HTMLDivElement>("case-edit-status");
const metaEl = byId<HTMLParagraphElement>("case-edit-meta");
const saveButton = byId<HTMLButtonElement>("save-case-btn");

const teamInput = byId<HTMLSelectElement>("case-team-number");
const severityInput = byId<HTMLSelectElement>("case-severity");
const statusInput = byId<HTMLSelectElement>("case-status");
const ownerInput = byId<HTMLInputElement>("case-owner");
const actionInput = byId<HTMLInputElement>("case-current-action");
const summaryInput = byId<HTMLInputElement>("case-summary");
const detailsInput = byId<HTMLTextAreaElement>("case-details");

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

function fillOwnerDatalist(values: string[]): void {
  const datalist = byId<HTMLDataListElement>("owners-list");
  datalist.innerHTML = values
    .map((value) => `<option value="${escapeHtml(value)}"></option>`)
    .join("");
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
  fillOwnerDatalist(data.catalog.owners || []);
}

async function loadCase(caseId: number): Promise<CaseRow> {
  const response = await fetch(`/api/main-cases/${caseId}`);
  if (!response.ok) {
    const payload = (await response.json()) as { error?: string };
    throw new Error(payload.error || "Failed to load case.");
  }

  return (await response.json()) as CaseRow;
}

async function handleAddOwnerButton(button: HTMLButtonElement): Promise<void> {
  const inputId = button.dataset.addInput;
  if (!inputId) {
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
      void handleAddOwnerButton(button);
    });
  }
}

async function init(): Promise<void> {
  bindAddOwnerButtons();

  const params = new URLSearchParams(window.location.search);
  const caseId = toNumericId(params.get("id"));

  if (!caseId) {
    setStatus("Missing or invalid case ID in URL.", true);
    saveButton.disabled = true;
    return;
  }

  try {
    await loadOwnerOptions();
    const caseRow = await loadCase(caseId);

    metaEl.innerHTML = `<strong>Case:</strong> ${escapeHtml(caseRow.main_case_ref)}`;
    teamInput.value = String(caseRow.team_number);
    severityInput.value = caseRow.severity;
    statusInput.value = caseRow.status;
    ownerInput.value = caseRow.owner || "";
    actionInput.value = caseRow.current_action || "";
    summaryInput.value = caseRow.summary || "";
    detailsInput.value = caseRow.details || "";

    form.addEventListener("submit", async (event) => {
      event.preventDefault();
      setStatus();

      const payload = {
        teamNumber: Number(teamInput.value),
        severity: severityInput.value,
        status: statusInput.value,
        owner: ownerInput.value,
        currentAction: actionInput.value,
        summary: summaryInput.value,
        details: detailsInput.value,
      };

      try {
        const response = await fetch(`/api/main-cases/${caseId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        const result = (await response.json()) as { mainCaseRef?: string; error?: string };
        if (!response.ok) {
          throw new Error(result.error || "Could not update case.");
        }

        const caseRef = result.mainCaseRef || caseRow.main_case_ref;
        setStatus(`Case updated: ${caseRef}`);
      } catch (error) {
        setStatus(getErrorMessage(error, "Could not update case."), true);
      }
    });
  } catch (error) {
    setStatus(getErrorMessage(error, "Could not initialize case editor."), true);
    saveButton.disabled = true;
  }
}

void init();
