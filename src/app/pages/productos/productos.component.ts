import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePackage, LucidePlus, LucideRefreshCw, LucideShoppingCart } from '@lucide/angular';
import { finalize, timeout, TimeoutError } from 'rxjs';
import { CarritoService } from '../../services/carrito.service';
import { environment } from '../../../environments/environment';
import { NuevoProducto, Pedidos360ApiService, Producto } from '../../services/pedidos360-api.service';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    CurrencyPipe,
    LucidePackage,
    LucidePlus,
    LucideRefreshCw,
    LucideShoppingCart
  ],
  templateUrl: './productos.component.html',
  styleUrl: './productos.component.css'
})
export class ProductosComponent implements OnInit {
  productos: Producto[] = [];
  readonly kafkaEnabled = environment.kafkaEnabled;
  detalle?: Producto;
  cargando = false;
  error = '';
  mensaje = '';

  form = this.fb.nonNullable.group({
    nombre: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['Computacion', [Validators.required]],
    precio: [10000, [Validators.required, Validators.min(1)]],
    stock: [10, [Validators.required, Validators.min(0)]]
  });

  constructor(
    private readonly api: Pedidos360ApiService,
    private readonly carrito: CarritoService,
    private readonly fb: FormBuilder
  ) {}

  ngOnInit(): void {
    this.cargarProductos();
  }

  cargarProductos(): void {
    this.cargando = true;
    this.error = '';

    this.api.listarProductos().pipe(
      timeout(20000),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: (error: unknown) => {
        if (error instanceof TimeoutError) {
          this.error = 'El API Gateway no respondio en 20 segundos. Intenta actualizar nuevamente.';
        } else if (error instanceof HttpErrorResponse && error.status === 401) {
          this.error = 'La sesion expiro o el token fue rechazado (401). Cierra sesion e ingresa nuevamente.';
        } else if (error instanceof HttpErrorResponse && error.status === 403) {
          this.error = 'Tu cuenta no tiene permiso para consultar productos (403).';
        } else if (error instanceof HttpErrorResponse && error.status === 0) {
          this.error = 'No hay conexion con el API Gateway. Comprueba que los servicios esten encendidos.';
        } else {
          this.error = 'No fue posible cargar productos desde el API Gateway.';
        }
      }
    });
  }

  agregarAlCarrito(producto: Producto): void {
    this.carrito.agregar(producto);
    this.mensaje = `${producto.nombre} agregado al carrito.`;
  }

  verDetalle(producto: Producto): void {
    this.api.detalleProducto(producto.id).subscribe({
      next: (detalle) => {
        this.detalle = detalle;
        this.error = '';
      },
      error: () => this.error = 'No fue posible abrir el detalle del producto.'
    });
  }

  crearProducto(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const request: NuevoProducto = this.form.getRawValue();
    this.api.crearProducto(request).subscribe({
      next: () => {
        this.form.reset({
          nombre: '',
          categoria: 'Computacion',
          precio: 10000,
          stock: 10
        });
        this.mensaje = 'Producto creado correctamente.';
        this.cargarProductos();
      },
      error: () => {
        this.error = 'No se pudo crear el producto. Revisa si tu usuario tiene rol Pedidos.Admin.';
      }
    });
  }
}
