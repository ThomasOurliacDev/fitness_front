import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastModule],
  // Un seul <p-toast> global → toutes les notifications passent par ToasterService.
  template: `
    <router-outlet />
    <p-toast position="top-right" />
  `,
  changeDetection: ChangeDetectionStrategy.Eager,
  styles: [`:host { display: block; height: 100vh; }`]
})
export class AppComponent {}
