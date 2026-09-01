import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { forkJoin } from 'rxjs';
import {
  LucideLayoutDashboard,
  LucidePackage,
  LucideRefreshCw,
  LucideShoppingCart,
  LucideUsers
} from '@lucide/angular';
import {
  Cliente,
  Pedido,
  Pedidos360ApiService,
  Producto,
  Resumen
} from '../../services/pedidos360-api.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    CurrencyPipe,
    LucideLayoutDashboard,
    LucidePackage,
    LucideRefreshCw,
    LucideShoppingCart,
    LucideUsers
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
  resumen?: Resumen;
  productos: Producto[] = [];
  clientes: Cliente[] = [];
  pedidos: Pedido[] = [];
  cargando = false;
  error = '';

  constructor(private readonly api: Pedidos360ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    this.cargando = true;
    this.error = '';

    forkJoin({
      resumen: this.api.obtenerResumen(),
      productos: this.api.listarProductos(),
      clientes: this.api.listarClientes(),
      pedidos: this.api.listarPedidos()
    }).subscribe({
      next: ({ resumen, productos, clientes, pedidos }) => {
        this.resumen = resumen;
        this.productos = productos;
        this.clientes = clientes;
        this.pedidos = pedidos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No fue posible cargar datos. Revisa el token, API Gateway o los servicios backend.';
        this.cargando = false;
      }
    });
  }

  obtenerProducto(productoId: number): string {
    return this.productos.find((producto) => producto.id === productoId)?.nombre ?? `Producto ${productoId}`;
  }

  obtenerCliente(clienteId: number): string {
    return this.clientes.find((cliente) => cliente.id === clienteId)?.nombre ?? `Cliente ${clienteId}`;
  }
}
