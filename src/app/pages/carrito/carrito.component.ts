import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import {
  LucideMinus,
  LucidePlus,
  LucidePrinter,
  LucideShoppingCart,
  LucideTrash2
} from '@lucide/angular';
import { CarritoService, ComprobantePedido, ItemCarrito } from '../../services/carrito.service';
import { Cliente, NuevoPedido, Pedidos360ApiService } from '../../services/pedidos360-api.service';
import { ProductImageComponent } from '../../shared/product-image.component';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    ProductImageComponent,
    RouterLink,
    LucideMinus,
    LucidePlus,
    LucidePrinter,
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
  bloqueo: { hasta: Date | null } | null = null;
  mensaje = '';
  enviando = false;
  comprobante: ComprobantePedido | null = null;
  private readonly destroyRef = inject(DestroyRef);

  form = this.fb.nonNullable.group({
    clienteId: [0, [Validators.required, Validators.min(1)]],
    tarjetaPrueba: ['', [Validators.required, Validators.pattern(/^0000 ?0000 ?0000 ?000[1-9]$/)]]
  });

  constructor(
    private readonly carrito: CarritoService,
    private readonly api: Pedidos360ApiService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.comprobante = this.carrito.ultimoComprobante();

    this.carrito.items$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((items) => {
      this.items = items;
    });

    this.api.listarClientes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
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
    if (this.enviando || this.items.length === 0 || this.form.invalid) {
      return;
    }

    const { clienteId, tarjetaPrueba } = this.form.getRawValue();
    const cliente = this.clientes.find((actual) => actual.id === clienteId);
    if (!cliente) {
      this.error = 'Selecciona un cliente antes de confirmar.';
      return;
    }

    const itemsConfirmados = this.items.map((item) => ({
      productoId: item.producto.id,
      producto: item.producto.nombre,
      cantidad: item.cantidad,
      precioUnitario: item.producto.precio
    }));
    const requests: NuevoPedido[] = this.items.map((item) => ({
      clienteId,
      productoId: item.producto.id,
      cantidad: item.cantidad,
      total: item.producto.precio * item.cantidad,
      estado: 'RECIBIDO',
      email: cliente.email
    }));

    this.enviando = true;
    this.error = '';
    this.bloqueo = null;
    this.mensaje = '';
    this.comprobante = null;

    this.api.crearCompra(requests, tarjetaPrueba.replace(/ /g, '')).subscribe({
      next: (respuestas) => {
        this.comprobante = {
          fecha: new Date().toISOString(),
          cliente: cliente.nombre,
          lineas: itemsConfirmados.map((item, index) => ({
            ...item,
            eventoId: respuestas[index].eventoId
          })),
          total: itemsConfirmados.reduce((total, item) => total + item.precioUnitario * item.cantidad, 0)
        };
        this.carrito.guardarComprobante(this.comprobante);
        this.carrito.limpiar();
        this.form.controls.tarjetaPrueba.reset();
        this.mensaje = 'Pago de prueba aprobado. Tu pedido fue recibido.';
        this.enviando = false;
      },
      error: (error: HttpErrorResponse) => {
        if (error.status === 429) {
          const retryAt = error.error?.bloqueadoHasta;
          const hasta = typeof retryAt === 'string' ? new Date(retryAt) : null;
          this.bloqueo = { hasta: hasta && Number.isFinite(hasta.getTime()) ? hasta : null };
        } else {
          this.error = error.status === 402
            ? 'La tarjeta de prueba fue rechazada. Puedes reintentar; tus productos siguen en el carrito.'
            : 'No pudimos confirmar el pago. Revisa tus pedidos antes de reintentar.';
        }
        this.enviando = false;
      }
    });
  }

  imprimirComprobante(): void {
    window.print();
  }
}
