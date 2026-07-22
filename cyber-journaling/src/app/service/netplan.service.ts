import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Team } from 'shared';
import { apiUrl } from './api-url';
import { map } from 'rxjs';
import { ConfigDataService } from './config-data.service';

@Injectable({
  providedIn: 'root',
})
export class NetplanService {
  #httpClient = inject(HttpClient);
  #configDataService = inject(ConfigDataService);
  #endpointUrl = apiUrl('netplan');

  getNetplans() {
    return this.#httpClient.get<Team[]>(this.#endpointUrl).pipe(
      map((teams) => {
        return teams.filter((team) => {
          if (!this.#configDataService.selectedTeamId()) {
            return true;
          } else {
            return team.id === this.#configDataService.selectedTeamId();
          }
        });
      }),
    );
  }
}
