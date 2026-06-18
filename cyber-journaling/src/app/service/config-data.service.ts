import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigData} from 'shared/src/models';
import {firstValueFrom} from 'rxjs';
import {apiUrl} from './api-url';

@Injectable({
  providedIn: 'root',
})
export class ConfigDataService {
  #httpClient = inject(HttpClient)

  #endpointUrl = apiUrl('configData');

  // This variable is only used for editing the data. As this service is supposed to work as read only,
  // we're converting the WriteableSignal to a regular Signal which cannot be edited by the consumer.
  private readonly _config = signal<ConfigData | undefined>(undefined);
  readonly config = this._config.asReadonly();

  presenterMode = false;

  async load(): Promise<void> {
    // wait for data
    const config = await firstValueFrom(
      this.#httpClient.get<ConfigData>(
        this.#endpointUrl
      )
    );
    console.debug('ConfigDataService.load():');
    console.debug(config);

    this._config.set(config);
  }
}
