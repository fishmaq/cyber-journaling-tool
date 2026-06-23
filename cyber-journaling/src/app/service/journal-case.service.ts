import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {JournalCase} from 'shared';
import {apiUrl} from './api-url';

@Injectable({
  providedIn: 'root',
})
export class JournalCaseService {
  #httpClient = inject(HttpClient)
  #endpointUrl = apiUrl('case');

  getJournalCases() {
    return this.#httpClient.get<JournalCase[]>(
      this.#endpointUrl
    );
  }

  saveJournalCase(journalCase: JournalCase) {
    if (journalCase.id) {
      // if there is already an id, we have to updates
      return this.#httpClient.put(
        this.#endpointUrl,
        journalCase
      );
    } else {
      return this.#httpClient.post(
        this.#endpointUrl,
        journalCase
      );
    }
  }

  deleteJournalCase(id: number) {
    return this.#httpClient.delete(
      this.#endpointUrl + '/' + id
    );
  }
}
