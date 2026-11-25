import { Component, input } from '@angular/core';
import { LucidePackage } from '@lucide/angular';

@Component({
  selector: 'app-product-image',
  standalone: true,
  imports: [LucidePackage],
  template: `
    @if (image(); as src) {
      <img [src]="src" alt="" width="432" height="440" loading="lazy">
    } @else {
      <svg lucidePackage size="24" aria-hidden="true"></svg>
    }
  `,
  styles: `
    :host {
      display: grid;
      place-items: center;
      aspect-ratio: 1;
      width: 100%;
      overflow: hidden;
      border-radius: 8px;
      background: #e8f2f2;
      color: #286457;
    }
    img { width: 100%; height: 100%; object-fit: contain; }
  `
})
export class ProductImageComponent {
  readonly name = input.required<string>();

  image(): string | null {
    const name = this.name();
    if (/\bnotebook\b/i.test(name)) return 'assets/catalogo/notebook.jpg';
    if (/\bmonitor\b/i.test(name)) return 'assets/catalogo/monitor.jpg';
    if (/\bmouse\b/i.test(name)) return 'assets/catalogo/mouse.jpg';
    return null;
  }
}
