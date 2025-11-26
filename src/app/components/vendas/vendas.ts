import { Component, OnInit } from '@angular/core';
import { Venda, ResumoVendasDTO, VendaService } from '../../services/venda';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificacaoService, Notificacao } from '../../services/notificacao';
import { GraficosComponent } from '../graficos/graficos';

@Component({
  selector: 'app-vendas',
  standalone: true,
  imports: [CommonModule, FormsModule, GraficosComponent],
  templateUrl: './vendas.html',
  styleUrls: ['./vendas.scss'],
})
export class Vendas implements OnInit {
  vendas: Venda[] = [];
  vendasFiltradas: Venda[] = [];
  resumo: ResumoVendasDTO = {
    totalVendido: 0,
    totalComprado: 0,
    lucroBruto: 0,
    margemLucro: 0,
  };

  categorias: string[] = ['todas', 'carnes', 'temperos', 'bebidas', 'frios', 'doces'];
  categoriaSelecionada: string = 'todas';

  anos: number[] = [];
  anoSelecionado: number | 'todos' = 'todos';

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

  dataAtualizacao: string = '';

  alertaMensagem: string | null = null;
  tipoAlerta: 'success' | 'danger' | 'warning' | 'info' = 'success';

  constructor(
    private vendaService: VendaService,
    private notificacaoService: NotificacaoService
  ) {}

  ngOnInit() {
    this.setDataAtualizacao();
    this.anos = Array.from({ length: 11 }, (_, i) => 2025 + i);

    this.carregarResumo();
    this.carregarVendas();

    this.notificacaoService.notificacao$.subscribe((notif: Notificacao) => {
      this.alertaMensagem = notif.mensagem;
      this.tipoAlerta = notif.tipo;

      // Carrega vendas e só rola para o topo depois da lista atualizada
      this.vendaService.listarVendas().subscribe((lista) => {
        this.vendas = lista;
        this.filtrarVendas();
      });
      this.vendaService.getResumo().subscribe((res) => {
        this.resumo = res;
      });
    });
  }

  setDataAtualizacao() {
    const hoje = new Date();
    const opcoes: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
    this.dataAtualizacao = hoje.toLocaleDateString('pt-BR', opcoes).toUpperCase();
  }

  carregarVendas() {
    this.vendaService.listarVendas().subscribe({
      next: (lista) => {
        this.vendas = lista;
        this.filtrarVendas();
      },
    });
  }

  carregarResumo() {
    this.vendaService.getResumo().subscribe({
      next: (res) => (this.resumo = res),
      error: (err) => console.error('Erro ao carregar resumo:', err),
    });
  }

  filtrarVendas() {
    this.vendasFiltradas = this.vendas.filter((venda) => {
      const { ano, mes } = parseLocalDate(venda.dataVenda);

      const categoriaOk =
        this.categoriaSelecionada === 'todas' ||
        venda.categoria.toLowerCase() === this.categoriaSelecionada.toLowerCase();

      const anoOk = this.anoSelecionado === 'todos' || ano === this.anoSelecionado;

      const mesOk = this.mesSelecionado === 'todos' || mes === this.mesSelecionado;

      return categoriaOk && anoOk && mesOk;
    });
  }

  formatarMoeda(valor: number): string {
    return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  }

  formatarLucro(venda: Venda): string {
    const compra = venda.precoCompra ?? 0;
    const vendaValor = venda.precoVenda ?? 0;
    const quantidade = venda.quantidadeVendida ?? 1;
    const lucro = (vendaValor - compra) * quantidade;
    return this.formatarMoeda(lucro);
  }

  finalizarVenda(novaVenda: Venda) {
    this.vendaService.criarVenda(novaVenda).subscribe({
      next: (vendaSalva) => {
        this.vendas.push(vendaSalva);
        this.filtrarVendas();
        this.carregarResumo();
      },
      error: (err) => console.error('Erro ao finalizar venda:', err),
    });
  }
}

function parseLocalDate(dataVenda: string): { ano: number; mes: number; dia: number } {
  if (!dataVenda || dataVenda.trim().length < 8) {
    return { ano: 0, mes: 0, dia: 0 };
  }

  dataVenda = dataVenda.trim();

  if (dataVenda.includes('T')) {
    const d = new Date(dataVenda);
    return {
      ano: d.getFullYear(),
      mes: d.getMonth(),
      dia: d.getDate(),
    };
  }

  if (dataVenda.includes('/')) {
    const [diaStr, mesStr, anoStr] = dataVenda.split('/').map((p) => p.trim());
    return {
      ano: Number(anoStr),
      mes: Number(mesStr) - 1,
      dia: Number(diaStr),
    };
  }

  const [anoStr, mesStr, diaStr] = dataVenda.split('-').map((p) => p.trim());
  return {
    ano: Number(anoStr),
    mes: Number(mesStr) - 1,
    dia: Number(diaStr),
  };
}
