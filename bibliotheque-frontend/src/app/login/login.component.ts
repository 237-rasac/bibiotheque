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

  constructor(private userService: UsersService,
    private userAuthSerivce: UserAuthService,
    private router: Router,
    private notification: NotificationService
  ) { }

  ngOnInit() {
  }

  login(loginForm: NgForm) {
    this.errorMessage = null;
    this.userService.login(loginForm.value).subscribe(
      (response: any) => {
        this.userAuthSerivce.setRoles(response.user.role);
        this.userAuthSerivce.setToken(response.jwtToken);
        this.userAuthSerivce.setUserId(response.user.userId);
        this.userAuthSerivce.setName(response.user.name);

        const successMsg = getResponseMessage('POST', '/authenticate', 200);
        if (successMsg) { this.notification.success(successMsg); }

        const role = response.user.role[0].roleName;
        if (role === 'Admin') {
          this.router.navigate(['/books']);
        } else {
          this.router.navigate(['/borrow-book']);
        }
      },
      (error) => {
        this.errorMessage = getResponseMessage('POST', '/authenticate', error.status)
          || error.error
          || 'Identifiants incorrects.';
      }
    );
  }
}