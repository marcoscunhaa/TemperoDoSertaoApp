import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Notificacao, NotificacaoService, TipoAlerta } from '../../services/notificacao';
import { Produto, ProdutoService } from '../../services/produto';
import { Reposicao, ReposicaoService } from '../../services/reposicao';

@Component({
  selector: 'app-reposicao',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reposicao.html',
  styleUrls: ['./reposicao.scss'],
})
export class ReposicaoComponent implements OnInit {
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];
  produtoFiltro: string = '';

  reposicoes: Reposicao[] = [];
  reposicoesFiltradas: Reposicao[] = [];

  alertaMensagem: string | null = null;
  tipoAlerta: TipoAlerta = 'success';

  // paginação
  paginaAtual = 1;
  itensPorPagina = 15;
  totalPaginas = 1;
  paginas: number[] = [];

  // filtros
  categorias = [
    { label: 'Carnes', value: 'Carnes' },
    { label: 'Bebidas', value: 'Bebidas' },
    { label: 'Doces', value: 'Doces' },
    { label: 'Frios', value: 'Frios' },
    { label: 'Temperos', value: 'Temperos' },
  ];
  categoriaSelecionada: string = 'todas';

  meses = [
    { nome: 'Janeiro', valor: 0 },
    { nome: 'Fevereiro', valor: 1 },
    { nome: 'Março', valor: 2 },
    { nome: 'Abril', valor: 3 },
    { nome: 'Maio', valor: 4 },
    { nome: 'Junho', valor: 5 },
    { nome: 'Julho', valor: 6 },
    { nome: 'Agosto', valor: 7 },
    { nome: 'Setembro', valor: 8 },
    { nome: 'Outubro', valor: 9 },
    { nome: 'Novembro', valor: 10 },
    { nome: 'Dezembro', valor: 11 },
  ];
  mesSelecionado: number | 'todos' = 'todos';

  anos: number[] = [];
  anoSelecionado: number | 'todos' = 'todos';

  // modal
  reposicaoSelecionada: Reposicao = this.criarObjetoReposicao();

  constructor(
    private reposicaoService: ReposicaoService,
    private produtoService: ProdutoService,
    private notificacaoService: NotificacaoService
  ) {}

  ngOnInit(): void {
    // ALERTA FUNCIONANDO ✔
    this.notificacaoService.notificacao$.subscribe((notif: Notificacao) => {
      this.tipoAlerta = notif.tipo;
      this.alertaMensagem = notif.mensagem;
    });

    this.anos = Array.from({ length: 11 }, (_, i) => 2025 + i);

    this.carregarProdutos();
    this.carregarReposicoes();
  }

  criarObjetoReposicao(): Reposicao {
    return {
      id: undefined,
      produto: {
        id: undefined,
        categoria: '',
        marca: '',
        detalhe: '',
        precoCompra: 0,
        precoVenda: 0,
        quantidadeEstoque: 0,
        vencimento: '',
      },
      quantidade: 1,
      dataEntrada: '',
      vencimento: '',
    };
  }

  carregarProdutos() {
    this.produtoService.listarTodos().subscribe({
      next: (prod) => {
        this.produtos = prod;
        this.produtosFiltrados = [...this.produtos];
      },
      error: () => this.notificacaoService.emitirErro('Erro ao carregar produtos.'),
    });
  }

  filtrarProdutos() {
    const filtro = this.produtoFiltro.toLowerCase();
    this.produtosFiltrados = this.produtos.filter(
      (p) => p.detalhe.toLowerCase().includes(filtro) || p.marca.toLowerCase().includes(filtro)
    );
  }

  carregarReposicoes() {
    this.reposicaoService.listarTodos().subscribe({
      next: (lista) => {
        this.reposicoes = lista;
        this.filtrar();
      },
      error: () => this.notificacaoService.emitirErro('Erro ao carregar reposições.'),
    });
  }

  filtrar() {
    this.reposicoesFiltradas = this.reposicoes.filter((rep) => {
      const data = new Date(rep.dataEntrada);
      const ano = data.getFullYear();
      const mes = data.getMonth();

      const categoriaOk =
        this.categoriaSelecionada === 'todas' ||
        rep.produto.categoria === this.categoriaSelecionada;

      const anoOk = this.anoSelecionado === 'todos' || ano === this.anoSelecionado;

      const mesOk = this.mesSelecionado === 'todos' || mes === this.mesSelecionado;

      return categoriaOk && anoOk && mesOk;
    });

    this.paginaAtual = 1;
    this.calcularPaginacao();
  }

  calcularPaginacao() {
    this.totalPaginas = Math.ceil(this.reposicoesFiltradas.length / this.itensPorPagina);
    this.paginas = Array.from({ length: this.totalPaginas }, (_, i) => i + 1);
  }

  reposicoesNaPagina(): Reposicao[] {
    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    return this.reposicoesFiltradas.slice(inicio, inicio + this.itensPorPagina);
  }

  irParaPagina(pagina: number) {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
    }
  }

  trackByIndex(index: number) {
    return index;
  }

  novaReposicao() {
    this.reposicaoSelecionada = this.criarObjetoReposicao();
    this.produtoFiltro = '';
    this.produtosFiltrados = [...this.produtos];

    // Se houver produtos, seleciona o primeiro por padrão
    if (this.produtosFiltrados.length > 0) {
      this.reposicaoSelecionada.produto = this.produtosFiltrados[0];
    }
  }

  editarReposicao(rep: Reposicao) {
    // Encontrar o objeto produto correspondente na lista de produtos
    const produtoSelecionado =
      this.produtos.find((p) => p.id === rep.produto.id) || this.criarObjetoReposicao().produto;

    // Definir reposicaoSelecionada
    this.reposicaoSelecionada = {
      ...rep,
      produto: produtoSelecionado,
    };

    // Converter datas para formato yyyy-MM-dd (input type="date")
    if (this.reposicaoSelecionada.dataEntrada.includes('/')) {
      const [d, m, a] = this.reposicaoSelecionada.dataEntrada.split('/');
      this.reposicaoSelecionada.dataEntrada = `${a}-${m}-${d}`;
    }

    if (this.reposicaoSelecionada.vencimento.includes('/')) {
      const [d, m, a] = this.reposicaoSelecionada.vencimento.split('/');
      this.reposicaoSelecionada.vencimento = `${a}-${m}-${d}`;
    }

    // Filtrar produtos para o select (mesmo que não vá mudar, para manter consistência)
    this.produtoFiltro = '';
    this.produtosFiltrados = [...this.produtos];
  }

  salvarReposicao() {
    if (!this.reposicaoSelecionada.id) {
      this.criarReposicao();
    } else {
      this.atualizarReposicao();
    }
  }

  criarReposicao() {
    this.reposicaoService.criar(this.reposicaoSelecionada).subscribe({
      next: (rep) => {
        this.notificacaoService.emitirSucesso('Reposição cadastrada com sucesso!');
        this.reposicoes.push(rep);
        this.filtrar();
      },
      error: () => this.notificacaoService.emitirErro('Erro ao cadastrar reposição.'),
    });
  }

  atualizarReposicao() {
    if (!this.reposicaoSelecionada.id) return;

    this.reposicaoService
      .atualizar(this.reposicaoSelecionada.id, this.reposicaoSelecionada)
      .subscribe({
        next: (rep) => {
          this.notificacaoService.emitirSucesso('Reposição atualizada com sucesso!');
          const idx = this.reposicoes.findIndex((r) => r.id === rep.id);
          if (idx !== -1) this.reposicoes[idx] = rep;
          this.filtrar();
        },
        error: () => this.notificacaoService.emitirErro('Erro ao atualizar reposição.'),
      });
  }

  confirmarExcluirReposicao() {
    if (!this.reposicaoSelecionada?.id) return;

    this.reposicaoService.deletar(this.reposicaoSelecionada.id).subscribe({
      next: () => {
        this.reposicoes = this.reposicoes.filter((r) => r.id !== this.reposicaoSelecionada.id);
        this.notificacaoService.emitirSucesso('Reposição removida!');
        this.filtrar();
      },
      error: () => this.notificacaoService.emitirErro('Erro ao excluir reposição.'),
    });
  }
}
