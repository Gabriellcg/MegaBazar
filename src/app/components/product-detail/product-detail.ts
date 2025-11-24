import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Produto } from '../../home/models/estrutura';
import { ProdutosService } from '../../services/produtos.service';


@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './product-detail.html',
  styleUrls: ['./product-detail.scss']
})
export class ProductDetail implements OnInit {
  produto: Produto | null = null;
  produtosRelacionados: Produto[] = [];
  quantidadeSelecionada: number = 1;
  imagemAtual: string = '';
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private produtosService: ProdutosService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.carregarProduto(id);
  }

  carregarProduto(id: number): void {
    this.loading = true;
    this.produtosService.getProdutos().subscribe({
      next: (data) => {
        // Buscar o produto pelo ID
        const todosProdutos = [...data.promocoes, ...data.lancamentos];
        this.produto = todosProdutos.find(p => p.id === id) || null;

        if (this.produto) {
          this.imagemAtual = this.produto.imagem;
          // Carregar produtos relacionados (excluindo o atual)
          this.produtosRelacionados = todosProdutos
            .filter(p => p.id !== id)
            .slice(0, 3);
        }

        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (error) => {
        console.error('Erro ao carregar produto:', error);
        this.loading = false;
      }
    });
  }

  calcularDesconto(): number {
    if (this.produto?.precoAntigo) {
      return Math.round((1 - this.produto.preco / this.produto.precoAntigo) * 100);
    }
    return 0;
  }

  calcularParcela(): number {
    if (this.produto) {
      return this.produto.preco / this.produto.parcelas;
    }
    return 0;
  }

  aumentarQuantidade(): void {
    if (this.quantidadeSelecionada < 10) {
      this.quantidadeSelecionada++;
    }
  }

  diminuirQuantidade(): void {
    if (this.quantidadeSelecionada > 1) {
      this.quantidadeSelecionada--;
    }
  }

  adicionarAoCarrinho(): void {
    if (this.produto) {
      this.produtosService.adicionarItem(this.produto, this.quantidadeSelecionada);
      alert(`${this.quantidadeSelecionada}x ${this.produto.nome} adicionado ao carrinho!`);
      console.log('Adicionando ao carrinho:', {
        produto: this.produto,
        quantidade: this.quantidadeSelecionada
      });
    }
  }

  comprarAgora(): void {
    if (this.produto) {
      this.produtosService.adicionarItem(this.produto, this.quantidadeSelecionada);
      this.router.navigate(['/carrinho']);
      console.log('Compra imediata:', {
        produto: this.produto,
        quantidade: this.quantidadeSelecionada
      });
    }
  }

  voltarParaHome(): void {
    this.router.navigate(['/']);
  }

  irParaProduto(id: number): void {
    this.router.navigate(['/produto', id]).then(() => {
      window.scrollTo(0, 0);
      this.carregarProduto(id);
    });
  }

  getArrayEstrelas(rating: number): number[] {
    return Array(5).fill(0).map((_, i) => i + 1);
  }

  isEstrelaPreenchida(estrela: number, rating: number): boolean {
    return estrela <= Math.floor(rating);
  }
}
