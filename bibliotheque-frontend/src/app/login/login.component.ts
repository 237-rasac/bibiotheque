import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Router } from '@angular/router';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';
import { NotificationService } from '../_service/notification.service';
import { getResponseMessage } from '../_model/response-messages';

@Component({
  standalone: false,
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  errorMessage: string | null = null;
  showPassword = false;

  constructor(private userService: UsersService,
    private userAuthSerivce: UserAuthService,
    private router: Router,
    private notification: NotificationService
  ) { }

  ngOnInit() {
  }

  login(loginForm: NgForm) {
    this.errorMessage = null;
    this.userService.login(loginForm.value).subscribe({
      next: (response: any) => {
        // Le JWT est posé par le backend dans un cookie httpOnly (Set-Cookie) :
        // il n'apparaît plus dans la réponse et n'est jamais stocké côté JS.
        this.userAuthSerivce.setUserId(response.user.userId);
        this.userAuthSerivce.setName(response.user.name);

        // Les rôles sont envoyés en clair dans le body de la réponse
        // (ex: ["ROLE_ADHERENT"]) et normalisés pour le guard.
        const rolesFromResponse: string[] = response.roles ?? [];
        const roles = rolesFromResponse.map((roleName: string) => ({ roleName: roleName.replace(/^ROLE_/, '') }));
        this.userAuthSerivce.setRoles(roles as []);

        const successMsg = getResponseMessage('POST', '/authenticate', 200);
        if (successMsg) { this.notification.success(successMsg); }

        this.redirectByRole(rolesFromResponse);
      },
      error: (err) => {
        this.errorMessage = err.message
          || getResponseMessage('POST', '/authenticate', err.status)
          || 'Identifiants incorrects.';
      }
    });
  }

  /** Redirige chaque utilisateur vers son interface selon son rôle. */
  private redirectByRole(roles: string[]) {
    if (roles.includes('ROLE_BIBLIOTHECAIRE')) {
      this.router.navigate(['/books']);
    } else if (roles.includes('ROLE_ADHERENT')) {
      // L'adhérent atterrit directement sur ses réservations
      // (le backend ne renvoie que les siennes : RS-05).
      this.router.navigate(['/my-reservations']);
    } else {
      this.router.navigate(['/forbidden']);
    }
  }
}