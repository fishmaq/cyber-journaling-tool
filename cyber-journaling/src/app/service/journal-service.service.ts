import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Service} from 'shared';
import {apiUrl} from './api-url';

@Injectable({
  providedIn: 'root',
})
export class JournalServiceService {
  #httpClient = inject(HttpClient)
  #endpointUrl = apiUrl('service')

  getServices() {
    return this.#httpClient.get<Service[]>(
      this.#endpointUrl
    );
  }
}
