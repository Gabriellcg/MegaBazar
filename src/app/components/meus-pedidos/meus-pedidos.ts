import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Pedido } from '../../home/models/estrutura';
import { ProdutosService } from '../../services/produtos.service';

@Component({
  selector: 'app-meus-pedidos',
  imports: [CommonModule, RouterModule],
  templateUrl: './meus-pedidos.html',
  styleUrl: './meus-pedidos.scss',
})
export class MeusPedidos implements OnInit {

  pedidos: Pedido[] = [];
  pedidoSelecionado: Pedido | null = null;
  loading: boolean = true;

  constructor(
    private pedidosService: ProdutosService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.carregarPedidos();
  }

  carregarPedidos(): void {
    this.pedidosService.pedidos$.subscribe(pedidos => {
      this.pedidos = pedidos;
      this.loading = false;
    });
  }

  selecionarPedido(pedido: Pedido): void {
    this.pedidoSelecionado = pedido;
  }

  fecharDetalhes(): void {
    this.pedidoSelecionado = null;
  }

  voltarParaHome(): void {
    this.router.navigate(['/']);
  }

  irParaProduto(produtoId: number): void {
    this.router.navigate(['/produto', produtoId]);
  }

  getStatusTexto(status: string): string {
    const statusMap: { [key: string]: string } = {
      'aguardando_pagamento': 'Aguardando pagamento',
      'pagamento_confirmado': 'Pagamento confirmado',
      'em_separacao': 'Em separação',
      'em_transporte': 'Em transporte',
      'entregue': 'Entregue',
      'cancelado': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const classMap: { [key: string]: string } = {
      'aguardando_pagamento': 'status-pending',
      'pagamento_confirmado': 'status-confirmed',
      'em_separacao': 'status-processing',
      'em_transporte': 'status-shipping',
      'entregue': 'status-delivered',
      'cancelado': 'status-cancelled'
    };
    return classMap[status] || '';
  }

  formatarData(data: Date): string {
    const d = new Date(data);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  calcularSubtotalItem(preco: number, quantidade: number): number {
    return preco * quantidade;
  }

  rastrearPedido(pedido: Pedido): void {
    alert(`Rastreamento do pedido ${pedido.numero}\n\nStatus: ${this.getStatusTexto(pedido.status)}\n\nCódigo de rastreamento será enviado por e-mail.`);
  }

  cancelarPedido(pedido: Pedido): void {
    if (confirm(`Deseja realmente cancelar o pedido ${pedido.numero}?`)) {
      this.pedidosService.atualizarStatus(pedido.numero, 'cancelado');
      alert('Pedido cancelado com sucesso!');
    }
  }

  recomprar(pedido: Pedido): void {
    alert('Funcionalidade de recompra em desenvolvimento!\n\nOs itens deste pedido serão adicionados ao seu carrinho.');
  }

}
