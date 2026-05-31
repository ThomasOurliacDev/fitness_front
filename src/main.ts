import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';

if (!environment.production) {
  // eslint-disable-next-line no-console
  console.info(`%c[ENV] ${environment.name}`, 'color:#00205B;font-weight:bold', environment);
}

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));
