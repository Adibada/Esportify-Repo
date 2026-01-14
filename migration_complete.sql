-- Import complet des données dans le bon ordre

-- 3. Images d'événements
INSERT INTO `image_evenement` (`id`, `evenement_id`, `filename`, `original_name`) VALUES
(1, 6, 'https://assets-persist.lovart.ai/agent_images/f9bdc511-2fc7-488e-821a-2622350d927e.png', 'Image événement 1'),
(2, 1, 'https://assets-persist.lovart.ai/agent_images/5df3b20f-369e-47bb-8499-5b403eedd380.png', 'Image événement 2'),
(3, 2, 'https://assets-persist.lovart.ai/agent_images/76a09bfb-9f02-4a3c-a77b-80f91b8d3197.png', 'Image événement 3'),
(4, 4, 'https://assets-persist.lovart.ai/agent_images/60449555-75e1-4ee4-be8a-42ed83c3548a.png', 'Image événement 4'),
(5, 43, 'https://assets-persist.lovart.ai/agent_images/a37c540a-46f7-4b29-b5ea-0835e2d39be9.png', 'Image événement 5');

-- 4. Participations (avec les bons user_id: 1=aaa, 23=testuser)
INSERT INTO `participations` (`user_id`, `evenements_id`, `statut`, `score`) VALUES
(1, 6, 'valide', 400),
(1, 1, 'valide', NULL),
(1, 43, 'valide', NULL),
(23, 6, 'valide', NULL);

-- 5. Commentaires (avec les bons user_id: 1=aaa, 23=testuser)
INSERT INTO `commentaires` (`id`, `evenement_id`, `user_id`, `contenu`, `created_at`) VALUES
(2, 1, 1, 'coeur!', '2025-09-08 19:29:48'),
(3, 1, 1, 'oups! pardon trop emotive :$', '2025-09-08 19:30:26'),
(6, 1, 23, 'ouuuuuuah j\'ai trop hâte !!', '2025-09-08 21:05:53');
