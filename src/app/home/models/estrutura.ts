export interface Produto {
  id: number;
  nome: string;
  preco: number;
  precoAntigo?: number;
  imagem: string;
  rating: number;
  parcelas: number;
  categoria?: string;
  descricao?: string;
}

export interface ProdutosData {
  promocoes: Produto[];
  lancamentos: Produto[];
}

export interface ItemCarrinho {
  produto: Produto;
  quantidade: number;
}

export interface ItemPedido {
  id: number;
  nome: string;
  preco: number;
  quantidade: number;
  imagem: string;
}

export interface Pedido {
  numero: string;
  data: Date;
  itens: ItemPedido[];
  subtotal: number;
  frete: number;
  total: number;
  formaPagamento: string;
  endereco: {
    logradouro: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  prazoEntrega: string;
  dadosCliente: {
    nome: string;
    email: string;
    telefone: string;
    cpf: string;
  };
  status: 'aguardando_pagamento' | 'pagamento_confirmado' | 'em_separacao' | 'em_transporte' | 'entregue' | 'cancelado';
  dataAtualizacao?: Date;
}
