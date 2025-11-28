import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Produto, ProdutosData } from './models/estrutura';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProdutosService } from '../services/produtos.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule, FormsModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  promocoes: Produto[] = [];
  lancamentos: Produto[] = [];
  promocoesFiltradas: Produto[] = [];
  lancamentosFiltrados: Produto[] = [];
  carrinhoCount: number = 0;
  menuAberto: boolean = false;
  loading: boolean = false;
  erro: string = '';

  termoBusca: string = '';
  buscaAtiva: boolean = false;

  constructor(
    private produtosService: ProdutosService,
    private cdr: ChangeDetectorRef
  ) {

  }

  ngOnInit(): void {

    this.carregarProdutos();
    this.atualizarCarrinhoCount();
  }

  atualizarCarrinhoCount(): void {
    this.produtosService.itens$.subscribe(() => {
      this.carrinhoCount = this.produtosService.getTotalItens();
    });
  }

  carregarProdutos(): void {

    this.loading = true;
    this.erro = '';

    this.produtosService.getProdutos().subscribe({
      next: (data) => {

        this.promocoes = Array.isArray(data.promocoes) ? [...data.promocoes] : [];
        this.lancamentos = Array.isArray(data.lancamentos) ? [...data.lancamentos] : [];

        this.promocoesFiltradas = [...this.promocoes];
        this.lancamentosFiltrados = [...this.lancamentos];

        this.loading = false;

        this.cdr.detectChanges();

      },
      error: (error) => {
        this.erro = 'Erro ao carregar produtos. Carregando dados de exemplo...';
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  calcularDesconto(produto: Produto): number {
    if (produto.precoAntigo) {
      return Math.round((1 - produto.preco / produto.precoAntigo) * 100);
    }
    return 0;
  }

  calcularParcela(produto: Produto): number {
    return produto.preco / produto.parcelas;
  }

  adicionarAoCarrinho(produto: Produto): void {
    this.produtosService.adicionarItem(produto, 1);
    alert(`${produto.nome} foi adicionado ao carrinho!`);

  }

  toggleMenu(): void {
    this.menuAberto = !this.menuAberto;
  }

  getArrayEstrelas(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isEstrelaPreenchida(estrela: number, rating: number): boolean {
    return estrela <= Math.floor(rating);
  }

  buscarProdutos(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.termoBusca = input.value.toLowerCase().trim();

    if (this.termoBusca === '') {
      this.promocoesFiltradas = [...this.promocoes];
      this.lancamentosFiltrados = [...this.lancamentos];
      this.buscaAtiva = false;
    } else {
      this.buscaAtiva = true;

      this.promocoesFiltradas = this.promocoes.filter(produto =>
        produto.nome.toLowerCase().includes(this.termoBusca)
      );

      this.lancamentosFiltrados = this.lancamentos.filter(produto =>
        produto.nome.toLowerCase().includes(this.termoBusca)
      );


    }
  }

  limparBusca(): void {
    this.termoBusca = '';
    this.promocoesFiltradas = [...this.promocoes];
    this.lancamentosFiltrados = [...this.lancamentos];
    this.buscaAtiva = false;
  }
}
