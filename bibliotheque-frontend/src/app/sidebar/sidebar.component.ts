import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';
import { filter } from 'rxjs';

/**
 * Application sidebar.
 * - Collapsed state persists across reloads (localStorage) and is shared
 *   with embedded components (e.g. admin profile card) via UsersService.
 * - Auto-collapses briefly on navigation to give visual feedback.
 * - Keyboard accessible: Alt+S focuses the first nav link.
 */
@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  collapsed = false;
  mobileOpen = false;
  private justNavigated = false;

  constructor(
    private userAuthService: UserAuthService,
    public userService: UsersService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Restore persisted collapse state and sync it app-wide.
    this.collapsed = localStorage.getItem('sb-collapsed') === 'true';
    this.userService.setSidebarCollapsed(this.collapsed);

    // Close sidebar on navigation (mobile) + brief pulse on the active link.
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileOpen = false;
      this.justNavigated = true;
      setTimeout(() => (this.justNavigated = false), 350);
    });

    // Keyboard shortcut: Alt+S focuses the first sidebar link.
    window.addEventListener('keydown', this.onKeydown);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.onKeydown);
  }

  isLoggedIn(): boolean {
    return !!this.userAuthService.isLoggedIn();
  }

  isNavPulsing(): boolean {
    return this.justNavigated;
  }

  logout() {
    this.userService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout()
    });
  }

  private finishLogout() {
    this.userAuthService.clear();
    this.router.navigate(['/']);
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
    localStorage.setItem('sb-collapsed', String(this.collapsed));
    this.userService.setSidebarCollapsed(this.collapsed);
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }

  private onKeydown = (event: KeyboardEvent) => {
    if (event.altKey && (event.key === 's' || event.key === 'S')) {
      event.preventDefault();
      document.querySelector<HTMLElement>('.ds-sidebar-link')?.focus();
    }
  };
}
