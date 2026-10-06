import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';
import {
  LucideLayoutDashboard,
  LucideLogOut,
  LucidePackage,
  LucideShoppingCart,
  LucideUsers
} from '@lucide/angular';
import { CarritoService } from '../../services/carrito.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LucideLayoutDashboard,
    LucideLogOut,
    LucidePackage,
    LucideShoppingCart,
    LucideUsers
  ],
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.css'
})
export class ShellComponent {
  readonly items$ = this.carrito.items$;

  constructor(
    private readonly msalService: MsalService,
    private readonly carrito: CarritoService
  ) {}

  get usuario(): string {
    const account = this.msalService.instance.getActiveAccount() ?? this.msalService.instance.getAllAccounts()[0];
    return account?.name ?? account?.username ?? 'Usuario autenticado';
  }

  salir(): void {
    this.carrito.limpiar();
    sessionStorage.removeItem('pedidos360_ultimo_comprobante');
    this.msalService.logoutRedirect();
  }
}
