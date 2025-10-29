/*
  # Ajout du support multi-devises pour les programmes

  1. Modifications
    - Ajout de la colonne `currency` à la table `programs`
    - Valeur par défaut : 'XOF' (Franc CFA)
    - Options disponibles : XOF, EUR, USD, GBP, etc.

  2. Notes
    - Ce champ permettra aux programmes de spécifier leur devise
    - Les projets hériteront de la devise du programme auquel ils sont soumis
*/

-- Ajouter la colonne currency à la table programs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'programs' AND column_name = 'currency'
  ) THEN
    ALTER TABLE programs ADD COLUMN currency VARCHAR(3) DEFAULT 'XOF' NOT NULL;
  END IF;
END $$;

-- Mettre à jour les programmes existants avec la devise par défaut si nécessaire
UPDATE programs SET currency = 'XOF' WHERE currency IS NULL;

-- Ajouter un commentaire sur la colonne
COMMENT ON COLUMN programs.currency IS 'Code ISO 4217 de la devise du programme (XOF, EUR, USD, etc.)';
