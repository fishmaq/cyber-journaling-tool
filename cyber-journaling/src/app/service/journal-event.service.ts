import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {JournalEvent} from 'shared';
import {apiUrl} from './api-url';

@Injectable({
  providedIn: 'root',
})
export class JournalEventService {
  #httpClient = inject(HttpClient)
  #endpointUrl = apiUrl('event');

  getJournalEvents() {
    return this.#httpClient.get<JournalEvent[]>(
      this.#endpointUrl
    );
  }

  saveJournalEvent(journalEvent: JournalEvent) {
    if (journalEvent.id) {
      // if there is already an id, we have to updates
      return this.#httpClient.put(
        this.#endpointUrl,
        journalEvent
      );
    } else {
      return this.#httpClient.post(
        this.#endpointUrl,
        journalEvent
      );
    }
  }

  deleteJournalEvent(id: number) {
    return this.#httpClient.delete(
      this.#endpointUrl + '/' + id
    );
  }

  reorderEvents(eventIds: number[]) {
    return this.#httpClient.put(
      this.#endpointUrl + '/reorder',
      {event_ids: eventIds}
    );
  }
}

