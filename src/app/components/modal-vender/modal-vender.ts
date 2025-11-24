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
  vendas: Venda[] = [];

  total = 0;
  lucro = 0;
  loading = false;
  troco = 0;

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

    // Atualiza troco e lucro sempre que necessário
    this.formVenda.get('valorRecebido')?.valueChanges.subscribe(() => this.calcularTroco());
    this.formVenda.get('precisaTroco')?.valueChanges.subscribe(() => this.calcularTroco());
    this.formVenda.get('formaPagamento')?.valueChanges.subscribe(() => this.calcularTroco());
  }

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

  carregarProdutos() {
    this.loading = true;

    this.produtoService.listarTodos().subscribe({
      next: (lista: Produto[]) => {
        this.produtos = lista;
        this.produtosFiltrados = [...lista];
        this.produtosFormArray.clear();

        lista.forEach(p => {
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

        this.loading = false;
      },
      error: () => this.loading = false,
    });
  }

  filtrar(event: any) {
    const termo = event.target.value.toLowerCase();
    this.produtosFiltrados = this.produtos.filter(
      p => p.detalhe.toLowerCase().includes(termo) || p.marca.toLowerCase().includes(termo)
    );
  }

  atualizarTotal() {
    this.total = this.produtosFormArray.controls
      .filter(c => c.value.selecionado)
      .reduce((soma, c) => {
        const v = c.value;
        return soma + (v.vendaPorPeso ? v.valorPeso || 0 : v.precoVenda * v.quantidadeVenda);
      }, 0);

    this.lucro = this.calcularLucro();
    this.calcularTroco();
  }

  calcularLucro(): number {
    return this.produtosFormArray.controls
      .filter(c => c.value.selecionado)
      .reduce((lucroTotal, c) => {
        const p = c.value;

        const totalVenda = p.vendaPorPeso ? p.valorPeso : p.precoVenda * p.quantidadeVenda;
        const totalCompra = p.precoCompra * p.quantidadeVenda;

        return lucroTotal + (totalVenda - totalCompra);
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

  finalizarVenda() {
    const selecionados = this.produtosFormArray.controls
      .filter(c => c.value.selecionado)
      .map(c => c.value);

    if (selecionados.length === 0) {
      this.notificacaoService.emitirAviso('Selecione ao menos um produto.');
      return;
    }

    const produtoSemEstoque = selecionados.find(p => p.quantidadeEstoque === 0);
    if (produtoSemEstoque) {
      this.notificacaoService.emitirErro(`O produto "${produtoSemEstoque.detalhe}" está sem estoque!`);
      return;
    }

    // Validação para vendas por peso: valor mínimo = preço unitário * quantidade
    const produtoComValorInsuficiente = selecionados.find(p =>
      p.vendaPorPeso && (p.valorPeso < p.precoVenda * p.quantidadeVenda)
    );
    if (produtoComValorInsuficiente) {
      this.notificacaoService.emitirErro(
        `O valor informado para "${produtoComValorInsuficiente.detalhe}" é menor que o mínimo permitido!`
      );
      return;
    }

    if (this.formaPagamento === 'dinheiro' && this.precisaTroco && this.valorRecebido < this.total) {
      this.notificacaoService.emitirErro('O valor recebido é menor que o total!');
      return;
    }

    this.loading = true;

    const requests = selecionados.map(p => {
      const precoUnitario = p.vendaPorPeso ? (p.valorPeso / p.quantidadeVenda) : p.precoVenda;
      const quantidade = p.quantidadeVenda;

      const venda: Venda = {
        dataVenda: new Date().toISOString().split('T')[0],
        categoria: p.categoria,
        produto: p.detalhe,
        marca: p.marca,
        precoCompra: p.precoCompra,
        precoVenda: precoUnitario,
        formaPagamento: this.formaPagamento,
        quantidadeVendida: quantidade,
      };
      return this.vendaService.criarVenda(venda);
    });

    forkJoin(requests).subscribe({
      next: () => {
        this.notificacaoService.emitirSucesso('Venda registrada com sucesso!');
        this.carregarProdutos();
        this.carregarVendas();
        this.atualizarTotal();

        this.produtosFormArray.controls.forEach(c =>
          c.patchValue({
            selecionado: false,
            quantidadeVenda: 1,
            vendaPorPeso: false,
            valorPeso: 0,
          })
        );

        this.formVenda.patchValue({ precisaTroco: false, valorRecebido: 0 });
        this.troco = 0;
        this.lucro = 0;
      },
      error: () => this.notificacaoService.emitirErro('Venda não foi realizada!'),
      complete: () => (this.loading = false),
    });
  }

  carregarVendas() {
    this.vendaService.listarVendas().subscribe({
      next: lista => (this.vendas = lista),
      error: err => console.error(err),
    });
  }
}
