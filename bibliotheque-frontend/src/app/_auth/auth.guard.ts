import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { UserAuthService } from '../_service/user-auth.service';
import { UsersService } from '../_service/users.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {

  constructor(private userAuthService: UserAuthService,
    private router: Router,
    private userService: UsersService
  ) {}
  
  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot): Observable<boolean | UrlTree> | Promise<boolean | UrlTree> | boolean | UrlTree {

    // Plus de token lisible côté JS (cookie httpOnly) : la présence de rôles
    // enregistrés au login sert d'indicateur de session côté client.
    if(this.userAuthService.isLoggedIn()) {
      const role = route.data["roles"] as Array<string>;

      if(role) {
        const match = this.userService.roleMatch(role);

        if(match) {
          return true;
        } else {
          this.router.navigate(['/forbidden']);
          return false;
        }
      }
    }

    this.router.navigate(['/login']);
    return false;
  }
}
