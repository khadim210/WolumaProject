/*
  # Nettoyage des partenaires dupliqués

  ## Description
  Cette migration supprime les partenaires dupliqués créés par des exécutions multiples
  du seeding automatique.

  ## Problème identifié
  - 60 copies de "Woluma Innovation Fund"
  - 60 copies de "Green Tech Partners"
  - 60 copies de "Health Innovation Lab"
  - Total: 180 partenaires au lieu de 3

  ## Solution
  Conserver uniquement le partenaire le plus ancien (l'original) pour chaque nom.
  Mise à jour automatique des références dans la table programs si nécessaire.

  ## Sécurité
  - Préserve les références de la table programs
  - Migration idempotente (peut être exécutée plusieurs fois)
  - Utilise les dates de création pour identifier les originaux
*/

-- Créer une table temporaire avec les IDs des partenaires à conserver (les plus anciens)
CREATE TEMP TABLE partners_to_keep AS
SELECT DISTINCT ON (name) id, name, created_at
FROM partners
ORDER BY name, created_at ASC;

-- Afficher les partenaires qui seront conservés
DO $$
DECLARE
  partner RECORD;
BEGIN
  RAISE NOTICE '=== Partenaires qui seront conservés ===';
  FOR partner IN 
    SELECT name, id, created_at 
    FROM partners_to_keep 
    ORDER BY name
  LOOP
    RAISE NOTICE 'Partenaire: % (ID: %, Créé le: %)', partner.name, partner.id, partner.created_at;
  END LOOP;
END $$;

-- Compter les doublons avant suppression
DO $$
DECLARE
  duplicate_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO duplicate_count
  FROM partners p
  WHERE p.id NOT IN (SELECT id FROM partners_to_keep);
  
  RAISE NOTICE '=== Statistiques avant nettoyage ===';
  RAISE NOTICE 'Total partenaires en base: %', (SELECT COUNT(*) FROM partners);
  RAISE NOTICE 'Partenaires à conserver: %', (SELECT COUNT(*) FROM partners_to_keep);
  RAISE NOTICE 'Partenaires dupliqués à supprimer: %', duplicate_count;
END $$;

-- Mettre à jour les références dans programs si nécessaire
-- (remplacer les IDs de partenaires dupliqués par les originaux)
UPDATE programs p
SET partner_id = ptk.id
FROM partners old_partner
JOIN partners_to_keep ptk ON ptk.name = old_partner.name
WHERE p.partner_id = old_partner.id
  AND old_partner.id != ptk.id;

-- Supprimer tous les partenaires qui ne sont PAS dans la liste des partenaires à conserver
DELETE FROM partners
WHERE id NOT IN (SELECT id FROM partners_to_keep);

-- Statistiques après nettoyage
DO $$
BEGIN
  RAISE NOTICE '=== Statistiques après nettoyage ===';
  RAISE NOTICE 'Total partenaires restants: %', (SELECT COUNT(*) FROM partners);
  RAISE NOTICE 'Nettoyage terminé avec succès!';
END $$;

-- Nettoyer la table temporaire
DROP TABLE partners_to_keep;