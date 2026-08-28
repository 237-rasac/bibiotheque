import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { UserAuthService } from '../_service/user-auth.service';
import { NotificationService } from '../_service/notification.service';
import { getResponseMessage } from '../_model/response-messages';
import { Injectable } from '@angular/core';

/** URLs qui ne doivent PAS déclencher de toast succès (listes, détails, etc.) */
const SILENT_SUCCESS_METHODS = new Set(['GET']);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private userAuthService: UserAuthService,
    private router: Router,
    private notification: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (req.headers.get('No-Auth') === 'True') {
      return next.handle(req.clone());
    }

    const token = this.userAuthService.getToken();
    req = this.addToken(req, token);

    return next.handle(req).pipe(
      // Succès : toast pour les opérations mutate (POST, PUT, PATCH, DELETE)
      tap((event) => {
        if (event instanceof HttpResponse && !SILENT_SUCCESS_METHODS.has(req.method)) {
          const swaggerMsg = getResponseMessage(req.method, req.url, event.status);
          if (swaggerMsg) {
            this.notification.success(swaggerMsg);
          }
        }
      }),
      catchError((err: HttpErrorResponse) => {
        // Auth redirects
        if (err.status === 401) {
          this.router.navigate(['/login']);
        } else if (err.status === 403) {
          this.router.navigate(['/forbidden']);
        }

        // Résoudre le message : backend > swagger > générique
        let message: string;

        if (err.status === 0) {
          message = getResponseMessage(req.method, req.url, 0)
            || 'Le serveur est injoignable. Vérifiez que le backend est démarré.';
        } else if (typeof err.error === 'string' && err.error) {
          // Le backend envoie le message d'erreur en string dans le body
          message = err.error;
        } else {
          message = getResponseMessage(req.method, req.url, err.status)
            || err.message
            || `Erreur serveur (${err.status}). Veuillez réessayer.`;
        }

        this.notification.error(message);

        return throwError(() => ({
          status: err.status,
          error: message,
          original: err
        }));
      })
    );
  }

  private addToken(request: HttpRequest<any>, token: string) {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }
}