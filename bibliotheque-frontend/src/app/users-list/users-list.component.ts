import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { Users } from '../_model/users';
import { UsersService } from '../_service/users.service';

@Component({
  standalone: false,
  selector: 'app-users-list',
  templateUrl: './users-list.component.html',
  styleUrls: ['./users-list.component.css']
})
export class UsersListComponent implements OnInit {

  users: Users[] = [];
  loading = true;

  showCreateModal = false;
  formSubmitting = false;
  newUser: Users = new Users();

  constructor(private usersService: UsersService,
    private router: Router) { }

  ngOnInit(): void {
    this.router.routeReuseStrategy.shouldReuseRoute = () => false;
    this.getUsers();
    // this.users = [{
    //   "userId": 1,
    //   "name": "tarun",
    //   "username": "tarungowda",
    //   "role": "STUDENT",
    //   "password": "sdklfjlakdsf"
    // }]
  }

  private getUsers() {
    this.loading = true;
    this.usersService.getUsersList().subscribe({
      next: (data) => { this.users = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  userDetails(userId: number) {
    this.router.navigate(['user-details', userId ]);
  }

  updateUser(userId: number) {
    this.router.navigate(['update-user', userId ]);
  }

  openCreateModal() {
    this.newUser = new Users();
    this.showCreateModal = true;
  }

  closeCreateModal() {
    if (!this.formSubmitting) {
      this.showCreateModal = false;
    }
  }

  onCreateUser() {
    this.formSubmitting = true;
    this.usersService.createUser(this.newUser).subscribe({
      next: () => {
        this.formSubmitting = false;
        this.showCreateModal = false;
        this.getUsers();
      },
      error: () => {
        this.formSubmitting = false;
      }
    });
  }

}
