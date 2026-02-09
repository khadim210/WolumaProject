import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import { FileText, Download, Loader2 } from 'lucide-react';
import Button from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

interface ManualSection {
  title: string;
  subsections: {
    title: string;
    content: string[];
    steps?: string[];
  }[];
}

const UserManualPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);

  const manualContent: ManualSection[] = [
    {
      title: "1. INTRODUCTION",
      subsections: [
        {
          title: "1.1 À propos de l'application",
          content: [
            "Cette application est une plateforme complète de gestion de projets et de programmes de financement.",
            "Elle permet aux organisations de soumettre des projets, aux évaluateurs de les analyser, et aux administrateurs de gérer l'ensemble du processus."
          ]
        },
        {
          title: "1.2 Rôles utilisateurs",
          content: [
            "• ADMIN : Gestion complète de la plateforme (utilisateurs, partenaires, programmes)",
            "• MANAGER : Gestion des modèles de formulaires et des évaluations",
            "• PARTNER : Soumission et suivi de projets pour son organisation",
            "• SUBMITTER : Soumission de projets individuels"
          ]
        },
        {
          title: "1.3 Prérequis techniques",
          content: [
            "• Navigateur web moderne (Chrome, Firefox, Safari, Edge)",
            "• Connexion Internet stable",
            "• Adresse email valide pour la création de compte"
          ]
        }
      ]
    },
    {
      title: "2. CONNEXION ET INSCRIPTION",
      subsections: [
        {
          title: "2.1 Création de compte",
          content: [
            "La création de compte se fait via la page d'inscription accessible depuis la page de connexion."
          ],
          steps: [
            "Cliquer sur 'S'inscrire' sur la page de connexion",
            "Remplir le formulaire avec vos informations :",
            "  - Nom complet",
            "  - Email professionnel",
            "  - Organisation (optionnel)",
            "  - Mot de passe sécurisé (min. 8 caractères)",
            "Accepter les conditions d'utilisation",
            "Cliquer sur 'Créer un compte'",
            "Un administrateur validera votre compte sous 24-48h"
          ]
        },
        {
          title: "2.2 Connexion à l'application",
          content: [
            "Une fois votre compte activé, vous pouvez vous connecter."
          ],
          steps: [
            "Ouvrir l'application dans votre navigateur",
            "Saisir votre email et mot de passe",
            "Cliquer sur 'Se connecter'",
            "Vous êtes redirigé vers le tableau de bord"
          ]
        },
        {
          title: "2.3 Mot de passe oublié",
          content: [
            "Si vous avez oublié votre mot de passe, contactez un administrateur pour le réinitialiser."
          ]
        }
      ]
    },
    {
      title: "3. TABLEAU DE BORD",
      subsections: [
        {
          title: "3.1 Vue d'ensemble",
          content: [
            "Le tableau de bord affiche une vue synthétique de vos activités :",
            "• Nombre total de projets",
            "• Projets par statut (en cours, approuvés, rejetés)",
            "• Activité récente",
            "• Notifications importantes"
          ]
        },
        {
          title: "3.2 Navigation",
          content: [
            "Le menu latéral gauche donne accès à toutes les fonctionnalités selon votre rôle :",
            "• Tableau de bord : Vue d'ensemble",
            "• Projets : Liste et gestion des projets",
            "• Éligibilité : Vérification d'éligibilité",
            "• Évaluation : Évaluation des projets (Manager)",
            "• Formalisation : Gestion des projets approuvés",
            "• Suivi : Monitoring des projets",
            "• Statistiques : Rapports et analyses",
            "• Administration : Gestion de la plateforme (Admin)"
          ]
        }
      ]
    },
    {
      title: "4. SOUMISSION DE PROJETS",
      subsections: [
        {
          title: "4.1 Créer un nouveau projet",
          content: [
            "La soumission de projet se fait en plusieurs étapes."
          ],
          steps: [
            "Aller dans 'Projets' > 'Nouveau projet'",
            "Sélectionner un programme de financement",
            "Remplir les informations du projet :",
            "  - Titre du projet",
            "  - Description détaillée",
            "  - Objectifs",
            "  - Bénéficiaires",
            "  - Budget prévisionnel",
            "  - Durée du projet",
            "Joindre les documents requis :",
            "  - Document de projet (PDF/Word)",
            "  - Budget détaillé (Excel)",
            "  - Documents justificatifs",
            "Vérifier toutes les informations",
            "Cliquer sur 'Soumettre le projet'",
            "Vous recevrez un email de confirmation"
          ]
        },
        {
          title: "4.2 Vérification d'éligibilité",
          content: [
            "Avant de soumettre, vérifiez l'éligibilité de votre projet."
          ],
          steps: [
            "Aller dans 'Éligibilité'",
            "Sélectionner le programme qui vous intéresse",
            "Remplir le questionnaire d'éligibilité",
            "Le système analyse automatiquement vos réponses",
            "Vous obtenez un score d'éligibilité",
            "Si éligible : vous pouvez soumettre votre projet",
            "Si non éligible : le système explique pourquoi"
          ]
        },
        {
          title: "4.3 Documents requis",
          content: [
            "Documents généralement demandés :",
            "• Document de présentation du projet (PDF/Word)",
            "• Budget détaillé avec justification (Excel)",
            "• Statuts de l'organisation",
            "• CV des responsables du projet",
            "• Lettres de recommandation (si applicable)",
            "• Preuve d'existence légale",
            "",
            "Format acceptés : PDF, Word (.doc, .docx), Excel (.xls, .xlsx)",
            "Taille maximale : 10 MB par fichier"
          ]
        },
        {
          title: "4.4 Soumission publique",
          content: [
            "Certains programmes permettent la soumission publique sans compte."
          ],
          steps: [
            "Utiliser le lien de soumission publique fourni par le programme",
            "Remplir le formulaire en ligne",
            "Joindre les documents requis",
            "Fournir un email de contact",
            "Soumettre le formulaire",
            "Vous recevrez un numéro de suivi par email"
          ]
        }
      ]
    },
    {
      title: "5. SUIVI DE PROJETS",
      subsections: [
        {
          title: "5.1 Liste des projets",
          content: [
            "Visualisez tous vos projets dans la section 'Projets'.",
            "",
            "Informations affichées :",
            "• Titre du projet",
            "• Programme de financement",
            "• Statut actuel",
            "• Date de soumission",
            "• Actions disponibles"
          ]
        },
        {
          title: "5.2 Détails d'un projet",
          content: [
            "Cliquer sur un projet pour voir tous les détails."
          ],
          steps: [
            "Dans la liste des projets, cliquer sur 'Voir détails'",
            "Vous accédez à la fiche complète du projet avec :",
            "  - Informations générales",
            "  - Documents joints",
            "  - Historique des statuts",
            "  - Commentaires des évaluateurs",
            "  - Score d'évaluation (si disponible)",
            "  - Actions possibles selon le statut"
          ]
        },
        {
          title: "5.3 Statuts des projets",
          content: [
            "Les projets passent par différents statuts :",
            "",
            "• DRAFT : Brouillon, non soumis",
            "• SUBMITTED : Soumis, en attente d'examen",
            "• UNDER_REVIEW : En cours d'évaluation",
            "• EVALUATION_COMPLETED : Évaluation terminée",
            "• APPROVED : Approuvé pour financement",
            "• FORMALIZATION : En cours de formalisation",
            "• DISBURSEMENT : En cours de décaissement",
            "• ACTIVE : Projet actif en cours",
            "• MONITORING : Suivi et monitoring",
            "• COMPLETED : Projet terminé",
            "• REJECTED : Projet rejeté",
            "• CANCELLED : Projet annulé"
          ]
        },
        {
          title: "5.4 Modifier un projet",
          content: [
            "Vous pouvez modifier un projet tant qu'il n'a pas été soumis."
          ],
          steps: [
            "Ouvrir le projet en statut 'DRAFT'",
            "Cliquer sur 'Modifier'",
            "Apporter les modifications nécessaires",
            "Enregistrer les changements",
            "Soumettre quand vous êtes prêt"
          ]
        }
      ]
    },
    {
      title: "6. ÉVALUATION (MANAGERS)",
      subsections: [
        {
          title: "6.1 Accéder aux projets à évaluer",
          content: [
            "En tant que Manager, vous pouvez évaluer les projets soumis."
          ],
          steps: [
            "Aller dans 'Évaluation'",
            "Voir la liste des projets en attente d'évaluation",
            "Filtrer par programme ou statut",
            "Cliquer sur un projet pour l'évaluer"
          ]
        },
        {
          title: "6.2 Processus d'évaluation",
          content: [
            "L'évaluation se fait selon des critères prédéfinis."
          ],
          steps: [
            "Ouvrir le projet à évaluer",
            "Consulter tous les documents joints",
            "Remplir la grille d'évaluation :",
            "  - Pertinence du projet",
            "  - Qualité du dossier",
            "  - Faisabilité",
            "  - Budget réaliste",
            "  - Impact attendu",
            "  - Durabilité",
            "Attribuer un score à chaque critère",
            "Ajouter des commentaires détaillés",
            "Recommandation finale : Approuver / Rejeter / Réviser",
            "Soumettre l'évaluation"
          ]
        },
        {
          title: "6.3 Évaluation IA (si configurée)",
          content: [
            "Le système peut utiliser l'IA pour une pré-évaluation.",
            "",
            "Fonctionnement :",
            "• L'IA analyse automatiquement le document de projet",
            "• Elle extrait les informations clés",
            "• Elle attribue un score préliminaire",
            "• Elle génère des commentaires détaillés",
            "• L'évaluateur humain révise et ajuste",
            "",
            "Note : L'évaluation IA est une aide, pas une décision finale."
          ]
        }
      ]
    },
    {
      title: "7. FORMALISATION",
      subsections: [
        {
          title: "7.1 Projets approuvés",
          content: [
            "Une fois un projet approuvé, il passe en phase de formalisation."
          ],
          steps: [
            "Aller dans 'Formalisation'",
            "Voir la liste des projets approuvés",
            "Sélectionner un projet",
            "Gérer les étapes de formalisation"
          ]
        },
        {
          title: "7.2 Demande de documents",
          content: [
            "Demander des documents complémentaires au porteur de projet."
          ],
          steps: [
            "Ouvrir le projet en formalisation",
            "Cliquer sur 'Demander des documents'",
            "Lister les documents requis",
            "Fixer une date limite",
            "Envoyer la demande",
            "Le porteur reçoit un email avec la liste",
            "Suivre la réception des documents"
          ]
        },
        {
          title: "7.3 Plan de décaissement",
          content: [
            "Définir le calendrier de décaissement des fonds."
          ],
          steps: [
            "Ouvrir le projet",
            "Cliquer sur 'Plan de décaissement'",
            "Créer les tranches de décaissement :",
            "  - Montant",
            "  - Date prévue",
            "  - Conditions",
            "  - Documents requis",
            "Valider le plan",
            "Le porteur reçoit une notification"
          ]
        },
        {
          title: "7.4 Support technique",
          content: [
            "Offrir un accompagnement au porteur de projet."
          ],
          steps: [
            "Ouvrir le projet",
            "Cliquer sur 'Support technique'",
            "Planifier une session :",
            "  - Date et heure",
            "  - Type (en ligne / présentiel)",
            "  - Sujet / objectifs",
            "  - Participants",
            "Envoyer l'invitation",
            "Suivre les sessions réalisées"
          ]
        }
      ]
    },
    {
      title: "8. SUIVI ET MONITORING",
      subsections: [
        {
          title: "8.1 Suivi des projets actifs",
          content: [
            "Une fois les fonds décaissés, suivre l'avancement du projet."
          ],
          steps: [
            "Aller dans 'Suivi'",
            "Sélectionner un projet actif",
            "Consulter les rapports d'avancement",
            "Vérifier les indicateurs de performance",
            "Planifier des visites de terrain si nécessaire"
          ]
        },
        {
          title: "8.2 Rapports périodiques",
          content: [
            "Les porteurs de projets doivent soumettre des rapports réguliers :",
            "• Rapport mensuel d'activités",
            "• Rapport trimestriel financier",
            "• Rapport final de projet",
            "",
            "Ces rapports sont consultables dans la section Suivi."
          ]
        }
      ]
    },
    {
      title: "9. STATISTIQUES ET RAPPORTS",
      subsections: [
        {
          title: "9.1 Tableaux de bord statistiques",
          content: [
            "Visualiser les données agrégées de tous les projets."
          ],
          steps: [
            "Aller dans 'Statistiques'",
            "Sélectionner la période d'analyse",
            "Filtrer par programme, partenaire, ou statut",
            "Consulter les graphiques :",
            "  - Évolution des soumissions",
            "  - Taux d'approbation",
            "  - Montants engagés",
            "  - Durée moyenne de traitement",
            "  - Répartition géographique"
          ]
        },
        {
          title: "9.2 Export de données",
          content: [
            "Exporter les données pour analyse externe."
          ],
          steps: [
            "Dans la page Statistiques",
            "Définir les filtres souhaités",
            "Cliquer sur 'Exporter'",
            "Choisir le format : Excel / CSV / PDF",
            "Le fichier est téléchargé automatiquement"
          ]
        }
      ]
    },
    {
      title: "10. ADMINISTRATION (ADMIN)",
      subsections: [
        {
          title: "10.1 Gestion des utilisateurs",
          content: [
            "Créer, modifier et gérer les comptes utilisateurs."
          ],
          steps: [
            "Aller dans 'Administration' > 'Utilisateurs'",
            "Voir la liste de tous les utilisateurs",
            "Pour créer un utilisateur :",
            "  - Cliquer sur 'Nouvel utilisateur'",
            "  - Remplir les informations",
            "  - Attribuer un rôle",
            "  - Activer le compte",
            "Pour modifier un utilisateur :",
            "  - Cliquer sur l'icône de modification",
            "  - Changer les informations",
            "  - Enregistrer",
            "Pour désactiver un utilisateur :",
            "  - Basculer le statut 'Actif' sur Non",
            "  - L'utilisateur ne peut plus se connecter"
          ]
        },
        {
          title: "10.2 Gestion des partenaires",
          content: [
            "Gérer les organisations partenaires."
          ],
          steps: [
            "Aller dans 'Administration' > 'Partenaires'",
            "Créer un nouveau partenaire :",
            "  - Nom de l'organisation",
            "  - Type (ONG, Entreprise, Institution)",
            "  - Coordonnées",
            "  - Contact principal",
            "Assigner des utilisateurs au partenaire",
            "Définir les programmes accessibles"
          ]
        },
        {
          title: "10.3 Gestion des programmes",
          content: [
            "Créer et gérer les programmes de financement."
          ],
          steps: [
            "Aller dans 'Administration' > 'Programmes'",
            "Créer un nouveau programme :",
            "  - Nom du programme",
            "  - Description",
            "  - Objectifs",
            "  - Budget total disponible",
            "  - Date de début / fin",
            "  - Critères d'éligibilité",
            "  - Montant min / max par projet",
            "  - Devise",
            "Activer / Désactiver un programme",
            "Verrouiller un programme (plus de soumissions)"
          ]
        },
        {
          title: "10.4 Modèles de formulaires",
          content: [
            "Créer des formulaires personnalisés pour la soumission."
          ],
          steps: [
            "Aller dans 'Administration' > 'Formulaires'",
            "Créer un nouveau modèle",
            "Utiliser le constructeur de formulaires :",
            "  - Glisser-déposer des champs",
            "  - Types : texte, nombre, date, fichier, choix multiples",
            "  - Configurer les validations",
            "  - Définir les champs obligatoires",
            "Prévisualiser le formulaire",
            "Assigner le formulaire à un programme",
            "Publier le formulaire"
          ]
        },
        {
          title: "10.5 Configuration de l'IA",
          content: [
            "Configurer l'évaluation automatique par IA."
          ],
          steps: [
            "Aller dans 'Administration' > 'Paramètres' > 'Configuration IA'",
            "Activer/Désactiver l'évaluation IA",
            "Configurer les paramètres :",
            "  - Modèle d'IA à utiliser (GPT-4, GPT-5, Claude, etc.)",
            "  - Critères d'évaluation personnalisés",
            "  - Seuil de score minimum",
            "  - Longueur des commentaires générés",
            "Tester la configuration",
            "Enregistrer les paramètres"
          ]
        },
        {
          title: "10.6 Historique des statuts",
          content: [
            "Voir l'historique complet des changements de statut pour tous les projets."
          ],
          steps: [
            "Aller dans 'Administration' > 'Historique'",
            "Voir tous les changements de statut",
            "Filtrer par projet, utilisateur ou date",
            "Exporter l'historique pour audit"
          ]
        }
      ]
    },
    {
      title: "11. PROFIL UTILISATEUR",
      subsections: [
        {
          title: "11.1 Modifier mon profil",
          content: [
            "Mettre à jour vos informations personnelles."
          ],
          steps: [
            "Cliquer sur votre nom en haut à droite",
            "Sélectionner 'Mon profil'",
            "Modifier les informations :",
            "  - Nom",
            "  - Email (demande validation)",
            "  - Organisation",
            "  - Téléphone",
            "Enregistrer les modifications"
          ]
        },
        {
          title: "11.2 Changer mon mot de passe",
          content: [
            "Modifier votre mot de passe pour plus de sécurité."
          ],
          steps: [
            "Aller dans 'Mon profil'",
            "Section 'Sécurité'",
            "Saisir l'ancien mot de passe",
            "Saisir le nouveau mot de passe",
            "Confirmer le nouveau mot de passe",
            "Enregistrer",
            "Vous serez déconnecté et devrez vous reconnecter"
          ]
        },
        {
          title: "11.3 Se déconnecter",
          content: [
            "Toujours se déconnecter après utilisation, surtout sur un ordinateur partagé."
          ],
          steps: [
            "Cliquer sur votre nom en haut à droite",
            "Sélectionner 'Se déconnecter'",
            "Vous êtes redirigé vers la page de connexion"
          ]
        }
      ]
    },
    {
      title: "12. BONNES PRATIQUES",
      subsections: [
        {
          title: "12.1 Sécurité",
          content: [
            "• Utilisez un mot de passe fort et unique",
            "• Ne partagez jamais vos identifiants",
            "• Déconnectez-vous après chaque session",
            "• Vérifiez toujours l'URL de l'application",
            "• Signalez toute activité suspecte à un administrateur"
          ]
        },
        {
          title: "12.2 Soumission de projets",
          content: [
            "• Lisez attentivement les critères d'éligibilité",
            "• Préparez tous les documents avant de commencer",
            "• Enregistrez régulièrement votre brouillon",
            "• Relisez tout avant de soumettre",
            "• Respectez les formats et tailles de fichiers",
            "• Soumettez avant la date limite"
          ]
        },
        {
          title: "12.3 Qualité du dossier",
          content: [
            "• Rédigez clairement et précisément",
            "• Fournissez toutes les informations demandées",
            "• Justifiez votre budget en détail",
            "• Incluez des lettres de recommandation",
            "• Montrez l'impact et la durabilité du projet",
            "• Relisez pour éviter les fautes"
          ]
        }
      ]
    },
    {
      title: "13. AIDE ET SUPPORT",
      subsections: [
        {
          title: "13.1 Obtenir de l'aide",
          content: [
            "En cas de problème ou de question :",
            "",
            "• Consultez d'abord ce manuel utilisateur",
            "• Contactez le support technique : support@woluma.com",
            "• Joignez des captures d'écran du problème",
            "• Indiquez votre rôle et l'action que vous tentiez",
            "• Le support répond sous 24-48h ouvrées"
          ]
        },
        {
          title: "13.2 Problèmes courants",
          content: [
            "Impossible de se connecter :",
            "• Vérifiez votre email et mot de passe",
            "• Votre compte est-il activé ?",
            "• Videz le cache de votre navigateur",
            "",
            "Impossible de joindre un fichier :",
            "• Vérifiez la taille (max 10 MB)",
            "• Vérifiez le format (PDF, Word, Excel)",
            "• Essayez avec un autre navigateur",
            "",
            "Le formulaire ne s'enregistre pas :",
            "• Vérifiez votre connexion Internet",
            "• Rechargez la page",
            "• Essayez avec un autre navigateur"
          ]
        },
        {
          title: "13.3 Contact",
          content: [
            "Support technique : support@woluma.com",
            "Questions générales : info@woluma.com",
            "Site web : www.woluma.com",
            "",
            "Horaires d'ouverture :",
            "Lundi - Vendredi : 8h00 - 17h00",
            "Week-end et jours fériés : Fermé"
          ]
        }
      ]
    }
  ];

  const generatePDF = async () => {
    setIsGenerating(true);

    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 20;
      const maxWidth = pageWidth - (margin * 2);
      let yPosition = 20;

      // Page de garde
      doc.setFontSize(28);
      doc.setFont('helvetica', 'bold');
      doc.text('MANUEL UTILISATEUR', pageWidth / 2, 80, { align: 'center' });

      doc.setFontSize(20);
      doc.text('Plateforme de Gestion de Projets', pageWidth / 2, 100, { align: 'center' });

      doc.setFontSize(12);
      doc.setFont('helvetica', 'normal');
      doc.text('Version 1.0', pageWidth / 2, 120, { align: 'center' });
      doc.text(new Date().toLocaleDateString('fr-FR'), pageWidth / 2, 130, { align: 'center' });

      // Logo (texte pour l'instant)
      doc.setFontSize(24);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(59, 130, 246); // Bleu
      doc.text('WOLUMA', pageWidth / 2, 160, { align: 'center' });
      doc.setTextColor(0, 0, 0); // Retour au noir

      // Nouvelle page pour la table des matières
      doc.addPage();
      yPosition = 20;

      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('TABLE DES MATIÈRES', margin, yPosition);
      yPosition += 15;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');

      manualContent.forEach((section, index) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage();
          yPosition = 20;
        }
        doc.text(`${section.title}`, margin, yPosition);
        yPosition += 6;
      });

      // Contenu du manuel
      manualContent.forEach((section, sectionIndex) => {
        doc.addPage();
        yPosition = 20;

        // Titre de section
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.setTextColor(59, 130, 246);
        doc.text(section.title, margin, yPosition);
        doc.setTextColor(0, 0, 0);
        yPosition += 12;

        // Sous-sections
        section.subsections.forEach((subsection) => {
          if (yPosition > pageHeight - 40) {
            doc.addPage();
            yPosition = 20;
          }

          // Titre de sous-section
          doc.setFontSize(12);
          doc.setFont('helvetica', 'bold');
          doc.text(subsection.title, margin, yPosition);
          yPosition += 8;

          // Contenu
          doc.setFontSize(10);
          doc.setFont('helvetica', 'normal');

          subsection.content.forEach((paragraph) => {
            if (yPosition > pageHeight - 20) {
              doc.addPage();
              yPosition = 20;
            }

            const lines = doc.splitTextToSize(paragraph, maxWidth);
            lines.forEach((line: string) => {
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }
              doc.text(line, margin, yPosition);
              yPosition += 5;
            });
            yPosition += 2;
          });

          // Étapes
          if (subsection.steps) {
            yPosition += 3;
            subsection.steps.forEach((step, stepIndex) => {
              if (yPosition > pageHeight - 20) {
                doc.addPage();
                yPosition = 20;
              }

              const stepText = step.startsWith('  ')
                ? `    ${step.trim()}`
                : `${stepIndex + 1}. ${step}`;

              const lines = doc.splitTextToSize(stepText, maxWidth - 5);
              lines.forEach((line: string) => {
                if (yPosition > pageHeight - 20) {
                  doc.addPage();
                  yPosition = 20;
                }
                doc.text(line, margin + 5, yPosition);
                yPosition += 5;
              });
            });
          }

          yPosition += 8;
        });
      });

      // Pied de page sur toutes les pages
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.setTextColor(128, 128, 128);
        doc.text(
          `Page ${i} / ${totalPages}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: 'center' }
        );
        doc.text(
          'Manuel Utilisateur - Plateforme de Gestion de Projets',
          margin,
          pageHeight - 10
        );
      }

      // Télécharger le PDF
      doc.save(`Manuel_Utilisateur_${new Date().toISOString().split('T')[0]}.pdf`);

    } catch (error) {
      console.error('Erreur lors de la génération du PDF:', error);
      alert('Une erreur est survenue lors de la génération du PDF');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Manuel Utilisateur</h1>
          <p className="mt-1 text-sm text-gray-500">
            Générez un manuel utilisateur complet au format PDF
          </p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <FileText className="h-12 w-12 text-blue-500" />
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">
              Manuel Utilisateur Complet
            </h2>
            <p className="text-gray-600 mb-4">
              Ce manuel couvre toutes les fonctionnalités de l'application, organisé par rôle utilisateur.
            </p>

            <div className="bg-gray-50 rounded-lg p-4 mb-4">
              <h3 className="font-semibold text-gray-900 mb-2">Contenu du manuel :</h3>
              <ul className="space-y-1 text-sm text-gray-600">
                <li>• Introduction et présentation de l'application</li>
                <li>• Connexion et gestion du compte</li>
                <li>• Guide complet de soumission de projets</li>
                <li>• Processus d'évaluation (pour les Managers)</li>
                <li>• Formalisation et décaissement</li>
                <li>• Suivi et monitoring des projets</li>
                <li>• Statistiques et rapports</li>
                <li>• Administration de la plateforme (pour les Admins)</li>
                <li>• Bonnes pratiques et conseils</li>
                <li>• Aide et support</li>
              </ul>
            </div>

            <Button
              onClick={generatePDF}
              disabled={isGenerating}
              className="inline-flex items-center"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Télécharger le Manuel PDF
                </>
              )}
            </Button>

            {isGenerating && (
              <p className="mt-2 text-sm text-gray-500">
                La génération du PDF peut prendre quelques secondes...
              </p>
            )}
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Sections du manuel</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {manualContent.map((section, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
              <h4 className="font-medium text-gray-900 mb-2">{section.title}</h4>
              <p className="text-sm text-gray-600">
                {section.subsections.length} sous-sections
              </p>
            </div>
          ))}
        </div>
      </Card>

      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">À propos de ce manuel</h3>
            <p className="text-sm text-blue-800">
              Ce manuel utilisateur est conçu pour accompagner tous les utilisateurs de la plateforme,
              quel que soit leur niveau technique. Il couvre l'ensemble des fonctionnalités disponibles
              et fournit des instructions étape par étape pour chaque action possible.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default UserManualPage;
