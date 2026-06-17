import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Team} from 'shared/src/models';
import {apiUrl} from './api-url';

@Injectable({
  providedIn: 'root',
})
export class NetplanService {
  #httpClient = inject(HttpClient)
  #endpointUrl = apiUrl('netplan');

  getNetplans() {
    return this.#httpClient.get<Team[]>(
      this.#endpointUrl
    );
  }
}
