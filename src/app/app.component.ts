import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
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
  constructor(private readonly msalService: MsalService) {}

  ngOnInit(): void {
    this.msalService.handleRedirectObservable().subscribe((result) => {
      if (result?.account) {
        this.msalService.instance.setActiveAccount(result.account);
      }
    });
  }
}
