import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Users } from '../_model/users';
import { UsersService } from '../_service/users.service';

@Component({
  standalone: false,
  selector: 'app-registration',
  templateUrl: './registration.component.html',
  styleUrls: ['./registration.component.css']
})
export class RegistrationComponent implements OnInit {

  user: Users = new Users();

  constructor(private usersService: UsersService,
    private router: Router) { }

  ngOnInit(): void {
  }

  saveUser() {
    this.usersService.createUser(this.user).subscribe({
      next: () => { this.goToUsersList(); }
    });
  }

  goToUsersList() {
    this.router.navigate(['/users']);
  }

  onSubmit() {
    this.saveUser();
  }

}
