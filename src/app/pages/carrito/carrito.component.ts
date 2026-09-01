import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  LucideMinus,
  LucidePlus,
  LucideShoppingCart,
  LucideTrash2
} from '@lucide/angular';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { Cliente, NuevoPedido, Pedidos360ApiService } from '../../services/pedidos360-api.service';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    LucideMinus,
    LucidePlus,
    LucideShoppingCart,
    LucideTrash2
  ],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent implements OnInit {
  items: ItemCarrito[] = [];
  clientes: Cliente[] = [];
  error = '';
  mensaje = '';
  enviando = false;

  form = this.fb.nonNullable.group({
    clienteId: [1, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private readonly carrito: CarritoService,
    private readonly api: Pedidos360ApiService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.carrito.items$.subscribe((items) => {
      this.items = items;
    });

    this.api.listarClientes().subscribe({
      next: (clientes) => {
        this.clientes = clientes;
        if (clientes[0]) {
          this.form.controls.clienteId.setValue(clientes[0].id);
        }
      },
      error: () => {
        this.error = 'No fue posible cargar clientes para completar el pedido.';
      }
    });
  }

  aumentar(item: ItemCarrito): void {
    this.carrito.cambiarCantidad(item.producto.id, item.cantidad + 1);
  }

  disminuir(item: ItemCarrito): void {
    this.carrito.cambiarCantidad(item.producto.id, item.cantidad - 1);
  }

  quitar(item: ItemCarrito): void {
    this.carrito.quitar(item.producto.id);
  }

  total(): number {
    return this.carrito.total();
  }

  confirmarPedido(): void {
    if (this.items.length === 0 || this.form.invalid) {
      return;
    }

    const clienteId = this.form.getRawValue().clienteId;
    const requests: NuevoPedido[] = this.items.map((item) => ({
      clienteId,
      productoId: item.producto.id,
      cantidad: item.cantidad,
      total: item.producto.precio * item.cantidad,
      estado: 'RECIBIDO'
    }));

    this.enviando = true;
    this.error = '';
    this.mensaje = '';

    forkJoin(requests.map((request) => this.api.crearPedido(request))).subscribe({
      next: () => {
        this.carrito.limpiar();
        this.mensaje = 'Pedido confirmado correctamente.';
        this.enviando = false;
      },
      error: () => {
        this.error = 'El pedido no se pudo confirmar. Revisa token, rol y API Gateway.';
        this.enviando = false;
      }
    });
  }
}
