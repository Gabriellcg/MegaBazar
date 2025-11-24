import { Injectable } from '@angular/core';
import { BehaviorSubject, catchError, map, Observable, of } from 'rxjs';
import { ItemCarrinho, Loja, LojasData, Pedido, Produto, ProdutosData } from '../home/models/estrutura';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class LojasService {
  private jsonUrl = 'assets/data/lojas.json';
  private lojasSubject = new BehaviorSubject<Loja[]>([]);
  public lojas$: Observable<Loja[]> = this.lojasSubject.asObservable();

  constructor(private http: HttpClient) {
    this.carregarLojas();
  }

  // Carregar lojas do JSON
  private carregarLojas(): void {
    this.http.get<LojasData>(this.jsonUrl).pipe(
      map(data => data.lojas),
      catchError(error => {
        console.error('Erro ao carregar lojas:', error);
        // Retornar array vazio em caso de erro
        return of([]);
      })
    ).subscribe(lojas => {
      this.lojasSubject.next(lojas);
      console.log(`✅ ${lojas.length} lojas carregadas do JSON`);
    });
  }

  // Buscar todas as lojas disponíveis
  getTodasLojas(): Loja[] {
    return this.lojasSubject.value.filter(loja => loja.disponivel);
  }

  // Buscar lojas disponíveis como Observable
  getTodasLojasObservable(): Observable<Loja[]> {
    return this.lojas$.pipe(
      map(lojas => lojas.filter(loja => loja.disponivel))
    );
  }

  // Buscar lojas por cidade
  getLojasPorCidade(cidade: string): Loja[] {
    return this.lojasSubject.value.filter(
      loja => loja.disponivel &&
        loja.endereco.cidade.toLowerCase().includes(cidade.toLowerCase())
    );
  }

  // Buscar lojas próximas ao CEP (simulado)
  getLojasProximasPorCEP(cep: string): Loja[] {
    // Simulação de busca por proximidade
    // Em produção, usar API de geolocalização real

    const cepNumerico = cep.replace(/\D/g, '');
    const lojas = this.lojasSubject.value;

    if (lojas.length === 0) {
      console.warn('⚠️ Nenhuma loja carregada ainda');
      return [];
    }

    const lojasPorProximidade = lojas
      .filter(loja => loja.disponivel)
      .map(loja => {
        const lojaCepNumerico = loja.endereco.cep.replace(/\D/g, '');
        const diferenca = Math.abs(parseInt(cepNumerico) - parseInt(lojaCepNumerico));

        // Simular distância baseada na diferença de CEP
        const distancia = Math.min(diferenca / 10000, 50);
        const tempoEstimado = this.calcularTempoEstimado(distancia);

        return {
          ...loja,
          distancia: parseFloat(distancia.toFixed(1)),
          tempoEstimado
        };
      })
      .sort((a, b) => (a.distancia || 0) - (b.distancia || 0))
      .slice(0, 3); // Retornar as 3 mais próximas

    console.log(`📍 ${lojasPorProximidade.length} lojas encontradas próximas ao CEP ${cep}`);
    return lojasPorProximidade;
  }

  // Buscar loja por ID
  getLojaPorId(id: number): Loja | undefined {
    return this.lojasSubject.value.find(loja => loja.id === id);
  }

  // Buscar loja por ID como Observable
  getLojaPorIdObservable(id: number): Observable<Loja | undefined> {
    return this.lojas$.pipe(
      map(lojas => lojas.find(loja => loja.id === id))
    );
  }

  // Verificar se as lojas estão carregadas
  isCarregado(): boolean {
    return this.lojasSubject.value.length > 0;
  }

  // Obter número total de lojas
  getTotalLojas(): number {
    return this.lojasSubject.value.length;
  }

  // Obter número de lojas disponíveis
  getTotalLojasDisponiveis(): number {
    return this.lojasSubject.value.filter(loja => loja.disponivel).length;
  }

  // Calcular tempo estimado baseado na distância
  private calcularTempoEstimado(distancia: number): string {
    if (distancia < 5) return '15-20 min';
    if (distancia < 10) return '20-30 min';
    if (distancia < 20) return '30-45 min';
    return '45-60 min';
  }

  // Formatar endereço completo
  getEnderecoCompleto(loja: Loja): string {
    const { logradouro, numero, bairro, cidade, estado, cep } = loja.endereco;
    const complemento = loja.endereco.complemento ? `, ${loja.endereco.complemento}` : '';
    return `${logradouro}, ${numero}${complemento} - ${bairro}, ${cidade} - ${estado}, ${cep}`;
  }

  // Recarregar lojas do JSON
  recarregarLojas(): void {
    this.carregarLojas();
  }
}
