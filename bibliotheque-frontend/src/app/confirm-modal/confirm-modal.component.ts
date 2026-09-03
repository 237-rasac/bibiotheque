import { Component, EventEmitter, Input, Output } from '@angular/core';

export interface ModalDetail {
  label: string;
  value: string;
}

@Component({
  standalone: false,
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {

  @Input() show = false;
  @Input() title = 'Confirm';
  @Input() message = '';
  @Input() details: ModalDetail[] = [];
  @Input() warning = '';
  @Input() iconClass = 'fa-solid fa-circle-exclamation';
  @Input() confirmText = 'Confirm';
  @Input() cancelText = 'Cancel';
  @Input() confirmIconClass = 'fa-solid fa-check';
  @Input() loadingText = 'Processing...';
  @Input() loadingIconClass = 'fa-solid fa-spinner-third';
  @Input() loading = false;
  @Input() variant: 'danger' | 'warning' | 'info' = 'danger';

  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get iconBgClass(): string {
    return `modal-icon modal-icon--${this.variant}`;
  }

  get confirmBtnClass(): string {
    return this.variant === 'danger'
      ? 'ds-btn ds-btn-danger ds-btn-sm'
      : this.variant === 'warning'
        ? 'ds-btn ds-btn-warning ds-btn-sm'
        : 'ds-btn ds-btn-primary ds-btn-sm';
  }

  onOverlayClick() {
    if (!this.loading) {
      this.cancel.emit();
    }
  }

  onContainerClick(event: Event) {
    event.stopPropagation();
  }

  onConfirm() {
    this.confirm.emit();
  }

  onCancel() {
    if (!this.loading) {
      this.cancel.emit();
    }
  }
}
