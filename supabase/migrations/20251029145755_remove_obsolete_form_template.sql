/*
  # Nettoyage des modèles de formulaires redondants

  ## Description
  Cette migration nettoie les modèles de formulaires obsolètes et redondants créés 
  par les anciennes migrations. Le système utilise désormais exclusivement les modèles 
  gérés via l'interface utilisateur et stockés dans Supabase.

  ## Changements
  1. Suppression du modèle générique "Appel à projets innovation" (obsolète)
     - Ce modèle a été remplacé par des modèles spécialisés plus complets
     - ID: 00000000-0000-0000-0000-000000000201
  
  2. Les modèles actuellement actifs sont :
     - Appel à Projets - Santé & Biotechnologies
     - Appel à Projets - Transition Énergétique
     - Appel à Projets - Innovation Numérique & IA
     - Appel à Projets - Innovation Sociale & Solidaire

  ## Notes importantes
  - Le fichier src/data/defaultFormTemplates.ts a été supprimé du code source
  - Le seeding automatique des templates a été désactivé pour éviter les duplications
  - Les modèles sont maintenant gérés exclusivement via l'interface utilisateur
  - Cette migration est idempotente et peut être exécutée plusieurs fois sans risque
*/

-- Suppression du modèle de formulaire obsolète s'il existe
DELETE FROM form_templates 
WHERE id = '00000000-0000-0000-0000-000000000201'
  AND name = 'Appel à projets innovation';

-- Vérification : S'assurer qu'aucun programme n'utilise le template supprimé
-- (Cette requête ne fait que vérifier, elle ne modifie rien)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM programs 
    WHERE form_template_id = '00000000-0000-0000-0000-000000000201'
  ) THEN
    RAISE NOTICE 'ATTENTION: Des programmes utilisent encore le template supprimé. Veuillez les mettre à jour manuellement.';
  ELSE
    RAISE NOTICE 'OK: Aucun programme n''utilise le template supprimé.';
  END IF;
END $$;