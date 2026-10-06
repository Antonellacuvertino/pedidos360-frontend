import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import {
  LucideMinus,
  LucidePlus,
  LucidePrinter,
  LucideShoppingCart,
  LucideTrash2
} from '@lucide/angular';
import { CarritoService, ItemCarrito } from '../../services/carrito.service';
import { Cliente, NuevoPedido, Pedidos360ApiService } from '../../services/pedidos360-api.service';

interface LineaComprobante {
  producto: string;
  cantidad: number;
  precioUnitario: number;
  eventoId: string;
}

interface ComprobantePedido {
  fecha: string;
  cliente: string;
  lineas: LineaComprobante[];
  total: number;
}

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
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
  mensaje = '';
  enviando = false;
  comprobante: ComprobantePedido | null = null;
  private readonly comprobanteKey = 'pedidos360_ultimo_comprobante';

  form = this.fb.nonNullable.group({
    clienteId: [1, [Validators.required, Validators.min(1)]]
  });

  constructor(
    private readonly carrito: CarritoService,
    private readonly api: Pedidos360ApiService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    const guardado = sessionStorage.getItem(this.comprobanteKey);
    if (guardado) {
      try {
        this.comprobante = JSON.parse(guardado) as ComprobantePedido;
      } catch {
        sessionStorage.removeItem(this.comprobanteKey);
      }
    }

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
    const cliente = this.clientes.find((actual) => actual.id === clienteId);
    if (!cliente) {
      this.error = 'Selecciona un cliente antes de confirmar.';
      return;
    }

    const itemsConfirmados = this.items.map((item) => ({
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
    this.mensaje = '';

    forkJoin(requests.map((request) => this.api.crearPedido(request))).subscribe({
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
        sessionStorage.setItem(this.comprobanteKey, JSON.stringify(this.comprobante));
        this.carrito.limpiar();
        this.mensaje = 'Pedido aceptado. El procesamiento de la orden, el stock y la notificacion es asincrono.';
        this.enviando = false;
      },
      error: () => {
        this.error = 'No se confirmaron todos los productos. Revisa Pedidos recientes antes de reintentar: alguna solicitud pudo haberse aceptado.';
        this.enviando = false;
      }
    });
  }

  imprimirComprobante(): void {
    window.print();
  }
}
