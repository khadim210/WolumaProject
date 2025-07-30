import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useFormTemplateStore, FormField, FieldType } from '../../stores/formTemplateStore';
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent,
  CardFooter
} from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';

const fieldTypes: { value: FieldType; label: string }[] = [
  { value: 'text', label: 'Texte court' },
  { value: 'textarea', label: 'Texte long' },
  { value: 'number', label: 'Nombre' },
  { value: 'select', label: 'Liste déroulante' },
  { value: 'radio', label: 'Choix unique' },
  { value: 'checkbox', label: 'Case à cocher' },
  { value: 'date', label: 'Date' },
  { value: 'file', label: 'Upload de fichiers' },
  { value: 'multiple_select', label: 'Choix multiples' }
];

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { addTemplate } = useFormTemplateStore();
  
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [fields, setFields] = useState<FormField[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const handleAddField = () => {
    const newField: FormField = {
      id: `field-${fields.length + 1}`,
      type: 'text',
      label: '',
      name: '',
      required: false,
      placeholder: '',
      helpText: '',
      options: []
    };
    
    setFields([...fields, newField]);
  };
  
  const handleFieldChange = (index: number, updates: Partial<FormField>) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], ...updates };
    
    // Update field name based on label
    if ('label' in updates) {
      updatedFields[index].name = updates.label?.toLowerCase().replace(/\s+/g, '_') || '';
    }
    
    setFields(updatedFields);
  };
  
  const handleRemoveField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };
  
  const handleAddOption = (fieldIndex: number) => {
    const updatedFields = [...fields];
    const field = updatedFields[fieldIndex];
    
    if (field.options) {
      field.options = [...field.options, ''];
    } else {
      field.options = [''];
    }
    
    setFields(updatedFields);
  };
  
  const handleOptionChange = (fieldIndex: number, optionIndex: number, value: string) => {
    const updatedFields = [...fields];
    const field = updatedFields[fieldIndex];
    
    if (field.options) {
      field.options[optionIndex] = value;
      setFields(updatedFields);
    }
  };
  
  const handleRemoveOption = (fieldIndex: number, optionIndex: number) => {
    const updatedFields = [...fields];
    const field = updatedFields[fieldIndex];
    
    if (field.options) {
      field.options = field.options.filter((_, i) => i !== optionIndex);
      setFields(updatedFields);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formName || fields.length === 0) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      await addTemplate({
        name: formName,
        description: formDescription,
        fields,
        isActive: true
      });
      
      navigate('/dashboard/form-templates');
    } catch (error) {
      console.error('Error creating form template:', error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Créer un modèle de formulaire</h1>
        <p className="mt-1 text-gray-600">
          Créez un nouveau modèle de formulaire d'évaluation qui pourra être utilisé pour les soumissions de projets.
        </p>
      </div>
      
      <form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Informations générales</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label htmlFor="formName" className="block text-sm font-medium text-gray-700">
                Nom du formulaire*
              </label>
              <input
                type="text"
                id="formName"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                required
              />
            </div>
            
            <div>
              <label htmlFor="formDescription" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="formDescription"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                rows={3}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
              />
            </div>
          </CardContent>
        </Card>
        
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Champs du formulaire</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {fields.map((field, index) => (
                <div key={field.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <GripVertical className="h-5 w-5 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900">Champ #{index + 1}</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveField(index)}
                      leftIcon={<Trash2 className="h-4 w-4" />}
                    >
                      Supprimer
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Label*
                      </label>
                      <input
                        type="text"
                        value={field.label}
                        onChange={(e) => handleFieldChange(index, { label: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                        required
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Type de champ*
                      </label>
                      <select
                        value={field.type}
                        onChange={(e) => handleFieldChange(index, { type: e.target.value as FieldType })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      >
                        {fieldTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Texte d'aide
                    </label>
                    <input
                      type="text"
                      value={field.helpText}
                      onChange={(e) => handleFieldChange(index, { helpText: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Instructions ou explications supplémentaires..."
                    />
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700">
                      Placeholder
                    </label>
                    <input
                      type="text"
                      value={field.placeholder}
                      onChange={(e) => handleFieldChange(index, { placeholder: e.target.value })}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                      placeholder="Texte indicatif..."
                    />
                  </div>
                  
                  {(field.type === 'select' || field.type === 'radio') && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options
                      </label>
                      <div className="space-y-2">
                        {field.options?.map((option, optionIndex) => (
                          <div key={optionIndex} className="flex items-center gap-2">
                            <input
                              type="text"
                              value={option}
                              onChange={(e) => handleOptionChange(index, optionIndex, e.target.value)}
                              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                              placeholder={`Option ${optionIndex + 1}`}
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => handleRemoveOption(index, optionIndex)}
                              leftIcon={<Trash2 className="h-4 w-4" />}
                            >
                              Supprimer
                            </Button>
                          </div>
                        ))}
                        <Button
                        {renderFieldSpecificOptions(field, index)}
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/dashboard/form-templates')}
            >
              Annuler
            </Button>
            
            <Button
              type="submit"
              variant="primary"
              disabled={!formName || fields.length === 0 || isSubmitting}
              leftIcon={<Save className="h-4 w-4" />}
            >
              Enregistrer le modèle
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
};

export default FormBuilderPage;