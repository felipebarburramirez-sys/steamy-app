import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HttpService {
  private readonly apiUrl = 'https://www.cheapshark.com/api/1.0';
  private readonly http = inject(HttpClient);

  get<T>(path: string, params: Record<string, string | number> = {}): Observable<T> {
    let httpParams = new HttpParams();

    Object.entries(params).forEach(([key, value]) => {
      httpParams = httpParams.set(key, String(value));
    });

    return this.http.get<T>(`${this.apiUrl}${path}`, { params: httpParams });
  }
}
