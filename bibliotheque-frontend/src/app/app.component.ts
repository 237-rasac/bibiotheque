import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { Subscription } from 'rxjs';
import { UserAuthService } from './_service/user-auth.service';

@Component({
  standalone: false,
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'Library Management System';
  showSidebar = false;
  showHeader = true;
  showLandingHeader = false;
  private sub!: Subscription;

  private hideHeaderRoutes = ['/login'];
  private landingRoutes = ['/'];

  constructor(
    private userAuthService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.evaluateVisibility();
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.evaluateVisibility();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private evaluateVisibility() {
    const url = this.router.url.split('?')[0];
    const onLanding = this.landingRoutes.includes(url) && !this.userAuthService.isLoggedIn();

    // /login : page dédiée, aucun header (landing ou app), juste le formulaire.
    this.showLandingHeader = onLanding && !this.hideHeaderRoutes.includes(url);
    // Authenticated app: app header + sidebar as before.
    this.showSidebar = !!this.userAuthService.isLoggedIn();
    this.showHeader = !this.userAuthService.isLoggedIn()
      ? !onLanding && !this.hideHeaderRoutes.includes(url)
      : !this.hideHeaderRoutes.includes(url);
  }
}
