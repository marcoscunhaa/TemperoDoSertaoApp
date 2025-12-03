import { ReposicaoComponent } from './../reposicao/reposicao';

import { Component, HostListener } from '@angular/core';
import { Footer } from '../footer/footer';
import { Estoque } from '../estoque/estoque';
import { ModalVender } from '../modal-vender/modal-vender';
import { ModalInserir } from '../modal-inserir/modal-inserir';
import { Vendas } from '../vendas/vendas';
import { CommonModule } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [ReposicaoComponent, Footer, Estoque, ModalVender, ModalInserir, Vendas, CommonModule],
})
export class Home {
   mostrarBotaoTopo = false;

  // Atualiza a variável quando o usuário rola a página
  @HostListener('window:scroll', [])
  onWindowScroll() {
    const scrollY = window.scrollY || window.pageYOffset;
    this.mostrarBotaoTopo = scrollY > 200; // aparece após 200px de scroll
  }

  irParaTopo() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}
