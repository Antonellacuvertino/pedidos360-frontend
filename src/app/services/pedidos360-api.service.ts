import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Producto {
  id: number;
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}

export interface Cliente {
  id: number;
  nombre: string;
  email: string;
  segmento: string;
}

export interface Pedido {
  id: number;
  clienteId: number;
  productoId: number;
  cantidad: number;
  total: number;
  estado: string;
  fechaCreacion: string;
}

export interface NuevoPedido {
  clienteId: number;
  productoId: number;
  cantidad: number;
  total: number;
  estado: string;
}

export interface NuevoProducto {
  nombre: string;
  categoria: string;
  precio: number;
  stock: number;
}

export interface NuevoCliente {
  nombre: string;
  email: string;
  segmento: string;
}

export interface Resumen {
  totalPedidos: number;
  totalProductos: number;
  totalClientes: number;
  ventaTotal: number;
  pedidosEnPreparacion: number;
}

export interface ApiDemoResponse {
  status: number;
  tipo: string;
  mensaje: string;
  timestamp: string;
  [key: string]: unknown;
}

@Injectable({ providedIn: 'root' })
export class Pedidos360ApiService {
  private readonly baseUrl = environment.apiBaseUrl;
  private readonly apiUrl = `${this.baseUrl}/api/v1`;

  constructor(private readonly http: HttpClient) {}

  obtenerResumen(): Observable<Resumen> {
    return this.http.get<Resumen>(`${this.apiUrl}/resumen`);
  }

  probarPublico(): Observable<ApiDemoResponse> {
    return this.http.get<ApiDemoResponse>(`${this.apiUrl}/public`);
  }

  probarProtegido(): Observable<ApiDemoResponse> {
    return this.http.get<ApiDemoResponse>(this.apiUrl);
  }

  probarPostSeguro(body: Record<string, unknown>): Observable<ApiDemoResponse> {
    return this.http.post<ApiDemoResponse>(this.apiUrl, body);
  }

  listarProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
  }

  crearProducto(request: NuevoProducto): Observable<Producto> {
    return this.http.post<Producto>(`${this.apiUrl}/productos`, request);
  }

  listarClientes(): Observable<Cliente[]> {
    return this.http.get<Cliente[]>(`${this.apiUrl}/clientes`);
  }

  crearCliente(request: NuevoCliente): Observable<Cliente> {
    return this.http.post<Cliente>(`${this.apiUrl}/clientes`, request);
  }

  listarPedidos(): Observable<Pedido[]> {
    return this.http.get<Pedido[]>(`${this.apiUrl}/pedidos`);
  }

  crearPedido(request: NuevoPedido): Observable<Pedido> {
    return this.http.post<Pedido>(`${this.apiUrl}/pedidos`, request);
  }
}
