import { Component, DestroyRef, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalBroadcastService, MsalService } from '@azure/msal-angular';
import { InteractionStatus } from '@azure/msal-browser';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LucideLayoutDashboard, LucideShieldCheck } from '@lucide/angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LucideLayoutDashboard, LucideShieldCheck],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  ingresando = false;
  procesandoRedireccion = true;
  error = '';

  constructor(
    private readonly msalService: MsalService,
    private readonly msalBroadcastService: MsalBroadcastService,
    private readonly router: Router,
    private readonly destroyRef: DestroyRef
  ) {}

  ngOnInit(): void {
    this.msalBroadcastService.inProgress$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((status) => {
        this.procesandoRedireccion = status !== InteractionStatus.None;
      });
  }

  get autenticado(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  ingresar(): void {
    if (this.ingresando || this.procesandoRedireccion) {
      return;
    }

    this.ingresando = true;
    this.error = '';
    this.msalService.loginRedirect({
      scopes: environment.azure.apiScopes
    }).subscribe({
      error: (error: { errorCode?: string }) => {
        this.ingresando = false;
        this.error = `No se pudo iniciar sesion con Microsoft${error.errorCode ? ` (${error.errorCode})` : ''}. Intenta nuevamente.`;
      }
    });
  }

  irDashboard(): void {
    void this.router.navigateByUrl('/app/dashboard');
  }
}
