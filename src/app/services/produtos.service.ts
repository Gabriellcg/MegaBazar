import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ItemCarrinho, Produto, ProdutosData } from '../home/models/estrutura';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {

  private itensSubject = new BehaviorSubject<ItemCarrinho[]>([]);
  public itens$: Observable<ItemCarrinho[]> = this.itensSubject.asObservable();

  private jsonUrl = 'assets/data/produtos.json';

  constructor(private http: HttpClient) {
    this.carregarDoLocalStorage();
  }

  getProdutos(): Observable<ProdutosData> {
    return this.http.get<ProdutosData>(this.jsonUrl);
  }

  private carregarDoLocalStorage(): void {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
      const itens = JSON.parse(carrinhoSalvo);
      this.itensSubject.next(itens);
    }
  }

  private salvarNoLocalStorage(): void {
    localStorage.setItem('carrinho', JSON.stringify(this.itensSubject.value));
  }

  getItens(): ItemCarrinho[] {
    return this.itensSubject.value;
  }

  getTotalItens(): number {
    return this.itensSubject.value.reduce((total, item) => total + item.quantidade, 0);
  }

  getSubtotal(): number {
    return this.itensSubject.value.reduce(
      (total, item) => total + (item.produto.preco * item.quantidade),
      0
    );
  }

  adicionarItem(produto: Produto, quantidade: number = 1): void {
    const itensAtuais = this.itensSubject.value;
    const itemExistente = itensAtuais.find(item => item.produto.id === produto.id);

    if (itemExistente) {
      // Atualizar quantidade
      itemExistente.quantidade += quantidade;
      this.itensSubject.next([...itensAtuais]);
    } else {
      // Adicionar novo item
      this.itensSubject.next([...itensAtuais, { produto, quantidade }]);
    }

    this.salvarNoLocalStorage();
  }

  removerItem(produtoId: number): void {
    const itensAtuais = this.itensSubject.value;
    const novosItens = itensAtuais.filter(item => item.produto.id !== produtoId);
    this.itensSubject.next(novosItens);
    this.salvarNoLocalStorage();
  }

  atualizarQuantidade(produtoId: number, quantidade: number): void {
    if (quantidade <= 0) {
      this.removerItem(produtoId);
      return;
    }

    const itensAtuais = this.itensSubject.value;
    const item = itensAtuais.find(item => item.produto.id === produtoId);

    if (item) {
      item.quantidade = quantidade;
      this.itensSubject.next([...itensAtuais]);
      this.salvarNoLocalStorage();
    }
  }

  limparCarrinho(): void {
    this.itensSubject.next([]);
    localStorage.removeItem('carrinho');
  }
}

