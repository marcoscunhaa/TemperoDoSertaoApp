import { Component, OnInit } from '@angular/core';
import { Produto, ProdutoService } from '../../services/produto';
import { DatePipe, DecimalPipe, CommonModule } from '@angular/common';
import { Notificacao, NotificacaoService, TipoAlerta } from '../../services/notificacao';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-estoque',
  standalone: true,
  imports: [CommonModule, FormsModule, DecimalPipe, DatePipe],
  templateUrl: './estoque.html',
  styleUrls: ['./estoque.scss'],
})
export class Estoque implements OnInit {
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];

  categoriaSelecionada = 'todas';
  termoPesquisa = '';
  produtoSelecionado: Produto | null = null;

  alertaMensagem: string | null = null;
  tipoAlerta: TipoAlerta = 'success';
  loading = false;

  // PAGINAÇÃO
  paginaAtual = 1;
  totalPaginas = 1;
  paginas: number[] = [];
  itensPorPagina = 5;

  categorias: { value: string; label: string }[] = [
    { value: 'todas', label: 'Todas as categorias' },
    { value: 'Carnes', label: 'Carnes' },
    { value: 'Temperos', label: 'Temperos' },
    { value: 'Bebidas', label: 'Bebidas' },
    { value: 'Frios', label: 'Frios' },
    { value: 'Doces', label: 'Doces' },
  ];

  constructor(
    private produtoService: ProdutoService,
    private notificacaoService: NotificacaoService
  ) {}

  ngOnInit() {
    this.carregarProdutos();

    this.notificacaoService.notificacao$.subscribe((notif: Notificacao) => {
      this.alertaMensagem = notif.mensagem;
      this.tipoAlerta = notif.tipo;
      this.carregarProdutos();
    });
  }

  carregarProdutos() {
    this.loading = true;
    this.produtoService.listarTodos().subscribe({
      next: (prods) => {
        this.produtos = prods;
        this.filtrar();
      },
      complete: () => (this.loading = false),
    });
  }

  filtrar() {
    const termo = this.termoPesquisa.toLowerCase();

    this.produtosFiltrados = this.produtos.filter((prod) => {
      const categoriaOk =
        this.categoriaSelecionada === 'todas' ||
        prod.categoria.toLowerCase() === this.categoriaSelecionada.toLowerCase();

      const pesquisaOk =
        !termo ||
        prod.detalhe.toLowerCase().includes(termo) ||
        prod.marca.toLowerCase().includes(termo);

      return categoriaOk && pesquisaOk;
    });

    // 🔥 Sempre voltar à primeira página após filtrar
    this.paginaAtual = 1;

    this.atualizarPaginacao();
  }

  onCategoriaChange(event: Event) {
    this.categoriaSelecionada = (event.target as HTMLSelectElement).value;
    this.filtrar();
  }

  onPesquisaChange(event: Event) {
    this.termoPesquisa = (event.target as HTMLInputElement).value;
    this.filtrar();
  }

  selecionarProduto(prod: Produto) {
    this.produtoSelecionado = prod;
  }

  confirmarExcluir() {
    if (!this.produtoSelecionado) return;

    this.produtoService.deletar(this.produtoSelecionado.id!).subscribe({
      next: () => {
        this.notificacaoService.emitirSucesso('Produto removido com sucesso!');
        this.produtoSelecionado = null;
        this.carregarProdutos();
      },
      error: () => {
        this.notificacaoService.emitirErro('Erro ao remover produto');
      },
    });
  }

  salvarEdicao() {
    if (!this.produtoSelecionado) return;

    this.produtoService.atualizar(this.produtoSelecionado.id!, this.produtoSelecionado).subscribe({
      next: () => {
        this.notificacaoService.emitirSucesso('Produto atualizado com sucesso!');
        this.carregarProdutos();
      },
      error: (err) => {
        if (err.status === 409) {
          this.notificacaoService.emitirErro(err.error);
        } else {
          this.notificacaoService.emitirErro('Erro ao atualizar produto');
        }
      },
    });
  }

  // ---------------- PAGINAÇÃO AJUSTADA ----------------

  atualizarPaginacao() {
    this.totalPaginas = Math.max(1, Math.ceil(this.produtosFiltrados.length / this.itensPorPagina));

    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);

    // 🔥 Corrige limites do paginador
    if (this.paginaAtual > this.totalPaginas) this.paginaAtual = this.totalPaginas;
    if (this.paginaAtual < 1) this.paginaAtual = 1;
  }

  irParaPagina(pagina: number) {
    if (pagina < 1 || pagina > this.totalPaginas) return;
    this.paginaAtual = pagina;
  }

  produtosNaPagina(): Produto[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;
    return this.produtosFiltrados.slice(inicio, fim);
  }

  trackByIndex(index: number) {
    return index;
  }
}
