import {TestBed} from '@angular/core/testing';

import {ConfigDataService} from './config-data.service';
import {provideHttpClient} from '@angular/common/http';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import { apiUrl } from "./api-url";

// TODO: make some tests
describe('ConfigData', () => {
  let service: ConfigDataService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),]
    });
    service = TestBed.inject(ConfigDataService);
    httpMock = TestBed.inject(HttpTestingController);

    //todo: mock response
  });

  it('should update config signal after loading', async () => {
    const loadPromise = service.load();
    const req = httpMock.expectOne(apiUrl('configData'));

    // mock response with empty object
    req.flush({});

    await loadPromise;
    // undefined is the default and even when there is no data in the db it should return at least an empty object
    expect(service.config()).not.toEqual(undefined);
  });

});
