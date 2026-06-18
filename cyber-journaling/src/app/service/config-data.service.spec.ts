import {TestBed} from '@angular/core/testing';

import {ConfigDataService} from './config-data.service';

// TODO: make some tests
describe('ConfigData', () => {
  let service: ConfigDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ConfigDataService);
  });

  it('should update config signal after loading', async () => {
    await service.load();
    // undefined is the default and even when there is no data in the db it should return at least an empty object
    expect(service.config()).not.toEqual(undefined);
  });

});
