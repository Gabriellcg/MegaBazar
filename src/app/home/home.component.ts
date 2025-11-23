import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { RouterModule } from '@angular/router';
import { Produto, ProdutosData } from './models/estrutura';
import { CommonModule } from '@angular/common';
import { ProdutosService } from '../services/produtos.service';

@Component({
  selector: 'app-home',
  imports: [RouterModule, CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  promocoes: Produto[] = [];
  lancamentos: Produto[] = [];
  carrinhoCount: number = 0;
  menuAberto: boolean = false;
  loading: boolean = false;
  erro: string = '';

  constructor(
    private produtosService: ProdutosService,
    private cdr: ChangeDetectorRef
  ) {
    console.log('🔧 HomeComponent construído');
  }

  ngOnInit(): void {
    console.log('🚀 ngOnInit chamado');
    this.carregarProdutos();
    this.atualizarCarrinhoCount();
  }

  atualizarCarrinhoCount(): void {
    this.produtosService.itens$.subscribe(() => {
      this.carrinhoCount = this.produtosService.getTotalItens();
    });
  }

  carregarProdutos(): void {
    console.log('📡 Iniciando carregamento...');
    this.loading = true;
    this.erro = '';

    this.produtosService.getProdutos().subscribe({
      next: (data) => {
        console.log('✅ Dados recebidos do serviço:', data);

        // Garantir que os dados sejam atribuídos corretamente
        this.promocoes = Array.isArray(data.promocoes) ? [...data.promocoes] : [];
        this.lancamentos = Array.isArray(data.lancamentos) ? [...data.lancamentos] : [];
        this.loading = false;

        console.log('📦 Promoções atribuídas:', this.promocoes);
        console.log('📦 Promoções length:', this.promocoes.length);
        console.log('📦 Lançamentos atribuídos:', this.lancamentos);
        console.log('📦 Lançamentos length:', this.lancamentos.length);
        console.log('⏱️ Loading agora é:', this.loading);

        // Forçar detecção de mudanças
        this.cdr.detectChanges();

        console.log('✨ Change detection executado!');
      },
      error: (error) => {
        console.error('❌ Erro ao carregar produtos:', error);
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
    console.log('🛒 Produto adicionado ao carrinho:', produto);
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
}
