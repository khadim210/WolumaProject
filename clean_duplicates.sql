/*
  ═══════════════════════════════════════════════════════════════════════════
  SCRIPT DE NETTOYAGE DES PROGRAMMES DUPLIQUÉS
  ═══════════════════════════════════════════════════════════════════════════

  Instructions:
  1. Ouvrir Supabase Dashboard: https://supabase.com/dashboard
  2. Sélectionner votre projet
  3. Aller dans "SQL Editor"
  4. Copier-coller ce script
  5. Cliquer sur "Run"

  Ce script va:
  - Analyser les doublons
  - Conserver le meilleur programme de chaque groupe
  - Supprimer les autres doublons
  - Afficher un rapport détaillé

  SÉCURITÉ: Ce script est idempotent (peut être exécuté plusieurs fois)
*/

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 1: ANALYSE DES DOUBLONS
-- ═══════════════════════════════════════════════════════════════════════════

DO $$
DECLARE
  prog_name TEXT;
  prog_to_keep UUID;
  prog_to_delete UUID;
  duplicate_count INTEGER := 0;
  total_deleted INTEGER := 0;
  prog RECORD;
  initial_count INTEGER;
BEGIN
  -- Compter les programmes au début
  SELECT COUNT(*) INTO initial_count FROM programs;

  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   NETTOYAGE INTELLIGENT DES PROGRAMMES DUPLIQUÉS          ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES INITIALES:';
  RAISE NOTICE '   Total programmes: %', initial_count;
  RAISE NOTICE '';

  -- Identifier les groupes de doublons
  RAISE NOTICE '🔍 ANALYSE DES DOUBLONS:';
  RAISE NOTICE '';

  FOR prog IN
    SELECT
      COUNT(*) as count,
      STRING_AGG(DISTINCT name, ' | ') as names,
      LOWER(TRIM(MIN(name))) as normalized_name
    FROM programs
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
    ORDER BY COUNT(*) DESC
  LOOP
    RAISE NOTICE '   ⚠️  Groupe % doublons: "%"', prog.count, prog.names;
    duplicate_count := duplicate_count + 1;
  END LOOP;

  IF duplicate_count = 0 THEN
    RAISE NOTICE '';
    RAISE NOTICE '✅ AUCUN DOUBLON DÉTECTÉ!';
    RAISE NOTICE '   Votre base de données est propre.';
    RAISE NOTICE '';
    RETURN;
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '   Total groupes de doublons: %', duplicate_count;
  RAISE NOTICE '';
  RAISE NOTICE '🧹 DÉBUT DU NETTOYAGE...';
  RAISE NOTICE '';

  -- ═══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 2: NETTOYAGE DES DOUBLONS
  -- ═══════════════════════════════════════════════════════════════════════════

  FOR prog_name IN
    SELECT DISTINCT LOWER(TRIM(name)) as normalized_name
    FROM programs
    GROUP BY LOWER(TRIM(name))
    HAVING COUNT(*) > 1
  LOOP
    -- Identifier le MEILLEUR programme à conserver
    -- Priorités:
    -- 1. Programme verrouillé (is_locked = true)
    -- 2. Programme avec le plus de projets associés
    -- 3. Programme le plus récent (created_at DESC)

    SELECT p.id INTO prog_to_keep
    FROM programs p
    WHERE LOWER(TRIM(p.name)) = prog_name
    ORDER BY
      (CASE WHEN COALESCE(p.is_locked, false) = true THEN 1 ELSE 0 END) DESC,
      (SELECT COUNT(*) FROM projects WHERE program_id = p.id) DESC,
      p.created_at DESC
    LIMIT 1;

    -- Récupérer les infos du programme conservé
    SELECT
      name,
      created_at,
      COALESCE(is_locked, false) as is_locked,
      (SELECT COUNT(*) FROM projects WHERE program_id = programs.id) as nb_projects
    INTO prog
    FROM programs
    WHERE id = prog_to_keep;

    RAISE NOTICE '   ✅ CONSERVATION: "%"', prog.name;
    RAISE NOTICE '      ID: %', SUBSTRING(prog_to_keep::TEXT FROM 1 FOR 8) || '...';
    RAISE NOTICE '      Créé: %', TO_CHAR(prog.created_at, 'YYYY-MM-DD HH24:MI');
    RAISE NOTICE '      Projets: %', prog.nb_projects;
    RAISE NOTICE '      Verrouillé: %', prog.is_locked;

    -- Supprimer tous les AUTRES programmes de ce groupe
    FOR prog_to_delete IN
      SELECT id
      FROM programs
      WHERE LOWER(TRIM(name)) = prog_name
        AND id != prog_to_keep
    LOOP
      -- Vérifier et réassigner les projets s'il y en a
      IF EXISTS (SELECT 1 FROM projects WHERE program_id = prog_to_delete) THEN
        UPDATE projects
        SET program_id = prog_to_keep
        WHERE program_id = prog_to_delete;

        RAISE NOTICE '      ↳ Projets réassignés: % → %',
          SUBSTRING(prog_to_delete::TEXT FROM 1 FOR 8) || '...',
          SUBSTRING(prog_to_keep::TEXT FROM 1 FOR 8) || '...';
      END IF;

      -- Supprimer le doublon
      DELETE FROM programs WHERE id = prog_to_delete;
      total_deleted := total_deleted + 1;

      RAISE NOTICE '      ❌ Supprimé: %', SUBSTRING(prog_to_delete::TEXT FROM 1 FOR 8) || '...';
    END LOOP;

    RAISE NOTICE '';
  END LOOP;

  -- ═══════════════════════════════════════════════════════════════════════════
  -- ÉTAPE 3: RAPPORT FINAL
  -- ═══════════════════════════════════════════════════════════════════════════

  RAISE NOTICE '╔════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║   RÉSULTATS DU NETTOYAGE                                  ║';
  RAISE NOTICE '╚════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 STATISTIQUES FINALES:';
  RAISE NOTICE '   Programmes avant: %', initial_count;
  RAISE NOTICE '   Programmes après: %', (SELECT COUNT(*) FROM programs);
  RAISE NOTICE '   Doublons supprimés: %', total_deleted;
  RAISE NOTICE '   Groupes nettoyés: %', duplicate_count;
  RAISE NOTICE '';

  IF total_deleted > 0 THEN
    RAISE NOTICE '✅ NETTOYAGE TERMINÉ AVEC SUCCÈS!';
  ELSE
    RAISE NOTICE '✅ AUCUNE SUPPRESSION NÉCESSAIRE.';
  END IF;

  RAISE NOTICE '';
  RAISE NOTICE '📋 PROGRAMMES RESTANTS:';
  RAISE NOTICE '';

  FOR prog IN
    SELECT
      name,
      TO_CHAR(created_at, 'YYYY-MM-DD') as date_creation,
      COALESCE(is_locked, false) as is_locked,
      (SELECT COUNT(*) FROM projects WHERE program_id = programs.id) as nb_projects,
      budget,
      currency
    FROM programs
    ORDER BY name
  LOOP
    RAISE NOTICE '   • %', prog.name;
    RAISE NOTICE '     Créé: % | Projets: % | Verrouillé: % | Budget: % %',
      prog.date_creation,
      prog.nb_projects,
      prog.is_locked,
      prog.budget,
      COALESCE(prog.currency, 'XOF');
  END LOOP;

  RAISE NOTICE '';
  RAISE NOTICE '═══════════════════════════════════════════════════════════════';
  RAISE NOTICE '';

END $$;

-- ═══════════════════════════════════════════════════════════════════════════
-- ÉTAPE 4: OPTIMISATIONS
-- ═══════════════════════════════════════════════════════════════════════════

-- Créer un index pour améliorer les recherches futures
CREATE INDEX IF NOT EXISTS idx_programs_name_lower
ON programs (LOWER(TRIM(name)));

-- Ajouter un commentaire sur la table
COMMENT ON TABLE programs IS 'Table des programmes - nettoyée des doublons le 2025-11-26';

-- Message final
DO $$
BEGIN
  RAISE NOTICE '🎉 SCRIPT TERMINÉ!';
  RAISE NOTICE '';
  RAISE NOTICE '💡 Pour vérifier qu''il n''y a plus de doublons:';
  RAISE NOTICE '   SELECT name, COUNT(*) FROM programs GROUP BY name HAVING COUNT(*) > 1;';
  RAISE NOTICE '';
END $$;
