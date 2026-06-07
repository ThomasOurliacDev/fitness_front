import { inject, Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';
import { HttpClient } from '@angular/common/http';


@Injectable({
  providedIn: 'root',
})
export class EntrainementService {
  protected apiUrl = environment.apiUrl;
  httpClient = inject(HttpClient);

  getPrograms() {
    return this.httpClient.get(`${this.apiUrl}/program`);
  }
}
