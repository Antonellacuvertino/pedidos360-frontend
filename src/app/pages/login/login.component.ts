import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MsalService } from '@azure/msal-angular';
import { InteractionType } from '@azure/msal-browser';
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
  constructor(
    private readonly msalService: MsalService,
    private readonly router: Router
  ) {}

  get autenticado(): boolean {
    return this.msalService.instance.getAllAccounts().length > 0;
  }

  ingresar(): void {
    this.msalService.loginRedirect({
      scopes: environment.azure.apiScopes,
      prompt: 'select_account'
    });
  }

  irDashboard(): void {
    void this.router.navigateByUrl('/app/dashboard');
  }

  protected readonly InteractionType = InteractionType;
}
