import { CommonModule } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { LucideRefreshCw } from '@lucide/angular';
import { forkJoin } from 'rxjs';
import {
  AnalyticsMetrics,
  PagoSimulado,
  Pedidos360ApiService,
  Recommendations
} from '../../services/pedidos360-api.service';

@Component({
  selector: 'app-streaming',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, LucideRefreshCw],
  templateUrl: './streaming.component.html',
  styleUrl: './streaming.component.css'
})
export class StreamingComponent implements OnInit {
  metrics?: AnalyticsMetrics;
  recommendations?: Recommendations;
  lastPayment?: PagoSimulado;
  loading = false;
  submitting = false;
  error = '';

  form = this.fb.nonNullable.group({
    clienteId: ['', Validators.required],
    pedidoId: ['', Validators.required],
    monto: [1000, [Validators.required, Validators.min(1)]],
    metodoPagoToken: ['', [Validators.required, Validators.pattern(/^demo_[A-Za-z0-9_-]{4,64}$/)]]
  });

  constructor(private readonly api: Pedidos360ApiService, private readonly fb: FormBuilder) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.loading = true;
    forkJoin({
      metrics: this.api.metricasAnalytics(),
      recommendations: this.api.recomendaciones()
    }).subscribe({
      next: ({ metrics, recommendations }) => {
        this.metrics = metrics;
        this.recommendations = recommendations;
        this.error = '';
        this.loading = false;
      },
      error: () => {
        this.error = 'No se pudo consultar analitica desde API Gateway.';
        this.loading = false;
      }
    });
  }

  pay(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.submitting = true;
    this.error = '';
    this.api.simularPago(this.form.getRawValue()).subscribe({
      next: (payment) => {
        this.lastPayment = payment;
        this.submitting = false;
        this.refresh();
      },
      error: (error: unknown) => {
        if (error instanceof HttpErrorResponse && error.status === 429 && error.error?.estado === 'BLOQUEADO') {
          this.lastPayment = error.error as PagoSimulado;
        } else {
          this.error = 'No se pudo registrar el intento de pago.';
        }
        this.submitting = false;
      }
    });
  }
}
