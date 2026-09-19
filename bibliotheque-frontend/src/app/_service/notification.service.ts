import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
  id: number;
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  duration: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {

  private toasts$ = new BehaviorSubject<Toast[]>([]);
  private counter = 0;

  toasts = this.toasts$.asObservable();

  show(type: Toast['type'], message: string, duration = 5000) {
    const id = ++this.counter;
    const toast: Toast = { id, type, message, duration };
    this.toasts$.next([...this.toasts$.value, toast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }
  }

  success(message: string, duration = 4000) {
    this.show('success', message, duration);
  }

  error(message: string, duration = 6000) {
    this.show('error', message, duration);
  }

  warning(message: string, duration = 5000) {
    this.show('warning', message, duration);
  }

  info(message: string, duration = 4000) {
    this.show('info', message, duration);
  }

  dismiss(id: number) {
    this.toasts$.next(this.toasts$.value.filter(t => t.id !== id));
  }
}
