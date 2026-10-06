import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { LucideLayoutDashboard, LucideShieldCheck } from '@lucide/angular';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, LucideLayoutDashboard, LucideShieldCheck],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {
  ingresando = false;
  error = '';

  constructor(
    private readonly msalService: MsalService,
    private readonly router: Router
  ) {}

  get autenticado(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  ingresar(): void {
    if (this.ingresando) {
      return;
    }

    this.ingresando = true;
    this.error = '';
    this.msalService.loginRedirect({
      scopes: environment.azure.apiScopes
    }).subscribe({
      error: () => {
        this.ingresando = false;
        this.error = 'No se pudo iniciar sesion con Microsoft. Intenta nuevamente.';
      }
    });
  }

  irDashboard(): void {
    void this.router.navigateByUrl('/app/dashboard');
  }
}
