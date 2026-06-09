import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {JournalCase} from 'shared/src/models';

@Injectable({
  providedIn: 'root',
})
export class JournalCaseService {
  #httpClient = inject(HttpClient)
  // TODO: remove localhost and move it to another config
  #apiUrl = "http://localhost:3001/case"

  getJournalCases() {
    return this.#httpClient.get<JournalCase[]>(
      this.#apiUrl
    );
  }

  saveJournalCase(journalCase: JournalCase) {
    if (journalCase.id) {
      // if there is already an id, we have to updates
      return this.#httpClient.put(
        this.#apiUrl,
        journalCase
      );
    } else {
      return this.#httpClient.post(
        this.#apiUrl,
        journalCase
      );
    }
  }

  deleteJournalCase(id: number) {
    return this.#httpClient.delete(
      this.#apiUrl + '/' + id
    );
  }
}
