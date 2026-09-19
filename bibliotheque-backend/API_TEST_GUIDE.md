# 📚 API Bibliothèque - Guide de Test

> **Base URL :** `http://localhost:8080`
>
> **Swagger UI :** `http://localhost:8080/swagger-ui.html`

---

## 🔐 Authentification

### `POST /authenticate` — Se connecter et obtenir un JWT

**Body :**
```json
{
  "username": "admin",
  "password": "admin123"
}
```

**Réponse 200 :**
```json
{
  "user": {
    "userId": 1,
    "username": "admin",
    "name": "Administrateur",
    "password": null,
    "role": [
      {
        "roleId": 1,
        "roleName": "Admin"
      }
    ]
  },
  "jwtToken": "eyJhbGciOiJIUzUxMiJ9..."
}
```

> ⚠️ **Copie le `jwtToken`** et colle-le dans le bouton **"Authorize"** de Swagger (format `eyJhbGci...` sans "Bearer").
>
> 🛡️ **Le token embarque les rôles** : un claim `roles` (ex. `["ROLE_ADHERENT"]` ou `["ROLE_BIBLIOTHECAIRE"]`)
> est ajouté à la génération du JWT. Le frontend peut le décoder (payload Base64) pour adapter l'UI,
> mais la sécurité reste côté backend (rôles rechargés en base à chaque requête).

---

## 👤 Gestion des Utilisateurs (AdminController)

### `POST /admin/users` — Créer un utilisateur

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **BIBLIOTHECAIRE**
>
> 🛡️ **Le rôle est attribué par le backend** : tout nouvel utilisateur créé ici est
> automatiquement un **ADHERENT**. Tout champ `role` envoyé dans le body est **ignoré**.

**Body :**
```json
{
  "username": "jean.dupont",
  "name": "Jean Dupont",
  "password": "motdepasse123"
}
```

**Réponse 200 :**
```json
{
  "userId": 2,
  "username": "jean.dupont",
  "name": "Jean Dupont",
  "password": "$2a$10$...",
  "role": [
    {
      "roleId": 1,
      "roleName": "ADHERENT"
    }
  ]
}
```

---

### `GET /admin/users` — Lister tous les utilisateurs

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**Réponse 200 :**
```json
[
  {
    "userId": 1,
    "username": "admin",
    "name": "Administrateur",
    "role": [
      {
        "roleId": 1,
        "roleName": "Admin"
      }
    ]
  },
  {
    "userId": 2,
    "username": "jean.dupont",
    "name": "Jean Dupont",
    "role": [
      {
        "roleId": 2,
        "roleName": "Admin"
      }
    ]
  }
]
```

---

### `GET /admin/users/{id}` — Obtenir un utilisateur par ID

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**URL :** `GET /admin/users/1`

---

### `PUT /admin/users/{id}` — Modifier un utilisateur

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**URL :** `PUT /admin/users/2`

**Body :**
```json
{
  "username": "jean.dupont",
  "name": "Jean Dupont Modified",
  "role": [
    {
      "roleName": "User"
    }
  ]
}
```

---

## 📖 Gestion des Livres (BooksController)

### `GET /admin/books` — Lister tous les livres

> ❌ Pas de token requis

---

### `GET /admin/books/{id}` — Obtenir un livre par ID

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**URL :** `GET /admin/books/1`

---

### `POST /admin/books` — Créer un livre

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**Body :**
```json
{
  "bookName": "Les Misérables",
  "bookAuthor": "Victor Hugo",
  "bookGenre": "Roman",
  "noOfCopies": 10
}
```

---

### `PUT /admin/books/{id}` — Modifier un livre

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

---

### `DELETE /admin/books/{id}` — Supprimer un livre

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

---

## 📚 Gestion des Emprunts (BorrowController)

> ⚠️ Endpoints actuellement publics (pas de token requis).

### `POST /borrow` — Emprunter un livre

**Body :**
```json
{
  "userId": 1,
  "bookId": 1
}
```

**Réponse 200 (succès) :**
```
Jean Dupont has borrowed one copy of "Le Petit Prince"!
```

---

### `GET /borrow` — Lister tous les emprunts

> ❌ Pas de token requis

---

### `PUT /borrow` — Retourner un livre

**Body :**
```json
{
  "borrowId": 1,
  "bookId": 1,
  "userId": 1
}
```

---

### `GET /borrow/user/{id}` — Voir les emprunts d'un utilisateur

**URL :** `GET /borrow/user/1`

---

### `GET /borrow/book/{id}` — Voir l'historique d'emprunt d'un livre

**URL :** `GET /borrow/book/1`

---

## 🗓️ Gestion des Réservations (ReservationController)

> 🔒 **Tous les endpoints de réservation exigent un JWT valide.**
>
> - **401 Unauthorized** : token absent, invalide ou expiré (RS-01)
> - **403 Forbidden** : authentifié mais sans droits (rôle ou propriété — RS-02, RS-03)

| Endpoint | Anonyme | ADHERENT | BIBLIOTHECAIRE |
|----------|---------|----------|----------------|
| `POST /api/reservations` | 401 | ✅ pour lui-même uniquement | ✅ pour n'importe qui |
| `GET /api/reservations` | 401 | ✅ ses réservations seulement | ✅ toutes |
| `GET /api/reservations/{id}` | 401 | ✅ si elle lui appartient | ✅ toutes |
| `PATCH /api/reservations/{id}/annuler` | 401 | ✅ si elle lui appartient | ✅ toutes |
| `DELETE /api/reservations/{id}` | 401 | ❌ 403 | ✅ |
| `GET /api/reservations/expired` | 401 | ✅ les siennes | ✅ toutes |

### `POST /api/reservations` — Créer une réservation

> ✅ Nécessite `Authorization: Bearer <token>` (ADHERENT ou BIBLIOTHECAIRE)
>
> 🛡️ **RS-04 :** l'adhérent concerné est toujours l'utilisateur connecté (extrait du jeton JWT).
> Tout `adherentId` envoyé dans le corps est **ignoré** par le serveur.

**Body :**
```json
{
  "livreId": 1
}
```

*(Un `adherentId` peut encore être envoyé pour compatibilité, mais il est ignoré.)*

**Réponse 201 :**
```json
{
  "reservationId": 1,
  "livreId": 1,
  "livreName": "Le Petit Prince",
  "adherentId": 1,
  "adherentName": "Jean Dupont",
  "dateReservation": "2026-08-21T10:00:00.000+0000",
  "dateExpiration": "2026-08-28T10:00:00.000+0000",
  "statut": "EN_ATTENTE"
}
```

**Erreurs :** `400` livreId manquant · `401` sans token · `404` livre introuvable · `409` RG-01/RG-02/RG-03

---

### `GET /api/reservations` — Lister les réservations

> ✅ Nécessite `Authorization: Bearer <token>`

- **ADHERENT** : retourne **uniquement ses propres réservations** (RS-05). Le filtre `adherentId` est ignoré et forcé à son identifiant.
- **BIBLIOTHECAIRE** : voit toutes les réservations ; filtres optionnels `statut` et `adherentId`.

**Sans filtre :** `GET /api/reservations`

**Filtrer par statut :** `GET /api/reservations?statut=EN_ATTENTE`

**Filtrer par membre (BIBLIOTHECAIRE) :** `GET /api/reservations?adherentId=1`

**Réponse 200 :**
```json
[
  {
    "reservationId": 1,
    "livreId": 1,
    "livreName": "Le Petit Prince",
    "adherentId": 1,
    "adherentName": "Jean Dupont",
    "dateReservation": "2026-08-21T10:00:00.000+0000",
    "dateExpiration": "2026-08-28T10:00:00.000+0000",
    "statut": "EN_ATTENTE"
  }
]
```

---

### `GET /api/reservations/{id}` — Obtenir une réservation par ID

> ✅ Nécessite `Authorization: Bearer <token>`
>
> 🛡️ **RS-03 :** un ADHERENT qui consulte la réservation d'un autre reçoit **403**.

**URL :** `GET /api/reservations/1`

**Erreurs :** `401` sans token · `403` réservation d'un autre adhérent · `404` introuvable

---

### `PATCH /api/reservations/{id}/annuler` — Annuler une réservation

> ✅ Nécessite `Authorization: Bearer <token>`
>
> 🛡️ **RS-03 :** un ADHERENT ne peut annuler que ses propres réservations (**403** sinon).

**URL :** `PATCH /api/reservations/1/annuler`

**Erreurs :** `401` sans token · `403` réservation d'un autre · `404` introuvable · `409` RG-05

---

### `DELETE /api/reservations/{id}` — Supprimer une réservation

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **BIBLIOTHECAIRE**
>
> 🛡️ **RS-02 :** un ADHERENT reçoit **403**.

**URL :** `DELETE /api/reservations/1`

**Réponse 204 :** *(aucun contenu)*

---

### `GET /api/reservations/expired` — Lister les réservations expirées

> ✅ Nécessite `Authorization: Bearer <token>`

- **ADHERENT** : uniquement ses propres réservations expirées.
- **BIBLIOTHECAIRE** : toutes.

---

## 📋 Valeurs des Enums

### `ReservationStatut`

| Valeur | Description |
|---|---|
| `EN_ATTENTE` | En attente de disponibilité |
| `DISPONIBLE` | Livre disponible pour retrait |
| `ANNULEE` | Réservation annulée |
| `EXPIREE` | Réservation expirée |
| `HONOREE` | Réservation honorée (livre retiré) |

### `Role`

| Valeur | Description |
|---|---|
| `ADHERENT` | Membre : emprunts et réservations pour lui-même uniquement |
| `BIBLIOTHECAIRE` | Bibliothécaire : gestion complète (livres, utilisateurs, réservations) |

> Le seed (`data.sql`) attribue `BIBLIOTHECAIRE` au compte `admin` et `ADHERENT` au compte `user`.

---

## 🚀 Ordre de test recommandé

1. **`POST /authenticate`** → Se connecter avec `admin/admin123` (rôle BIBLIOTHECAIRE) et récupérer le JWT
2. **`POST /authenticate`** → Se connecter avec `user/user123` (rôle ADHERENT) et récupérer le JWT
3. **Sans token** : `GET /api/reservations` → **401** (RS-01)
4. **Avec token ADHERENT** : `GET /api/reservations` → **200**, ses réservations seulement (RS-05)
5. **Avec token ADHERENT** : `GET /api/reservations/{id d'un autre}` → **403** (RS-03)
6. **Avec token ADHERENT** : `POST /api/reservations` avec `adherentId` d'un autre → créé pour l'utilisateur du token (RS-04)
7. **Avec token ADHERENT** : `DELETE /api/reservations/{id}` → **403** (RS-02)
8. **Avec token BIBLIOTHECAIRE** : `DELETE /api/reservations/{id}` → **204**
9. **`POST /admin/books`** → Créer un livre (avec le token BIBLIOTHECAIRE)
10. **`POST /borrow`** → Emprunter le livre
