import { CommonModule, CurrencyPipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePlus, LucideRefreshCw, LucideShoppingCart } from '@lucide/angular';
import { ProductImageComponent } from '../../shared/product-image.component';
import { catchError, EMPTY, exhaustMap, filter, finalize, retry, Subject, switchMap, take, throwError, timer, timeout, TimeoutError } from 'rxjs';
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
    ProductImageComponent,
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
  productoBase?: Producto;
  private idsSugeridos: number[] = [];
  private readonly seleccion = new Subject<Producto>();
  private readonly destroyRef = inject(DestroyRef);
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
    if (this.kafkaEnabled) {
      this.seleccion.pipe(
        switchMap(producto => timer(400, 1000).pipe(
          take(12),
          exhaustMap(() => this.api.recomendaciones(true).pipe(timeout(5500), catchError(() => EMPTY))),
          filter(result => result.productoBaseId === producto.id && this.productoBase === producto),
          take(1)
        )),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(resultado => {
        this.idsSugeridos = resultado.productoIds;
      });
    }
  }

  get sugeridos(): Producto[] {
    if (!this.productoBase) return [];
    const carritoIds = new Set(this.carrito.obtenerItems().map(item => item.producto.id));
    return this.idsSugeridos
      .map(id => this.productos.find(producto => producto.id === id))
      .filter((p): p is Producto => !!p && p.stock > 0 && !carritoIds.has(p.id))
      .slice(0, 3);
  }

  cargarProductos(): void {
    if (this.cargando) return;
    this.cargando = true;
    this.error = '';

    this.api.listarProductos().pipe(
      timeout(10000),
      retry({ count: 1, delay: (error: unknown) => {
        const transient = error instanceof TimeoutError || (error instanceof HttpErrorResponse &&
          (error.status === 0 || error.status >= 500));
        return transient ? timer(500) : throwError(() => error);
      }}),
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.cargando = false)
    ).subscribe({
      next: (productos) => {
        this.productos = productos;
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          this.error = 'Vuelve a iniciar sesión para ver los productos.';
        } else if (error instanceof HttpErrorResponse && error.status === 403) {
          this.error = 'Tu cuenta no tiene permiso para consultar productos.';
        } else {
          this.error = 'No pudimos mostrar los productos. Intenta nuevamente.';
        }
      }
    });
  }

  agregarAlCarrito(producto: Producto): void {
    this.carrito.agregar(producto);
    this.mensaje = `${producto.nombre} agregado al carrito.`;
    if (this.kafkaEnabled) {
      this.productoBase = producto;
      this.idsSugeridos = [];
      this.api.registrarCarrito(producto.id).pipe(
        timeout(8000),
        catchError(() => EMPTY),
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(() => {
        if (this.productoBase === producto) this.seleccion.next(producto);
      });
    }
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
