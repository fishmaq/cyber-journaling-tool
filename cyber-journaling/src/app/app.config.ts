import {
  ApplicationConfig,
  ErrorHandler,
  inject,
  provideAppInitializer,
  provideBrowserGlobalErrorListeners
} from '@angular/core';
import {provideRouter} from '@angular/router';

import {routes} from './app.routes';
import {provideHttpClient} from '@angular/common/http';
import {ConfigDataService} from './service/config-data.service';
import {GlobalErrorHandler} from './errorhandler/global-error-handler';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(async () => {
      // load the configData into the configDataService before client app startup
      const configDataService = inject(ConfigDataService);
      await configDataService.load();

      console.debug('ApplicationConfig: app initialized')
    }),
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes),
    provideHttpClient(),
    {provide: ErrorHandler, useClass: GlobalErrorHandler}]
};
