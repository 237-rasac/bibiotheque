import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { NgForm } from '@angular/forms';
import { Observable, BehaviorSubject } from 'rxjs';
import { Users } from '../_model/users';
import { UserAuthService } from './user-auth.service';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UsersService {

  private baseURL = `${environment.apiUrl}/admin/users`;
  requestHeader = new HttpHeaders(
    { 'No-Auth': 'True' }
  );

  constructor(
    private httpClient: HttpClient,
    private userAuthService: UserAuthService
  ) { }

  /** Sidebar collapse state, shared with embedded components. */
  private sidebarCollapsedSubject = new BehaviorSubject<boolean>(false);
  readonly sidebarCollapsed$ = this.sidebarCollapsedSubject.asObservable();

  setSidebarCollapsed(collapsed: boolean): void {
    this.sidebarCollapsedSubject.next(collapsed);
  }

  /** Login : envoie les identifiants et accepte le cookie httpOnly posé par le backend. */
  public login(loginData: NgForm) {
    return this.httpClient.post(`${environment.apiUrl}/authenticate`, loginData, {
      headers: this.requestHeader,
      withCredentials: true
    });
  }

  /** Déconnexion serveur : le backend écrase le cookie JWT (maxAge=0). */
  public logout() {
    return this.httpClient.post(`${environment.apiUrl}/logout`, {}, {
      headers: this.requestHeader,
      withCredentials: true
    });
  }

  public roleMatch(allowedRoles: any): boolean {
    const userRoles: any = this.userAuthService.getRoles();

    if (userRoles != null && userRoles) {
      for (let i = 0; i < userRoles.length; i++) {
        for (let j = 0; j < allowedRoles.length; j++) {
          if (userRoles[i].roleName === allowedRoles[j]) {
            return true;
          }
        }
      }
    }

    return false;
  }

  getUsersList(): Observable<Users[]> {
    return this.httpClient.get<Users[]>(`${this.baseURL}`);
  }

  createUser(user: Users): Observable<Object> {
    return this.httpClient.post(`${this.baseURL}`, user);
  }

  getUserById(userId: number): Observable<Users> {
    return this.httpClient.get<Users>(`${this.baseURL}/${userId}`);
  }

  updateUser(userId: number, user: Users): Observable<Object> {
    return this.httpClient.put(`${this.baseURL}/${userId}`, user);
  }

  deleteUser(userId: number): Observable<Object> {
    return this.httpClient.delete(`${this.baseURL}/${userId}`);
  }

}
