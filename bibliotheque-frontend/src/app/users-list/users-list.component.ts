import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
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

  constructor(private usersService: UsersService,
    private router: Router) { }

  ngOnInit(): void {
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

}
