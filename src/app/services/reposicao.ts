import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Produto } from './produto';

// INTERFACE de Reposição ✔
export interface Reposicao {
  id?: number;
  produto: Produto;
  quantidade: number;
  dataEntrada: string;
  vencimento: string;
}

@Injectable({
  providedIn: 'root',
})
export class ReposicaoService {

  private readonly apiUrl = 'http://localhost:8080/reposicoes';

  constructor(private http: HttpClient) {}

  // Listar todas as reposições
  listarTodos(): Observable<Reposicao[]> {
    return this.http.get<Reposicao[]>(this.apiUrl);
  }

  // Buscar reposição por id
  buscarPorId(id: number): Observable<Reposicao> {
    return this.http.get<Reposicao>(`${this.apiUrl}/${id}`);
  }

  // Buscar reposições por produto
  buscarPorProduto(idProduto: number): Observable<Reposicao[]> {
    return this.http.get<Reposicao[]>(`${this.apiUrl}/produto/${idProduto}`);
  }

  // Criar nova reposição
  criar(reposicao: Reposicao): Observable<Reposicao> {
    return this.http.post<Reposicao>(this.apiUrl, reposicao);
  }

  // Atualizar reposição
  atualizar(id: number, reposicao: Reposicao): Observable<Reposicao> {
    return this.http.put<Reposicao>(`${this.apiUrl}/${id}`, reposicao);
  }

  // Deletar reposição
  deletar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
