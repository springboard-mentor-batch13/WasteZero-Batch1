import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OpportunityService {

  private apiUrl = 'http://localhost:3000/opportunities';

  constructor(private http: HttpClient) {}

  createOpportunity(data: any): Observable<any> {

    return this.http.post(this.apiUrl, data);

  }

}