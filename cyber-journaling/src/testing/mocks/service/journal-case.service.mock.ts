import { vi } from 'vitest';

export const journalCaseServiceMock = {
  getJournalCases: vi.fn(),
  saveJournalCase: vi.fn(),
  deleteJournalCase: vi.fn(),
};
