import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ItemCarrinho } from '../../home/models/estrutura';
import { ProdutosService } from '../../services/produtos.service';

@Component({
  selector: 'app-checkout',
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './checkout.html',
  styleUrl: './checkout.scss',
})
export class Checkout implements OnInit {

   checkoutForm!: FormGroup;
  itens: ItemCarrinho[] = [];
  subtotal: number = 0;
  frete: number = 0;
  total: number = 0;

  metodoPagamentoSelecionado: string = '';
  enderecoSelecionado: string = '';

  constructor(
    private fb: FormBuilder,
    private carrinhoService: ProdutosService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.carregarCarrinho();
    this.inicializarFormulario();
  }

  inicializarFormulario(): void {
    this.checkoutForm = this.fb.group({
      // Dados pessoais
      nomeCompleto: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      telefone: ['', [Validators.required, Validators.minLength(10)]],
      cpf: ['', [Validators.required, Validators.minLength(11)]],

      // Endereço
      cep: ['', [Validators.required, Validators.minLength(8)]],
      endereco: ['', Validators.required],
      numero: ['', Validators.required],
      complemento: [''],
      bairro: ['', Validators.required],
      cidade: ['', Validators.required],
      estado: ['', Validators.required],

      // Pagamento
      metodoPagamento: ['', Validators.required],
      numeroCartao: [''],
      nomeCartao: [''],
      validadeCartao: [''],
      cvv: ['']
    });
  }

  carregarCarrinho(): void {
    this.carrinhoService.itens$.subscribe(itens => {
      this.itens = itens;
      this.calcularValores();
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

  buscarCep(): void {
    const cep = this.checkoutForm.get('cep')?.value?.replace(/\D/g, '');

    if (cep && cep.length === 8) {
      fetch(`https://viacep.com.br/ws/${cep}/json/`)
        .then(response => response.json())
        .then(data => {
          if (!data.erro) {
            this.checkoutForm.patchValue({
              endereco: data.logradouro,
              bairro: data.bairro,
              cidade: data.localidade,
              estado: data.uf
            });
          } else {
            alert('CEP não encontrado!');
          }
        })
        .catch(error => {
          console.error('Erro ao buscar CEP:', error);
          alert('Erro ao buscar CEP. Tente novamente.');
        });
    }
  }

  selecionarMetodoPagamento(metodo: string): void {
    this.metodoPagamentoSelecionado = metodo;
    this.checkoutForm.patchValue({ metodoPagamento: metodo });

    // Validações condicionais
    if (metodo === 'credito' || metodo === 'debito') {
      this.checkoutForm.get('numeroCartao')?.setValidators([Validators.required]);
      this.checkoutForm.get('nomeCartao')?.setValidators([Validators.required]);
      this.checkoutForm.get('validadeCartao')?.setValidators([Validators.required]);
      this.checkoutForm.get('cvv')?.setValidators([Validators.required]);
    } else {
      this.checkoutForm.get('numeroCartao')?.clearValidators();
      this.checkoutForm.get('nomeCartao')?.clearValidators();
      this.checkoutForm.get('validadeCartao')?.clearValidators();
      this.checkoutForm.get('cvv')?.clearValidators();
    }

    this.checkoutForm.get('numeroCartao')?.updateValueAndValidity();
    this.checkoutForm.get('nomeCartao')?.updateValueAndValidity();
    this.checkoutForm.get('validadeCartao')?.updateValueAndValidity();
    this.checkoutForm.get('cvv')?.updateValueAndValidity();
  }

  finalizarPedido(): void {
    if (this.itens.length === 0) {
      alert('Seu carrinho está vazio!');
      this.router.navigate(['/']);
      return;
    }

    if (this.checkoutForm.invalid) {
      alert('Por favor, preencha todos os campos obrigatórios!');
      this.marcarCamposComoTocados();
      return;
    }

    const formData = this.checkoutForm.value;
    const numeroPedido = '#CC-' + Math.floor(Math.random() * 900000 + 100000);

    const pedido = {
      numero: numeroPedido,
      data: new Date(),
      itens: this.itens.map(item => ({
        id: item.produto.id,
        nome: item.produto.nome,
        preco: item.produto.preco,
        quantidade: item.quantidade,
        imagem: item.produto.imagem
      })),
      subtotal: this.subtotal,
      frete: this.frete,
      total: this.total,
      formaPagamento: this.getFormaPagamentoTexto(),
      endereco: {
        logradouro: formData.endereco,
        numero: formData.numero,
        complemento: formData.complemento,
        bairro: formData.bairro,
        cidade: formData.cidade,
        estado: formData.estado,
        cep: formData.cep
      },
      prazoEntrega: '2-5 dias úteis',
      dadosCliente: {
        nome: formData.nomeCompleto,
        email: formData.email,
        telefone: formData.telefone,
        cpf: formData.cpf
      },
      status: 'aguardando_pagamento' as const
    };

    console.log('Pedido finalizado:', pedido);

    // Adicionar pedido ao service
    this.carrinhoService.adicionarPedido(pedido);

    // Limpar carrinho
    this.carrinhoService.limparCarrinho();

    // Redirecionar para página de confirmação
    this.router.navigate(['/pedido-confirmado']);
  }

  getFormaPagamentoTexto(): string {
    switch (this.metodoPagamentoSelecionado) {
      case 'credito': return 'Cartão de Crédito';
      case 'debito': return 'Cartão de Débito';
      case 'pix': return 'PIX';
      case 'boleto': return 'Boleto Bancário';
      default: return 'Não informado';
    }
  }

  marcarCamposComoTocados(): void {
    Object.keys(this.checkoutForm.controls).forEach(key => {
      this.checkoutForm.get(key)?.markAsTouched();
    });
  }

  voltarParaCarrinho(): void {
    this.router.navigate(['/carrinho']);
  }

  isInvalido(campo: string): boolean {
    const control = this.checkoutForm.get(campo);
    return !!(control && control.invalid && control.touched);
  }

  formatarPreco(valor: number): string {
    return valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
}
