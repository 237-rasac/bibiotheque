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
  private sub!: Subscription;

  constructor(
    private userAuthService: UserAuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.checkSidebar();
    this.sub = this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.checkSidebar();
      }
    });
  }

  ngOnDestroy() {
    this.sub?.unsubscribe();
  }

  private checkSidebar() {
    this.showSidebar = !!this.userAuthService.isLoggedIn();
  }
}
