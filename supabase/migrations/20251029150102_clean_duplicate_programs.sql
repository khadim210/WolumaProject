/*
  # Nettoyage des programmes dupliqués

  ## Description
  Cette migration supprime les programmes dupliqués créés par des exécutions multiples
  du seeding automatique. Le système a créé 60 copies de chaque programme au lieu d'un seul.

  ## Problème identifié
  - 60 copies de "Innovation Technologique 2025" 
  - 60 copies de "Transition Énergétique Durable"
  - Total: 120 programmes au lieu de 2

  ## Solution
  Conserver uniquement le programme le plus ancien (l'original) pour chaque nom
  et supprimer toutes les copies dupliquées.

  ## Sécurité
  - Aucun projet ne référence actuellement ces programmes (vérifié)
  - Migration idempotente (peut être exécutée plusieurs fois)
  - Utilise les dates de création pour identifier les originaux

  ## Résultat attendu
  - 2 programmes uniques conservés (les originaux)
  - 118 programmes dupliqués supprimés
*/

-- Créer une table temporaire avec les IDs des programmes à conserver (les plus anciens)
CREATE TEMP TABLE programs_to_keep AS
SELECT DISTINCT ON (name) id, name, created_at
FROM programs
ORDER BY name, created_at ASC;

-- Afficher les programmes qui seront conservés
DO $$
DECLARE
  prog RECORD;
BEGIN
  RAISE NOTICE '=== Programmes qui seront conservés ===';
  FOR prog IN 
    SELECT name, id, created_at 
    FROM programs_to_keep 
    ORDER BY name
  LOOP
    RAISE NOTICE 'Programme: % (ID: %, Créé le: %)', prog.name, prog.id, prog.created_at;
  END LOOP;
END $$;

-- Compter les doublons avant suppression
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM programs p
  WHERE p.id NOT IN (SELECT id FROM programs_to_keep);
  
  RAISE NOTICE '=== Statistiques avant nettoyage ===';
  RAISE NOTICE 'Total programmes en base: %', (SELECT COUNT(*) FROM programs);
  RAISE NOTICE 'Programmes à conserver: %', (SELECT COUNT(*) FROM programs_to_keep);
  RAISE NOTICE 'Programmes dupliqués à supprimer: %', duplicate_count;
END $$;

-- Supprimer tous les programmes qui ne sont PAS dans la liste des programmes à conserver
DELETE FROM programs
WHERE id NOT IN (SELECT id FROM programs_to_keep);

-- Statistiques après nettoyage
DO $$
BEGIN
  RAISE NOTICE '=== Statistiques après nettoyage ===';
  RAISE NOTICE 'Total programmes restants: %', (SELECT COUNT(*) FROM programs);
  RAISE NOTICE 'Nettoyage terminé avec succès!';
END $$;

-- Nettoyer la table temporaire
DROP TABLE programs_to_keep;