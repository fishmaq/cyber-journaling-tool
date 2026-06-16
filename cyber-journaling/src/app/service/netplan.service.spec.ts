import { TestBed } from '@angular/core/testing';

import { NetplanService } from './netplan.service';

describe('NetplanService', () => {
  let service: NetplanService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(NetplanService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
