import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';

@Component({
  standalone: false,
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent implements OnInit {

  isDark = false;

  constructor(
    private userAuthService: UserAuthService,
    private router: Router,
    public userService: UsersService,
  ) { }

  name = this.userAuthService.getName();

  ngOnInit(): void {
    const saved = localStorage.getItem('ds-theme');
    this.isDark = saved === 'dark';
    this.applyTheme();
  }

  public isLoggedIn() {
    return this.userAuthService.isLoggedIn();
  }

  public logout() {
    // Déconnexion serveur d'abord (écrase le cookie httpOnly), puis purge locale.
    this.userService.logout().subscribe({
      next: () => this.finishLogout(),
      error: () => this.finishLogout() // déconnecter quand même côté client
    });
  }

  private finishLogout() {
    this.userAuthService.clear();
    this.router.navigate(['/']);
  }

  public toggleTheme() {
    this.isDark = !this.isDark;
    localStorage.setItem('ds-theme', this.isDark ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme() {
    document.documentElement.setAttribute('data-theme', this.isDark ? 'dark' : 'light');
  }
}
