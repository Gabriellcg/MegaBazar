import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ItemCarrinho, Pedido, Produto, ProdutosData } from '../home/models/estrutura';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ProdutosService {

  private itensSubject = new BehaviorSubject<ItemCarrinho[]>([]);
  public itens$: Observable<ItemCarrinho[]> = this.itensSubject.asObservable();

  private pedidosSubject = new BehaviorSubject<Pedido[]>([]);
  public pedidos$: Observable<Pedido[]> = this.pedidosSubject.asObservable();

  private produtosCache = new BehaviorSubject<ProdutosData | null>(null);
  public produtos$: Observable<ProdutosData | null> = this.produtosCache.asObservable();

  private jsonUrl = 'assets/data/produtos.json';

  constructor(private http: HttpClient) {
    this.carregarDoLocalStorage();
    this.carregarPedidos();
    this.carregarProdutosComEstoque();
  }

  private carregarProdutosComEstoque(): void {
    this.http.get<ProdutosData>(this.jsonUrl).subscribe(data => {
      const estoqueLocal = this.carregarEstoqueLocal();

      data.promocoes = data.promocoes.map(produto => ({
        ...produto,
        estoque: estoqueLocal[produto.id] !== undefined ? estoqueLocal[produto.id] : produto.estoque
      }));

      data.lancamentos = data.lancamentos.map(produto => ({
        ...produto,
        estoque: estoqueLocal[produto.id] !== undefined ? estoqueLocal[produto.id] : produto.estoque
      }));

      this.produtosCache.next(data);
    });
  }

  getProdutos(): Observable<ProdutosData> {
    return this.produtos$.pipe(
      map(data => {
        if (!data) {
          this.carregarProdutosComEstoque();
          return { promocoes: [], lancamentos: [] };
        }
        return data;
      })
    );
  }

  getProdutoPorId(id: number): Produto | undefined {
    const data = this.produtosCache.value;
    if (!data) return undefined;

    const produto = [...data.promocoes, ...data.lancamentos].find(p => p.id === id);
    return produto;
  }

  private carregarEstoqueLocal(): { [produtoId: number]: number } {
    const estoqueSalvo = localStorage.getItem('estoque_produtos');
    return estoqueSalvo ? JSON.parse(estoqueSalvo) : {};
  }

  private salvarEstoqueLocal(estoque: { [produtoId: number]: number }): void {
    localStorage.setItem('estoque_produtos', JSON.stringify(estoque));
  }

  private atualizarEstoqueProduto(produtoId: number, novoEstoque: number): void {
    const data = this.produtosCache.value;
    if (!data) return;

    data.promocoes = data.promocoes.map(p =>
      p.id === produtoId ? { ...p, estoque: novoEstoque } : p
    );
    data.lancamentos = data.lancamentos.map(p =>
      p.id === produtoId ? { ...p, estoque: novoEstoque } : p
    );

    this.produtosCache.next({ ...data });

    const estoqueLocal = this.carregarEstoqueLocal();
    estoqueLocal[produtoId] = novoEstoque;
    this.salvarEstoqueLocal(estoqueLocal);
  }

  decrementarEstoque(itens: ItemCarrinho[]): { sucesso: boolean; mensagem: string } {
    const data = this.produtosCache.value;
    if (!data) {
      return {
        sucesso: false,
        mensagem: 'Erro ao carregar produtos'
      };
    }

    for (const item of itens) {
      const produto = this.getProdutoPorId(item.produto.id);
      if (!produto) {
        return {
          sucesso: false,
          mensagem: `Produto ${item.produto.nome} não encontrado`
        };
      }
      if (produto.estoque < item.quantidade) {
        return {
          sucesso: false,
          mensagem: `Estoque insuficiente para ${item.produto.nome}. Disponível: ${produto.estoque}`
        };
      }
    }

    itens.forEach(item => {
      const produto = this.getProdutoPorId(item.produto.id);
      if (produto) {
        const novoEstoque = produto.estoque - item.quantidade;
        this.atualizarEstoqueProduto(item.produto.id, novoEstoque);
      }
    });

    return {
      sucesso: true,
      mensagem: 'Estoque atualizado com sucesso'
    };
  }

  restaurarEstoque(itens: ItemCarrinho[]): void {
    itens.forEach(item => {
      const produto = this.getProdutoPorId(item.produto.id);
      if (produto) {
        const novoEstoque = produto.estoque + item.quantidade;
        this.atualizarEstoqueProduto(item.produto.id, novoEstoque);
      }
    });
  }

  private carregarDoLocalStorage(): void {
    const carrinhoSalvo = localStorage.getItem('carrinho');
    if (carrinhoSalvo) {
      const itens = JSON.parse(carrinhoSalvo);
      this.itensSubject.next(itens);
    }
  }

  private salvarNoLocalStorage(): void {
    localStorage.setItem('carrinho', JSON.stringify(this.itensSubject.value));
  }

  getItens(): ItemCarrinho[] {
    return this.itensSubject.value;
  }

  getTotalItens(): number {
    return this.itensSubject.value.reduce((total, item) => total + item.quantidade, 0);
  }

  getSubtotal(): number {
    return this.itensSubject.value.reduce(
      (total, item) => total + (item.produto.preco * item.quantidade),
      0
    );
  }

  verificarEstoqueDisponivel(produto: Produto, quantidade: number): boolean {
    return produto.estoque >= quantidade && produto.estoque > 0;
  }

  getQuantidadeMaximaPermitida(produto: Produto): number {
    return Math.min(produto.estoque, 10);
  }

  adicionarItem(produto: Produto, quantidade: number = 1): { sucesso: boolean; mensagem: string } {

    const produtoAtualizado = this.getProdutoPorId(produto.id);
    if (!produtoAtualizado) {
      return {
        sucesso: false,
        mensagem: 'Produto não encontrado'
      };
    }

    const itensAtuais = this.itensSubject.value;
    const itemExistente = itensAtuais.find(item => item.produto.id === produto.id);

    if (produtoAtualizado.estoque === 0) {
      return {
        sucesso: false,
        mensagem: 'Produto indisponível no momento'
      };
    }

    if (itemExistente) {
      const novaQuantidade = itemExistente.quantidade + quantidade;

      if (novaQuantidade > produtoAtualizado.estoque) {
        return {
          sucesso: false,
          mensagem: `Apenas ${produtoAtualizado.estoque} unidade${produtoAtualizado.estoque === 1 ? '' : 's'} disponível${produtoAtualizado.estoque === 1 ? '' : 'eis'}`
        };
      }

      if (novaQuantidade > 10) {
        return {
          sucesso: false,
          mensagem: 'Limite máximo de 10 unidades por produto'
        };
      }

      itemExistente.produto = produtoAtualizado;
      itemExistente.quantidade = novaQuantidade;
      this.itensSubject.next([...itensAtuais]);
    } else {
      if (quantidade > produtoAtualizado.estoque) {
        return {
          sucesso: false,
          mensagem: `Apenas ${produtoAtualizado.estoque} unidade${produtoAtualizado.estoque === 1 ? '' : 's'} disponível${produtoAtualizado.estoque === 1 ? '' : 'eis'}`
        };
      }

      if (quantidade > 10) {
        return {
          sucesso: false,
          mensagem: 'Limite máximo de 10 unidades por produto'
        };
      }

      this.itensSubject.next([...itensAtuais, { produto: produtoAtualizado, quantidade }]);
    }

    this.salvarNoLocalStorage();

    return {
      sucesso: true,
      mensagem: 'Produto adicionado ao carrinho com sucesso'
    };
  }

  removerItem(produtoId: number): void {
    const itensAtuais = this.itensSubject.value;
    const novosItens = itensAtuais.filter(item => item.produto.id !== produtoId);
    this.itensSubject.next(novosItens);
    this.salvarNoLocalStorage();
  }

  atualizarQuantidade(produtoId: number, quantidade: number): boolean {
    if (quantidade <= 0) {
      this.removerItem(produtoId);
      return true;
    }

    const itensAtuais = this.itensSubject.value;
    const item = itensAtuais.find(item => item.produto.id === produtoId);

    if (!item) {
      return false;
    }

    const produtoAtualizado = this.getProdutoPorId(produtoId);
    if (!produtoAtualizado) {
      return false;
    }

    if (quantidade > produtoAtualizado.estoque) {
      console.warn(`Quantidade solicitada (${quantidade}) excede o estoque disponível (${produtoAtualizado.estoque})`);
      return false;
    }

    if (quantidade > 10) {
      console.warn('Limite máximo de 10 unidades por produto');
      return false;
    }

    item.produto = produtoAtualizado;
    item.quantidade = quantidade;
    this.itensSubject.next([...itensAtuais]);
    this.salvarNoLocalStorage();

    return true;
  }

  limparCarrinho(): void {
    this.itensSubject.next([]);
    localStorage.removeItem('carrinho');
  }

  produtoEstaNoCarrinho(produtoId: number): boolean {
    return this.itensSubject.value.some(item => item.produto.id === produtoId);
  }

  getQuantidadeNoCarrinho(produtoId: number): number {
    const item = this.itensSubject.value.find(i => i.produto.id === produtoId);
    return item ? item.quantidade : 0;
  }

  validarCarrinhoParaCheckout(): { valido: boolean; problemas: string[] } {
    const itens = this.itensSubject.value;
    const problemas: string[] = [];

    if (itens.length === 0) {
      return {
        valido: false,
        problemas: ['Carrinho vazio']
      };
    }

    itens.forEach(item => {
      const produtoAtualizado = this.getProdutoPorId(item.produto.id);
      if (!produtoAtualizado) {
        problemas.push(`${item.produto.nome}: Produto não encontrado`);
      } else if (produtoAtualizado.estoque === 0) {
        problemas.push(`${item.produto.nome}: Produto indisponível`);
      } else if (item.quantidade > produtoAtualizado.estoque) {
        problemas.push(
          `${item.produto.nome}: Apenas ${produtoAtualizado.estoque} unidade${produtoAtualizado.estoque === 1 ? '' : 's'} disponível${produtoAtualizado.estoque === 1 ? '' : 'eis'}`
        );
      }
    });

    return {
      valido: problemas.length === 0,
      problemas
    };
  }

  private carregarPedidos(): void {
    const pedidosSalvos = localStorage.getItem('pedidos');
    if (pedidosSalvos) {
      const pedidos = JSON.parse(pedidosSalvos);
      pedidos.forEach((p: Pedido) => {
        p.data = new Date(p.data);
        if (p.dataAtualizacao) {
          p.dataAtualizacao = new Date(p.dataAtualizacao);
        }
      });
      this.pedidosSubject.next(pedidos);
    }
  }

  private salvarPedidos(): void {
    localStorage.setItem('pedidos', JSON.stringify(this.pedidosSubject.value));
  }

  adicionarPedido(pedido: Pedido): void {
    const pedidosAtuais = this.pedidosSubject.value;
    this.pedidosSubject.next([pedido, ...pedidosAtuais]);
    this.salvarPedidos();

    localStorage.setItem('ultimoPedido', JSON.stringify(pedido));
  }

  getPedidos(): Pedido[] {
    return this.pedidosSubject.value;
  }

  getPedidoPorNumero(numero: string): Pedido | undefined {
    return this.pedidosSubject.value.find(p => p.numero === numero);
  }

  atualizarStatus(numero: string, novoStatus: Pedido['status']): void {
    const pedidos = this.pedidosSubject.value;
    const pedido = pedidos.find(p => p.numero === numero);

    if (pedido) {
      pedido.status = novoStatus;
      pedido.dataAtualizacao = new Date();
      this.pedidosSubject.next([...pedidos]);
      this.salvarPedidos();

      if (novoStatus === 'cancelado') {
        const itensCarrinho: ItemCarrinho[] = pedido.itens.map(item => ({
          produto: this.getProdutoPorId(item.id)!,
          quantidade: item.quantidade
        })).filter(item => item.produto !== undefined);

        this.restaurarEstoque(itensCarrinho);
      }
    }
  }

  getTotalPedidos(): number {
    return this.pedidosSubject.value.length;
  }

  limparPedidos(): void {
    this.pedidosSubject.next([]);
    localStorage.removeItem('pedidos');
    localStorage.removeItem('ultimoPedido');
  }
}
