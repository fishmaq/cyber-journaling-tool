import {TestBed} from '@angular/core/testing';

import {JournalCaseService} from './journal-case.service';
import {apiUrl} from './api-url';
import {ConfigData, JournalCase} from 'shared/src/models';
import {HttpTestingController, provideHttpClientTesting} from '@angular/common/http/testing';
import {provideHttpClient} from '@angular/common/http';

function testHttpMethod(service: JournalCaseService, httpMock: HttpTestingController, data: JournalCase, httpMethod: string) {
  service.saveJournalCase(data as JournalCase).subscribe();

  const req = httpMock.expectOne(apiUrl('case'));
  expect(req.request.method).toBe(httpMethod);
  req.flush({} as ConfigData);
}

describe('JournalCase', () => {
  let service: JournalCaseService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
      ]
    });
    service = TestBed.inject(JournalCaseService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  it('should use the correct http method', () => {
    // when there is no id present it should use POST
    testHttpMethod(service, httpMock, {} as JournalCase, 'POST');

    // when there is an id present it should use PUT
    testHttpMethod(service, httpMock, {id:1} as JournalCase, 'PUT');
  });
});
