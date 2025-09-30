export const defaultFormTemplates = [
  {
    id: 'health-biotech-template',
    name: 'Appel à Projets - Santé & Biotechnologies',
    description: 'Formulaire spécialisé pour les projets d\'innovation dans le domaine de la santé, des biotechnologies et des dispositifs médicaux',
    fields: [
      {
        id: 'project_category',
        type: 'select',
        label: 'Catégorie du projet',
        name: 'project_category',
        required: true,
        options: [
          'Dispositif médical innovant',
          'Thérapie génique',
          'Biotechnologie pharmaceutique',
          'E-santé et télémédecine',
          'Diagnostic médical',
          'Prévention et santé publique',
          'Autre'
        ],
        helpText: 'Sélectionnez la catégorie qui correspond le mieux à votre projet'
      },
      {
        id: 'target_pathology',
        type: 'text',
        label: 'Pathologie ou domaine médical ciblé',
        name: 'target_pathology',
        required: true,
        placeholder: 'Ex: Cancer, Diabète, Maladies cardiovasculaires...',
        helpText: 'Précisez la pathologie ou le domaine médical concerné par votre innovation'
      },
      {
        id: 'innovation_stage',
        type: 'radio',
        label: 'Stade de développement',
        name: 'innovation_stage',
        required: true,
        options: [
          'Recherche fondamentale',
          'Preuve de concept',
          'Prototype fonctionnel',
          'Tests précliniques',
          'Essais cliniques Phase I',
          'Essais cliniques Phase II/III',
          'Prêt pour commercialisation'
        ],
        helpText: 'Indiquez le niveau de maturité actuel de votre innovation'
      },
      {
        id: 'regulatory_status',
        type: 'multiple_select',
        label: 'Statut réglementaire',
        name: 'regulatory_status',
        required: false,
        options: [
          'Marquage CE en cours',
          'Autorisation FDA en cours',
          'Autorisation ANSM en cours',
          'Brevet déposé',
          'Propriété intellectuelle protégée',
          'Aucune démarche réglementaire'
        ],
        helpText: 'Sélectionnez tous les statuts réglementaires applicables'
      },
      {
        id: 'clinical_evidence',
        type: 'textarea',
        label: 'Preuves cliniques et scientifiques',
        name: 'clinical_evidence',
        required: true,
        placeholder: 'Décrivez les études, publications, résultats cliniques qui soutiennent votre innovation...',
        helpText: 'Détaillez les preuves scientifiques et cliniques de l\'efficacité de votre solution'
      },
      {
        id: 'market_size',
        type: 'number',
        label: 'Taille du marché cible (en millions d\'euros)',
        name: 'market_size',
        required: true,
        placeholder: '100',
        helpText: 'Estimez la taille du marché adressable pour votre innovation'
      },
      {
        id: 'team_medical_expertise',
        type: 'textarea',
        label: 'Expertise médicale de l\'équipe',
        name: 'team_medical_expertise',
        required: true,
        placeholder: 'Présentez les compétences médicales et scientifiques de votre équipe...',
        helpText: 'Décrivez l\'expertise médicale, les diplômes et l\'expérience de votre équipe'
      },
      {
        id: 'ethics_approval',
        type: 'checkbox',
        label: 'Approbation éthique obtenue ou en cours',
        name: 'ethics_approval',
        required: false,
        defaultValue: false,
        helpText: 'Cochez si vous avez obtenu ou êtes en cours d\'obtention d\'une approbation éthique'
      },
      {
        id: 'supporting_documents',
        type: 'file',
        label: 'Documents de support',
        name: 'supporting_documents',
        required: false,
        acceptedFileTypes: '.pdf,.doc,.docx',
        maxFileSize: 20,
        allowMultipleFiles: true,
        helpText: 'Téléchargez vos publications, brevets, résultats d\'études (max 20MB par fichier)'
      }
    ],
    isActive: true
  },
  {
    id: 'energy-transition-template',
    name: 'Appel à Projets - Transition Énergétique',
    description: 'Formulaire dédié aux projets d\'innovation dans les énergies renouvelables, l\'efficacité énergétique et la transition écologique',
    fields: [
      {
        id: 'energy_domain',
        type: 'select',
        label: 'Domaine énergétique',
        name: 'energy_domain',
        required: true,
        options: [
          'Énergie solaire photovoltaïque',
          'Énergie éolienne',
          'Hydroélectricité',
          'Biomasse et bioénergie',
          'Géothermie',
          'Hydrogène vert',
          'Stockage d\'énergie',
          'Efficacité énergétique',
          'Smart grids',
          'Mobilité électrique',
          'Autre'
        ],
        helpText: 'Choisissez le domaine énergétique principal de votre projet'
      },
      {
        id: 'technology_readiness',
        type: 'radio',
        label: 'Niveau de maturité technologique (TRL)',
        name: 'technology_readiness',
        required: true,
        options: [
          'TRL 1-2 : Recherche fondamentale',
          'TRL 3-4 : Preuve de concept',
          'TRL 5-6 : Prototype et validation',
          'TRL 7-8 : Démonstration système',
          'TRL 9 : Système qualifié'
        ],
        helpText: 'Évaluez le niveau de maturité technologique selon l\'échelle TRL'
      },
      {
        id: 'environmental_impact',
        type: 'textarea',
        label: 'Impact environnemental attendu',
        name: 'environmental_impact',
        required: true,
        placeholder: 'Décrivez les bénéfices environnementaux : réduction CO2, économies d\'énergie...',
        helpText: 'Quantifiez l\'impact positif de votre projet sur l\'environnement'
      },
      {
        id: 'energy_production',
        type: 'number',
        label: 'Production énergétique estimée (MWh/an)',
        name: 'energy_production',
        required: false,
        placeholder: '1000',
        helpText: 'Pour les projets de production d\'énergie, indiquez la capacité annuelle estimée'
      },
      {
        id: 'co2_reduction',
        type: 'number',
        label: 'Réduction CO2 estimée (tonnes/an)',
        name: 'co2_reduction',
        required: true,
        placeholder: '500',
        helpText: 'Estimez la réduction annuelle d\'émissions de CO2 grâce à votre projet'
      },
      {
        id: 'certifications',
        type: 'multiple_select',
        label: 'Certifications et labels',
        name: 'certifications',
        required: false,
        options: [
          'ISO 14001 (Management environnemental)',
          'ISO 50001 (Management de l\'énergie)',
          'Label RGE',
          'Certification LEED',
          'Label BBC',
          'Certification HQE',
          'Autre certification'
        ],
        helpText: 'Sélectionnez les certifications obtenues ou visées'
      },
      {
        id: 'partnerships',
        type: 'textarea',
        label: 'Partenariats et collaborations',
        name: 'partnerships',
        required: false,
        placeholder: 'Décrivez vos partenariats avec des laboratoires, entreprises, collectivités...',
        helpText: 'Présentez vos partenaires stratégiques et collaborations prévues'
      },
      {
        id: 'scalability',
        type: 'textarea',
        label: 'Potentiel de déploiement et réplicabilité',
        name: 'scalability',
        required: true,
        placeholder: 'Expliquez comment votre solution peut être déployée à grande échelle...',
        helpText: 'Décrivez le potentiel de déploiement et de réplication de votre innovation'
      },
      {
        id: 'technical_documents',
        type: 'file',
        label: 'Documentation technique',
        name: 'technical_documents',
        required: false,
        acceptedFileTypes: '.pdf,.doc,.docx,.xls,.xlsx',
        maxFileSize: 25,
        allowMultipleFiles: true,
        helpText: 'Téléchargez vos études techniques, schémas, calculs énergétiques (max 25MB par fichier)'
      }
    ],
    isActive: true
  },
  {
    id: 'digital-ai-template',
    name: 'Appel à Projets - Innovation Numérique & IA',
    description: 'Formulaire spécialisé pour les projets d\'innovation dans le numérique, l\'intelligence artificielle et les technologies émergentes',
    fields: [
      {
        id: 'tech_category',
        type: 'select',
        label: 'Catégorie technologique',
        name: 'tech_category',
        required: true,
        options: [
          'Intelligence Artificielle / Machine Learning',
          'Blockchain et cryptomonnaies',
          'Internet des Objets (IoT)',
          'Réalité Virtuelle / Augmentée',
          'Cybersécurité',
          'Big Data et Analytics',
          'Cloud Computing',
          'Robotique',
          'Applications mobiles innovantes',
          'Plateformes web',
          'Autre technologie émergente'
        ],
        helpText: 'Sélectionnez la catégorie technologique principale de votre projet'
      },
      {
        id: 'ai_techniques',
        type: 'multiple_select',
        label: 'Techniques d\'IA utilisées (si applicable)',
        name: 'ai_techniques',
        required: false,
        options: [
          'Apprentissage supervisé',
          'Apprentissage non supervisé',
          'Apprentissage par renforcement',
          'Réseaux de neurones profonds',
          'Traitement du langage naturel (NLP)',
          'Vision par ordinateur',
          'Systèmes experts',
          'Algorithmes génétiques',
          'Logique floue'
        ],
        helpText: 'Sélectionnez toutes les techniques d\'IA que vous utilisez'
      },
      {
        id: 'target_users',
        type: 'textarea',
        label: 'Utilisateurs cibles et cas d\'usage',
        name: 'target_users',
        required: true,
        placeholder: 'Décrivez vos utilisateurs cibles et les cas d\'usage principaux...',
        helpText: 'Présentez clairement qui utilisera votre solution et dans quels contextes'
      },
      {
        id: 'data_sources',
        type: 'textarea',
        label: 'Sources de données et datasets',
        name: 'data_sources',
        required: false,
        placeholder: 'Décrivez les données utilisées, leur origine, leur qualité...',
        helpText: 'Pour les projets IA/Data : précisez vos sources de données et leur traitement'
      },
      {
        id: 'technical_architecture',
        type: 'textarea',
        label: 'Architecture technique',
        name: 'technical_architecture',
        required: true,
        placeholder: 'Décrivez l\'architecture technique, les technologies utilisées, l\'infrastructure...',
        helpText: 'Présentez l\'architecture technique de votre solution'
      },
      {
        id: 'scalability_metrics',
        type: 'number',
        label: 'Nombre d\'utilisateurs cibles (première année)',
        name: 'scalability_metrics',
        required: true,
        placeholder: '10000',
        helpText: 'Estimez le nombre d\'utilisateurs que vous visez la première année'
      },
      {
        id: 'security_measures',
        type: 'multiple_select',
        label: 'Mesures de sécurité et conformité',
        name: 'security_measures',
        required: true,
        options: [
          'RGPD / Protection des données',
          'Chiffrement des données',
          'Authentification multi-facteurs',
          'Audit de sécurité',
          'Certification ISO 27001',
          'Hébergement sécurisé (HDS)',
          'Tests de pénétration',
          'Conformité secteur bancaire',
          'Autre certification sécurité'
        ],
        helpText: 'Sélectionnez toutes les mesures de sécurité mises en place ou prévues'
      },
      {
        id: 'open_source',
        type: 'checkbox',
        label: 'Projet open source ou contribution à l\'open source',
        name: 'open_source',
        required: false,
        defaultValue: false,
        helpText: 'Cochez si votre projet contribue à l\'écosystème open source'
      },
      {
        id: 'competitive_advantage',
        type: 'textarea',
        label: 'Avantage concurrentiel et différenciation',
        name: 'competitive_advantage',
        required: true,
        placeholder: 'Expliquez ce qui différencie votre solution de la concurrence...',
        helpText: 'Décrivez votre avantage concurrentiel et votre proposition de valeur unique'
      },
      {
        id: 'monetization_model',
        type: 'select',
        label: 'Modèle de monétisation',
        name: 'monetization_model',
        required: true,
        options: [
          'SaaS (Software as a Service)',
          'Licence logicielle',
          'Freemium',
          'Marketplace / Commission',
          'Publicité',
          'Vente de données (anonymisées)',
          'Modèle hybride',
          'Autre'
        ],
        helpText: 'Sélectionnez votre modèle économique principal'
      },
      {
        id: 'technical_files',
        type: 'file',
        label: 'Fichiers techniques',
        name: 'technical_files',
        required: false,
        acceptedFileTypes: '.pdf,.doc,.docx,.zip,.json',
        maxFileSize: 30,
        allowMultipleFiles: true,
        helpText: 'Téléchargez vos spécifications techniques, diagrammes, code source (max 30MB par fichier)'
      }
    ],
    isActive: true
  },
  {
    id: 'social-innovation-template',
    name: 'Appel à Projets - Innovation Sociale & Solidaire',
    description: 'Formulaire pour les projets d\'innovation sociale, d\'économie solidaire et d\'impact sociétal',
    fields: [
      {
        id: 'social_domain',
        type: 'select',
        label: 'Domaine d\'intervention sociale',
        name: 'social_domain',
        required: true,
        options: [
          'Lutte contre la pauvreté',
          'Insertion professionnelle',
          'Éducation et formation',
          'Santé et bien-être',
          'Logement et habitat',
          'Alimentation durable',
          'Inclusion numérique',
          'Vieillissement et dépendance',
          'Handicap et accessibilité',
          'Égalité des genres',
          'Cohésion territoriale',
          'Autre'
        ],
        helpText: 'Sélectionnez le domaine social principal de votre projet'
      },
      {
        id: 'target_beneficiaries',
        type: 'textarea',
        label: 'Bénéficiaires cibles',
        name: 'target_beneficiaries',
        required: true,
        placeholder: 'Décrivez précisément les populations bénéficiaires de votre projet...',
        helpText: 'Identifiez clairement qui bénéficiera de votre innovation sociale'
      },
      {
        id: 'social_problem',
        type: 'textarea',
        label: 'Problème social adressé',
        name: 'social_problem',
        required: true,
        placeholder: 'Décrivez le problème social que vous souhaitez résoudre...',
        helpText: 'Expliquez clairement le défi social que votre projet vise à relever'
      },
      {
        id: 'beneficiaries_count',
        type: 'number',
        label: 'Nombre de bénéficiaires directs estimés',
        name: 'beneficiaries_count',
        required: true,
        placeholder: '500',
        helpText: 'Estimez le nombre de personnes qui bénéficieront directement de votre projet'
      },
      {
        id: 'territorial_scope',
        type: 'radio',
        label: 'Périmètre territorial',
        name: 'territorial_scope',
        required: true,
        options: [
          'Local (commune/quartier)',
          'Intercommunal',
          'Départemental',
          'Régional',
          'National',
          'International'
        ],
        helpText: 'Précisez l\'étendue géographique de votre projet'
      },
      {
        id: 'partnership_types',
        type: 'multiple_select',
        label: 'Types de partenariats',
        name: 'partnership_types',
        required: false,
        options: [
          'Collectivités locales',
          'Associations',
          'Entreprises sociales',
          'Établissements publics',
          'Fondations',
          'Coopératives',
          'Mutuelles',
          'Établissements d\'enseignement',
          'Centres de recherche'
        ],
        helpText: 'Sélectionnez vos types de partenaires actuels ou envisagés'
      },
      {
        id: 'impact_measurement',
        type: 'textarea',
        label: 'Méthodes de mesure d\'impact',
        name: 'impact_measurement',
        required: true,
        placeholder: 'Décrivez comment vous mesurerez l\'impact social de votre projet...',
        helpText: 'Expliquez vos indicateurs et méthodes d\'évaluation de l\'impact social'
      },
      {
        id: 'sustainability_model',
        type: 'textarea',
        label: 'Modèle de pérennité économique',
        name: 'sustainability_model',
        required: true,
        placeholder: 'Expliquez comment votre projet sera viable économiquement à long terme...',
        helpText: 'Décrivez votre stratégie pour assurer la pérennité financière du projet'
      },
      {
        id: 'participatory_approach',
        type: 'checkbox',
        label: 'Approche participative avec les bénéficiaires',
        name: 'participatory_approach',
        required: false,
        defaultValue: false,
        helpText: 'Cochez si votre projet implique activement les bénéficiaires dans sa conception'
      },
      {
        id: 'gender_equality',
        type: 'checkbox',
        label: 'Prise en compte de l\'égalité femmes-hommes',
        name: 'gender_equality',
        required: false,
        defaultValue: false,
        helpText: 'Cochez si votre projet intègre spécifiquement l\'égalité des genres'
      },
      {
        id: 'impact_documents',
        type: 'file',
        label: 'Documents d\'impact et études',
        name: 'impact_documents',
        required: false,
        acceptedFileTypes: '.pdf,.doc,.docx,.xls,.xlsx',
        maxFileSize: 15,
        allowMultipleFiles: true,
        helpText: 'Téléchargez vos études d\'impact, rapports, évaluations (max 15MB par fichier)'
      }
    ],
    isActive: true
  }
];