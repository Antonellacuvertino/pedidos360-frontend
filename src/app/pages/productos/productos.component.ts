import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucidePackage, LucidePlus, LucideRefreshCw, LucideShoppingCart } from '@lucide/angular';
import { CarritoService } from '../../services/carrito.service';
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

    this.api.listarProductos().subscribe({
      next: (productos) => {
        this.productos = productos;
        this.cargando = false;
      },
      error: () => {
        this.error = 'No fue posible cargar productos desde el API Gateway.';
        this.cargando = false;
      }
    });
  }

  agregarAlCarrito(producto: Producto): void {
    this.carrito.agregar(producto);
    this.mensaje = `${producto.nombre} agregado al carrito.`;
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
