import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { usePermissions } from '../../hooks/usePermissions';
import { useProgramStore, Program, Partner, SelectionCriterion, CriterionType } from '../../stores/programStore';
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
  Search, 
  Filter,
  Calendar,
  Building,
  Settings,
  Save,
  X,
  Target,
  Award
} from 'lucide-react';
import { Formik, Form, Field, ErrorMessage, FieldArray } from 'formik';
import * as Yup from 'yup';

const programSchema = Yup.object().shape({
  name: Yup.string().required('Nom requis'),
  description: Yup.string().required('Description requise'),
  partnerId: Yup.string().required('Partenaire requis'),
  budget: Yup.number().required('Budget requis').positive('Le budget doit être positif'),
  startDate: Yup.date().required('Date de début requise'),
  endDate: Yup.date()
    .required('Date de fin requise')
    .min(Yup.ref('startDate'), 'La date de fin doit être après la date de début'),
  selectionCriteria: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Nom du critère requis'),
      description: Yup.string().required('Description requise'),
      type: Yup.string().required('Type requis'),
      required: Yup.boolean(),
    })
  ).min(1, 'Au moins un critère de sélection est requis'),
  evaluationCriteria: Yup.array().of(
    Yup.object().shape({
      name: Yup.string().required('Nom du critère requis'),
      description: Yup.string().required('Description requise'),
      weight: Yup.number()
        .required('Poids requis')
        .min(1, 'Le poids doit être au moins 1%')
        .max(100, 'Le poids ne peut pas dépasser 100%'),
      maxScore: Yup.number()
        .required('Score maximum requis')
        .min(1, 'Le score maximum doit être au moins 1'),
    })
  ).min(1, 'Au moins un critère d\'évaluation est requis')
  .test('total-weight', 'Le poids total ne doit pas dépasser 100%', function(value) {
    if (!value) return true;
    const totalWeight = value.reduce((sum, criterion) => sum + (criterion.weight || 0), 0);
    return totalWeight <= 100;
  }),
});

interface ProgramFormValues {
  name: string;
  description: string;
  partnerId: string;
  budget: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  selectionCriteria: SelectionCriterion[];
  evaluationCriteria: EvaluationCriterion[];
}

const criterionTypes: { value: CriterionType; label: string }[] = [
  { value: 'number', label: 'Nombre' },
  { value: 'text', label: 'Texte' },
  { value: 'select', label: 'Liste de choix' },
  { value: 'boolean', label: 'Oui/Non' },
  { value: 'date', label: 'Date' },
  { value: 'range', label: 'Plage de valeurs' },
];

const ProgramManagementPage: React.FC = () => {
  const { user: currentUser } = useAuthStore();
  const { checkPermission } = usePermissions();
  const { 
    programs, 
    partners, 
    isLoading, 
    fetchPrograms, 
    fetchPartners,
    addProgram, 
    updateProgram, 
    deleteProgram 
  } = useProgramStore();
  const { users } = useUserManagementStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [partnerFilter, setPartnerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchPrograms();
    fetchPartners();
  }, [fetchPrograms, fetchPartners]);

  const managers = users.filter(user => user.role === 'manager' && user.isActive);

  const filteredPrograms = programs.filter(program => {
    const matchesSearch = program.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         program.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPartner = partnerFilter === 'all' || program.partnerId === partnerFilter;
    const matchesStatus = statusFilter === 'all' || 
                         (statusFilter === 'active' && program.isActive) ||
                         (statusFilter === 'inactive' && !program.isActive);
    
    return matchesSearch && matchesPartner && matchesStatus;
  });

  const handleCreateProgram = async (values: ProgramFormValues, { resetForm, setSubmitting }: any) => {
    try {
      await addProgram({
        name: values.name,
        description: values.description,
        partnerId: values.partnerId,
        budget: values.budget,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        isActive: values.isActive,
        selectionCriteria: values.selectionCriteria,
      });
      resetForm();
      setShowCreateModal(false);
    } catch (error) {
      console.error('Error creating program:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateProgram = async (values: ProgramFormValues, { setSubmitting }: any) => {
    if (!editingProgram) return;
    
    try {
      await updateProgram(editingProgram.id, {
        name: values.name,
        description: values.description,
        partnerId: values.partnerId,
        budget: values.budget,
        startDate: new Date(values.startDate),
        endDate: new Date(values.endDate),
        isActive: values.isActive,
        selectionCriteria: values.selectionCriteria,
      });
      setEditingProgram(null);
    } catch (error) {
      console.error('Error updating program:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProgram = async (programId: string) => {
    try {
      await deleteProgram(programId);
      setShowDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting program:', error);
    }
  };

  const getPartnerName = (partnerId: string) => {
    const partner = partners.find(p => p.id === partnerId);
    return partner ? partner.name : 'Partenaire introuvable';
  };

  const getCriterionTypeLabel = (type: CriterionType) => {
    const typeConfig = criterionTypes.find(t => t.value === type);
    return typeConfig ? typeConfig.label : type;
  };

  const generateCriterionId = () => {
    return `c${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };
  
  const generateEvaluationId = () => {
    return `e${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  if (currentUser?.role !== 'admin') {
    if (!checkPermission('parameters.edit')) {
      return (
        <div className="text-center py-12">
          <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-lg font-medium text-gray-900 mb-2">Accès restreint</h2>
          <p className="text-gray-500">Vous n'avez pas les permissions nécessaires pour accéder à cette page.</p>
        </div>
      );
    }
  }

  const initialFormValues: ProgramFormValues = {
    name: '',
    description: '',
    partnerId: '',
    budget: 0,
    startDate: '',
    endDate: '',
    isActive: true,
    selectionCriteria: [{
      id: generateCriterionId(),
      name: '',
      description: '',
      type: 'text',
      required: true,
    }],
    evaluationCriteria: [{
      id: generateEvaluationId(),
      name: '',
      description: '',
      weight: 0,
      maxScore: 20,
    }],
  };

  const getEditFormValues = (program: Program): ProgramFormValues => ({
    name: program.name,
    description: program.description,
    partnerId: program.partnerId,
    budget: program.budget,
    startDate: program.startDate.toISOString().split('T')[0],
    endDate: program.endDate.toISOString().split('T')[0],
    isActive: program.isActive,
    selectionCriteria: program.selectionCriteria,
    evaluationCriteria: program.evaluationCriteria,
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des programmes</h1>
          <p className="mt-1 text-gray-600">Gérez les programmes et leurs critères de sélection</p>
        </div>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => setShowCreateModal(true)}
        >
          Nouveau programme
        </Button>
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
                placeholder="Rechercher un programme..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex gap-4">
              <select
                className="block w-64 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={partnerFilter}
                onChange={(e) => setPartnerFilter(e.target.value)}
              >
                <option value="all">Tous les partenaires</option>
                {partners.map(partner => (
                  <option key={partner.id} value={partner.id}>
                    {partner.name}
                  </option>
                ))}
              </select>
              
              <select
                className="block w-48 rounded-md border-gray-300 shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as 'all' | 'active' | 'inactive')}
              >
                <option value="all">Tous les statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Programs List */}
      <div className="grid grid-cols-1 gap-6">
        {filteredPrograms.map(program => (
          <Card key={program.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row justify-between">
                <div className="mb-4 lg:mb-0 flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-medium text-gray-900">{program.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      program.isActive 
                        ? 'bg-success-100 text-success-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {program.isActive ? 'Actif' : 'Inactif'}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{program.description}</p>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <Building className="h-4 w-4 mr-2" />
                      <span className="font-medium">Partenaire:</span>
                      <span className="ml-1">{getPartnerName(program.partnerId)}</span>
                    </div>
                    
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="h-4 w-4 mr-2" />
                      <span>{program.startDate.toLocaleDateString()} - {program.endDate.toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  <div className="mb-4">
                    <div className="text-sm text-gray-500 mb-2">
                      <span className="font-medium">Budget:</span> {program.budget.toLocaleString()} FCFA
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Target className="h-4 w-4 mr-1" />
                      Critères de sélection ({program.selectionCriteria.length})
                    </h4>
                    <div className="space-y-2">
                      {program.selectionCriteria.slice(0, 3).map(criterion => (
                        <div key={criterion.id} className="flex items-center text-sm">
                          <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium mr-2 ${
                            criterion.required 
                              ? 'bg-error-100 text-error-800' 
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {getCriterionTypeLabel(criterion.type)}
                          </span>
                          <span className="text-gray-700">{criterion.name}</span>
                          {criterion.required && (
                            <span className="ml-1 text-error-600 text-xs">*</span>
                          )}
                        </div>
                      ))}
                      {program.selectionCriteria.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{program.selectionCriteria.length - 3} autres critères...
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                      <Award className="h-4 w-4 mr-1" />
                      Critères d'évaluation ({program.evaluationCriteria.length})
                    </h4>
                    <div className="space-y-2">
                      {program.evaluationCriteria.slice(0, 3).map(criterion => (
                        <div key={criterion.id} className="flex items-center justify-between text-sm">
                          <div className="flex items-center">
                            <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-secondary-100 text-secondary-800 mr-2">
                              {criterion.weight}%
                            </span>
                            <span className="text-gray-700">{criterion.name}</span>
                          </div>
                          <span className="text-xs text-gray-500">/{criterion.maxScore}</span>
                        </div>
                      ))}
                      {program.evaluationCriteria.length > 3 && (
                        <div className="text-xs text-gray-500">
                          +{program.evaluationCriteria.length - 3} autres critères...
                        </div>
                      )}
                      <div className="text-xs text-gray-600 font-medium">
                        Poids total: {program.evaluationCriteria.reduce((sum, c) => sum + c.weight, 0)}%
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col justify-between items-end lg:ml-6">
                  <div className="text-xs text-gray-500 mb-4">
                    Créé le {program.createdAt.toLocaleDateString()}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setEditingProgram(program)}
                      leftIcon={<Edit className="h-3 w-3" />}
                    >
                      Modifier
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowDeleteConfirm(program.id)}
                      leftIcon={<Trash2 className="h-3 w-3" />}
                    >
                      Supprimer
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredPrograms.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="text-gray-500">
            {searchTerm || partnerFilter !== 'all' || statusFilter !== 'all'
              ? "Aucun programme ne correspond à vos critères de recherche"
              : "Aucun programme n'est disponible pour le moment"}
          </div>
        </div>
      )}

      {/* Create/Edit Program Modal */}
      {(showCreateModal || editingProgram) && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-4 mx-auto p-5 border w-full max-w-4xl shadow-lg rounded-md bg-white">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900">
                {editingProgram ? 'Modifier le programme' : 'Créer un nouveau programme'}
              </h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setEditingProgram(null);
                }}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <Formik
              initialValues={editingProgram ? getEditFormValues(editingProgram) : initialFormValues}
              validationSchema={programSchema}
              onSubmit={editingProgram ? handleUpdateProgram : handleCreateProgram}
              enableReinitialize
            >
              {({ values, isSubmitting }) => (
                <Form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                      <label className="block text-sm font-medium text-gray-700">Partenaire</label>
                      <Field
                        as="select"
                        name="partnerId"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        <option value="">Sélectionnez un partenaire</option>
                        {partners.map(partner => (
                          <option key={partner.id} value={partner.id}>
                            {partner.name}
                          </option>
                        ))}
                      </Field>
                      <ErrorMessage name="partnerId" component="div" className="mt-1 text-sm text-error-600" />
                    </div>
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

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Budget (FCFA)</label>
                      <Field
                        name="budget"
                        type="number"
                        min="0"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      />
                      <ErrorMessage name="budget" component="div" className="mt-1 text-sm text-error-600" />
                    </div>

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
                    <label className="flex items-center">
                      <Field
                        name="isActive"
                        type="checkbox"
                        className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                      />
                      <span className="ml-2 text-sm text-gray-900">Programme actif</span>
                    </label>
                  </div>

                  {/* Selection Criteria */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Critères de sélection
                    </label>
                    <FieldArray name="selectionCriteria">
                      {({ push, remove }) => (
                        <div className="space-y-4">
                          {values.selectionCriteria.map((criterion, index) => (
                            <div key={index} className="border border-gray-200 rounded-lg p-4">
                              <div className="flex justify-between items-center mb-4">
                                <h4 className="text-sm font-medium text-gray-900">Critère #{index + 1}</h4>
                                {index > 0 && (
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => remove(index)}
                                    leftIcon={<Trash2 className="h-4 w-4" />}
                                  >
                                    Supprimer
                                  </Button>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Nom</label>
                                  <Field
                                    name={`selectionCriteria.${index}.name`}
                                    type="text"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  />
                                  <ErrorMessage name={`selectionCriteria.${index}.name`} component="div" className="mt-1 text-sm text-error-600" />
                                </div>

                                <div>
                                  <label className="block text-sm font-medium text-gray-700">Type</label>
                                  <Field
                                    as="select"
                                    name={`selectionCriteria.${index}.type`}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  >
                                    {criterionTypes.map(type => (
                                      <option key={type.value} value={type.value}>
                                        {type.label}
                                      </option>
                                    ))}
                                  </Field>
                                </div>
                              </div>

                              <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700">Description</label>
                                <Field
                                  as="textarea"
                                  name={`selectionCriteria.${index}.description`}
                                  rows={2}
                                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                />
                                <ErrorMessage name={`selectionCriteria.${index}.description`} component="div" className="mt-1 text-sm text-error-600" />
                              </div>

                              {/* Type-specific fields */}
                              {(criterion.type === 'number' || criterion.type === 'range') && (
                                <div className="grid grid-cols-2 gap-4 mb-4">
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Valeur minimum</label>
                                    <Field
                                      name={`selectionCriteria.${index}.minValue`}
                                      type="number"
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                  </div>
                                  <div>
                                    <label className="block text-sm font-medium text-gray-700">Valeur maximum</label>
                                    <Field
                                      name={`selectionCriteria.${index}.maxValue`}
                                      type="number"
                                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    />
                                  </div>
                                </div>
                              )}

                              {criterion.type === 'text' && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700">Longueur maximum</label>
                                  <Field
                                    name={`selectionCriteria.${index}.maxLength`}
                                    type="number"
                                    min="1"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                  />
                                </div>
                              )}

                              {criterion.type === 'select' && (
                                <div className="mb-4">
                                  <label className="block text-sm font-medium text-gray-700">Options (une par ligne)</label>
                                  <Field
                                    as="textarea"
                                    name={`selectionCriteria.${index}.options`}
                                    rows={3}
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                                    placeholder="Option 1&#10;Option 2&#10;Option 3"
                                    value={criterion.options?.join('\n') || ''}
                                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => {
                                      const options = e.target.value.split('\n').filter(opt => opt.trim() !== '');
                                      // Update the field value
                                      const event = {
                                        target: {
                                          name: `selectionCriteria.${index}.options`,
                                          value: options
                                        }
                                      };
                                      // This is a workaround for Formik field arrays
                                      values.selectionCriteria[index].options = options;
                                    }}
                                  />
                                </div>
                              )}

                              {criterion.type === 'boolean' && (
                                <div className="mb-4">
                                  <label className="flex items-center">
                                    <Field
                                      name={`selectionCriteria.${index}.defaultValue`}
                                      type="checkbox"
                                      className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                    />
                                    <span className="ml-2 text-sm text-gray-900">Valeur par défaut (Oui)</span>
                                  </label>
                                </div>
                              )}

                              <div>
                                <label className="flex items-center">
                                  <Field
                                    name={`selectionCriteria.${index}.required`}
                                    type="checkbox"
                                    className="rounded border-gray-300 text-primary-600 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                                  />
                                  <span className="ml-2 text-sm text-gray-900">Critère obligatoire</span>
                                </label>
                              </div>
                            </div>
                          ))}

                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => push({
                              id: generateCriterionId(),
                              name: '',
                              description: '',
                              type: 'text',
                              required: true,
                            })}
                            leftIcon={<Plus className="h-4 w-4" />}
                          >
                            Ajouter un critère
                          </Button>
                        </div>
                      )}
                    </FieldArray>
                  </div>

                  <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setShowCreateModal(false);
                        setEditingProgram(null);
                      }}
                    >
                      Annuler
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      isLoading={isSubmitting}
                      leftIcon={<Save className="h-4 w-4" />}
                    >
                      {editingProgram ? 'Modifier' : 'Créer'} le programme
                    </Button>
                  </div>
                </Form>
              )}
            </Formik>
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
              <h3 className="text-lg font-medium text-gray-900 mt-4">Supprimer le programme</h3>
              <p className="text-sm text-gray-500 mt-2">
                Êtes-vous sûr de vouloir supprimer ce programme ? Cette action est irréversible.
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
                  onClick={() => handleDeleteProgram(showDeleteConfirm)}
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