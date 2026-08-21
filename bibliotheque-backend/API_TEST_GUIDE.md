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

---

## 👤 Gestion des Utilisateurs (AdminController)

### `POST /admin/users` — Créer un utilisateur

> ❌ Pas de token requis (non sécurisé actuellement)

**Body :**
```json
{
  "username": "jean.dupont",
  "name": "Jean Dupont",
  "password": "motdepasse123",
  "role": [
    {
      "roleName": "Admin"
    }
  ]
}
```

**Pour créer un user normal :**
```json
{
  "username": "marie.martin",
  "name": "Marie Martin",
  "password": "motdepasse456",
  "role": [
    {
      "roleName": "User"
    }
  ]
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
      "roleId": 2,
      "roleName": "Admin"
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

**Réponse 200 :**
```json
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
}
```

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

**Réponse 200 :**
```json
{
  "userId": 2,
  "username": "jean.dupont",
  "name": "Jean Dupont Modified",
  "role": [
    {
      "roleId": 3,
      "roleName": "User"
    }
  ]
}
```

---

## 📖 Gestion des Livres (BooksController)

### `GET /admin/books` — Lister tous les livres

> ❌ Pas de token requis

**Réponse 200 :**
```json
[
  {
    "bookId": 1,
    "bookName": "Le Petit Prince",
    "bookAuthor": "Antoine de Saint-Exupéry",
    "bookGenre": "Conte",
    "noOfCopies": 3
  },
  {
    "bookId": 2,
    "bookName": "L'Étranger",
    "bookAuthor": "Albert Camus",
    "bookGenre": "Roman",
    "noOfCopies": 5
  }
]
```

---

### `GET /admin/books/{id}` — Obtenir un livre par ID

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**URL :** `GET /admin/books/1`

**Réponse 200 :**
```json
{
  "bookId": 1,
  "bookName": "Le Petit Prince",
  "bookAuthor": "Antoine de Saint-Exupéry",
  "bookGenre": "Conte",
  "noOfCopies": 3
}
```

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

**Réponse 200 :**
```json
{
  "bookId": 3,
  "bookName": "Les Misérables",
  "bookAuthor": "Victor Hugo",
  "bookGenre": "Roman",
  "noOfCopies": 10
}
```

---

### `PUT /admin/books/{id}` — Modifier un livre

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**URL :** `PUT /admin/books/1`

**Body :**
```json
{
  "bookName": "Le Petit Prince (édition corrigée)",
  "bookAuthor": "Antoine de Saint-Exupéry",
  "bookGenre": "Conte philosophique",
  "noOfCopies": 5
}
```

**Réponse 200 :**
```json
{
  "bookId": 1,
  "bookName": "Le Petit Prince (édition corrigée)",
  "bookAuthor": "Antoine de Saint-Exupéry",
  "bookGenre": "Conte philosophique",
  "noOfCopies": 5
}
```

---

### `DELETE /admin/books/{id}` — Supprimer un livre

> ✅ Nécessite `Authorization: Bearer <token>` avec le rôle **Admin**

**URL :** `DELETE /admin/books/3`

**Réponse 200 :**
```json
{
  "deleted": true
}
```

---

## 📚 Gestion des Emprunts (BorrowController)

### `POST /borrow` — Emprunter un livre

> ❌ Pas de token requis

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

**Réponse 200 (échec - pas de stock) :**
```
The book "Le Petit Prince" is out of stock!
```

> 📝 Les dates `issueDate` et `dueDate` (7 jours plus tard) sont définies automatiquement par le serveur.

---

### `GET /borrow` — Lister tous les emprunts

> ❌ Pas de token requis

**Réponse 200 :**
```json
[
  {
    "borrowId": 1,
    "bookId": 1,
    "userId": 1,
    "issueDate": "2026-08-21T10:00:00.000+0000",
    "returnDate": null,
    "dueDate": "2026-08-28T10:00:00.000+0000"
  }
]
```

---

### `PUT /borrow` — Retourner un livre

> ❌ Pas de token requis

**Body :**
```json
{
  "borrowId": 1,
  "bookId": 1,
  "userId": 1
}
```

**Réponse 200 :**
```json
{
  "borrowId": 1,
  "bookId": 1,
  "userId": 1,
  "issueDate": "2026-08-21T10:00:00.000+0000",
  "returnDate": "2026-08-22T14:30:00.000+0000",
  "dueDate": "2026-08-28T10:00:00.000+0000"
}
```

> 📝 La `returnDate` est définie automatiquement à la date courante.

---

### `GET /borrow/user/{id}` — Voir les emprunts d'un utilisateur

> ❌ Pas de token requis

**URL :** `GET /borrow/user/1`

**Réponse 200 :**
```json
[
  {
    "borrowId": 1,
    "bookId": 1,
    "userId": 1,
    "issueDate": "2026-08-21T10:00:00.000+0000",
    "returnDate": null,
    "dueDate": "2026-08-28T10:00:00.000+0000"
  }
]
```

---

### `GET /borrow/book/{id}` — Voir l'historique d'emprunt d'un livre

> ❌ Pas de token requis

**URL :** `GET /borrow/book/1`

**Réponse 200 :**
```json
[
  {
    "borrowId": 1,
    "bookId": 1,
    "userId": 1,
    "issueDate": "2026-08-21T10:00:00.000+0000",
    "returnDate": "2026-08-22T14:30:00.000+0000",
    "dueDate": "2026-08-28T10:00:00.000+0000"
  }
]
```

---

## 🗓️ Gestion des Réservations (ReservationController)

### `POST /api/reservations` — Créer une réservation

> ❌ Pas de token requis

**Body :**
```json
{
  "livreId": 1,
  "adherentId": 1
}
```

**Réponse 201 :**
```json
{
  "reservationId": 1,
  "livreId": 1,
  "livreName": "Le Petit Prince",
  "adherentId": 1,
  "adherentName": "Jean Dupont",
  "dateReservation": "2026-08-21T10:00:00.000+0000",
  "dateExpiration": "2026-08-24T10:00:00.000+0000",
  "statut": "EN_ATTENTE"
}
```

---

### `GET /api/reservations` — Lister les réservations (filtrage optionnel)

> ❌ Pas de token requis

**Sans filtre :** `GET /api/reservations`

**Filtrer par statut :** `GET /api/reservations?statut=EN_ATTENTE`

**Filtrer par membre :** `GET /api/reservations?adherentId=1`

**Filtrer les deux :** `GET /api/reservations?statut=EN_ATTENTE&adherentId=1`

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
    "dateExpiration": "2026-08-24T10:00:00.000+0000",
    "statut": "EN_ATTENTE"
  }
]
```

---

### `GET /api/reservations/{id}` — Obtenir une réservation par ID

> ❌ Pas de token requis

**URL :** `GET /api/reservations/1`

**Réponse 200 :**
```json
{
  "reservationId": 1,
  "livreId": 1,
  "livreName": "Le Petit Prince",
  "adherentId": 1,
  "adherentName": "Jean Dupont",
  "dateReservation": "2026-08-21T10:00:00.000+0000",
  "dateExpiration": "2026-08-24T10:00:00.000+0000",
  "statut": "EN_ATTENTE"
}
```

---

### `PATCH /api/reservations/{id}/annuler` — Annuler une réservation

> ❌ Pas de token requis

**URL :** `PATCH /api/reservations/1/annuler`

**Réponse 200 :**
```json
{
  "reservationId": 1,
  "livreId": 1,
  "livreName": "Le Petit Prince",
  "adherentId": 1,
  "adherentName": "Jean Dupont",
  "dateReservation": "2026-08-21T10:00:00.000+0000",
  "dateExpiration": "2026-08-24T10:00:00.000+0000",
  "statut": "ANNULEE"
}
```

---

### `DELETE /api/reservations/{id}` — Supprimer une réservation

> ❌ Pas de token requis

**URL :** `DELETE /api/reservations/1`

**Réponse 204 :** *(aucun contenu)*

---

### `GET /api/reservations/expired` — Lister les réservations expirées

> ❌ Pas de token requis

**Réponse 200 :**
```json
[
  {
    "reservationId": 2,
    "livreId": 2,
    "livreName": "L'Étranger",
    "adherentId": 2,
    "adherentName": "Marie Martin",
    "dateReservation": "2026-08-17T10:00:00.000+0000",
    "dateExpiration": "2026-08-20T10:00:00.000+0000",
    "statut": "EXPIREE"
  }
]
```

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
| `Admin` | Administrateur (accès complet) |
| `User` | Utilisateur standard |

---

## 🚀 Ordre de test recommandé

1. **`POST /admin/users`** → Créer un admin
2. **`POST /authenticate`** → Se connecter avec cet admin et récupérer le JWT
3. **`POST /admin/books`** → Créer un livre (avec le token Admin)
4. **`GET /admin/books`** → Vérifier le livre créé
5. **`POST /borrow`** → Emprunter le livre
6. **`GET /borrow`** → Vérifier l'emprunt
7. **`PUT /borrow`** → Retourner le livre
8. **`POST /api/reservations`** → Créer une réservation
9. **`PATCH /api/reservations/1/annuler`** → Annuler la réservation
10. **`GET /admin/users`** → Vérifier les users (Admin only)
