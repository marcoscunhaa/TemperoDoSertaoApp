import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NotificacaoService } from '../../services/notificacao';
import { Produto, ProdutoService } from '../../services/produto';
import { Venda, VendaService } from '../../services/venda';
import { forkJoin } from 'rxjs';

@Component({
  standalone: true,
  selector: 'app-modal-vender',
  templateUrl: './modal-vender.html',
  styleUrls: ['./modal-vender.scss'],
  imports: [CommonModule, ReactiveFormsModule],
})
export class ModalVender {
  produtos: Produto[] = [];
  produtosFiltrados: Produto[] = [];

  // 🔥 paginação
  // Paginação
  paginaAtual = 1;
  itensPorPagina = 5;
  paginaAtualProdutos: Produto[] = [];
  totalPaginas = 1;

  vendas: Venda[] = [];

  total = 0;
  lucro = 0;
  troco = 0;
  loading = false;

  formVenda!: FormGroup;

  constructor(
    private produtoService: ProdutoService,
    private vendaService: VendaService,
    private notificacaoService: NotificacaoService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.formVenda = this.fb.group({
      formaPagamento: ['dinheiro', Validators.required],
      produtos: this.fb.array<FormGroup>([]),
      precisaTroco: [false],
      valorRecebido: [0, [Validators.min(0)]],
    });

    this.carregarProdutos();

    this.formVenda.get('valorRecebido')?.valueChanges.subscribe(() => this.calcularTroco());
    this.formVenda.get('precisaTroco')?.valueChanges.subscribe(() => this.calcularTroco());
    this.formVenda.get('formaPagamento')?.valueChanges.subscribe(() => this.calcularTroco());
  }

  // GETTERS ================================

  get produtosFormArray(): FormArray<FormGroup> {
    return this.formVenda.get('produtos') as FormArray<FormGroup>;
  }

  get formaPagamento() {
    return this.formVenda.get('formaPagamento')?.value;
  }

  get precisaTroco() {
    return this.formVenda.get('precisaTroco')?.value;
  }

  get valorRecebido() {
    return this.formVenda.get('valorRecebido')?.value;
  }

  // Itens selecionados para exibir no subtotal
  get itensSelecionados() {
    return this.produtosFormArray.controls
      .filter((c) => c.value.selecionado)
      .map((c) => c.value);
  }

  // Recupera um FormGroup pelo ID do produto
  getFormGroupById(id: number | undefined): FormGroup {
    return this.produtosFormArray.controls.find((c) => c.value.id === id)!;
  }

  // PAGINAÇÃO ================================

  atualizarPaginacao() {
    this.totalPaginas = Math.ceil(this.produtosFiltrados.length / this.itensPorPagina);
    if (this.paginaAtual > this.totalPaginas) {
      this.paginaAtual = this.totalPaginas || 1;
    }

    const inicio = (this.paginaAtual - 1) * this.itensPorPagina;
    const fim = inicio + this.itensPorPagina;

    this.paginaAtualProdutos = this.produtosFiltrados.slice(inicio, fim);
  }

  paginaAnterior() {
    if (this.paginaAtual > 1) {
      this.paginaAtual--;
      this.atualizarPaginacao();
    }
  }

  proximaPagina() {
    if (this.paginaAtual < this.totalPaginas) {
      this.paginaAtual++;
      this.atualizarPaginacao();
    }
  }

  trackById(index: number, item: Produto) {
    return item.id;
  }

  // CARREGAR PRODUTOS ================================

  carregarProdutos() {
    this.loading = true;

    this.produtoService.listarTodos().subscribe({
      next: (lista: Produto[]) => {
        this.produtos = lista;
        this.produtosFiltrados = [...lista];
        this.produtosFormArray.clear();

        lista.forEach((p) => {
          this.produtosFormArray.push(
            this.fb.group({
              id: [p.id],
              detalhe: [p.detalhe],
              marca: [p.marca],
              categoria: [p.categoria],
              precoCompra: [p.precoCompra],
              precoVenda: [p.precoVenda],
              quantidadeEstoque: [p.quantidadeEstoque],
              selecionado: [false],
              vendaPorPeso: [false],
              valorPeso: [0],
              quantidadeVenda: [1, [Validators.required, Validators.min(1)]],
            })
          );
        });

        this.atualizarPaginacao();
        this.loading = false;
      },

      error: () => (this.loading = false),
    });
  }

  filtrar(event: any) {
    const termo = event.target.value.toLowerCase().trim();

    this.produtosFiltrados = this.produtos.filter(
      (p) =>
        p.detalhe.toLowerCase().includes(termo) ||
        p.marca.toLowerCase().includes(termo)
    );

    this.paginaAtual = 1;
    this.atualizarPaginacao();
  }

  // CÁLCULOS ================================

  atualizarTotal() {
    this.total = this.produtosFormArray.controls
      .filter((c) => c.value.selecionado)
      .reduce((soma, c) => {
        const p = c.value;
        const subtotal = p.vendaPorPeso ? (p.valorPeso || 0) : p.precoVenda * p.quantidadeVenda;
        return soma + subtotal;
      }, 0);

    this.lucro = this.calcularLucro();
    this.calcularTroco();
  }

  calcularLucro(): number {
    return this.produtosFormArray.controls
      .filter((c) => c.value.selecionado)
      .reduce((lucro, c) => {
        const p = c.value;

        const totalVenda = p.vendaPorPeso ? p.valorPeso : p.precoVenda * p.quantidadeVenda;
        const totalCompra = p.precoCompra * p.quantidadeVenda;

        return lucro + (totalVenda - totalCompra);
      }, 0);
  }

  calcularTroco() {
    if (this.formaPagamento !== 'dinheiro' || !this.precisaTroco) {
      this.troco = 0;
      return;
    }

    const recebido = Number(this.valorRecebido || 0);

    this.troco = recebido - this.total;

    if (this.troco < 0) this.troco = 0;
  }

  // FINALIZAR VENDA ================================

  finalizarVenda() {
    const selecionados = this.produtosFormArray.controls
      .filter((c) => c.value.selecionado)
      .map((c) => c.value);

    if (selecionados.length === 0) {
      this.notificacaoService.emitirAviso('Selecione ao menos um produto.');
      return;
    }

    const semEstoque = selecionados.find((p) => p.quantidadeEstoque === 0);
    if (semEstoque) {
      this.notificacaoService.emitirErro(
        `O produto "${semEstoque.detalhe}" está sem estoque!`
      );
      return;
    }

    const insuficiente = selecionados.find(
      (p) => p.vendaPorPeso && p.valorPeso < p.precoVenda * p.quantidadeVenda
    );
/*
    if (insuficiente) {
      this.notificacaoService.emitirErro(
        `O valor informado para "${insuficiente.detalhe}" é menor que o mínimo permitido!`
      );
      return;
    }

    if (
      this.formaPagamento === 'dinheiro' &&
      this.precisaTroco &&
      this.valorRecebido < this.total
    ) {
      this.notificacaoService.emitirErro('O valor recebido é menor que o total!')
      return;
    }
    */

    this.loading = true;

    const requests = selecionados.map((p) => {
      const precoUnitario = p.vendaPorPeso
        ? p.valorPeso / p.quantidadeVenda
        : p.precoVenda;

      const venda: Venda = {
        dataVenda: new Date().toISOString().split('T')[0],
        categoria: p.categoria,
        produto: p.detalhe,
        marca: p.marca,
        precoCompra: p.precoCompra,
        precoVenda: precoUnitario,
        formaPagamento: this.formaPagamento,
        quantidadeVendida: p.quantidadeVenda,
      };

      return this.vendaService.criarVenda(venda);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.notificacaoService.emitirSucesso('Venda registrada com sucesso!');

        this.carregarProdutos();
        this.carregarVendas();
        this.atualizarTotal();

        // Resetar formulário
        this.produtosFormArray.controls.forEach((c) =>
          c.patchValue({
            selecionado: false,
            quantidadeVenda: 1,
            vendaPorPeso: false,
            valorPeso: 0,
          })
        );

        this.formVenda.patchValue({
          precisaTroco: false,
          valorRecebido: 0,
        });

        this.troco = 0;
        this.lucro = 0;
      },

      error: () => {
        this.notificacaoService.emitirErro('Venda não foi realizada!');
      },

      complete: () => (this.loading = false),
    });
  }

  carregarVendas() {
    this.vendaService.listarVendas().subscribe({
      next: (lista) => (this.vendas = lista),
      error: (err) => console.error(err),
    });
  }
}
