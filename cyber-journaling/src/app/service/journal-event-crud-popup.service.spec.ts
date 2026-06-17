import { TestBed } from '@angular/core/testing';

import { JournalEventCrudPopupService } from './journal-event-crud-popup.service';

describe('EventCrudPopupService', () => {
  let service: JournalEventCrudPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JournalEventCrudPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
