import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Users } from '../_model/users';
import { UsersService } from '../_service/users.service';

@Component({
  standalone: false,
  selector: 'app-update-user',
  templateUrl: './update-user.component.html',
  styleUrls: ['./update-user.component.css']
})
export class UpdateUserComponent implements OnInit {

  userId: number;
  user: Users = new Users();

  constructor(private usersService: UsersService,
    private route: ActivatedRoute,
    private router: Router) { }

  ngOnInit(): void {
    this.userId = this.route.snapshot.params['userId'];
    // Le select du template lie user.role[0].roleName : prévoir un rôle par
    // défaut pour le rendu initial, avant l'arrivée des données.
    this.user.role = [{ roleName: 'ADHERENT' }];
    this.usersService.getUserById(this.userId).subscribe({
      next: (data) => { this.user = data; },
      error: () => { /* toast handled by interceptor */ }
    });
  }

  onSubmit() {
    this.usersService.updateUser(this.userId, this.user).subscribe({
      next: () => { this.goToUsersList(); },
      error: () => { /* toast handled by interceptor */ }
    });
  }

  goToUsersList() {
    this.router.navigate(['/users']);
  }

}
