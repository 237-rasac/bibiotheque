/**
 * Messages de réponse HTTP extraits du swagger.json
 * Appliqués à tous les endpoints CRUD de l'application.
 *
 * Structure: endpoint → method → status → message
 */
export const RESPONSE_MESSAGES: Record<string, Record<number, string>> = {

  // ===================== BOOKS =====================
  'GET /admin/books': {
    200: 'Liste des livres chargée avec succès.',
  },
  'GET /admin/books/:id': {
    200: 'Détails du livre chargés avec succès.',
    404: 'Livre introuvable.',
  },
  'POST /admin/books': {
    201: 'Livre créé avec succès.',
    400: 'Champs manquants ou invalides.',
    409: 'Un livre avec ce nom existe déjà.',
  },
  'PUT /admin/books/:id': {
    200: 'Livre mis à jour avec succès.',
    400: 'Champs manquants ou invalides.',
    404: 'Livre introuvable.',
  },
  'DELETE /admin/books/:id': {
    204: 'Livre supprimé avec succès.',
    404: 'Livre introuvable.',
  },

  // ===================== USERS =====================
  'GET /admin/users': {
    200: 'Liste des utilisateurs chargée avec succès.',
  },
  'GET /admin/users/:id': {
    200: 'Détails de l\'utilisateur chargés avec succès.',
    404: 'Utilisateur introuvable.',
  },
  'POST /admin/users': {
    201: 'Utilisateur créé avec succès.',
    400: 'Champs manquants ou invalides.',
    409: 'Un utilisateur avec ce nom existe déjà.',
  },
  'PUT /admin/users/:id': {
    200: 'Utilisateur mis à jour avec succès.',
    400: 'Champs manquants ou invalides.',
    404: 'Utilisateur introuvable.',
  },

  // ===================== BORROW =====================
  'GET /borrow': {
    200: 'Liste des emprunts chargée avec succès.',
  },
  'GET /borrow/user/:id': {
    200: 'Emprunts de l\'utilisateur chargés avec succès.',
  },
  'GET /borrow/book/:id': {
    200: 'Historique d\'emprunt du livre chargé avec succès.',
  },
  'POST /borrow': {
    201: 'Livre emprunté avec succès.',
    400: 'Données d\'emprunt invalides.',
    404: 'Livre ou utilisateur introuvable.',
    409: 'Emprunt impossible : règle métier violée.',
  },
  'PUT /borrow': {
    200: 'Livre retourné avec succès.',
    400: 'Données de retour invalides.',
    404: 'Emprunt introuvable.',
    409: 'Retour impossible : ce livre n\'est pas en cours d\'emprunt.',
  },

  // ===================== RESERVATIONS =====================
  'GET /api/reservations': {
    200: 'Liste des réservations chargée avec succès.',
  },
  'GET /api/reservations/:id': {
    200: 'Détails de la réservation chargés avec succès.',
    404: 'Réservation introuvable.',
  },
  'GET /api/reservations/expired': {
    200: 'Réservations expirées chargées avec succès.',
  },
  'POST /api/reservations': {
    201: 'Réservation créée avec succès.',
    400: 'livreId ou adherentId manquant dans le corps de la requête.',
    404: 'Livre ou utilisateur introuvable.',
    409: 'Règle métier violée (RG-01, RG-02, RG-03).',
  },
  'PATCH /api/reservations/:id/annuler': {
    200: 'Réservation annulée avec succès.',
    404: 'Réservation introuvable.',
    409: 'Statut non annulable (RG-05).',
  },
  'DELETE /api/reservations/:id': {
    204: 'Réservation supprimée avec succès.',
    404: 'Réservation introuvable.',
  },

  // ===================== AUTH =====================
  'POST /authenticate': {
    200: 'Connexion réussie.',
    401: 'Identifiants incorrects.',
  },
};

/**
 * Messages d'erreur génériques (hors swagger) pour les erreurs réseau/serveur.
 */
export const GENERIC_MESSAGES: Record<number, string> = {
  0:   'Le serveur est injoignable. Vérifiez que le backend est démarré.',
  401: 'Session expirée. Veuillez vous reconnecter.',
  403: 'Vous n\'avez pas les droits pour effectuer cette action.',
  408: 'La requête a expiré. Veuillez réessayer.',
  429: 'Trop de requêtes. Veuillez patienter avant de réessayer.',
  500: 'Erreur interne du serveur. Veuillez réessayer.',
  502: 'Le serveur est temporairement indisponible.',
  503: 'Service indisponible. Veuillez réessayer plus tard.',
};

/**
 * Convertit une URL réelle en pattern de clé swagger.
 * Ex: /admin/books/5 → /admin/books/:id
 */
export function toSwaggerPattern(url: string): string {
  return url
    .replace(/\/admin\/books\/\d+/g, '/admin/books/:id')
    .replace(/\/admin\/users\/\d+/g, '/admin/users/:id')
    .replace(/\/borrow\/user\/\d+/g, '/borrow/user/:id')
    .replace(/\/borrow\/book\/\d+/g, '/borrow/book/:id')
    .replace(/\/api\/reservations\/expired/g, '/api/reservations/expired')
    .replace(/\/api\/reservations\/\d+\/annuler/g, '/api/reservations/:id/annuler')
    .replace(/\/api\/reservations\/\d+/g, '/api/reservations/:id');
}

/**
 * Récupère le message pour une réponse HTTP donnée.
 */
export function getResponseMessage(
  method: string,
  url: string,
  status: number
): string | null {
  const pattern = toSwaggerPattern(url);
  const key = `${method.toUpperCase()} ${pattern}`;
  const endpointMessages: Record<number, string> | undefined = RESPONSE_MESSAGES[key];

  if (endpointMessages && endpointMessages[status]) {
    return endpointMessages[status];
  }

  // Fallback sur les messages génériques
  if (GENERIC_MESSAGES[status]) {
    return GENERIC_MESSAGES[status];
  }

  return null;
}
