import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { ItemCarrinho } from '../../home/models/estrutura';
import { ProdutosService } from '../../services/produtos.service';

@Component({
  selector: 'app-cart-component',
  imports: [CommonModule, RouterModule],
  templateUrl: './cart-component.html',
  styleUrl: './cart-component.scss',
})
export class CartComponent implements OnInit {

  itens: ItemCarrinho[] = [];
  subtotal: number = 0;
  frete: number = 0;
  total: number = 0;

  constructor(
    private carrinhoService: ProdutosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.carregarCarrinho();
  }

  carregarCarrinho(): void {
    this.carrinhoService.itens$.subscribe(itens => {
      this.itens = itens;
      this.calcularValores();
    });
  }

  calcularValores(): void {
    this.subtotal = this.carrinhoService.getSubtotal();

    // Frete grátis acima de R$ 200
    if (this.subtotal >= 200) {
      this.frete = 0;
    } else if (this.subtotal > 0) {
      this.frete = 29.90;
    } else {
      this.frete = 0;
    }

    this.total = this.subtotal + this.frete;
  }

  aumentarQuantidade(item: ItemCarrinho): void {
    if (item.quantidade < 10) {
      this.carrinhoService.atualizarQuantidade(item.produto.id, item.quantidade + 1);
    }
  }

  diminuirQuantidade(item: ItemCarrinho): void {
    if (item.quantidade > 1) {
      this.carrinhoService.atualizarQuantidade(item.produto.id, item.quantidade - 1);
    }
  }

  removerItem(item: ItemCarrinho): void {
    if (confirm(`Deseja remover "${item.produto.nome}" do carrinho?`)) {
      this.carrinhoService.removerItem(item.produto.id);
    }
  }

  limparCarrinho(): void {
    if (confirm('Deseja remover todos os itens do carrinho?')) {
      this.carrinhoService.limparCarrinho();
    }
  }

  continuarComprando(): void {
    this.router.navigate(['/']);
  }

  finalizarCompra(): void {
    if (this.itens.length === 0) {
      alert('Seu carrinho está vazio!');
      return;
    }
    // Redirecionar para checkout
    this.router.navigate(['/checkout']);
  }

  calcularParcela(valor: number, parcelas: number): number {
    return valor / parcelas;
  }

  irParaProduto(id: number): void {
    this.router.navigate(['/produto', id]);
  }
}
