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
