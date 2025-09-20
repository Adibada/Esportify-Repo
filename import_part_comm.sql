-- Import data for participations
INSERT INTO participations (user_id, evenements_id, statut, score) VALUES 
(1,1,'valide',400),
(1,2,'valide',NULL),
(1,43,'valide',NULL),
(1,44,'valide',NULL),
(1,46,'valide',NULL),
(23,1,'valide',NULL),
(23,4,'en_attente',NULL),
(23,44,'en_attente',NULL);

-- Import data for commentaires
INSERT INTO commentaires (id, evenement_id, user_id, contenu, created_at) VALUES 
(2,2,1,'coeur!','2025-09-08 19:29:48'),
(3,2,1,'oups! pardon trop emotive :$','2025-09-08 19:30:26'),
(6,2,23,'ouuuuuuah j\'ai trop hâte !!','2025-09-08 21:05:53'),
(7,2,32,'Eh mais ca a l\'air trop bien cet event! <3','2025-09-09 20:32:47'),
(8,2,32,'en plus le site est canon ;)','2025-09-09 20:32:59'),
(9,4,32,'Je vais tout donner !','2025-09-10 18:47:09');
