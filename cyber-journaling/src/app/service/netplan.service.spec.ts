import { TestBed } from '@angular/core/testing';

import { NetplanService } from './netplan.service';

describe('NetplanService', () => {
  let service: NetplanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetplanService);
  });

  // no tests needed for now
});
