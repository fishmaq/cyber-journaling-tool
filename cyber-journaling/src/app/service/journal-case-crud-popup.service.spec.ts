import { TestBed } from '@angular/core/testing';

import { JournalCaseCrudPopupService } from './journal-case-crud-popup.service';

describe('CaseCrudPopupService', () => {
  let service: JournalCaseCrudPopupService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(JournalCaseCrudPopupService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
