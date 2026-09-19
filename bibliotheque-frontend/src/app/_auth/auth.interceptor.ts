import { HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError } from 'rxjs';
import { NotificationService } from '../_service/notification.service';
import { getResponseMessage, extractRuleDetails } from '../_model/response-messages';
import { Injectable } from '@angular/core';

/** URLs qui ne doivent PAS déclencher de toast succès (listes, détails, etc.) */
const SILENT_SUCCESS_METHODS = new Set(['GET']);

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private router: Router,
    private notification: NotificationService
  ) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Le JWT voyage via cookie httpOnly : aucune entête Authorization à ajouter,
    // il suffit d'autoriser l'envoi/réception des cookies entre origines.
    req = req.clone({ withCredentials: true });

    if (req.headers.get('No-Auth') === 'True') {
      return next.handle(req);
    }

    return next.handle(req).pipe(
      // Succès : toast pour les opérations mutate (POST, PUT, PATCH, DELETE)
      tap((event) => {
        if (event instanceof HttpResponse && !SILENT_SUCCESS_METHODS.has(req.method)) {
          // Priorité au message renvoyé par le backend dans le body
          // (ex: { message: "..." }), sinon fallback sur le message swagger.
          const body = event.body;
          const backendMsg =
            body && typeof body === 'object' && typeof (body as { message?: unknown }).message === 'string'
              ? ((body as { message: string }).message).trim()
              : '';
          const message = backendMsg || getResponseMessage(req.method, req.url, event.status);
          if (message) {
            this.notification.success(message);
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

        // Résoudre le message : backend JSON > backend string > swagger > générique
        let message: string;

        if (err.status === 0) {
          message = 'Le serveur est injoignable. Vérifiez que le backend est démarré.';
        } else if (err.error && typeof err.error === 'object' && err.error.message) {
          // Backend renvoie { rule, message, status } en JSON
          message = err.error.message;
        } else if (typeof err.error === 'string' && err.error) {
          // Backend envoie une string brute dans le body
          message = err.error;
        } else {
          message = getResponseMessage(req.method, req.url, err.status)
            || err.message
            || `Erreur serveur (${err.status}). Veuillez réessayer.`;
        }

        // Déplier les codes règles métier (RG-01, RG-02...) en descriptions
        // lisibles, pour le toast et pour les erreurs affichées inline.
        message = this.expandRuleCodes(message);

        this.notification.error(message);

        // Renvoyer l'erreur enrichie pour que les composants puissent
        // afficher des détails supplémentaires (ex: description RG)
        return throwError(() => ({
          status: err.status,
          error: err.error,
          message: message,
          original: err
        }));
      })
    );
  }

  /**
   * Ajoute la description lisible de chaque code RG présent dans le message.
   * Ex: "Règle métier violée (RG-01)."
   *  → "Règle métier violée (RG-01).\n• RG-01 : Un adhérent ne peut pas réserver..."
   */
  private expandRuleCodes(message: string): string {
    const details = extractRuleDetails(message);
    if (details.length === 0) {
      return message;
    }
    return `${message}\n${details.map(d => `• ${d}`).join('\n')}`;
  }
}