import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Producto } from './pedidos360-api.service';

export interface ItemCarrito {
  producto: Producto;
  cantidad: number;
}

@Injectable({ providedIn: 'root' })
export class CarritoService {
  private readonly storageKey = 'pedidos360_carrito';
  private readonly itemsSubject = new BehaviorSubject<ItemCarrito[]>(this.leerStorage());
  readonly items$ = this.itemsSubject.asObservable();

  obtenerItems(): ItemCarrito[] {
    return this.itemsSubject.value;
  }

  agregar(producto: Producto, cantidad = 1): void {
    const items = [...this.itemsSubject.value];
    const actual = items.find((item) => item.producto.id === producto.id);

    if (actual) {
      actual.cantidad += cantidad;
    } else {
      items.push({ producto, cantidad });
    }

    this.guardar(items);
  }

  cambiarCantidad(productoId: number, cantidad: number): void {
    const items = this.itemsSubject.value
      .map((item) => item.producto.id === productoId ? { ...item, cantidad } : item)
      .filter((item) => item.cantidad > 0);
    this.guardar(items);
  }

  quitar(productoId: number): void {
    this.guardar(this.itemsSubject.value.filter((item) => item.producto.id !== productoId));
  }

  limpiar(): void {
    this.guardar([]);
  }

  total(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.producto.precio * item.cantidad, 0);
  }

  cantidadTotal(): number {
    return this.itemsSubject.value.reduce((total, item) => total + item.cantidad, 0);
  }

  private guardar(items: ItemCarrito[]): void {
    this.itemsSubject.next(items);
    localStorage.setItem(this.storageKey, JSON.stringify(items));
  }

  private leerStorage(): ItemCarrito[] {
    const raw = localStorage.getItem(this.storageKey);
    if (!raw) {
      return [];
    }

    try {
      return JSON.parse(raw) as ItemCarrito[];
    } catch {
      localStorage.removeItem(this.storageKey);
      return [];
    }
  }
}
