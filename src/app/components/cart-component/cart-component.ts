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
  mensagensEstoque: Map<number, string> = new Map();

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
      this.validarEstoqueTodos();
    });
  }

  calcularValores(): void {
    this.subtotal = this.carrinhoService.getSubtotal();

    if (this.subtotal >= 200) {
      this.frete = 0;
    } else if (this.subtotal > 0) {
      this.frete = 29.90;
    } else {
      this.frete = 0;
    }

    this.total = this.subtotal + this.frete;
  }




  validarEstoqueTodos(): void {
    this.mensagensEstoque.clear();
    this.itens.forEach(item => {
      this.validarEstoque(item);
    });
  }


  validarEstoque(item: ItemCarrinho): boolean {
    const estoque = item.produto.estoque;
    const quantidade = item.quantidade;

    if (estoque === 0) {
      this.mensagensEstoque.set(
        item.produto.id,
        'Produto indisponível no momento'
      );
      return false;
    } else if (quantidade > estoque) {
      this.mensagensEstoque.set(
        item.produto.id,
        `Apenas ${estoque} ${estoque === 1 ? 'unidade disponível' : 'unidades disponíveis'}`
      );
      return false;
    } else if (quantidade === estoque) {
      this.mensagensEstoque.set(
        item.produto.id,
        `Última${estoque === 1 ? '' : 's'} ${estoque} unidade${estoque === 1 ? '' : 's'} em estoque`
      );
      return true;
    } else if (estoque <= 5 && estoque > 0) {
      this.mensagensEstoque.set(
        item.produto.id,
        `Apenas ${estoque} unidades disponíveis`
      );
      return true;
    } else {
      this.mensagensEstoque.delete(item.produto.id);
      return true;
    }
  }


  getMensagemEstoque(produtoId: number): string | undefined {
    return this.mensagensEstoque.get(produtoId);
  }


  temErroEstoque(produtoId: number): boolean {
    const item = this.itens.find(i => i.produto.id === produtoId);
    if (!item) return false;
    return item.quantidade > item.produto.estoque || item.produto.estoque === 0;
  }


  temAvisoEstoque(produtoId: number): boolean {
    const item = this.itens.find(i => i.produto.id === produtoId);
    if (!item) return false;
    return item.produto.estoque <= 5 && item.quantidade <= item.produto.estoque && item.produto.estoque > 0;
  }


  podeFinalizarCompra(): boolean {
    if (this.itens.length === 0) return false;


    return this.itens.every(item => {
      return item.quantidade <= item.produto.estoque && item.produto.estoque > 0;
    });
  }



  aumentarQuantidade(item: ItemCarrinho): void {

    if (item.quantidade >= item.produto.estoque) {
      alert(`Estoque máximo disponível: ${item.produto.estoque} unidade${item.produto.estoque === 1 ? '' : 's'}`);
      return;
    }

    const limiteMaximo = Math.min(10, item.produto.estoque);

    if (item.quantidade < limiteMaximo) {
      this.carrinhoService.atualizarQuantidade(item.produto.id, item.quantidade + 1);
    } else if (item.quantidade >= 10) {
      alert('Limite máximo de 10 unidades por produto');
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

    if (!this.podeFinalizarCompra()) {
      const itensComProblema = this.itens.filter(item =>
        item.quantidade > item.produto.estoque || item.produto.estoque === 0
      );

      if (itensComProblema.length > 0) {
        const listaProblemas = itensComProblema.map(item => {
          if (item.produto.estoque === 0) {
            return `• ${item.produto.nome}: Produto indisponível`;
          } else {
            return `• ${item.produto.nome}: Apenas ${item.produto.estoque} unidade${item.produto.estoque === 1 ? '' : 's'} disponível${item.produto.estoque === 1 ? '' : 'eis'}`;
          }
        }).join('\n');

        alert(`Não é possível finalizar a compra. Ajuste os seguintes itens:\n\n${listaProblemas}`);
        return;
      }
    }

    alert('Redirecionando para o pagamento...');
    this.router.navigate(['/checkout']);
  }

  calcularParcela(valor: number, parcelas: number): number {
    return valor / parcelas;
  }

  irParaProduto(id: number): void {
    this.router.navigate(['/produto', id]);
  }

  formatarNumero(valor: number): string {
    return valor.toFixed(2);
  }
}
