import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JournalEvent } from 'shared';
import { apiUrl } from './api-url';
import { map } from 'rxjs';
import { ConfigDataService } from './config-data.service';

@Injectable({
  providedIn: 'root',
})
export class JournalEventService {
  #httpClient = inject(HttpClient);
  #configDataService = inject(ConfigDataService);
  #endpointUrl = apiUrl('event');

  getJournalEvents() {
    return this.#httpClient.get<JournalEvent[]>(this.#endpointUrl).pipe(
      map((journalEvents) => {
        return journalEvents.filter((journalEvent) => {
          if (
            !this.#configDataService.selectedTeamId() ||
            !journalEvent.journal_case ||
            !journalEvent.journal_case.team_id
          ) {
            return true;
          } else {
            return journalEvent.journal_case.team_id === this.#configDataService.selectedTeamId();
          }
        });
      }),
    );
  }

  saveJournalEvent(journalEvent: JournalEvent) {
    if (journalEvent.id) {
      // if there is already an id, we have to updates
      return this.#httpClient.put(this.#endpointUrl, journalEvent);
    } else {
      return this.#httpClient.post(this.#endpointUrl, journalEvent);
    }
  }

  deleteJournalEvent(id: number) {
    return this.#httpClient.delete(this.#endpointUrl + '/' + id);
  }
}
