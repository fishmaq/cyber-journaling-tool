import { TestBed } from '@angular/core/testing';

import { JournalEvent } from './journal-event';

describe('JournalEvent', () => {
  let service: JournalEvent;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JournalEvent);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
