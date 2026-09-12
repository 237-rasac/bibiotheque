import { Component, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { NgForm } from '@angular/forms';
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
  showPassword = false;
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

  deleteUser(userId: number) {
    if (!confirm('Delete this user? This action cannot be undone.')) {
      return;
    }
    this.usersService.deleteUser(userId).subscribe({
      next: () => { this.getUsers(); },
      error: () => { /* toast handled by interceptor */ }
    });
  }

  openCreateModal() {
    this.newUser = new Users();
    this.formSubmitting = false;
    this.showPassword = false; // repasse en masqué à chaque ouverture
    this.showCreateModal = true;
  }

  closeCreateModal() {
    if (!this.formSubmitting) {
      this.showCreateModal = false;
    }
  }

  onCreateUser(form: NgForm) {
    // Bloque la requête si le formulaire est invalide (champs manquants, etc.)
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.formSubmitting = true;
    // Le rôle est attribué par le backend (ADHERENT) : rien à envoyer côté client.
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
