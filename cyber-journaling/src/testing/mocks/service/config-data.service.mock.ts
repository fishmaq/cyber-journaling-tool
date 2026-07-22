import {vi} from 'vitest';
import {signal} from '@angular/core';

export const configDataServiceMock = {
  presenterMode: false,
  config: vi.fn(),
  selectedTeamId: signal<number | null>(null)
};
