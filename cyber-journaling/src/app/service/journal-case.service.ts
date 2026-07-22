import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { JournalCase } from 'shared';
import { apiUrl } from './api-url';
import { map } from 'rxjs';
import { ConfigDataService } from './config-data.service';

@Injectable({
  providedIn: 'root',
})
export class JournalCaseService {
  #httpClient = inject(HttpClient);
  #configDataService = inject(ConfigDataService);
  #endpointUrl = apiUrl('case');

  getJournalCases() {
    return this.#httpClient.get<JournalCase[]>(this.#endpointUrl).pipe(
      map((journalCases) => {
        return journalCases.filter((journalCase) => {
          if(!this.#configDataService.selectedTeamId() || !journalCase.team_id){
            return true
          }else{
            return journalCase.team_id === this.#configDataService.selectedTeamId();
          }
        });
      }),
    );
  }

  saveJournalCase(journalCase: JournalCase) {
    if (journalCase.id) {
      // if there is already an id, we have to updates
      return this.#httpClient.put(this.#endpointUrl, journalCase);
    } else {
      return this.#httpClient.post(this.#endpointUrl, journalCase);
    }
  }

  deleteJournalCase(id: number) {
    return this.#httpClient.delete(this.#endpointUrl + '/' + id);
  }
}
