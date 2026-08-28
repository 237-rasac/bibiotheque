import { Component, OnInit } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';
import { filter } from 'rxjs';

@Component({
  standalone: false,
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css']
})
export class SidebarComponent implements OnInit {

  collapsed = false;
  mobileOpen = false;

  constructor(
    private userAuthService: UserAuthService,
    public userService: UsersService,
    private router: Router,
  ) {}

  ngOnInit(): void {
    // Close sidebar on navigation (mobile)
    this.router.events.pipe(
      filter(event => event instanceof NavigationEnd)
    ).subscribe(() => {
      this.mobileOpen = false;
    });
  }

  isLoggedIn(): boolean {
    return !!this.userAuthService.isLoggedIn();
  }

  toggleCollapse() {
    this.collapsed = !this.collapsed;
  }

  toggleMobile() {
    this.mobileOpen = !this.mobileOpen;
  }

  closeMobile() {
    this.mobileOpen = false;
  }
}
