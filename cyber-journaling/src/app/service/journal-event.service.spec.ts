import { TestBed } from '@angular/core/testing';
import {JournalEventService} from './journal-event.service';


describe('JournalEvent', () => {
  let service: JournalEventService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JournalEventService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
