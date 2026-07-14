import { bootstrapApplication } from '@angular/platform-browser';
import { registerLocaleData } from '@angular/common';
import localeFr from '@angular/common/locales/fr';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

// Requis par toute pipe/format Angular qui référence explicitement 'fr-FR'
// (DatePipe, formatDate...) — sans ça : NG0701 "Missing locale data".
registerLocaleData(localeFr, 'fr-FR');

if (!environment.production) {
  // eslint-disable-next-line no-console
  console.info(`%c[ENV] ${environment.name}`, 'color:#00205B;font-weight:bold', environment);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
