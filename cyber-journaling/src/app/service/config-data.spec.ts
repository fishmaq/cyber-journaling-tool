import { TestBed } from '@angular/core/testing';

import { ConfigDataService } from './config-data.service';
// TODO: make some tests
describe('ConfigData', () => {
  let service: ConfigDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
