import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Team} from 'shared/src/models';

@Injectable({
  providedIn: 'root',
})
export class NetplanService {
  #httpClient = inject(HttpClient)
  // TODO: remove localhost and move it to another config
  #apiUrl = "http://localhost:3001/netplan"

  getNetplans() {
    return this.#httpClient.get<Team[]>(
      this.#apiUrl
    );
  }
}
