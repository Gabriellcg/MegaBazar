import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { Pedido } from '../../home/models/estrutura';

@Component({
  selector: 'app-order-confirmation-component',
  imports: [CommonModule, RouterModule],
  templateUrl: './order-confirmation-component.html',
  styleUrl: './order-confirmation-component.scss',
})
export class OrderConfirmationComponent implements OnInit {

  pedido: Pedido | null = null;
  loading: boolean = true;

  constructor(private router: Router) { }

  ngOnInit(): void {
    this.carregarPedido();
  }

  carregarPedido(): void {
    // Simular carregamento de pedido
    // Em produção, pegar do serviço ou state management
    const pedidoSalvo = localStorage.getItem('ultimoPedido');

    if (pedidoSalvo) {
      this.pedido = JSON.parse(pedidoSalvo);
      this.loading = false;
    } else {
      // Criar pedido de exemplo se não existir
      this.pedido = {
        numero: '#CC-789456',
        data: new Date(),
        itens: [
          {
            id: 1,
            nome: 'iPhone 17 Pro 256 gb | Laranja',
            preco: 8999.99,
            quantidade: 1,
            imagem: 'https://images.unsplash.com/photo-1592286927505-e0e5c06f4f5b?w=300&h=300&fit=crop'
          }
        ],
        subtotal: 8999.99,
        frete: 0,
        total: 8999.99,
        formaPagamento: 'Cartão de Crédito',
        endereco: {
          logradouro: 'Rua Principal',
          numero: '100',
          complemento: 'Apto 301',
          bairro: 'Centro',
          cidade: 'São Paulo',
          estado: 'SP',
          cep: '01001-000'
        },
        prazoEntrega: '2 dias'
      };
      this.loading = false;
    }
  }

  voltarParaHome(): void {
    this.router.navigate(['/']);
  }

  verMaisProdutos(): void {
    this.router.navigate(['/']);
  }

  acompanharPedido(): void {
    alert(`Acompanhar pedido ${this.pedido?.numero}\n\nEm breve você receberá um e-mail com o código de rastreamento.`);
  }

  verTodosOsPedidos(): void {
    alert('Funcionalidade "Meus Pedidos" em desenvolvimento!');
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

}
