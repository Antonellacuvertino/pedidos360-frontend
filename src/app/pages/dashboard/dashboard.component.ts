import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, forkJoin, timeout } from 'rxjs';
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
  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly api: Pedidos360ApiService) {}

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';

    forkJoin({
      resumen: this.api.obtenerResumen(),
      productos: this.api.listarProductos(),
      clientes: this.api.listarClientes(),
      pedidos: this.api.listarPedidos()
    }).pipe(timeout(20000), finalize(() => this.cargando = false), takeUntilDestroyed(this.destroyRef)).subscribe({
      next: ({ resumen, productos, clientes, pedidos }) => {
        this.resumen = resumen;
        this.productos = productos;
        this.clientes = clientes;
        this.pedidos = pedidos;
      },
      error: () => {
        this.error = 'No pudimos actualizar el resumen. Intenta nuevamente.';
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
