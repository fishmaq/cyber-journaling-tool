import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {JournalCase} from 'shared/src/models';

@Injectable({
  providedIn: 'root',
})
export class JournalCaseService {
  #httpClient = inject(HttpClient)
  #apiUrl = "http://localhost:3001"


  getJournalCases() {
    return this.#httpClient.get<JournalCase[]>(
      this.#apiUrl + '/case'
    );
  }

}
