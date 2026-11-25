import { CommonModule } from '@angular/common';
import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { LucideRefreshCw } from '@lucide/angular';
import { catchError, finalize, forkJoin, of, timeout } from 'rxjs';
import { CarritoService } from '../../services/carrito.service';
import { AnalyticsMetrics, Pedidos360ApiService, Producto } from '../../services/pedidos360-api.service';
import { ProductImageComponent } from '../../shared/product-image.component';

@Component({
  selector: 'app-streaming',
  standalone: true,
  imports: [CommonModule, ProductImageComponent, RouterLink, LucideRefreshCw],
  templateUrl: './streaming.component.html',
  styleUrl: './streaming.component.css'
})
export class StreamingComponent implements OnInit {
  metrics: AnalyticsMetrics | null = null;
  sugeridos: Producto[] = [];
  productoBase?: Producto;
  desdePedido = false;
  desdeVista = false;
  loading = false;
  error = '';
  recomendacionesNoDisponibles = false;
  private readonly destroyRef = inject(DestroyRef);

  constructor(private readonly api: Pedidos360ApiService, private readonly carrito: CarritoService) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    if (this.loading) return;
    this.loading = true;
    this.error = '';
    forkJoin({
      metrics: this.api.metricasAnalytics().pipe(timeout(10000), catchError(() => of(null))),
      suggestions: this.api.recomendaciones().pipe(timeout(10000), catchError(() => of(null))),
      products: this.api.listarProductos().pipe(timeout(10000), catchError(() => of(null)))
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
      finalize(() => this.loading = false)
    ).subscribe(({ metrics, suggestions, products }) => {
      this.metrics = metrics;
      if (!metrics) this.error = 'No pudimos actualizar la actividad.';
      this.recomendacionesNoDisponibles = suggestions === null || products === null;
      const catalog = new Map(products?.map(product => [product.id, product]));
      const currentCart = this.carrito.obtenerItems().map(item => item.producto.id);
      const lastOrder = this.carrito.ultimoComprobante()?.lineas ?? [];
      const fromOrder = suggestions?.productoBaseId != null &&
        lastOrder.some(item => item.productoId === suggestions.productoBaseId);
      const excluded = new Set([...currentCart, ...(fromOrder ? lastOrder.map(item => item.productoId) : [])]);
      this.productoBase = catalog.get(suggestions?.productoBaseId ?? 0);
      this.desdePedido = fromOrder && !currentCart.includes(this.productoBase?.id ?? 0);
      this.desdeVista = suggestions?.accionBase === 'VISTA';
      this.sugeridos = (suggestions?.productoIds ?? []).map(id => catalog.get(id))
        .filter((p): p is Producto => !!p && p.stock > 0 && !excluded.has(p.id)).slice(0, 3);
    });
  }
}
