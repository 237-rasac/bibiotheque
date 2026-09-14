import { Component, OnDestroy, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../_service/user-auth.service';

/**
 * Header dedicated to the public landing page ("Home").
 *
 * Completely separate from the authenticated app header (header.component):
 * transparent-over-hero at the top, becomes a frosted glass bar on scroll,
 * with anchor navigation to the landing sections and a CTA.
 */
@Component({
  standalone: false,
  selector: 'app-landing-header',
  templateUrl: './landing-header.component.html',
  styleUrls: ['./landing-header.component.css']
})
export class LandingHeaderComponent implements OnInit, OnDestroy {
  readonly brandName = 'LibraryMS';
  readonly navLinks = [
    { label: 'Features', target: 'lp-features-section' },
    { label: 'How it works', target: 'lp-how-section' },
    { label: 'Stats', target: 'lp-stats-section' },
  ];

  isScrolled = false;
  isMenuOpen = false;
  isDark = false;
  private readonly scrollThreshold = 24;
  private windowListeners: Array<() => void> = [];

  constructor(
    private userAuthService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.isDark = localStorage.getItem('ds-theme') === 'dark';
    this.onWindowScroll();

    const onScroll = () => this.onWindowScroll();
    const onResize = () => {
      if (window.innerWidth > 900 && this.isMenuOpen) {
        this.isMenuOpen = false;
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    this.windowListeners.push(
      () => window.removeEventListener('scroll', onScroll),
      () => window.removeEventListener('resize', onResize)
    );
  }

  ngOnDestroy(): void {
    this.windowListeners.forEach(dispose => dispose());
  }

  isLoggedIn(): boolean {
    return !!this.userAuthService.isLoggedIn();
  }

  onWindowScroll(): void {
    this.isScrolled = window.scrollY > this.scrollThreshold;
  }

  goToSection(target: string): void {
    this.isMenuOpen = false;
    const element = document.getElementById(target);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } else {
      // Anchor section not rendered yet: navigate to home first.
      this.router.navigate(['/']).then(() => {
        setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 50);
        // Fallback if the element still cannot be found.
        setTimeout(() => document.getElementById(target)?.scrollIntoView({ behavior: 'smooth' }), 400);
      });
    }
  }

  toggleTheme(): void {
    this.isDark = !this.isDark;
    localStorage.setItem('ds-theme', this.isDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  closeMenu(): void {
    this.isMenuOpen = false;
  }
}
