import { vi } from 'vitest';

export const journalEventServiceMock = {
  getJournalEvents: vi.fn(),
  saveJournalEvent: vi.fn(),
};
