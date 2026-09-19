import { Component } from '@angular/core';
import { NotificationService, Toast } from '../_service/notification.service';

@Component({
  selector: 'app-notification',
  standalone: false,
  template: `
    <div class="toast-container">
      <div
        *ngFor="let toast of (notificationService.toasts | async)"
        class="toast-item"
        [class.toast-success]="toast.type === 'success'"
        [class.toast-error]="toast.type === 'error'"
        [class.toast-warning]="toast.type === 'warning'"
        [class.toast-info]="toast.type === 'info'"
        (click)="notificationService.dismiss(toast.id)">
        <i class="fa-solid toast-icon"
          [class.fa-circle-check]="toast.type === 'success'"
          [class.fa-circle-exclamation]="toast.type === 'error'"
          [class.fa-triangle-exclamation]="toast.type === 'warning'"
          [class.fa-circle-info]="toast.type === 'info'"></i>
        <span class="toast-message">{{ toast.message }}</span>
        <button class="toast-close" (click)="notificationService.dismiss(toast.id); $event.stopPropagation()">
          <i class="fa-solid fa-xmark"></i>
        </button>
      </div>
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 80px;
      right: 16px;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 8px;
      max-width: 420px;
      width: calc(100% - 32px);
      pointer-events: none;
    }

    .toast-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      border-radius: var(--ds-radius-lg, 0.75rem);
      background: var(--ds-bg-elevated, #fff);
      border: 1px solid var(--ds-border, #E2E8F0);
      box-shadow: var(--ds-shadow-lg, 0 10px 15px -3px rgba(0,0,0,0.1));
      cursor: pointer;
      pointer-events: auto;
      animation: toastSlideIn 0.3s ease-out both;
      transition: opacity 0.2s ease, transform 0.2s ease;
    }

    .toast-item:hover {
      box-shadow: var(--ds-shadow-xl);
    }

    .toast-icon {
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .toast-message {
      flex: 1;
      font-size: var(--ds-text-sm, 0.875rem);
      font-weight: 500;
      line-height: 1.4;
      color: var(--ds-text, #1E293B);
      white-space: pre-line; /* respecte les \n (ex: détails RG-01..RG-07) */
    }

    .toast-close {
      flex-shrink: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: none;
      border: none;
      color: var(--ds-text-muted, #94A3B8);
      cursor: pointer;
      border-radius: 50%;
      transition: all 150ms ease;
    }

    .toast-close:hover {
      background: var(--ds-bg-hover, #F1F5F9);
      color: var(--ds-text, #1E293B);
    }

    .toast-success {
      border-left: 4px solid var(--ds-success, #10B981);
    }
    .toast-success .toast-icon { color: var(--ds-success, #10B981); }

    .toast-error {
      border-left: 4px solid var(--ds-danger, #EF4444);
    }
    .toast-error .toast-icon { color: var(--ds-danger, #EF4444); }

    .toast-warning {
      border-left: 4px solid var(--ds-warning, #F59E0B);
    }
    .toast-warning .toast-icon { color: var(--ds-warning, #F59E0B); }

    .toast-info {
      border-left: 4px solid var(--ds-info, #06B6D4);
    }
    .toast-info .toast-icon { color: var(--ds-info, #06B6D4); }

    @keyframes toastSlideIn {
      from { opacity: 0; transform: translateX(40px); }
      to { opacity: 1; transform: translateX(0); }
    }

    @media (max-width: 576px) {
      .toast-container {
        right: 8px;
        left: 8px;
        max-width: none;
        width: auto;
        top: 72px;
      }
    }
  `]
})
export class NotificationComponent {
  constructor(public notificationService: NotificationService) {}
}
