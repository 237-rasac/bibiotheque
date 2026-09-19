import { Component, OnInit } from '@angular/core';
import { NgForm } from '@angular/forms';
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
  formSubmitting = false;
  showPassword = false;

  constructor(private usersService: UsersService,
    private router: Router) { }

  ngOnInit(): void {
  }

  onSubmit(form: NgForm) {
    // Bloque la requête si le formulaire est invalide (champs manquants, etc.)
    if (form.invalid) {
      Object.values(form.controls).forEach(control => control.markAsTouched());
      return;
    }

    this.formSubmitting = true;
    // Le rôle n'est pas envoyé : le backend attribue systématiquement ADHERENT.
    this.usersService.createUser(this.user).subscribe({
      next: () => { this.goToUsersList(); },
      error: () => { this.formSubmitting = false; }
    });
  }

  goToUsersList() {
    this.router.navigate(['/users']);
  }

}
