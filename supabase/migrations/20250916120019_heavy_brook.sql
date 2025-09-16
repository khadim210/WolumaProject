/*
  # Seed Data Migration

  1. Insert mock users
  2. Insert mock partners
  3. Insert mock form templates
  4. Insert mock programs with criteria
  5. Insert mock projects with evaluations

  Note: This migration populates the database with the existing mock data
  to maintain functionality during the transition to Supabase.
*/

-- Insert mock users (these will be linked to auth.users later)
INSERT INTO users (id, name, email, role, organization, is_active, created_at, last_login) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin@woluma.com', 'admin', NULL, true, '2024-01-01T00:00:00Z', '2025-01-15T10:00:00Z'),
  ('00000000-0000-0000-0000-000000000002', 'Partner User', 'contact@innovation-afrique.org', 'partner', 'Fondation Innovation Afrique', true, '2024-02-01T00:00:00Z', '2025-01-14T09:00:00Z'),
  ('00000000-0000-0000-0000-000000000003', 'Portfolio Manager', 'manager@example.com', 'manager', NULL, true, '2024-03-01T00:00:00Z', '2025-01-13T08:00:00Z'),
  ('00000000-0000-0000-0000-000000000004', 'Project Submitter', 'submitter@example.com', 'submitter', 'Submitter Organization', true, '2024-04-01T00:00:00Z', '2025-01-12T07:00:00Z'),
  ('00000000-0000-0000-0000-000000000005', 'Inactive User', 'inactive@example.com', 'submitter', 'Old Company', false, '2024-05-01T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert mock partners
INSERT INTO partners (id, name, description, contact_email, contact_phone, is_active, created_at, assigned_manager_id) VALUES
  ('00000000-0000-0000-0000-000000000101', 'Fondation Innovation Afrique', 'Fondation dédiée à l''innovation technologique en Afrique', 'contact@innovation-afrique.org', '+225 01 02 03 04', true, '2024-01-15T00:00:00Z', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000102', 'Banque de Développement', 'Institution financière pour le développement économique', 'projets@banque-dev.ci', '+225 05 06 07 08', true, '2024-02-01T00:00:00Z', '00000000-0000-0000-0000-000000000003'),
  ('00000000-0000-0000-0000-000000000103', 'Ministère de l''Innovation', 'Ministère en charge de l''innovation et des nouvelles technologies', 'innovation@gouv.ci', NULL, true, '2024-01-10T00:00:00Z', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert mock form templates
INSERT INTO form_templates (id, name, description, fields, is_active, created_at, updated_at) VALUES
  ('00000000-0000-0000-0000-000000000201', 'Appel à projets innovation', 'Formulaire standard pour les projets d''innovation technologique', 
   '[
     {
       "id": "f1",
       "type": "text",
       "label": "Titre du projet",
       "name": "projectTitle",
       "required": true,
       "placeholder": "Entrez le titre de votre projet"
     },
     {
       "id": "f2",
       "type": "textarea",
       "label": "Description du projet",
       "name": "projectDescription",
       "required": true,
       "placeholder": "Décrivez votre projet en détail"
     },
     {
       "id": "f3",
       "type": "number",
       "label": "Budget demandé",
       "name": "requestedBudget",
       "required": true,
       "placeholder": "Montant en euros"
     },
     {
       "id": "f4",
       "type": "select",
       "label": "Secteur d''activité",
       "name": "sector",
       "required": true,
       "options": ["Technologies", "Santé", "Environnement", "Education", "Autre"]
     }
   ]'::jsonb, 
   true, '2025-01-01T00:00:00Z', '2025-01-01T00:00:00Z')
ON CONFLICT (id) DO NOTHING;

-- Insert mock programs
INSERT INTO programs (id, name, description, partner_id, form_template_id, budget, start_date, end_date, is_active, created_at, manager_id, selection_criteria, evaluation_criteria, custom_ai_prompt) VALUES
  ('00000000-0000-0000-0000-000000000301', 'Programme Innovation Tech 2025', 'Programme de financement pour les startups technologiques', 
   '00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000201', 500000000, '2025-01-01', '2025-12-31', true, '2024-12-01T00:00:00Z', '00000000-0000-0000-0000-000000000003',
   '[
     {
       "id": "c1",
       "name": "Budget maximum",
       "description": "Budget maximum autorisé pour le projet",
       "type": "number",
       "required": true,
       "minValue": 10000,
       "maxValue": 1000000
     },
     {
       "id": "c2",
       "name": "Secteur d''activité",
       "description": "Secteur d''activité du projet",
       "type": "select",
       "required": true,
       "options": ["Technologies", "Santé", "Environnement", "Education", "Agriculture"]
     },
     {
       "id": "c3",
       "name": "Durée du projet",
       "description": "Durée maximale du projet en mois",
       "type": "range",
       "required": true,
       "minValue": 6,
       "maxValue": 36
     }
   ]'::jsonb,
   '[
     {
       "id": "e1",
       "name": "Innovation et originalité",
       "description": "Niveau d''innovation et d''originalité du projet",
       "weight": 25,
       "maxScore": 20
     },
     {
       "id": "e2",
       "name": "Faisabilité technique",
       "description": "Capacité technique à réaliser le projet",
       "weight": 20,
       "maxScore": 20
     },
     {
       "id": "e3",
       "name": "Impact et pertinence",
       "description": "Impact potentiel et pertinence du projet",
       "weight": 25,
       "maxScore": 20
     },
     {
       "id": "e4",
       "name": "Réalisme budgétaire",
       "description": "Réalisme et justification du budget demandé",
       "weight": 15,
       "maxScore": 20
     },
     {
       "id": "e5",
       "name": "Compétence de l''équipe",
       "description": "Compétences et expérience de l''équipe projet",
       "weight": 15,
       "maxScore": 20
     }
   ]'::jsonb, NULL),
  
  ('00000000-0000-0000-0000-000000000302', 'Fonds Développement Durable', 'Financement de projets environnementaux et durables', 
   '00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000201', 750000000, '2025-02-01', '2026-01-31', true, '2024-11-15T00:00:00Z', '00000000-0000-0000-0000-000000000003',
   '[
     {
       "id": "c4",
       "name": "Impact environnemental",
       "description": "Le projet doit avoir un impact environnemental positif",
       "type": "boolean",
       "required": true,
       "defaultValue": true
     },
     {
       "id": "c5",
       "name": "Zone géographique",
       "description": "Zone géographique d''intervention",
       "type": "select",
       "required": true,
       "options": ["Urbaine", "Rurale", "Côtière", "Forestière"]
     },
     {
       "id": "c6",
       "name": "Nombre de bénéficiaires",
       "description": "Nombre minimum de bénéficiaires directs",
       "type": "number",
       "required": true,
       "minValue": 100,
       "maxValue": 50000
     }
   ]'::jsonb,
   '[
     {
       "id": "e6",
       "name": "Impact environnemental",
       "description": "Mesure de l''impact positif sur l''environnement",
       "weight": 30,
       "maxScore": 20
     },
     {
       "id": "e7",
       "name": "Durabilité du projet",
       "description": "Capacité du projet à perdurer dans le temps",
       "weight": 25,
       "maxScore": 20
     },
     {
       "id": "e8",
       "name": "Nombre de bénéficiaires",
       "description": "Étendue de l''impact sur les populations",
       "weight": 20,
       "maxScore": 20
     },
     {
       "id": "e9",
       "name": "Innovation sociale",
       "description": "Caractère innovant de l''approche sociale",
       "weight": 15,
       "maxScore": 20
     },
     {
       "id": "e10",
       "name": "Partenariats locaux",
       "description": "Qualité des partenariats avec les acteurs locaux",
       "weight": 10,
       "maxScore": 20
     }
   ]'::jsonb, NULL),
  
  ('00000000-0000-0000-0000-000000000303', 'Initiative Jeunes Entrepreneurs', 'Programme d''accompagnement pour jeunes entrepreneurs', 
   '00000000-0000-0000-0000-000000000101', NULL, 200000000, '2025-03-01', '2025-08-31', true, '2024-12-10T00:00:00Z', NULL,
   '[
     {
       "id": "c7",
       "name": "Âge du porteur",
       "description": "Âge maximum du porteur de projet",
       "type": "number",
       "required": true,
       "minValue": 18,
       "maxValue": 35
     },
     {
       "id": "c8",
       "name": "Expérience entrepreneuriale",
       "description": "Le porteur a-t-il une expérience entrepreneuriale préalable ?",
       "type": "boolean",
       "required": false,
       "defaultValue": false
     },
     {
       "id": "c9",
       "name": "Description du projet",
       "description": "Description détaillée du projet",
       "type": "text",
       "required": true,
       "maxLength": 2000
     }
   ]'::jsonb,
   '[
     {
       "id": "e11",
       "name": "Potentiel entrepreneurial",
       "description": "Évaluation du potentiel entrepreneurial du porteur",
       "weight": 35,
       "maxScore": 20
     },
     {
       "id": "e12",
       "name": "Viabilité économique",
       "description": "Viabilité économique du modèle proposé",
       "weight": 30,
       "maxScore": 20
     },
     {
       "id": "e13",
       "name": "Innovation du concept",
       "description": "Caractère innovant du concept d''entreprise",
       "weight": 20,
       "maxScore": 20
     },
     {
       "id": "e14",
       "name": "Capacité d''exécution",
       "description": "Capacité à exécuter le plan d''affaires",
       "weight": 15,
       "maxScore": 20
     }
   ]'::jsonb, NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert mock projects
INSERT INTO projects (id, title, description, status, budget, timeline, submitter_id, program_id, created_at, updated_at, submission_date, tags, evaluation_scores, evaluation_comments, total_evaluation_score, evaluation_notes, evaluated_by, evaluation_date, formalization_completed, nda_signed, recommended_status) VALUES
  ('00000000-0000-0000-0000-000000000401', 'Recherche sur les Énergies Renouvelables', 'Projet de recherche visant à améliorer l''efficacité des panneaux solaires de 20%', 'submitted', 150000000, '18 mois', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000301', '2025-01-15T00:00:00Z', '2025-01-15T00:00:00Z', '2025-01-15T00:00:00Z', '["énergie", "recherche", "développement durable"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000402', 'Initiative d''Agriculture Urbaine', 'Création de solutions d''agriculture verticale pour les environnements urbains denses', 'pre_selected', 75000000, '12 mois', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000302', '2025-01-10T00:00:00Z', '2025-01-20T00:00:00Z', '2025-01-10T00:00:00Z', '["agriculture", "urbain", "développement durable"]'::jsonb, NULL, NULL, 87, 'Proposition solide avec un potentiel de marché clair', '00000000-0000-0000-0000-000000000003', '2025-01-20T00:00:00Z', false, false, 'pre_selected'),
  
  ('00000000-0000-0000-0000-000000000403', 'IA pour le Diagnostic Médical', 'Développement de solutions d''IA pour améliorer la détection précoce des maladies', 'formalization', 300000000, '24 mois', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000301', '2024-12-05T00:00:00Z', '2025-01-25T00:00:00Z', '2024-12-05T00:00:00Z', '["santé", "IA", "technologie"]'::jsonb, NULL, NULL, 95, 'Équipe de recherche exceptionnelle avec des résultats préliminaires prometteurs', '00000000-0000-0000-0000-000000000003', '2025-01-25T00:00:00Z', false, false, 'selected'),
  
  ('00000000-0000-0000-0000-000000000404', 'Initiative de Nettoyage des Océans', 'Développement de systèmes automatisés pour la collecte des plastiques océaniques', 'financed', 200000000, '18 mois', '00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000302', '2024-11-20T00:00:00Z', '2025-01-30T00:00:00Z', '2024-11-20T00:00:00Z', '["environnement", "nettoyage", "océan", "développement durable"]'::jsonb, 
   '{
     "Impact environnemental": 18,
     "Durabilité du projet": 17,
     "Nombre de bénéficiaires": 19,
     "Innovation sociale": 16,
     "Partenariats locaux": 18
   }'::jsonb,
   '{
     "Impact environnemental": "Excellent impact sur la réduction de la pollution océanique",
     "Durabilité du projet": "Système autonome avec maintenance minimale",
     "Nombre de bénéficiaires": "Impact global sur l''écosystème marin",
     "Innovation sociale": "Sensibilisation et engagement communautaire",
     "Partenariats locaux": "Collaboration avec ONG environnementales"
   }'::jsonb,
   92, 'Évaluation automatique basée sur l''analyse du contenu du projet. Score total calculé: 92%. Projet très prometteur avec des critères solides.', '00000000-0000-0000-0000-000000000003', '2025-01-30T00:00:00Z', true, true, 'selected'),
  
  -- Additional projects for testing AI evaluation
  ('00000000-0000-0000-0000-000000000405', 'Plateforme de E-learning Intelligente', 'Développement d''une plateforme d''apprentissage en ligne utilisant l''IA pour personnaliser les parcours éducatifs selon les besoins de chaque apprenant. La solution intègre des algorithmes de machine learning pour analyser les performances et adapter le contenu.', 'submitted', 180000000, '15 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000301', '2025-01-20T00:00:00Z', '2025-01-20T00:00:00Z', '2025-01-20T00:00:00Z', '["éducation", "IA", "e-learning", "technologie"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000406', 'Application Mobile de Télémédecine', 'Création d''une application mobile permettant aux patients ruraux de consulter des médecins spécialisés à distance. L''app inclut des fonctionnalités de diagnostic préliminaire par IA et de suivi médical personnalisé.', 'submitted', 120000000, '12 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000301', '2025-01-18T00:00:00Z', '2025-01-18T00:00:00Z', '2025-01-18T00:00:00Z', '["santé", "télémédecine", "mobile", "IA"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000407', 'Système de Gestion Intelligente de l''Énergie', 'Développement d''un système IoT pour optimiser la consommation énergétique des bâtiments commerciaux. Utilise des capteurs intelligents et des algorithmes prédictifs pour réduire la consommation d''énergie de 30%.', 'submitted', 250000000, '20 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000301', '2025-01-22T00:00:00Z', '2025-01-22T00:00:00Z', '2025-01-22T00:00:00Z', '["énergie", "IoT", "optimisation", "bâtiment intelligent"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000408', 'Programme de Reforestation Communautaire', 'Initiative de plantation d''arbres impliquant les communautés locales pour restaurer 5000 hectares de forêt dégradée. Le projet inclut la formation des populations locales et la création d''une pépinière communautaire.', 'submitted', 95000000, '36 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000302', '2025-01-19T00:00:00Z', '2025-01-19T00:00:00Z', '2025-01-19T00:00:00Z', '["environnement", "reforestation", "communauté", "formation"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000409', 'Système de Traitement des Eaux Usées Écologique', 'Installation de systèmes de traitement des eaux usées utilisant des technologies naturelles (phytoépuration) pour 10 villages ruraux. Solution durable et peu coûteuse en maintenance.', 'submitted', 140000000, '18 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000302', '2025-01-21T00:00:00Z', '2025-01-21T00:00:00Z', '2025-01-21T00:00:00Z', '["eau", "traitement", "écologique", "rural"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000410', 'Ferme Solaire Communautaire', 'Construction d''une ferme solaire de 2MW gérée par la communauté locale. Le projet vise à fournir de l''électricité propre à 3000 foyers tout en générant des revenus pour la communauté.', 'submitted', 320000000, '24 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000302', '2025-01-23T00:00:00Z', '2025-01-23T00:00:00Z', '2025-01-23T00:00:00Z', '["énergie solaire", "communauté", "électricité", "revenus"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000411', 'Marketplace de Produits Locaux', 'Création d''une plateforme en ligne connectant les producteurs locaux aux consommateurs urbains. L''objectif est de réduire les intermédiaires et d''augmenter les revenus des producteurs de 40%.', 'submitted', 45000000, '10 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000303', '2025-01-17T00:00:00Z', '2025-01-17T00:00:00Z', '2025-01-17T00:00:00Z', '["marketplace", "agriculture", "local", "e-commerce"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000412', 'Service de Livraison Écologique à Vélo', 'Lancement d''un service de livraison urbaine utilisant uniquement des vélos électriques. Service rapide, écologique et créateur d''emplois pour les jeunes. Objectif : 50 livreurs en 6 mois.', 'submitted', 35000000, '8 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000303', '2025-01-16T00:00:00Z', '2025-01-16T00:00:00Z', '2025-01-16T00:00:00Z', '["livraison", "écologique", "vélo", "emploi jeunes"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL),
  
  ('00000000-0000-0000-0000-000000000413', 'Atelier de Fabrication de Meubles Recyclés', 'Création d''un atelier de fabrication de meubles à partir de matériaux recyclés. Formation de 20 jeunes artisans et commercialisation via des showrooms et vente en ligne.', 'submitted', 28000000, '12 mois', '00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000303', '2025-01-24T00:00:00Z', '2025-01-24T00:00:00Z', '2025-01-24T00:00:00Z', '["meubles", "recyclage", "artisanat", "formation"]'::jsonb, NULL, NULL, NULL, NULL, NULL, NULL, false, false, NULL)
ON CONFLICT (id) DO NOTHING;