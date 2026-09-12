import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UserAuthService {

  constructor() { }

  public setRoles(roles: []) {
    localStorage.setItem('roles', JSON.stringify(roles));
  }

  public getRoles(): [] {
    return JSON.parse(localStorage.getItem('roles')!);
  }

  public setUserId(userId: number) {
    localStorage.setItem('userId', JSON.stringify(userId));
  }

  public getUserId() {
    return JSON.parse(localStorage.getItem('userId')!);
  }

  public setName(name: string) {
    localStorage.setItem('name', JSON.stringify(name));
  }

  public getName() {
    return JSON.parse(localStorage.getItem('name')!);
  }

  /**
   * Le JWT vit dans un cookie httpOnly géré par le backend (cf. JwtCookieUtil) :
   * le frontend ne stocke plus aucun token, seulement des infos d'affichage.
   */
  public clear() {
    localStorage.removeItem('roles');
    localStorage.removeItem('userId');
    localStorage.removeItem('name');
  }

  /**
   * Le token n'est plus lisible côté JS (cookie httpOnly) : la présence de
   * rôles enregistrés au moment du login sert d'indicateur de session côté client.
   * La vraie validité est vérifiée par le backend à chaque requête (401 -> /login).
   */
  public isLoggedIn() {
    const roles = this.getRoles();
    return roles != null && roles.length > 0;
  }

}
