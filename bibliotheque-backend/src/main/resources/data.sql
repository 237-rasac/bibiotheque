-- ============================================================
-- Seed : comptes par defaut
--   Administrateur : admin / admin123   (role Admin)
--   Utilisateur    : user  / user123    (role User)
-- ============================================================

-- 1. Roles par defaut (crees uniquement s'ils n'existent pas)
INSERT INTO role (role_name)
SELECT 'Admin'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE role_name = 'Admin');

INSERT INTO role (role_name)
SELECT 'User'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE role_name = 'User');

-- 2. Utilisateur admin (cree uniquement s'il n'existe pas)
--    La colonne user_id n'a pas de valeur par defaut : Hibernate
--    fournit l'id via la sequence hibernate_sequence (valeur par
--    defaut de GenerationType.AUTO en Hibernate 5.x), il faut donc
--    appeler nextval() explicitement dans le seed.
INSERT INTO users (user_id, username, password, name)
SELECT nextval('hibernate_sequence')::integer, 'admin', '$2a$10$kZeiDHtXnCRvKLMEYQ3rbOTqYzL8QGymBGT9RX9TqnGwAbODrC7vK', 'Administrateur'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 2b. Si le compte admin existe deja avec un autre mot de passe,
--     on resynchronise son hash sur admin123 (seed auto-correcteur).
UPDATE users
SET password = '$2a$10$kZeiDHtXnCRvKLMEYQ3rbOTqYzL8QGymBGT9RX9TqnGwAbODrC7vK'
WHERE username = 'admin'
  AND password IS DISTINCT FROM '$2a$10$kZeiDHtXnCRvKLMEYQ3rbOTqYzL8QGymBGT9RX9TqnGwAbODrC7vK';

-- 3. Utilisateur exemple (cree uniquement s'il n'existe pas)
INSERT INTO users (user_id, username, password, name)
SELECT nextval('hibernate_sequence')::integer, 'user', '$2a$10$33G/VlD2wy8NTb8wBK4L0.iWC2in0ug0TnRi/f0J6XPBflsl0TPPG', 'Utilisateur'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'user');

-- 3b. Resynchronisation du mot de passe du compte exemple sur user123.
UPDATE users
SET password = '$2a$10$33G/VlD2wy8NTb8wBK4L0.iWC2in0ug0TnRi/f0J6XPBflsl0TPPG'
WHERE username = 'user'
  AND password IS DISTINCT FROM '$2a$10$33G/VlD2wy8NTb8wBK4L0.iWC2in0ug0TnRi/f0J6XPBflsl0TPPG';

-- 4. Liaisons utilisateurs <-> roles dans la table USER_ROLE
INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN role r ON r.role_name = 'Admin'
WHERE u.username = 'admin'
  AND NOT EXISTS (
      SELECT 1 FROM user_role ur
      WHERE ur.user_id = u.user_id AND ur.role_id = r.role_id
  );

INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN role r ON r.role_name = 'User'
WHERE u.username = 'user'
  AND NOT EXISTS (
      SELECT 1 FROM user_role ur
      WHERE ur.user_id = u.user_id AND ur.role_id = r.role_id
  );
