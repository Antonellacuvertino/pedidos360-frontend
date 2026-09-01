import { Routes } from '@angular/router';
import { MsalGuard } from '@azure/msal-angular';
import { LoginComponent } from './pages/login/login.component';
import { ShellComponent } from './layout/shell/shell.component';
import { DashboardComponent } from './pages/dashboard/dashboard.component';
import { ProductosComponent } from './pages/productos/productos.component';
import { CarritoComponent } from './pages/carrito/carrito.component';
import { CuentaComponent } from './pages/cuenta/cuenta.component';

export const routes: Routes = [
  { path: '', component: LoginComponent },
  {
    path: 'app',
    component: ShellComponent,
    canActivate: [MsalGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      { path: 'dashboard', component: DashboardComponent },
      { path: 'productos', component: ProductosComponent },
      { path: 'carrito', component: CarritoComponent },
      { path: 'cuenta', component: CuentaComponent }
    ]
  },
  { path: 'dashboard', redirectTo: 'app/dashboard' },
  { path: '**', redirectTo: '' }
];
