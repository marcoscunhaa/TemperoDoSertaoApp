import { Component } from '@angular/core';
import { Footer } from "../footer/footer";
import { Estoque } from "../estoque/estoque";
import { ModalVender } from "../modal-vender/modal-vender";
import { ModalInserir } from "../modal-inserir/modal-inserir";
import { Vendas } from "../vendas/vendas";
import { Location } from '@angular/common';

@Component({
  standalone: true,
  selector: 'app-home',
  templateUrl: './home.html',
  styleUrls: ['./home.scss'],
  imports: [Footer, Estoque, ModalVender, ModalInserir, Vendas],
})
export class Home {

}
