import { TestBed } from '@angular/core/testing';

import { JournalCaseService } from './journal-case.service';

describe('JournalCase', () => {
  let service: JournalCaseService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JournalCaseService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
