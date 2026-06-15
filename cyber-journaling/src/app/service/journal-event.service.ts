import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {JournalEvent} from 'shared/src/models';

@Injectable({
  providedIn: 'root',
})
export class JournalEventService {
  #httpClient = inject(HttpClient)
  // TODO: remove localhost and move it to another config
  #apiUrl = "http://localhost:3001/event"

  getJournalEvents() {
    return this.#httpClient.get<JournalEvent[]>(
      this.#apiUrl
    );
  }

  saveJournalEvent(journalEvent: JournalEvent) {
    if (journalEvent.id) {
      // if there is already an id, we have to updates
      return this.#httpClient.put(
        this.#apiUrl,
        journalEvent
      );
    } else {
      return this.#httpClient.post(
        this.#apiUrl,
        journalEvent
      );
    }
  }

  deleteJournalEvent(id: number) {
    return this.#httpClient.delete(
      this.#apiUrl + '/' + id
    );
  }
}

