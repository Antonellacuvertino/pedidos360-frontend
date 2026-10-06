import { Component, OnInit } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { MsalService } from '@azure/msal-angular';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  constructor(
    private readonly msalService: MsalService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.msalService.handleRedirectObservable({ navigateToLoginRequestUrl: false }).subscribe((result) => {
      const account = result?.account
        ?? this.msalService.instance.getActiveAccount()
        ?? this.msalService.instance.getAllAccounts()[0];

      if (account) {
        this.msalService.instance.setActiveAccount(account);
        if (this.router.url === '/') {
          void this.router.navigateByUrl('/app/dashboard');
        }
      }
    });
  }
}
