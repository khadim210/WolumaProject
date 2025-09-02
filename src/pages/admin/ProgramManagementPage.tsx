import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProgramStore, Program, Partner, EvaluationCriterion, SelectionCriterion } from '../../stores/programStore';
import { useUserManagementStore } from '../../stores/userManagementStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { 
  Plus, 
  Edit, 
  Trash2, 
  Users, 
  Building, 
  Target,
  Calendar,
  DollarSign,
  Shield,
  Search,
  Filter,
  MoreVertical,
  Eye,
  EyeOff,
  Download,
  Lightbulb
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';
import jsPDF from 'jspdf';

const programSchema = Yup.object().shape({
  name: Yup.string().required('Nom requis'),
  description: Yup.string().required('Description requise'),
  partnerId: Yup.string().required('Partenaire requis'),
  budget: Yup.number().positive('Le budget doit être positif').required('Budget requis'),
  startDate: Yup.date().required('Date de début requise'),
  endDate: Yup.date()
    .min(Yup.ref('startDate'), 'La date de fin doit être après la date de début')
    .required('Date de fin requise'),
});

const partnerSchema = Yup.object().shape({
  name: Yup.string().required('Nom requis'),
  description: Yup.string().required('Description requise'),
  contactEmail: Yup.string().email('Email invalide').required('Email requis'),
  contactPhone: Yup.string(),
  address: Yup.string(),
});

const ProgramManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { users } = useUserManagementStore();
  const { 
    programs, 
    partners, 
    fetchPrograms, 
    fetchPartners,
    addProgram,
    updateProgram,
    deleteProgram,
    addPartner,
    updatePartner,
    deletePartner,
    isLoading 
  } = useProgramStore();

  const [activeTab, setActiveTab] = useState<'programs' | 'partners'>('programs');
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [showCreateProgramModal, setShowCreateProgramModal] = useState(false);
  const [showCreatePartnerModal, setShowCreatePartnerModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{ type: 'program' | 'partner'; id: string } | null>(null);
  const [expandedProgram, setExpandedProgram] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchPartners();
  }, [fetchPrograms, fetchPartners]);

  // Get accessible programs and partners based on user role
  const getAccessibleData = () => {
    if (!currentUser) return { accessiblePrograms: [], accessiblePartners: [] };
    
    if (currentUser.role === 'admin') {
      return { accessiblePrograms: programs, accessiblePartners: partners };
    } else if (currentUser.role === 'manager') {
      // Manager can see programs from their assigned partners
      const managerPartners = partners.filter(p => p.assignedManagerId === currentUser.id);
      const partnerIds = managerPartners.map(p => p.id);
      const managerPrograms = programs.filter(p => partnerIds.includes(p.partnerId) || p.managerId === currentUser.id);
      return { accessiblePrograms: managerPrograms, accessiblePartners: managerPartners };
    }
    
    return { accessiblePrograms: [], accessiblePartners: [] };
  };

  const { accessiblePrograms, accessiblePartners } = getAccessibleData();

  const filteredPrograms = accessiblePrograms.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartner = partnerFilter === 'all' || program.partnerId === partnerFilter;
    return matchesSearch && matchesPartner;
  });

  const filteredPartners = accessiblePartners.filter(partner => 
    partner.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    partner.contactEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const managers = users.filter(user => user.role === 'manager' && user.isActive);

  const handleCreateProgram = async (values: any, { resetForm, setSubmitting }: any) => {
    try {
      await addProgram({
        ...values,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        isActive: true,
        selectionCriteria: [],
        evaluationCriteria: [
          {
            id: 'default1',
            name: 'Innovation et originalité',
            description: 'Niveau d\'innovation et d\'originalité du projet',
            weight: 25,
            maxScore: 20
          },
          {
            id: 'default2',
            name: 'Faisabilité technique',
            description: 'Capacité technique à réaliser le projet',
            weight: 25,
            maxScore: 20
          },
          {
            id: 'default3',
            name: 'Impact et pertinence',
            description: 'Impact potentiel et pertinence du projet',
            weight: 25,
            maxScore: 20
          },
          {
            id: 'default4',
            name: 'Réalisme budgétaire',
            description: 'Réalisme et justification du budget demandé',
            weight: 25,
            maxScore: 20
          }
        ]
      });
      resetForm();
      setShowCreateProgramModal(false);
    } catch (error) {
      console.error('Error creating program:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgram = async (values: any, { setSubmitting }: any) => {
    if (!editingProgram) return;
    
    try {
      await updateProgram(editingProgram.id, {
        ...values,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
      });
      setEditingProgram(null);
    } catch (error) {
      console.error('Error updating program:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreatePartner = async (values: any, { resetForm, setSubmitting }: any) => {
    try {
      await addPartner({
        ...values,
        isActive: true,
      });
      resetForm();
      setShowCreatePartnerModal(false);
    } catch (error) {
      console.error('Error creating partner:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdatePartner = async (values: any, { setSubmitting }: any) => {
    if (!editingPartner) return;
    
    try {
      await updatePartner(editingPartner.id, values);
      setEditingPartner(null);
    } catch (error) {
      console.error('Error updating partner:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!showDeleteConfirm) return;
    
    try {
      if (showDeleteConfirm.type === 'program') {
        await deleteProgram(showDeleteConfirm.id);
      } else {
        await deletePartner(showDeleteConfirm.id);
      }
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const handleExportPromptToPdf = (program: Program) => {
    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    let yPosition = margin;

    // Helper function to add text with word wrapping
    const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
      pdf.setFontSize(fontSize);
      const lines = pdf.splitTextToSize(text, maxWidth);
      pdf.text(lines, x, y);
      return y + (lines.length * fontSize * 0.4);
    };

    // Header with Woluma branding
    pdf.setFillColor(0, 51, 102); // Woluma blue
    pdf.rect(0, 0, pageWidth, 40, 'F');
    
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROMPT D\'ÉVALUATION IA', margin, 25);
    
    pdf.setFontSize(10);
    pdf.text('Woluma-Flow - Configuration d\'évaluation automatique', margin, 35);

    yPosition = 60;
    pdf.setTextColor(0, 0, 0);

    // Program Information
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('INFORMATIONS DU PROGRAMME', margin, yPosition);
    yPosition += 15;

    pdf.setDrawColor(200, 200, 200);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 40);
    
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('Nom:', margin + 5, yPosition + 5);
    pdf.setFont('helvetica', 'normal');
    yPosition = addText(program.name, margin + 25, yPosition + 5, pageWidth - 2 * margin - 30, 12);
    yPosition += 5;

    pdf.setFont('helvetica', 'bold');
    pdf.text('Description:', margin + 5, yPosition);
    pdf.setFont('helvetica', 'normal');
    yPosition = addText(program.description, margin + 35, yPosition, pageWidth - 2 * margin - 40, 12);
    yPosition += 15;

    // Custom AI Prompt
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('PROMPT PERSONNALISÉ', margin, yPosition);
    yPosition += 10;

    if (program.customAiPrompt) {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(program.customAiPrompt, margin, yPosition, pageWidth - 2 * margin, 11);
    } else {
      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'italic');
      pdf.text('Aucun prompt personnalisé défini. Le prompt par défaut sera utilisé.', margin, yPosition);
      yPosition += 10;
    }
    yPosition += 15;

    // Variables disponibles
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('VARIABLES DISPONIBLES', margin, yPosition);
    yPosition += 10;

    const variables = [
      { name: '{{program_name}}', description: 'Nom du programme' },
      { name: '{{program_description}}', description: 'Description du programme' },
      { name: '{{partner_name}}', description: 'Nom du partenaire' },
      { name: '{{budget_range}}', description: 'Fourchette budgétaire du programme' }
    ];

    variables.forEach(variable => {
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${variable.name}:`, margin, yPosition);
      pdf.setFont('helvetica', 'normal');
      pdf.text(variable.description, margin + 60, yPosition);
      yPosition += 8;
    });

    yPosition += 10;

    // Evaluation Criteria
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('CRITÈRES D\'ÉVALUATION', margin, yPosition);
    yPosition += 10;

    program.evaluationCriteria.forEach((criterion, index) => {
      // Check if we need a new page
      if (yPosition > 250) {
        pdf.addPage();
        yPosition = margin;
      }

      pdf.setDrawColor(200, 200, 200);
      pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, 25);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${criterion.name}`, margin + 5, yPosition + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Score max: ${criterion.maxScore}`, pageWidth - margin - 60, yPosition + 5);
      pdf.text(`Poids: ${criterion.weight}%`, pageWidth - margin - 60, yPosition + 12);

      pdf.setFontSize(10);
      yPosition = addText(criterion.description, margin + 5, yPosition + 15, pageWidth - 2 * margin - 70, 10);
      yPosition += 10;
    });

    // Footer
    const footerY = pdf.internal.pageSize.height - 20;
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, footerY, pageWidth - margin, footerY);
    
    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), margin, footerY + 8);
    pdf.text('Woluma-Flow - Configuration d\'évaluation IA', pageWidth - margin - 80, footerY + 8);

    // Save the PDF
    const fileName = `Prompt_IA_${program.name.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
    pdf.save(fileName);
  };

  if (currentUser?.role !== 'admin' && currentUser?.role !== 'manager') {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h2>
        <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des programmes</h1>
          <p className="mt-1 text-gray-600">Gérez les programmes et partenaires</p>
        </div>
        <div className="flex space-x-3">
          {checkPermission('parameters.edit') && (
            <>
              <Button
                variant="secondary"
                leftIcon={<Building className="h-4 w-4" />}
                onClick={() => setShowCreatePartnerModal(true)}
              >
                Nouveau partenaire
              </Button>
              <Button
                variant="primary"
                leftIcon={<Plus className="h-4 w-4" />}
                onClick={() => setShowCreateProgramModal(true)}
              >
                Nouveau programme
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('programs')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'programs'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Target className="h-4 w-4 inline mr-2" />
            Programmes ({filteredPrograms.length})
          </button>
          <button
            onClick={() => setActiveTab('partners')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'partners'
                ? 'border-primary-500 text-primary-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Building className="h-4 w-4 inline mr-2" />
            Partenaires ({filteredPartners.length})
          </button>
        </nav>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="py-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-grow">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder={`Rechercher ${activeTab === 'programs' ? 'un programme' : 'un partenaire'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            {activeTab === 'programs' && (
              <div className="relative w-64">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                  <Filter className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  className="block w-full pl-10 pr-8 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm appearance-none"
                  value={partnerFilter}
                  onChange={(e) => setPartnerFilter(e.target.value)}
                >
                  <option value="all">Tous les partenaires</option>
                  {accessiblePartners.map(partner => (
                    <option key={partner.id} value={partner.id}>
                      {partner.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Content */}
      {activeTab === 'programs' ? (
        <div className="grid grid-cols-1 gap-6">
          {filteredPrograms.map(program => {
            const partner = partners.find(p => p.id === program.partnerId);
            const manager = managers.find(m => m.id === program.managerId);
            const isExpanded = expandedProgram === program.id;
            
            return (
              <Card key={program.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="flex items-center">
                        <Target className="h-5 w-5 text-primary-600 mr-2" />
                        {program.name}
                        <span className={`ml-3 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          program.isActive 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {program.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </CardTitle>
                      <p className="mt-1 text-sm text-gray-500">{program.description}</p>
                      
                      <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="flex items-center text-gray-600">
                          <Building className="h-4 w-4 mr-1" />
                          <span>{partner?.name || 'Partenaire inconnu'}</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <DollarSign className="h-4 w-4 mr-1" />
                          <span>{program.budget.toLocaleString()} FCFA</span>
                        </div>
                        <div className="flex items-center text-gray-600">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{program.startDate.toLocaleDateString()} - {program.endDate.toLocaleDateString()}</span>
                        </div>
                        {manager && (
                          <div className="flex items-center text-gray-600">
                            <Users className="h-4 w-4 mr-1" />
                            <span>{manager.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedProgram(isExpanded ? null : program.id)}
                        leftIcon={isExpanded ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      >
                        {isExpanded ? 'Masquer' : 'Détails'}
                      </Button>
                      
                      {checkPermission('parameters.edit') && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingProgram(program)}
                            leftIcon={<Edit className="h-4 w-4" />}
                          >
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowDeleteConfirm({ type: 'program', id: program.id })}
                            leftIcon={<Trash2 className="h-4 w-4" />}
                          >
                            Supprimer
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardHeader>
                
                {isExpanded && (
                  <CardContent className="border-t border-gray-200 bg-gray-50">
                    <div className="space-y-6">
                      {/* Critères d'évaluation */}
                      <div>
                        <h4 className="text-md font-semibold text-gray-800 mb-3">Critères d'évaluation</h4>
                        <div className="space-y-2">
                          {program.evaluationCriteria.map((criterion, index) => (
                            <div key={criterion.id} className="bg-white border border-gray-200 rounded-md p-3">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="font-medium text-gray-900">{criterion.name}</span>
                                  <p className="text-sm text-gray-600 mt-1">{criterion.description}</p>
                                </div>
                                <div className="text-right text-sm text-gray-500">
                                  <div>Score max: {criterion.maxScore}</div>
                                  <div>Poids: {criterion.weight}%</div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Personnalisation du prompt IA */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="text-md font-semibold text-gray-800 flex items-center">
                            <Lightbulb className="h-4 w-4 text-yellow-500 mr-2" />
                            Personnalisation du prompt IA
                          </h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportPromptToPdf(program)}
                            leftIcon={<Download className="h-4 w-4" />}
                          >
                            Exporter le prompt en PDF
                          </Button>
                        </div>
                        
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                          <p className="text-sm text-blue-700 mb-3">
                            Personnalisez les instructions données à l'IA pour l'évaluation des projets de ce programme.
                            Si aucun prompt personnalisé n'est défini, le prompt par défaut sera utilisé.
                          </p>
                          
                          <div className="bg-gray-800 text-gray-100 p-3 rounded-md text-sm font-mono mb-3">
                            <div className="text-gray-400 mb-2">Instructions spécifiques pour l'IA</div>
                            {program.customAiPrompt || "Entrez des instructions spécifiques pour l'évaluation IA de ce programme..."}
                          </div>
                          
                          <div className="text-xs text-gray-600 mb-3">
                            Exemple :
                            <br />- Accordez une attention particulière aux aspects environnementaux
                            <br />- Privilégiez les projets avec un impact social fort
                            <br />- Évaluez la faisabilité technique avec rigueur
                            <br />- Considérez le potentiel de scalabilité du projet
                          </div>
                          
                          <div className="bg-gray-100 p-3 rounded-md text-xs text-gray-600">
                            Ces instructions seront ajoutées au prompt standard pour personnaliser l'évaluation selon les spécificités de ce programme.
                          </div>
                          
                          <div className="mt-4">
                            <h5 className="text-sm font-medium text-gray-700 mb-2">Variables disponibles</h5>
                            <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                              <div><code className="bg-gray-200 px-1 rounded">{'{{program_name}}'}</code> - Nom du programme</div>
                              <div><code className="bg-gray-200 px-1 rounded">{'{{program_description}}'}</code> - Description du programme</div>
                              <div><code className="bg-gray-200 px-1 rounded">{'{{partner_name}}'}</code> - Nom du partenaire</div>
                              <div><code className="bg-gray-200 px-1 rounded">{'{{budget_range}}'}</code> - Fourchette budgétaire du programme</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })}
          
          {filteredPrograms.length === 0 && (
            <div className="text-center py-12 bg-white rounded-lg shadow">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                {searchTerm || partnerFilter !== 'all'
                  ? "Aucun programme ne correspond à vos critères de recherche"
                  : "Aucun programme disponible"}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPartners.map(partner => {
            const manager = managers.find(m => m.id === partner.assignedManagerId);
            const partnerPrograms = programs.filter(p => p.partnerId === partner.id);
            
            return (
              <Card key={partner.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center">
                        <Building className="h-5 w-5 text-primary-600 mr-2" />
                        {partner.name}
                        <span className={`ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          partner.isActive 
                            ? 'bg-success-100 text-success-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {partner.isActive ? 'Actif' : 'Inactif'}
                        </span>
                      </CardTitle>
                      <p className="mt-1 text-sm text-gray-500">{partner.description}</p>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center text-gray-600">
                      <span className="font-medium">Email:</span>
                      <span className="ml-2">{partner.contactEmail}</span>
                    </div>
                    
                    {partner.contactPhone && (
                      <div className="flex items-center text-gray-600">
                        <span className="font-medium">Téléphone:</span>
                        <span className="ml-2">{partner.contactPhone}</span>
                      </div>
                    )}
                    
                    {manager && (
                      <div className="flex items-center text-gray-600">
                        <Users className="h-4 w-4 mr-1" />
                        <span className="font-medium">Manager:</span>
                        <span className="ml-2">{manager.name}</span>
                      </div>
                    )}
                    
                    <div className="flex items-center text-gray-600">
                      <Target className="h-4 w-4 mr-1" />
                      <span className="font-medium">Programmes:</span>
                      <span className="ml-2">{partnerPrograms.length}</span>
                    </div>
                    
                    <div className="flex items-center text-gray-600">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span className="font-medium">Créé le:</span>
                      <span className="ml-2">{partner.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                </CardContent>
                
                {checkPermission('parameters.edit') && (
                  <CardFooter className="bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingPartner(partner)}
                      leftIcon={<Edit className="h-4 w-4" />}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm({ type: 'partner', id: partner.id })}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Supprimer
                    </Button>
                  </CardFooter>
                )}
              </Card>
            );
          })}
          
          {filteredPartners.length === 0 && (
            <div className="col-span-full text-center py-12 bg-white rounded-lg shadow">
              <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <div className="text-gray-500">
                {searchTerm
                  ? "Aucun partenaire ne correspond à vos critères de recherche"
                  : "Aucun partenaire disponible"}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create Program Modal */}
      {showCreateProgramModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouveau programme</h3>
              <Formik
                initialValues={{
                  name: '',
                  description: '',
                  partnerId: '',
                  budget: '',
                  startDate: '',
                  endDate: '',
                  managerId: '',
                }}
                validationSchema={programSchema}
                onSubmit={handleCreateProgram}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom du programme</label>
                      <Field
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="description" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Partenaire</label>
                      <Field
                        as="select"
                        name="partnerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Sélectionner un partenaire</option>
                        {accessiblePartners.map(partner => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="partnerId" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Budget (FCFA)</label>
                      <Field
                        name="budget"
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="budget" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                        <Field
                          name="startDate"
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <ErrorMessage name="startDate" component="div" className="mt-1 text-sm text-error-600" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                        <Field
                          name="endDate"
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <ErrorMessage name="endDate" component="div" className="mt-1 text-sm text-error-600" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager (optionnel)</label>
                      <Field
                        as="select"
                        name="managerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Aucun manager assigné</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </Field>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreateProgramModal(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                      >
                        Créer
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Edit Program Modal */}
      {editingProgram && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le programme</h3>
              <Formik
                initialValues={{
                  name: editingProgram.name,
                  description: editingProgram.description,
                  partnerId: editingProgram.partnerId,
                  budget: editingProgram.budget.toString(),
                  startDate: editingProgram.startDate.toISOString().split('T')[0],
                  endDate: editingProgram.endDate.toISOString().split('T')[0],
                  managerId: editingProgram.managerId || '',
                  isActive: editingProgram.isActive,
                }}
                validationSchema={programSchema}
                onSubmit={handleUpdateProgram}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom du programme</label>
                      <Field
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="description" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Partenaire</label>
                      <Field
                        as="select"
                        name="partnerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Sélectionner un partenaire</option>
                        {accessiblePartners.map(partner => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="partnerId" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Budget (FCFA)</label>
                      <Field
                        name="budget"
                        type="number"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="budget" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date de début</label>
                        <Field
                          name="startDate"
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <ErrorMessage name="startDate" component="div" className="mt-1 text-sm text-error-600" />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700">Date de fin</label>
                        <Field
                          name="endDate"
                          type="date"
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        />
                        <ErrorMessage name="endDate" component="div" className="mt-1 text-sm text-error-600" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager</label>
                      <Field
                        as="select"
                        name="managerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Aucun manager assigné</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </Field>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <Field
                          name="isActive"
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Programme actif</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingProgram(null)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                      >
                        Modifier
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Create Partner Modal */}
      {showCreatePartnerModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Créer un nouveau partenaire</h3>
              <Formik
                initialValues={{
                  name: '',
                  description: '',
                  contactEmail: '',
                  contactPhone: '',
                  address: '',
                  assignedManagerId: '',
                }}
                validationSchema={partnerSchema}
                onSubmit={handleCreatePartner}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom du partenaire</label>
                      <Field
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="description" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email de contact</label>
                      <Field
                        name="contactEmail"
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="contactEmail" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone (optionnel)</label>
                      <Field
                        name="contactPhone"
                        type="tel"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse (optionnel)</label>
                      <Field
                        as="textarea"
                        name="address"
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager assigné (optionnel)</label>
                      <Field
                        as="select"
                        name="assignedManagerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Aucun manager assigné</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </Field>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setShowCreatePartnerModal(false)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                      >
                        Créer
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {editingPartner && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Modifier le partenaire</h3>
              <Formik
                initialValues={{
                  name: editingPartner.name,
                  description: editingPartner.description,
                  contactEmail: editingPartner.contactEmail,
                  contactPhone: editingPartner.contactPhone || '',
                  address: editingPartner.address || '',
                  assignedManagerId: editingPartner.assignedManagerId || '',
                  isActive: editingPartner.isActive,
                }}
                validationSchema={partnerSchema}
                onSubmit={handleUpdatePartner}
              >
                {({ isSubmitting }) => (
                  <Form className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Nom du partenaire</label>
                      <Field
                        name="name"
                        type="text"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="name" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Description</label>
                      <Field
                        as="textarea"
                        name="description"
                        rows={3}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="description" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email de contact</label>
                      <Field
                        name="contactEmail"
                        type="email"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="contactEmail" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Téléphone</label>
                      <Field
                        name="contactPhone"
                        type="tel"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adresse</label>
                      <Field
                        as="textarea"
                        name="address"
                        rows={2}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700">Manager assigné</label>
                      <Field
                        as="select"
                        name="assignedManagerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Aucun manager assigné</option>
                        {managers.map(manager => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </Field>
                    </div>

                    <div>
                      <label className="flex items-center">
                        <Field
                          name="isActive"
                          type="checkbox"
                          className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                        />
                        <span className="ml-2 text-sm text-gray-900">Partenaire actif</span>
                      </label>
                    </div>

                    <div className="flex justify-end space-x-3 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setEditingPartner(null)}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="primary"
                        isLoading={isSubmitting}
                      >
                        Modifier
                      </Button>
                    </div>
                  </Form>
                )}
              </Formik>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-error-100">
                <Trash2 className="h-6 w-6 text-error-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">
                Supprimer {showDeleteConfirm.type === 'program' ? 'le programme' : 'le partenaire'}
              </h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer cet élément ? Cette action est irréversible.
              </p>
              <div className="flex justify-center space-x-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setShowDeleteConfirm(null)}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  onClick={handleDelete}
                >
                  Supprimer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProgramManagementPage;