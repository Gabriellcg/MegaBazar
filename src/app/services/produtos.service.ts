import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ProdutosData } from '../home/models/estrutura';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {
  private jsonUrl = 'assets/data/produtos.json';

  constructor(private http: HttpClient) {}

  getProdutos(): Observable<ProdutosData> {
    return this.http.get<ProdutosData>(this.jsonUrl);
  }
}
