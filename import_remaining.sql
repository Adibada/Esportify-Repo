-- Import data for evenements (without users - they are already there)
INSERT INTO evenements (id, organisateur_id, titre, description, start, end, statut, lot, image) VALUES 
(3,1,'L\'évènement de l\'année !','Un futur classique, c\'est sûr ','2025-09-04 16:19:03','2025-09-06 16:19:03','termine','Médaille d\'or',''),
(43,1,'Ultimate Kart Racing Contest','Courses endiablées et pièges infernaux ','2025-10-18 00:00:00','2025-10-19 00:00:00','valide','Casque de champion',''),
(44,20,'Petite compétition entre amis','Un événement tranquille avec quelques coups de poings','2025-10-25 00:00:00','2025-10-26 03:00:00','valide','Badge d\'amitié',''),
(46,1,'Un Max d\'Adrénaline !!','Des tirs et des explosions dans tous les sens !! ','2025-11-01 10:00:00','2025-11-02 10:00:00','valide','Arme légendaire',''),
(47,20,'Qui sera le meilleur ExFighter ?!','Super-pouvoirs et effets visuels pour des combats féroces et spectaculaires !!!','2025-11-22 01:00:00','2025-11-23 01:00:00','valide','Titre de champion',''),
(50,20,'Tournoi Stratégique','Il va falloir réfléchir vite ','2025-09-19 00:00:00','2025-09-25 00:00:00','refuse','Livre de stratégie',''),
(52,1,'event test','test ','2025-09-19 15:28:00','2025-09-20 15:28:00','refuse','Test prize',''),
(53,20,'autre test','another one ','2025-09-20 11:18:00','2025-09-21 13:18:00','refuse','Another prize','');

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

-- Import data for image_evenement
INSERT INTO image_evenement (id, evenement_id, url, description) VALUES 
(1,1,'https://assets-persist.lovart.ai/agent_images/f9bdc511-2fc7-488e-821a-2622350d927e.png','https://assets-persist.lovart.ai/agent_images/f9bdc511-2fc7-488e-821a-2622350d927e.png'),
(2,2,'https://assets-persist.lovart.ai/agent_images/5df3b20f-369e-47bb-8499-5b403eedd380.png','https://assets-persist.lovart.ai/agent_images/5df3b20f-369e-47bb-8499-5b403eedd380.png'),
(3,3,'https://assets-persist.lovart.ai/agent_images/76a09bfb-9f02-4a3c-a77b-80f91b8d3197.png\r\n\r\n','https://assets-persist.lovart.ai/agent_images/76a09bfb-9f02-4a3c-a77b-80f91b8d3197.png\r\n\r\n'),
(4,4,'https://assets-persist.lovart.ai/agent_images/60449555-75e1-4ee4-be8a-42ed83c3548a.png','https://assets-persist.lovart.ai/agent_images/60449555-75e1-4ee4-be8a-42ed83c3548a.png'),
(5,43,'https://assets-persist.lovart.ai/agent_images/a37c540a-46f7-4b29-b5ea-0835e2d39be9.png','https://assets-persist.lovart.ai/agent_images/a37c540a-46f7-4b29-b5ea-0835e2d39be9.png'),
(6,44,'https://assets-persist.lovart.ai/agent_images/e9446b76-e2c2-43bc-8c32-433e9dc39a97.png','https://assets-persist.lovart.ai/agent_images/e9446b76-e2c2-43bc-8c32-433e9dc39a97.png'),
(7,46,'https://assets-persist.lovart.ai/agent_images/3b0cd85a-5791-427b-bed5-6d5c1a916247.jpg','https://assets-persist.lovart.ai/agent_images/3b0cd85a-5791-427b-bed5-6d5c1a916247.jpg'),
(8,46,'https://assets-persist.lovart.ai/agent_images/5fff31fd-4484-46e0-9456-0da4aca17ca9.jpg','URL: assets-persist.lovart.ai'),
(9,47,'https://assets-persist.lovart.ai/agent_images/622c2382-6d2e-4e6b-91d7-1929ec1491ee.jpg','Un écran de sellection de personnages'),
(10,47,'https://assets-persist.lovart.ai/agent_images/654b64c5-d22f-4138-9214-18280eb5cb3c.jpg','Un écran de sellection de personnages'),
(11,47,'https://assets-persist.lovart.ai/agent_images/a2e76bf3-e835-40e8-9079-39eb2a64c425.jpg','Un écran de sellection de personnages'),
(17,50,'https://assets-persist.lovart.ai/agent_images/68814442-e132-48a9-95ff-b8344b189349.jpg','Champs de bataille RTS'),
(18,50,'https://assets-persist.lovart.ai/agent_images/f05eadcf-71cb-4dc3-bf87-bc96fa1a4a93.jpg','Scène d\'e-sport avec écran géant circulaire au centre '),
(20,52,'https://assets-persist.lovart.ai/agent_images/5fff31fd-4484-46e0-9456-0da4aca17ca9.jpg','aaaa'),
(21,53,'https://assets-persist.lovart.ai/agent_images/a2e76bf3-e835-40e8-9079-39eb2a64c425.jpg','aaaa');
