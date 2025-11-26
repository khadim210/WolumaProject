import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import {
  FileText,
  GraduationCap,
  DollarSign,
  Archive,
  Shield,
  Plus,
  Download,
  Upload,
  CheckCircle,
  XCircle,
  Clock,
  Edit,
  Trash2,
  AlertCircle
} from 'lucide-react';
import DocumentRequestModal from '../../components/formalization/DocumentRequestModal';
import TechnicalSupportModal from '../../components/formalization/TechnicalSupportModal';
import DisbursementPlanModal from '../../components/formalization/DisbursementPlanModal';
import { formalizationService } from '../../services/formalizationService';
import type {
  DocumentRequest,
  DocumentSubmission,
  TechnicalSupport,
  DisbursementPlan,
  DisbursementTranche
} from '../../services/formalizationService';

type TabType = 'documents' | 'support' | 'financial' | 'archive';

const FormalizationPage: React.FC = () => {
  const { user } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { projects, fetchProjects } = useProjectStore();
  const { programs, fetchPrograms } = useProgramStore();

  const [activeTab, setActiveTab] = useState<TabType>('documents');
  const [selectedProject, setSelectedProject] = useState<string>('');
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showFinancialModal, setShowFinancialModal] = useState(false);
  const [selectedSupport, setSelectedSupport] = useState<TechnicalSupport | null>(null);

  const [documentRequests, setDocumentRequests] = useState<DocumentRequest[]>([]);
  const [technicalSupports, setTechnicalSupports] = useState<TechnicalSupport[]>([]);
  const [disbursementPlan, setDisbursementPlan] = useState<DisbursementPlan | null>(null);
  const [disbursementTranches, setDisbursementTranches] = useState<DisbursementTranche[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);

  useEffect(() => {
    fetchPrograms();
    fetchProjects();
  }, [fetchPrograms, fetchProjects]);

  useEffect(() => {
    if (selectedProject) {
      loadProjectData(selectedProject);
    }
  }, [selectedProject]);

  const loadProjectData = async (projectId: string) => {
    const [docs, supports, financial] = await Promise.all([
      formalizationService.getDocumentRequestsByProject(projectId),
      formalizationService.getTechnicalSupportByProject(projectId),
      formalizationService.getDisbursementPlanByProject(projectId)
    ]);

    setDocumentRequests(docs);
    setTechnicalSupports(supports);
    setDisbursementPlan(financial.plan);
    setDisbursementTranches(financial.tranches);
  };

  if (!user || !checkPermission('evaluation.evaluate')) {
    return (
      <div className="text-center py-12">
        <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h2 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h2>
        <p className="text-gray-500">Vous n'avez pas accès à cette section.</p>
      </div>
    );
  }

  const selectedProjectsData = projects.filter(
    p => p.status === 'selected' || p.status === 'formalization'
  );

  const currentProject = projects.find(p => p.id === selectedProject);

  const handleCreateDocumentRequest = async (values: any) => {
    await formalizationService.createDocumentRequest({
      ...values,
      requested_by: user.id
    });
    loadProjectData(selectedProject);
  };

  const handleUploadDocument = async (requestId: string, file: File, submittedBy: string) => {
    setIsUploading(true);
    try {
      const filePath = await formalizationService.uploadDocument(file, requestId);
      if (filePath) {
        await formalizationService.createDocumentSubmission({
          request_id: requestId,
          file_name: file.name,
          file_path: filePath,
          file_size: file.size,
          submitted_by: submittedBy
        });
        loadProjectData(selectedProject);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors du téléversement');
    } finally {
      setIsUploading(false);
    }
  };

  const handleCreateTechnicalSupport = async (values: any) => {
    if (selectedSupport) {
      await formalizationService.updateTechnicalSupport(selectedSupport.id, values);
    } else {
      await formalizationService.createTechnicalSupport({
        ...values,
        created_by: user.id
      });
    }
    setSelectedSupport(null);
    loadProjectData(selectedProject);
  };

  const handleDeleteSupport = async (id: string) => {
    if (confirm('Confirmer la suppression ?')) {
      await formalizationService.deleteTechnicalSupport(id);
      loadProjectData(selectedProject);
    }
  };

  const handleSaveDisbursementPlan = async (values: any) => {
    await formalizationService.createDisbursementPlan(
      {
        project_id: values.project_id,
        total_amount: values.total_amount,
        currency: values.currency,
        created_by: user.id
      },
      values.tranches
    );
    loadProjectData(selectedProject);
  };

  const handleUpdateTranche = async (trancheId: string, updates: Partial<DisbursementTranche>) => {
    await formalizationService.updateDisbursementTranche(trancheId, updates);
    loadProjectData(selectedProject);
  };

  const handleArchiveProject = async () => {
    if (!currentProject) return;

    if (!confirm(`Confirmer l'archivage du projet "${currentProject.title}" ?`)) {
      return;
    }

    setIsArchiving(true);
    try {
      const result = await formalizationService.createProjectArchive(
        selectedProject,
        user.id,
        'Projet archivé depuis la page de formalisation'
      );

      if (result.success) {
        alert('Projet archivé avec succès');
      }
    } catch (error) {
      console.error('Error archiving project:', error);
      alert('Erreur lors de l\'archivage');
    } finally {
      setIsArchiving(false);
    }
  };

  const tabs = [
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'support', label: 'Accompagnement Technique', icon: GraduationCap },
    { id: 'financial', label: 'Plan de Décaissement', icon: DollarSign },
    { id: 'archive', label: 'Archive & Export', icon: Archive }
  ];

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: { label: 'En attente', color: 'bg-yellow-100 text-yellow-800' },
      submitted: { label: 'Soumis', color: 'bg-blue-100 text-blue-800' },
      validated: { label: 'Validé', color: 'bg-green-100 text-green-800' },
      rejected: { label: 'Rejeté', color: 'bg-red-100 text-red-800' },
      planned: { label: 'Planifié', color: 'bg-purple-100 text-purple-800' },
      in_progress: { label: 'En cours', color: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Terminé', color: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Annulé', color: 'bg-gray-100 text-gray-800' },
      disbursed: { label: 'Décaissé', color: 'bg-green-100 text-green-800' },
      approved: { label: 'Approuvé', color: 'bg-green-100 text-green-800' }
    };

    const badge = badges[status as keyof typeof badges] || { label: status, color: 'bg-gray-100 text-gray-800' };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Formalisation des Projets</h1>
        <p className="text-gray-600">
          Gestion des documents, accompagnement et décaissement
        </p>
      </div>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Sélectionner un projet
        </label>
        {selectedProjectsData.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Aucun projet sélectionné disponible
                </h3>
                <p className="text-gray-600 mb-4">
                  Les projets doivent avoir le statut "Sélectionné" ou "Formalisation" pour apparaître ici.
                </p>
                <div className="bg-blue-50 rounded-lg p-4 text-left max-w-md mx-auto">
                  <p className="text-sm text-blue-900 font-medium mb-2">Pour voir des projets ici :</p>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Allez dans la page "Évaluation"</li>
                    <li>Évaluez et sélectionnez des projets</li>
                    <li>Les projets sélectionnés apparaîtront ici</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="w-full max-w-md px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">-- Choisir un projet ({selectedProjectsData.length} disponible{selectedProjectsData.length > 1 ? 's' : ''}) --</option>
            {selectedProjectsData.map(project => (
              <option key={project.id} value={project.id}>
                {project.title} ({project.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {selectedProject && (
        <>
          <div className="border-b border-gray-200 mb-6">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Gestion des Documents</h2>
                <Button onClick={() => setShowDocumentModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvelle demande
                </Button>
              </div>

              <div className="grid gap-4">
                {documentRequests.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucune demande de document</p>
                    </CardContent>
                  </Card>
                ) : (
                  documentRequests.map((request) => (
                    <Card key={request.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{request.document_name}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Type: {request.document_type}
                            </p>
                          </div>
                          {getStatusBadge(request.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{request.description}</p>
                        {request.due_date && (
                          <p className="text-sm text-gray-500 mb-4">
                            <Clock className="h-4 w-4 inline mr-1" />
                            Date limite: {new Date(request.due_date).toLocaleDateString('fr-FR')}
                          </p>
                        )}

                        <div className="flex gap-2">
                          <label className="flex-1">
                            <input
                              type="file"
                              className="hidden"
                              onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                  const email = prompt('Email du soumissionnaire:');
                                  if (email) {
                                    handleUploadDocument(request.id, file, email);
                                  }
                                }
                              }}
                              disabled={isUploading || request.status === 'validated'}
                            />
                            <Button
                              variant="outline"
                              className="w-full"
                              disabled={isUploading || request.status === 'validated'}
                            >
                              <Upload className="h-4 w-4 mr-2" />
                              {isUploading ? 'Téléversement...' : 'Uploader'}
                            </Button>
                          </label>
                          <Button
                            variant="outline"
                            onClick={() => {
                              formalizationService.updateDocumentRequest(request.id, {
                                status: 'validated'
                              }).then(() => loadProjectData(selectedProject));
                            }}
                            disabled={request.status !== 'submitted'}
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Valider
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'support' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Accompagnement Technique</h2>
                <Button onClick={() => {
                  setSelectedSupport(null);
                  setShowSupportModal(true);
                }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nouvel accompagnement
                </Button>
              </div>

              <div className="grid gap-4">
                {technicalSupports.length === 0 ? (
                  <Card>
                    <CardContent className="text-center py-12">
                      <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Aucun accompagnement planifié</p>
                    </CardContent>
                  </Card>
                ) : (
                  technicalSupports.map((support) => (
                    <Card key={support.id}>
                      <CardHeader>
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle>{support.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Type: {support.support_type}
                            </p>
                          </div>
                          {getStatusBadge(support.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-gray-700 mb-4">{support.description}</p>
                        <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                          {support.scheduled_date && (
                            <div>
                              <span className="font-medium">Date:</span>{' '}
                              {new Date(support.scheduled_date).toLocaleDateString('fr-FR')}
                            </div>
                          )}
                          {support.duration_hours > 0 && (
                            <div>
                              <span className="font-medium">Durée:</span>{' '}
                              {support.duration_hours}h
                            </div>
                          )}
                          {support.provider && (
                            <div>
                              <span className="font-medium">Prestataire:</span>{' '}
                              {support.provider}
                            </div>
                          )}
                          {support.participants && (
                            <div>
                              <span className="font-medium">Participants:</span>{' '}
                              {support.participants}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            onClick={() => {
                              setSelectedSupport(support);
                              setShowSupportModal(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Modifier
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => handleDeleteSupport(support.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          )}

          {activeTab === 'financial' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold">Plan de Décaissement</h2>
                {!disbursementPlan && (
                  <Button onClick={() => setShowFinancialModal(true)}>
                    <Plus className="h-4 w-4 mr-2" />
                    Créer le plan
                  </Button>
                )}
              </div>

              {disbursementPlan ? (
                <div className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Montant total: {disbursementPlan.total_amount.toLocaleString()} {disbursementPlan.currency}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {disbursementTranches.map((tranche) => (
                          <div
                            key={tranche.id}
                            className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                          >
                            <div className="flex justify-between items-start mb-3">
                              <div>
                                <h4 className="font-medium">
                                  Tranche {tranche.tranche_number}
                                </h4>
                                <p className="text-sm text-gray-600">
                                  {tranche.amount.toLocaleString()} {disbursementPlan.currency} ({tranche.percentage}%)
                                </p>
                              </div>
                              {getStatusBadge(tranche.status)}
                            </div>

                            {tranche.scheduled_date && (
                              <p className="text-sm text-gray-600 mb-2">
                                Date prévue: {new Date(tranche.scheduled_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}

                            {tranche.conditions && (
                              <p className="text-sm text-gray-700 mb-3">
                                <span className="font-medium">Conditions:</span> {tranche.conditions}
                              </p>
                            )}

                            {tranche.status === 'pending' && (
                              <Button
                                size="sm"
                                onClick={() => handleUpdateTranche(tranche.id, { status: 'disbursed', actual_disbursement_date: new Date() })}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Marquer comme décaissé
                              </Button>
                            )}

                            {tranche.actual_disbursement_date && (
                              <p className="text-sm text-green-600 mt-2">
                                Décaissé le: {new Date(tranche.actual_disbursement_date).toLocaleDateString('fr-FR')}
                              </p>
                            )}
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <Card>
                  <CardContent className="text-center py-12">
                    <DollarSign className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">Aucun plan de décaissement créé</p>
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          {activeTab === 'archive' && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold">Archivage et Export</h2>

              <Card>
                <CardContent className="py-8">
                  <div className="text-center space-y-4">
                    <Archive className="h-16 w-16 text-blue-600 mx-auto" />
                    <h3 className="text-lg font-semibold">
                      Archiver le projet: {currentProject?.title}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                      L'archivage permet de clôturer officiellement le projet et d'exporter
                      l'ensemble du dossier (documents, évaluations, accompagnement, décaissements)
                      au format ZIP.
                    </p>

                    <div className="flex gap-4 justify-center pt-4">
                      <Button
                        onClick={handleArchiveProject}
                        disabled={isArchiving}
                      >
                        <Archive className="h-4 w-4 mr-2" />
                        {isArchiving ? 'Archivage...' : 'Archiver le projet'}
                      </Button>

                      <Button variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Exporter en ZIP
                      </Button>
                    </div>

                    <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                      <div className="flex items-start gap-2">
                        <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                        <div className="text-left text-sm text-yellow-800">
                          <p className="font-medium mb-1">Attention</p>
                          <p>
                            Cette action est définitive. Le projet sera marqué comme archivé
                            et ne pourra plus être modifié.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <DocumentRequestModal
        isOpen={showDocumentModal}
        onClose={() => setShowDocumentModal(false)}
        onSubmit={handleCreateDocumentRequest}
        projectId={selectedProject}
      />

      <TechnicalSupportModal
        isOpen={showSupportModal}
        onClose={() => {
          setShowSupportModal(false);
          setSelectedSupport(null);
        }}
        onSubmit={handleCreateTechnicalSupport}
        projectId={selectedProject}
        support={selectedSupport || undefined}
      />

      {currentProject && (
        <DisbursementPlanModal
          isOpen={showFinancialModal}
          onClose={() => setShowFinancialModal(false)}
          onSubmit={handleSaveDisbursementPlan}
          projectId={selectedProject}
          projectBudget={currentProject.budget}
          existingPlan={disbursementPlan && { ...disbursementPlan, tranches: disbursementTranches }}
        />
      )}
    </div>
  );
};

export default FormalizationPage;
