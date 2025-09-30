import React, { useState, useEffect } from 'react';
import { useFormTemplateStore, FormTemplate, FormField, FieldType } from '../../stores/formTemplateStore';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Copy, Trash2, CreditCard as Edit, Archive, MoreVertical, GripVertical } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FormTemplatesPage: React.FC = () => {
  const { templates, fetchTemplates, duplicateTemplate, deleteTemplate } = useFormTemplateStore();
  const navigate = useNavigate();
  const [selectedTemplate, setSelectedTemplate] = useState<FormTemplate | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchTemplates();
    console.log('📋 FormTemplatesPage mounted, fetching templates...');
    console.log('📋 Current templates in store:', templates);
    console.log('📋 Is loading:', isLoading);
    console.log('📋 Error:', error);
  }, [fetchTemplates]);

  // Debug: Log templates when they change
  useEffect(() => {
    console.log('📋 Templates updated:', templates.length, 'templates');
    templates.forEach((template, index) => {
      console.log(`📋 Template ${index + 1}:`, template.name, '- Fields:', template.fields.length);
    });
  }, [templates]);

  const handleDuplicate = async (template: FormTemplate) => {
    await duplicateTemplate(template.id);
  };

  const handleDelete = async (template: FormTemplate) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce modèle ?')) {
      await deleteTemplate(template.id);
    }
  };

  const getFieldTypeLabel = (type: FieldType): string => {
    const labels: Record<FieldType, string> = {
      text: 'Texte court',
      textarea: 'Texte long',
      number: 'Nombre',
      select: 'Liste déroulante',
      radio: 'Choix unique',
      checkbox: 'Case à cocher',
      date: 'Date',
      file: 'Upload de fichiers',
      multiple_select: 'Choix multiples'
    };
    return labels[type];
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-900">Modèles de formulaires</h1>
        <Button
          variant="primary"
          leftIcon={<Plus className="h-4 w-4" />}
          onClick={() => navigate('/dashboard/form-templates/create')}
        >
          Nouveau modèle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {templates.map(template => (
          <Card key={template.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle>{template.name}</CardTitle>
                  <p className="mt-1 text-sm text-gray-500">{template.description}</p>
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Copy className="h-4 w-4" />}
                    onClick={() => handleDuplicate(template)}
                  >
                    Dupliquer
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Edit className="h-4 w-4" />}
                    onClick={() => navigate(`/dashboard/form-templates/${template.id}/edit`)}
                  >
                    Modifier
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    leftIcon={<Trash2 className="h-4 w-4" />}
                    onClick={() => handleDelete(template)}
                  >
                    Supprimer
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <h3 className="text-sm font-medium text-gray-700">Champs du formulaire</h3>
                <div className="space-y-2">
                  {template.fields.map(field => (
                    <div
                      key={field.id}
                      className="flex items-center p-3 bg-gray-50 rounded-md"
                    >
                      <GripVertical className="h-5 w-5 text-gray-400 mr-3" />
                      <div className="flex-1">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{field.label}</span>
                          {field.required && (
                            <span className="ml-2 text-xs text-error-600">Requis</span>
                          )}
                        </div>
                        <span className="text-sm text-gray-500">{getFieldTypeLabel(field.type)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
            <CardFooter className="bg-gray-50">
              <div className="flex justify-between items-center w-full text-sm text-gray-500">
                <span>Créé le {template.createdAt.toLocaleDateString()}</span>
                <span>Modifié le {template.updatedAt.toLocaleDateString()}</span>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FormTemplatesPage;