import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Service} from 'shared/src/models';

@Injectable({
  providedIn: 'root',
})
export class JournalServiceService {
  #httpClient = inject(HttpClient)
  // TODO: remove localhost and move it to another config
  #apiUrl = "http://localhost:3001/service"

  getServices() {
    return this.#httpClient.get<Service[]>(
      this.#apiUrl
    );
  }
}
