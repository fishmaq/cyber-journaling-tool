type WikiPage = {
  id: number | string;
  title: string;
  content: string;
  createdAt: string | null;
  updatedAt: string | null;
};

type WikiChecklistItem = {
  id: number | string;
  text: string;
  details: string;
  isDone: boolean;
  sortOrder: number;
  createdAt: string | null;
  updatedAt: string | null;
};

type WikiStateResponse = {
  pages?: WikiPage[];
  checklist?: WikiChecklistItem[];
};

const byId = <T extends HTMLElement>(id: string): T =>
  document.getElementById(id) as T;

const headerClock = byId<HTMLElement>("header-clock");
const refreshButton = byId<HTMLButtonElement>("wiki-refresh");
const pageSearchInput = byId<HTMLInputElement>("wiki-page-search");

const pagesListEl = byId<HTMLDivElement>("wiki-pages-list");
const pageForm = byId<HTMLFormElement>("wiki-page-form");
const pageTitleInput = byId<HTMLInputElement>("wiki-page-title");
const pageContentInput = byId<HTMLTextAreaElement>("wiki-page-content");
const pageMetaEl = byId<HTMLElement>("wiki-page-meta");
const pageStatusEl = byId<HTMLDivElement>("wiki-page-status");
const newPageButton = byId<HTMLButtonElement>("wiki-new-page");
const deletePageButton = byId<HTMLButtonElement>("wiki-delete-page");

const checklistForm = byId<HTMLFormElement>("wiki-checklist-form");
const checklistTextInput = byId<HTMLInputElement>("wiki-check-text");
const checklistDetailsInput = byId<HTMLInputElement>("wiki-check-details");
const checklistListEl = byId<HTMLDivElement>("wiki-checklist-list");
const checklistStatusEl = byId<HTMLDivElement>("wiki-checklist-status");
const checklistSummaryEl = byId<HTMLElement>("wiki-checklist-summary");

let pagesCache: WikiPage[] = [];
let checklistCache: WikiChecklistItem[] = [];
let selectedPageId: number | null = null;
let pageSearchValue = "";
let pageDraftSnapshot = "";

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

  const parsed = new Date(value);
  if (Number.isNaN(parsed.valueOf())) {
    return "-";
  }

  return parsed.toLocaleString();
}

function updateHeaderClock(): void {
  headerClock.textContent = new Date().toLocaleString();
}

function firstWords(value: string, count: number): string {
  const text = value.trim();
  if (!text) {
    return "No content yet";
  }

  const words = text.split(/\s+/g);
  if (words.length <= count) {
    return text;
  }

  return `${words.slice(0, count).join(" ")}...`;
}

function normalizedText(value: string): string {
  return value.trim().toLowerCase();
}

function pageMatchesSearch(page: WikiPage, query: string): boolean {
  if (!query) {
    return true;
  }

  const title = normalizedText(page.title);
  const content = normalizedText(page.content);
  return title.includes(query) || content.includes(query);
}

function currentDraftSnapshot(): string {
  return JSON.stringify({
    title: pageTitleInput.value.trim(),
    content: pageContentInput.value,
  });
}

function updatePageEditorHeight(): void {
  pageContentInput.style.height = "auto";
  const minHeight = 360;
  pageContentInput.style.height = `${Math.max(minHeight, pageContentInput.scrollHeight)}px`;
}

function updateDraftStatus(): void {
  const isDirty = currentDraftSnapshot() !== pageDraftSnapshot;
  if (isDirty) {
    setStatus(pageStatusEl, "Unsaved changes");
  } else if (!pageStatusEl.textContent || pageStatusEl.textContent === "Unsaved changes") {
    setStatus(pageStatusEl);
  }
}

function getSelectedPage(): WikiPage | null {
  if (!selectedPageId) {
    return null;
  }

  const page = pagesCache.find((entry) => toNumericId(entry.id) === selectedPageId);
  return page || null;
}

function renderPagesList(): void {
  if (pagesCache.length === 0) {
    pagesListEl.innerHTML = `<div class="entry-empty">No wiki pages yet.</div>`;
    return;
  }

  const normalizedSearch = normalizedText(pageSearchValue);
  const visiblePages = pagesCache.filter((page) =>
    pageMatchesSearch(page, normalizedSearch),
  );
  if (visiblePages.length === 0) {
    pagesListEl.innerHTML = `<div class="entry-empty">No pages match this search.</div>`;
    return;
  }

  pagesListEl.innerHTML = visiblePages
    .map((page) => {
      const pageId = toNumericId(page.id);
      const isActive = pageId !== null && pageId === selectedPageId;
      const preview = firstWords(page.content, 14);
      return `
        <button
          class="wiki-page-item ${isActive ? "active" : ""}"
          type="button"
          data-page-id="${pageId ?? ""}"
        >
          <span class="wiki-page-item-title">${escapeHtml(page.title)}</span>
          <span class="wiki-page-item-preview">${escapeHtml(preview)}</span>
          <span class="wiki-page-item-time">${escapeHtml(formatDate(page.updatedAt))}</span>
        </button>
      `;
    })
    .join("");
}

function applyPageSelection(pageId: number | null): void {
  selectedPageId = pageId;
  const page = getSelectedPage();
  if (!page) {
    pageTitleInput.value = "";
    pageContentInput.value = "";
    pageMetaEl.textContent = "No page selected.";
    deletePageButton.disabled = true;
    pageDraftSnapshot = currentDraftSnapshot();
    updatePageEditorHeight();
    renderPagesList();
    return;
  }

  pageTitleInput.value = page.title;
  pageContentInput.value = page.content;
  pageMetaEl.textContent = `Created: ${formatDate(page.createdAt)} | Updated: ${formatDate(
    page.updatedAt,
  )}`;
  deletePageButton.disabled = false;
  pageDraftSnapshot = currentDraftSnapshot();
  updatePageEditorHeight();
  renderPagesList();
}

function renderChecklist(): void {
  const doneCount = checklistCache.filter((item) => item.isDone).length;
  const totalCount = checklistCache.length;
  const openCount = totalCount - doneCount;
  checklistSummaryEl.textContent = `${openCount} open · ${doneCount} done`;

  if (checklistCache.length === 0) {
    checklistListEl.innerHTML = `<div class="entry-empty">No checklist tasks yet.</div>`;
    return;
  }

  checklistListEl.innerHTML = checklistCache
    .map((item) => {
      const itemId = toNumericId(item.id);
      return `
        <article class="wiki-check-item ${item.isDone ? "done" : ""}" data-item-id="${itemId ?? ""}">
          <label class="wiki-check-toggle">
            <input type="checkbox" data-action="toggle" ${item.isDone ? "checked" : ""} />
          </label>

          <div class="wiki-check-fields">
            <input
              class="wiki-check-input"
              data-field="text"
              maxlength="240"
              value="${escapeHtml(item.text)}"
              placeholder="Task"
            />
            <input
              class="wiki-check-input"
              data-field="details"
              maxlength="280"
              value="${escapeHtml(item.details || "")}"
              placeholder="Details"
            />
            <p class="wiki-check-time">Updated: ${escapeHtml(formatDate(item.updatedAt))}</p>
          </div>

          <div class="wiki-check-actions">
            <button class="secondary-btn wiki-mini-btn" type="button" data-action="save">Save</button>
            <button class="danger-btn wiki-mini-btn" type="button" data-action="delete">Delete</button>
          </div>
        </article>
      `;
    })
    .join("");
}

async function loadWikiState(preferredPageId: number | null = null): Promise<void> {
  const response = await fetch("/api/wiki");
  if (!response.ok) {
    throw new Error("Failed to load wiki.");
  }

  const payload = (await response.json()) as WikiStateResponse;
  pagesCache = Array.isArray(payload.pages) ? payload.pages : [];
  checklistCache = Array.isArray(payload.checklist) ? payload.checklist : [];

  const currentSelection = preferredPageId ?? selectedPageId;
  const resolvedSelection =
    currentSelection &&
    pagesCache.some((page) => toNumericId(page.id) === currentSelection)
      ? currentSelection
      : toNumericId(pagesCache[0]?.id);

  renderChecklist();
  applyPageSelection(resolvedSelection);
}

pagesListEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("[data-page-id]");
  if (!button) {
    return;
  }

  const pageId = toNumericId(button.dataset.pageId);
  if (!pageId) {
    return;
  }

  applyPageSelection(pageId);
  setStatus(pageStatusEl);
});

pageSearchInput.addEventListener("input", () => {
  pageSearchValue = pageSearchInput.value;
  renderPagesList();
});

newPageButton.addEventListener("click", () => {
  applyPageSelection(null);
  pageTitleInput.focus();
  setStatus(pageStatusEl, "Draft mode: new page.");
});

deletePageButton.addEventListener("click", () => {
  void (async () => {
    const page = getSelectedPage();
    if (!page) {
      setStatus(pageStatusEl, "Select a page first.", true);
      return;
    }

    const pageId = toNumericId(page.id);
    if (!pageId) {
      setStatus(pageStatusEl, "Invalid page ID.", true);
      return;
    }

    if (!window.confirm(`Delete wiki page "${page.title}"?`)) {
      return;
    }

    setStatus(pageStatusEl);
    try {
      const response = await fetch(`/api/wiki/pages/${pageId}`, {
        method: "DELETE",
      });
      const result = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(result.error || "Could not delete wiki page.");
      }

      await loadWikiState(null);
      setStatus(pageStatusEl, `Page deleted: ${page.title}`);
    } catch (error) {
      setStatus(pageStatusEl, getErrorMessage(error, "Could not delete wiki page."), true);
    }
  })();
});

pageForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    setStatus(pageStatusEl);
    const title = pageTitleInput.value.trim();
    if (!title) {
      setStatus(pageStatusEl, "Title is required.", true);
      return;
    }

    const payload = {
      title,
      content: pageContentInput.value,
    };

    try {
      if (selectedPageId) {
        const response = await fetch(`/api/wiki/pages/${selectedPageId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { page?: WikiPage; error?: string };
        if (!response.ok || !result.page) {
          throw new Error(result.error || "Could not update wiki page.");
        }

        const pageId = toNumericId(result.page.id);
        await loadWikiState(pageId);
        setStatus(pageStatusEl, `Page updated: ${result.page.title}`);
        pageDraftSnapshot = currentDraftSnapshot();
      } else {
        const response = await fetch("/api/wiki/pages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const result = (await response.json()) as { page?: WikiPage; error?: string };
        if (!response.ok || !result.page) {
          throw new Error(result.error || "Could not create wiki page.");
        }

        const pageId = toNumericId(result.page.id);
        await loadWikiState(pageId);
        setStatus(pageStatusEl, `Page created: ${result.page.title}`);
        pageDraftSnapshot = currentDraftSnapshot();
      }
    } catch (error) {
      setStatus(pageStatusEl, getErrorMessage(error, "Could not save wiki page."), true);
    }
  })();
});

checklistForm.addEventListener("submit", (event) => {
  event.preventDefault();
  void (async () => {
    setStatus(checklistStatusEl);
    const text = checklistTextInput.value.trim();
    if (!text) {
      setStatus(checklistStatusEl, "Task text is required.", true);
      return;
    }

    try {
      const response = await fetch("/api/wiki/checklist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          details: checklistDetailsInput.value,
        }),
      });
      const result = (await response.json()) as { item?: WikiChecklistItem; error?: string };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "Could not add checklist task.");
      }

      checklistTextInput.value = "";
      checklistDetailsInput.value = "";
      await loadWikiState(selectedPageId);
      setStatus(checklistStatusEl, "Checklist task added.");
    } catch (error) {
      setStatus(
        checklistStatusEl,
        getErrorMessage(error, "Could not add checklist task."),
        true,
      );
    }
  })();
});

checklistListEl.addEventListener("change", (event) => {
  const target = event.target;
  if (!(target instanceof HTMLInputElement)) {
    return;
  }

  if (target.dataset.action !== "toggle") {
    return;
  }

  const row = target.closest<HTMLElement>("[data-item-id]");
  const itemId = toNumericId(row?.dataset.itemId);
  if (!itemId) {
    return;
  }

  void (async () => {
    try {
      const response = await fetch(`/api/wiki/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDone: target.checked }),
      });
      const result = (await response.json()) as { item?: WikiChecklistItem; error?: string };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "Could not update checklist task.");
      }

      await loadWikiState(selectedPageId);
      setStatus(checklistStatusEl, "Checklist task updated.");
    } catch (error) {
      setStatus(
        checklistStatusEl,
        getErrorMessage(error, "Could not update checklist task."),
        true,
      );
    }
  })();
});

checklistListEl.addEventListener("click", (event) => {
  const target = event.target;
  if (!(target instanceof Element)) {
    return;
  }

  const button = target.closest<HTMLButtonElement>("[data-action]");
  if (!button) {
    return;
  }

  const row = button.closest<HTMLElement>("[data-item-id]");
  const itemId = toNumericId(row?.dataset.itemId);
  if (!itemId) {
    return;
  }

  const action = button.dataset.action;
  if (action === "delete") {
    void (async () => {
      if (!window.confirm("Delete this checklist item?")) {
        return;
      }

      try {
        const response = await fetch(`/api/wiki/checklist/${itemId}`, {
          method: "DELETE",
        });
        const result = (await response.json()) as { error?: string };
        if (!response.ok) {
          throw new Error(result.error || "Could not delete checklist task.");
        }

        await loadWikiState(selectedPageId);
        setStatus(checklistStatusEl, "Checklist task deleted.");
      } catch (error) {
        setStatus(
          checklistStatusEl,
          getErrorMessage(error, "Could not delete checklist task."),
          true,
        );
      }
    })();
    return;
  }

  if (action !== "save") {
    return;
  }

  const textInput = row?.querySelector<HTMLInputElement>('[data-field="text"]');
  const detailsInput = row?.querySelector<HTMLInputElement>('[data-field="details"]');
  if (!textInput || !detailsInput) {
    return;
  }

  void (async () => {
    try {
      const response = await fetch(`/api/wiki/checklist/${itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: textInput.value,
          details: detailsInput.value,
        }),
      });
      const result = (await response.json()) as { item?: WikiChecklistItem; error?: string };
      if (!response.ok || !result.item) {
        throw new Error(result.error || "Could not save checklist task.");
      }

      await loadWikiState(selectedPageId);
      setStatus(checklistStatusEl, "Checklist task saved.");
    } catch (error) {
      setStatus(
        checklistStatusEl,
        getErrorMessage(error, "Could not save checklist task."),
        true,
      );
    }
  })();
});

refreshButton.addEventListener("click", () => {
  void loadWikiState(selectedPageId)
    .then(() => {
      setStatus(pageStatusEl, "Wiki refreshed.");
      setStatus(checklistStatusEl);
    })
    .catch((error) => {
      setStatus(pageStatusEl, getErrorMessage(error, "Refresh failed."), true);
    });
});

pageTitleInput.addEventListener("input", () => {
  updateDraftStatus();
});

pageContentInput.addEventListener("input", () => {
  updatePageEditorHeight();
  updateDraftStatus();
});

window.addEventListener("keydown", (event) => {
  const isSave = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s";
  if (!isSave) {
    return;
  }

  event.preventDefault();
  pageForm.requestSubmit();
});

async function init(): Promise<void> {
  updateHeaderClock();
  window.setInterval(updateHeaderClock, 1000);
  deletePageButton.disabled = true;
  updatePageEditorHeight();

  try {
    await loadWikiState();
  } catch (error) {
    setStatus(pageStatusEl, getErrorMessage(error, "Could not load wiki."), true);
  }
}

void init();
