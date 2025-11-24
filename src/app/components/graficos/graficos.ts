import { Component, OnInit } from '@angular/core';
import { Chart } from 'chart.js/auto';
import { VendaService } from '../../services/venda';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-graficos',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './graficos.html',
})
export class GraficosComponent implements OnInit {

  vendas: any[] = [];
  grafico!: Chart;

  anos: number[] = [];
  anoSelecionado = new Date().getFullYear();

  constructor(private vendaService: VendaService) {
    for (let a = 2025; a <= 2035; a++) this.anos.push(a);
  }

  ngOnInit() {
    this.vendaService.listarVendas().subscribe(vendas => {
      this.vendas = vendas;
      this.criarGrafico();
    });
  }

  atualizarGrafico() {
    if (this.grafico) this.grafico.destroy();
    this.criarGrafico();
  }

  criarGrafico() {
    const totalVendido = Array(12).fill(0);
    const totalComprado = Array(12).fill(0);
    const totalLucro = Array(12).fill(0);

    this.vendas.forEach(v => {
      const data = new Date(v.dataVenda);
      const ano = data.getFullYear();
      const mes = data.getMonth();

      if (ano === this.anoSelecionado) {
        const vendido = v.precoVenda * v.quantidadeVendida;
        const comprado = v.precoCompra * v.quantidadeVendida;
        const lucro = vendido - comprado;

        totalVendido[mes] += vendido;
        totalComprado[mes] += comprado;
        totalLucro[mes] += lucro;
      }
    });

    this.grafico = new Chart("graficoVendas", {
      type: 'bar',
      data: {
        labels: [
          "Jan","Fev","Mar","Abr","Mai","Jun",
          "Jul","Ago","Set","Out","Nov","Dez"
        ],
        datasets: [
          {
            label: "Vendido (R$)",
            data: totalVendido,
            backgroundColor: "#0d0887", // Plasma roxo profundo
            borderRadius: 8,
          },
          {
            label: "Investido (R$)",
            data: totalComprado,
            backgroundColor: "#cc4678", // Plasma magenta
            borderRadius: 8,
          },
          {
            label: "Lucro (R$)",
            data: totalLucro,
            backgroundColor: "#f0f921", // Plasma amarelo neon
            borderRadius: 8,
          }
        ]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: "top",
            labels: {
              font: { size: 14, weight: 'bold' }
            }
          },
          tooltip: {
            callbacks: {
              label: (ctx) => {
                const valor = (ctx.parsed.y ?? 0);
                return `${ctx.dataset.label}: R$ ${valor
                  .toFixed(2)
                  .replace('.', ',')}`;
              }
            }
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              callback: value => "R$ " + value
            }
          }
        }
      }
    });
  }
}
