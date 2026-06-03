import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ConfigData} from 'shared/src/models';
import {firstValueFrom} from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ConfigDataService {
  #initialApiUrl: string = "http://localhost:3001"
  #httpClient = inject(HttpClient)

  // This variable is only used for editing the data. As this service is supposed to work as read only,
  // we're converting the WriteableSignal to a regular Signal which cannot be edited by the consumer.
  private readonly _config = signal<ConfigData | undefined>(undefined);
  readonly config = this._config.asReadonly();

  async load(): Promise<void> {
    try {
      // wait for data
      const config = await firstValueFrom(
        this.#httpClient.get<ConfigData>(
          this.#initialApiUrl + '/configData'
        )
      );
      console.debug('ConfigDataService.load():');
      console.debug(config);

      this._config.set(config);
    } catch (e) {
      console.error('something went wrong while fetching config. maybe no connection?', e)
    }
  }
}
