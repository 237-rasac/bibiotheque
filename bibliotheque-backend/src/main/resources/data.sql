-- ============================================================
-- Seed : comptes par defaut
--   Administrateur    : admin / admin123   (role BIBLIOTHECAIRE)
--   Utilisateur       : user  / user123    (role ADHERENT)
-- ============================================================

-- 1. Roles du domaine (crees uniquement s'ils n'existent pas)
INSERT INTO role (role_name)
SELECT 'ADHERENT'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE role_name = 'ADHERENT');

INSERT INTO role (role_name)
SELECT 'BIBLIOTHECAIRE'
WHERE NOT EXISTS (SELECT 1 FROM role WHERE role_name = 'BIBLIOTHECAIRE');

-- 2. Utilisateur admin (cree uniquement s'il n'existe pas)
--    La colonne user_id n'a pas de valeur par defaut : Hibernate
--    fournit l'id via la sequence hibernate_sequence (valeur par
--    defaut de GenerationType.AUTO en Hibernate 5.x), il faut donc
--    appeler nextval() explicitement dans le seed.
INSERT INTO users (user_id, username, password, name)
SELECT nextval('hibernate_sequence')::integer, 'admin', '$2a$10$kZeiDHtXnCRvKLMEYQ3rbOTqYzL8QGymBGT9RX9TqnGwAbODrC7vK', 'Administrateur'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'admin');

-- 2b. PAS de re-synchronisation forcee du mot de passe : un UPDATE au
--      demarrage ecraserait les mots de passe reels changes via l'API
--      (c'est ce qui rendait le compte 'user' innavigable apres un restart).

-- 3. Utilisateur exemple (cree uniquement s'il n'existe pas)
INSERT INTO users (user_id, username, password, name)
SELECT nextval('hibernate_sequence')::integer, 'user', '$2a$10$33G/VlD2wy8NTb8wBK4L0.iWC2in0ug0TnRi/f0J6XPBflsl0TPPG', 'Utilisateur'
WHERE NOT EXISTS (SELECT 1 FROM users WHERE username = 'user');

-- 3b. PAS de re-synchronisation forcee du mot de passe (meme raison que 2b).

-- 4. Liaisons utilisateurs <-> roles du domaine dans la table USER_ROLE
--    - admin recoit BIBLIOTHECAIRE (gestion complete : livres, utilisateurs, reservations)
--    - user recoit ADHERENT (emprunts et reservations pour lui-meme uniquement)
INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN role r ON r.role_name = 'BIBLIOTHECAIRE'
WHERE u.username = 'admin'
  AND NOT EXISTS (
      SELECT 1 FROM user_role ur
      WHERE ur.user_id = u.user_id AND ur.role_id = r.role_id
  );

INSERT INTO user_role (user_id, role_id)
SELECT u.user_id, r.role_id
FROM users u
JOIN role r ON r.role_name = 'ADHERENT'
WHERE u.username = 'user'
  AND NOT EXISTS (
      SELECT 1 FROM user_role ur
      WHERE ur.user_id = u.user_id AND ur.role_id = r.role_id
  );

-- 5. Migration des roles legacy (bases existantes) :
--    Admin -> BIBLIOTHECAIRE, User -> ADHERENT.
--    Sur une base neuve ces roles n'existent pas : les requetes sont des no-op.
INSERT INTO user_role (user_id, role_id)
SELECT ur.user_id, dom.role_id
FROM user_role ur
JOIN role legacy ON legacy.role_id = ur.role_id
JOIN role dom ON dom.role_name =
      CASE legacy.role_name
          WHEN 'Admin' THEN 'BIBLIOTHECAIRE'
          WHEN 'User'  THEN 'ADHERENT'
      END
WHERE legacy.role_name IN ('Admin', 'User')
  AND NOT EXISTS (
      SELECT 1 FROM user_role ur2
      WHERE ur2.user_id = ur.user_id AND ur2.role_id = dom.role_id
  );

-- 5b. Suppression des liens puis des roles legacy
DELETE FROM user_role
WHERE role_id IN (SELECT role_id FROM role WHERE role_name IN ('Admin', 'User'));

DELETE FROM role
WHERE role_name IN ('Admin', 'User');
