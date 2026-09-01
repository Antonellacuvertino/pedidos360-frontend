import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { MsalService } from '@azure/msal-angular';
import { AccountInfo } from '@azure/msal-browser';
import { LucideCopy, LucideRefreshCw, LucideSend, LucideShieldCheck, LucideUsers } from '@lucide/angular';
import { environment } from '../../../environments/environment';
import { ApiDemoResponse, Pedidos360ApiService } from '../../services/pedidos360-api.service';

type TokenClaims = Record<string, unknown>;

@Component({
  selector: 'app-cuenta',
  standalone: true,
  imports: [CommonModule, LucideCopy, LucideRefreshCw, LucideSend, LucideShieldCheck, LucideUsers],
  templateUrl: './cuenta.component.html',
  styleUrl: './cuenta.component.css'
})
export class CuentaComponent implements OnInit {
  cuenta?: AccountInfo;
  accessToken = '';
  claims: TokenClaims = {};
  apiResponse?: ApiDemoResponse;
  error = '';
  copiado = false;
  probando = false;

  constructor(
    private readonly msalService: MsalService,
    private readonly api: Pedidos360ApiService
  ) {}

  ngOnInit(): void {
    this.cuenta = this.obtenerCuenta();
    this.cargarToken();
  }

  cargarToken(): void {
    const account = this.obtenerCuenta();
    if (!account) {
      this.error = 'No hay una cuenta activa en MSAL.';
      return;
    }

    this.error = '';
    this.msalService.acquireTokenSilent({
      account,
      scopes: [environment.azure.apiScope]
    }).subscribe({
      next: (result) => {
        this.accessToken = result.accessToken;
        this.claims = this.decodificarJwt(result.accessToken);
      },
      error: () => {
        this.error = 'No se pudo obtener el access token. Cierra sesion e ingresa nuevamente.';
      }
    });
  }

  copiarToken(): void {
    void navigator.clipboard.writeText(this.accessToken);
    this.copiado = true;
    setTimeout(() => {
      this.copiado = false;
    }, 1800);
  }

  probarPublico(): void {
    this.ejecutarPrueba(() => this.api.probarPublico());
  }

  probarProtegido(): void {
    this.ejecutarPrueba(() => this.api.probarProtegido());
  }

  probarPostSeguro(): void {
    this.ejecutarPrueba(() => this.api.probarPostSeguro({
      origen: 'frontend-pedidos360',
      accion: 'prueba-post',
      fecha: new Date().toISOString()
    }));
  }

  claim(nombre: string): string {
    const value = this.claims[nombre];
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value === undefined || value === null ? 'No informado' : String(value);
  }

  expiracion(): string {
    const exp = this.claims['exp'];
    if (typeof exp !== 'number') {
      return 'No informado';
    }
    return new Date(exp * 1000).toLocaleString();
  }

  private obtenerCuenta(): AccountInfo | undefined {
    const active = this.msalService.instance.getActiveAccount();
    const first = this.msalService.instance.getAllAccounts()[0];
    if (!active && first) {
      this.msalService.instance.setActiveAccount(first);
    }
    return active ?? first;
  }

  private decodificarJwt(token: string): TokenClaims {
    const payload = token.split('.')[1];
    if (!payload) {
      return {};
    }

    const padded = payload.padEnd(payload.length + (4 - payload.length % 4) % 4, '=');
    const normalized = padded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(
      atob(normalized)
        .split('')
        .map((char) => `%${char.charCodeAt(0).toString(16).padStart(2, '0')}`)
        .join('')
    );

    return JSON.parse(json) as TokenClaims;
  }

  private ejecutarPrueba(request: () => ReturnType<Pedidos360ApiService['probarPublico']>): void {
    this.probando = true;
    this.apiResponse = undefined;
    this.error = '';

    request().subscribe({
      next: (response) => {
        this.apiResponse = response;
        this.probando = false;
      },
      error: () => {
        this.error = 'La prueba fallo. Revisa la URL del API Gateway, CORS o el token.';
        this.probando = false;
      }
    });
  }
}
