import React, { useEffect, useState, useMemo } from 'react';
import { useAuthStore } from '../../stores/authStore';
import { useProjectStore } from '../../stores/projectStore';
import { useProgramStore } from '../../stores/programStore';
import { Card, CardHeader, CardTitle, CardContent } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import ProjectStatusBadge from '../../components/projects/ProjectStatusBadge';
import {
  CheckCircle,
  XCircle,
  FileText,
  Calendar,
  User,
  AlertTriangle,
  Filter,
  CheckSquare,
  Square,
  Sparkles,
  RotateCcw,
  Search,
  ChevronDown,
  ChevronUp,
  Download,
  FileSpreadsheet
} from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EligibilityPage: React.FC = () => {
  const { user } = useAuthStore();
  const { projects, fetchProjects, updateProject } = useProjectStore();
  const { programs, fetchPrograms } = useProgramStore();

  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedProjects, setSelectedProjects] = useState<Set<string>>(new Set());
  const [eligibilityNotes, setEligibilityNotes] = useState('');
  const [batchNotes, setBatchNotes] = useState('');
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});
  const [isProcessing, setIsProcessing] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [resetSearchTerm, setResetSearchTerm] = useState('');
  const [isFormDataExpanded, setIsFormDataExpanded] = useState(false);
  const [resetStatusFilter, setResetStatusFilter] = useState<string>('eligible');

  // Filtres
  const [programFilter, setProgramFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchProjects();
    fetchPrograms();
  }, [fetchProjects, fetchPrograms]);

  const getProgram = (programId: string) => {
    return programs.find(p => p.id === programId);
  };

  // Filtrage des projets
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(p =>
      p.status === 'submitted' ||
      p.status === 'eligible' ||
      p.status === 'ineligible'
    );

    // Filtre par statut
    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Filtre par programme
    if (programFilter !== 'all') {
      filtered = filtered.filter(p => p.programId === programFilter);
    }

    // Filtre par date
    if (dateFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter(p => {
        if (!p.submittedAt) return false;
        const submittedDate = new Date(p.submittedAt);
        const diffDays = Math.floor((now.getTime() - submittedDate.getTime()) / (1000 * 60 * 60 * 24));

        switch (dateFilter) {
          case 'today':
            return diffDays === 0;
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    // Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(term) ||
        p.description.toLowerCase().includes(term)
      );
    }

    return filtered;
  }, [projects, statusFilter, programFilter, dateFilter, searchTerm]);

  const handleSelectProject = (projectId: string) => {
    setSelectedProject(projectId);
    setEligibilityNotes('');
    setCheckedCriteria({});
    setIsFormDataExpanded(false);
  };

  const handleToggleProject = (projectId: string) => {
    const newSelected = new Set(selectedProjects);
    if (newSelected.has(projectId)) {
      newSelected.delete(projectId);
    } else {
      newSelected.add(projectId);
    }
    setSelectedProjects(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedProjects.size === filteredProjects.length) {
      setSelectedProjects(new Set());
    } else {
      setSelectedProjects(new Set(filteredProjects.map(p => p.id)));
    }
  };

  const handleCriteriaCheck = (criteriaIndex: number, checked: boolean) => {
    setCheckedCriteria(prev => ({
      ...prev,
      [criteriaIndex]: checked
    }));
  };

  const handleFieldCriteriaCheck = (criteriaKey: string, checked: boolean) => {
    setCheckedCriteria(prev => ({
      ...prev,
      [criteriaKey]: checked
    }));
  };

  const generateEligibilityNotes = (
    isApproved: boolean,
    textualCriteria: string[],
    fieldCriteria: any[],
    checkedCriteria: Record<string, boolean>
  ): string => {
    const timestamp = new Date().toLocaleString('fr-FR', {
      dateStyle: 'long',
      timeStyle: 'short'
    });

    let notes = `=== ÉVALUATION D'ÉLIGIBILITÉ ===\n`;
    notes += `Date: ${timestamp}\n`;
    notes += `Décision: ${isApproved ? 'ÉLIGIBLE ✓' : 'NON ÉLIGIBLE ✗'}\n\n`;

    if (textualCriteria.length > 0) {
      notes += `--- CRITÈRES TEXTUELS (${textualCriteria.length}) ---\n`;
      const checkedCount = textualCriteria.filter((_, idx) => checkedCriteria[idx]).length;
      const uncheckedCount = textualCriteria.length - checkedCount;

      notes += `Validés: ${checkedCount}/${textualCriteria.length}\n`;
      if (uncheckedCount > 0) {
        notes += `Non validés: ${uncheckedCount}\n`;
      }
      notes += `\n`;

      textualCriteria.forEach((criteria, index) => {
        const isChecked = checkedCriteria[index];
        const status = isChecked ? '✓' : '✗';
        notes += `${status} ${criteria}\n`;
      });
      notes += `\n`;
    }

    if (fieldCriteria.length > 0) {
      notes += `--- CRITÈRES BASÉS SUR FORMULAIRE (${fieldCriteria.length}) ---\n`;
      const fieldCheckedCount = fieldCriteria.filter((_, idx) => checkedCriteria[`field-${idx}`]).length;
      const fieldUncheckedCount = fieldCriteria.length - fieldCheckedCount;

      notes += `Validés: ${fieldCheckedCount}/${fieldCriteria.length}\n`;
      if (fieldUncheckedCount > 0) {
        notes += `Non validés: ${fieldUncheckedCount}\n`;
      }
      notes += `\n`;

      fieldCriteria.forEach((criterion, index) => {
        const isChecked = checkedCriteria[`field-${index}`];
        const status = isChecked ? '✓' : '✗';
        const fieldName = criterion.fieldLabel || criterion.fieldName || `Champ ${index + 1}`;
        notes += `${status} ${fieldName}`;
        if (criterion.conditions) {
          notes += ` - ${criterion.conditions.operator} ${criterion.conditions.value}`;
          if (criterion.conditions.value2) {
            notes += ` et ${criterion.conditions.value2}`;
          }
        }
        notes += `\n`;
      });
      notes += `\n`;
    }

    if (!isApproved) {
      notes += `--- RAISONS DU REJET ---\n`;
      const uncheckedTextualCriteria = textualCriteria.filter((_, idx) => !checkedCriteria[idx]);
      const uncheckedFieldCriteria = fieldCriteria.filter((_, idx) => !checkedCriteria[`field-${idx}`]);

      if (uncheckedTextualCriteria.length > 0 || uncheckedFieldCriteria.length > 0) {
        notes += `Critères non respectés:\n`;
        uncheckedTextualCriteria.forEach(criteria => {
          notes += `• ${criteria}\n`;
        });
        uncheckedFieldCriteria.forEach((criterion, index) => {
          const fieldName = criterion.fieldLabel || criterion.fieldName || `Champ ${index + 1}`;
          notes += `• ${fieldName}`;
          if (criterion.conditions) {
            notes += ` (${criterion.conditions.operator} ${criterion.conditions.value}`;
            if (criterion.conditions.value2) {
              notes += ` et ${criterion.conditions.value2}`;
            }
            notes += `)`;
          }
          notes += `\n`;
        });
        notes += `\n`;
      }
      notes += `Notes complémentaires:\n`;
    } else {
      notes += `--- NOTES COMPLÉMENTAIRES ---\n`;
    }

    return notes;
  };

  const handleApprove = async () => {
    if (!selectedProject || !user) return;

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    const program = getProgram(project.programId);
    const textualCriteria = program?.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];
    const allFieldCriteria = program?.fieldEligibilityCriteria || [];
    const fieldCriteria = allFieldCriteria.filter(fc => fc.isEligibilityCriteria === true);

    const allTextualChecked = textualCriteria.every((_, index) => checkedCriteria[index]);
    const allFieldChecked = fieldCriteria.every((_, index) => checkedCriteria[`field-${index}`]);

    if ((!allTextualChecked && textualCriteria.length > 0) || (!allFieldChecked && fieldCriteria.length > 0)) {
      alert('Veuillez cocher tous les critères d\'éligibilité avant d\'approuver.');
      return;
    }

    setIsProcessing(true);
    try {
      const generatedNotes = generateEligibilityNotes(true, textualCriteria, fieldCriteria, checkedCriteria);
      const finalNotes = generatedNotes + (eligibilityNotes.trim() ? `\n${eligibilityNotes}` : '');

      await updateProject(selectedProject, {
        status: 'eligible',
        eligibilityNotes: finalNotes,
        eligibilityCheckedBy: user.id,
        eligibilityCheckedAt: new Date().toISOString()
      });

      alert('Projet marqué comme éligible avec succès!');
      setSelectedProject(null);
      setEligibilityNotes('');
      setCheckedCriteria({});
    } catch (error) {
      console.error('Error approving project:', error);
      alert('Erreur lors de l\'approbation du projet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!selectedProject || !user) return;

    const project = projects.find(p => p.id === selectedProject);
    if (!project) return;

    const program = getProgram(project.programId);
    const textualCriteria = program?.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];
    const allFieldCriteria = program?.fieldEligibilityCriteria || [];
    const fieldCriteria = allFieldCriteria.filter(fc => fc.isEligibilityCriteria === true);

    setIsProcessing(true);
    try {
      const generatedNotes = generateEligibilityNotes(false, textualCriteria, fieldCriteria, checkedCriteria);
      const finalNotes = generatedNotes + (eligibilityNotes.trim() ? `\n${eligibilityNotes}` : '');

      await updateProject(selectedProject, {
        status: 'ineligible',
        eligibilityNotes: finalNotes,
        eligibilityCheckedBy: user.id,
        eligibilityCheckedAt: new Date().toISOString()
      });

      alert('Projet marqué comme non éligible.');
      setSelectedProject(null);
      setEligibilityNotes('');
      setCheckedCriteria({});
    } catch (error) {
      console.error('Error rejecting project:', error);
      alert('Erreur lors du rejet du projet.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedProjects.size === 0 || !user) return;

    if (!window.confirm(`Voulez-vous approuver ${selectedProjects.size} projet(s) ?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const promises = Array.from(selectedProjects).map(projectId =>
        updateProject(projectId, {
          status: 'eligible',
          eligibilityNotes: batchNotes || 'Approuvé en lot',
          eligibilityCheckedBy: user.id,
          eligibilityCheckedAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      alert(`${selectedProjects.size} projet(s) approuvé(s) avec succès!`);
      setSelectedProjects(new Set());
      setBatchNotes('');
    } catch (error) {
      console.error('Error batch approving projects:', error);
      alert('Erreur lors de l\'approbation par lot.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleBatchReject = async () => {
    if (selectedProjects.size === 0 || !user) return;

    if (!batchNotes.trim()) {
      alert('Veuillez fournir une raison pour le rejet par lot.');
      return;
    }

    if (!window.confirm(`Voulez-vous rejeter ${selectedProjects.size} projet(s) ?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const promises = Array.from(selectedProjects).map(projectId =>
        updateProject(projectId, {
          status: 'ineligible',
          eligibilityNotes: batchNotes,
          eligibilityCheckedBy: user.id,
          eligibilityCheckedAt: new Date().toISOString()
        })
      );

      await Promise.all(promises);
      alert(`${selectedProjects.size} projet(s) rejeté(s) avec succès!`);
      setSelectedProjects(new Set());
      setBatchNotes('');
    } catch (error) {
      console.error('Error batch rejecting projects:', error);
      alert('Erreur lors du rejet par lot.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoEvaluate = async () => {
    if (selectedProjects.size === 0) {
      alert('Veuillez sélectionner au moins un projet.');
      return;
    }

    if (!window.confirm(`Voulez-vous évaluer automatiquement l'éligibilité de ${selectedProjects.size} projet(s) ?`)) {
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    try {
      for (const projectId of Array.from(selectedProjects)) {
        try {
          const project = projects.find(p => p.id === projectId);
          if (!project) continue;

          const program = getProgram(project.programId);
          if (!program || !program.eligibilityCriteria) {
            failCount++;
            continue;
          }

          const criteriaList = program.eligibilityCriteria.split('\n').filter(c => c.trim());
          const isEligible = criteriaList.length > 0;

          await updateProject(projectId, {
            status: isEligible ? 'eligible' : 'ineligible',
            eligibilityNotes: `Évaluation automatique: ${criteriaList.length} critère(s) vérifié(s) automatiquement.`,
            eligibilityCheckedBy: user!.id,
            eligibilityCheckedAt: new Date().toISOString()
          });

          successCount++;
        } catch (error) {
          console.error(`Erreur évaluation projet ${projectId}:`, error);
          failCount++;
        }
      }

      alert(`Évaluation terminée!\n✓ ${successCount} projet(s) évalué(s)\n✗ ${failCount} erreur(s)`);
      setSelectedProjects(new Set());
    } catch (error) {
      console.error('Erreur évaluation automatique:', error);
      alert('Erreur lors de l\'évaluation automatique.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleResetProjects = async (projectIds: string[]) => {
    if (projectIds.length === 0) return;

    if (!window.confirm(`Voulez-vous réinitialiser ${projectIds.length} projet(s) vers le statut "Soumis" ?`)) {
      return;
    }

    setIsProcessing(true);
    try {
      const promises = projectIds.map(projectId =>
        updateProject(projectId, {
          status: 'submitted',
          eligibilityNotes: undefined,
          eligibilityCheckedBy: undefined,
          eligibilityCheckedAt: undefined
        })
      );

      await Promise.all(promises);
      alert(`${projectIds.length} projet(s) réinitialisé(s) avec succès!`);
      setShowResetModal(false);
      setResetSearchTerm('');
    } catch (error) {
      console.error('Erreur réinitialisation:', error);
      alert('Erreur lors de la réinitialisation.');
    } finally {
      setIsProcessing(false);
    }
  };

  const getResettableProjects = () => {
    return projects.filter(p => {
      const matchesStatus = resetStatusFilter === 'all' || p.status === resetStatusFilter;
      const matchesSearch = !resetSearchTerm ||
        p.title.toLowerCase().includes(resetSearchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(resetSearchTerm.toLowerCase());

      return (p.status === 'eligible' || p.status === 'ineligible') && matchesStatus && matchesSearch;
    });
  };

  const getEligibilityStatus = (project: any) => {
    const program = getProgram(project.programId);
    if (!program) return 'N/A';

    const textualCriteria = program.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];
    const allFieldCriteria = program.fieldEligibilityCriteria || [];
    const fieldCriteria = allFieldCriteria.filter(fc => fc.isEligibilityCriteria === true);
    const totalCriteria = textualCriteria.length + fieldCriteria.length;

    if (totalCriteria === 0) return 'Aucun critère';

    if (project.status === 'eligible') {
      return `✓ Éligible (${totalCriteria} critères validés)`;
    } else if (project.status === 'ineligible') {
      return `✗ Non éligible`;
    } else if (project.status === 'submitted') {
      return `En attente (${totalCriteria} critères à vérifier)`;
    } else {
      return `Statut: ${project.status}`;
    }
  };

  const handleExportExcel = () => {
    const exportData = filteredProjects.map(project => {
      const program = getProgram(project.programId);
      const textualCriteria = program?.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];
      const allFieldCriteria = program?.fieldEligibilityCriteria || [];
      const fieldCriteria = allFieldCriteria.filter(fc => fc.isEligibilityCriteria === true);
      const totalCriteria = textualCriteria.length + fieldCriteria.length;

      let eligibilityDetail = '';
      if (totalCriteria > 0) {
        eligibilityDetail = `Total: ${totalCriteria} critères (${textualCriteria.length} textuels, ${fieldCriteria.length} champs)`;
      } else {
        eligibilityDetail = 'Aucun critère défini';
      }

      return {
        'Titre': project.title,
        'Programme': program?.name || 'N/A',
        'Statut': project.status,
        'État Éligibilité': getEligibilityStatus(project),
        'Détails Critères': eligibilityDetail,
        'Date de soumission': new Date(project.submittedAt || project.createdAt).toLocaleDateString('fr-FR'),
        'Vérifié par': project.eligibilityCheckedBy || 'Non vérifié',
        'Date de vérification': project.eligibilityCheckedAt
          ? new Date(project.eligibilityCheckedAt).toLocaleDateString('fr-FR')
          : 'N/A',
        'Notes': project.eligibilityNotes || ''
      };
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Projets Éligibilité');

    const colWidths = [
      { wch: 30 },
      { wch: 25 },
      { wch: 15 },
      { wch: 40 },
      { wch: 35 },
      { wch: 20 },
      { wch: 20 },
      { wch: 20 },
      { wch: 50 }
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, `Projets_Eligibilite_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleExportPDF = () => {
    const doc = new jsPDF('l', 'mm', 'a4');

    doc.setFontSize(18);
    doc.text('Liste des Projets - État d\'Éligibilité', 14, 15);

    doc.setFontSize(10);
    doc.text(`Généré le: ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, 14, 22);
    doc.text(`Total: ${filteredProjects.length} projet(s)`, 14, 28);

    const tableData = filteredProjects.map(project => {
      const program = getProgram(project.programId);
      return [
        project.title.length > 30 ? project.title.substring(0, 27) + '...' : project.title,
        program?.name || 'N/A',
        project.status,
        getEligibilityStatus(project),
        new Date(project.submittedAt || project.createdAt).toLocaleDateString('fr-FR')
      ];
    });

    autoTable(doc, {
      startY: 35,
      head: [['Titre', 'Programme', 'Statut', 'État Éligibilité', 'Date Soumission']],
      body: tableData,
      theme: 'grid',
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold'
      },
      bodyStyles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 60 },
        1: { cellWidth: 45 },
        2: { cellWidth: 30 },
        3: { cellWidth: 70 },
        4: { cellWidth: 35 }
      },
      margin: { left: 14, right: 14 },
      didDrawPage: (data: any) => {
        const pageCount = doc.getNumberOfPages();
        const pageHeight = doc.internal.pageSize.height;
        doc.setFontSize(8);
        doc.text(
          `Page ${data.pageNumber} sur ${pageCount}`,
          doc.internal.pageSize.width / 2,
          pageHeight - 10,
          { align: 'center' }
        );
      }
    });

    doc.save(`Projets_Eligibilite_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const selectedProjectData = selectedProject ? projects.find(p => p.id === selectedProject) : null;
  const selectedProgram = selectedProjectData ? getProgram(selectedProjectData.programId) : null;

  // Combine textual and field-based criteria
  const textualCriteria = selectedProgram?.eligibilityCriteria?.split('\n').filter(c => c.trim()) || [];
  const allFieldCriteria = selectedProgram?.fieldEligibilityCriteria || [];
  const fieldCriteria = allFieldCriteria.filter(fc => fc.isEligibilityCriteria === true);
  const totalCriteriaCount = textualCriteria.length + fieldCriteria.length;
  const criteriaList = textualCriteria;

  if (!user || (user.role !== 'admin' && user.role !== 'manager')) {
    return (
      <div className="flex items-center justify-center h-full">
        <Card className="max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Accès Restreint
              </h3>
              <p className="text-gray-600">
                Seuls les administrateurs et managers peuvent accéder à la page de vérification d'éligibilité.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Vérification d'Éligibilité</h1>
        <p className="mt-2 text-gray-600">
          Vérifiez l'éligibilité des projets soumis selon les critères définis.
        </p>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Filter className="h-5 w-5 text-gray-500 mr-2" />
              <CardTitle>Filtres</CardTitle>
            </div>
            {selectedProjects.size > 0 && (
              <span className="text-sm font-medium text-blue-600">
                {selectedProjects.size} projet(s) sélectionné(s)
              </span>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Titre ou description..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statut
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les statuts</option>
                <option value="submitted">Soumis</option>
                <option value="eligible">Éligible</option>
                <option value="ineligible">Non éligible</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Programme
              </label>
              <select
                value={programFilter}
                onChange={(e) => setProgramFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous les programmes</option>
                {programs.map(program => (
                  <option key={program.id} value={program.id}>
                    {program.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date de soumission
              </label>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Toutes les dates</option>
                <option value="today">Aujourd'hui</option>
                <option value="week">Cette semaine</option>
                <option value="month">Ce mois</option>
              </select>
            </div>

            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setStatusFilter('all');
                  setProgramFilter('all');
                  setDateFilter('all');
                  setSearchTerm('');
                  setSelectedProjects(new Set());
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between items-center gap-4">
        <div className="flex gap-4">
          <Button
            variant="outline"
            onClick={() => setShowResetModal(true)}
            leftIcon={<RotateCcw className="h-4 w-4" />}
          >
            Réinitialiser des projets
          </Button>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleExportExcel}
            leftIcon={<FileSpreadsheet className="h-4 w-4" />}
            disabled={filteredProjects.length === 0}
          >
            Exporter Excel
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            leftIcon={<Download className="h-4 w-4" />}
            disabled={filteredProjects.length === 0}
          >
            Exporter PDF
          </Button>
        </div>
      </div>

      {/* Actions par lot */}
      {selectedProjects.size > 0 && (
        <Card className="border-2 border-blue-500 bg-blue-50">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-2">
                  Actions par lot ({selectedProjects.size} projet(s))
                </h3>
                <textarea
                  value={batchNotes}
                  onChange={(e) => setBatchNotes(e.target.value)}
                  placeholder="Notes pour l'ensemble des projets sélectionnés (obligatoire pour rejet)..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div className="flex gap-3 ml-4">
                <Button
                  variant="primary"
                  onClick={handleAutoEvaluate}
                  isLoading={isProcessing}
                  leftIcon={<Sparkles className="h-5 w-5" />}
                >
                  Évaluation Auto
                </Button>
                <Button
                  variant="success"
                  onClick={handleBatchApprove}
                  isLoading={isProcessing}
                  leftIcon={<CheckCircle className="h-5 w-5" />}
                >
                  Approuver Tout
                </Button>
                <Button
                  variant="danger"
                  onClick={handleBatchReject}
                  isLoading={isProcessing}
                  leftIcon={<XCircle className="h-5 w-5" />}
                >
                  Rejeter Tout
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Projets</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    {filteredProjects.length} projet(s) affiché(s) sur {projects.length} au total
                  </p>
                </div>
                <button
                  onClick={handleSelectAll}
                  className="flex items-center text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selectedProjects.size === filteredProjects.length ? (
                    <>
                      <CheckSquare className="h-4 w-4 mr-1" />
                      Tout désélectionner
                    </>
                  ) : (
                    <>
                      <Square className="h-4 w-4 mr-1" />
                      Tout sélectionner
                    </>
                  )}
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {filteredProjects.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                  <p>Aucun projet correspondant aux filtres</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredProjects.map(project => {
                    const program = getProgram(project.programId);
                    const isSelected = selectedProjects.has(project.id);
                    const isCurrentProject = selectedProject === project.id;

                    return (
                      <div
                        key={project.id}
                        className={`relative p-4 rounded-lg border-2 transition-all ${
                          isCurrentProject
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex items-start">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => handleToggleProject(project.id)}
                            className="mt-1 mr-3 h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer"
                          />
                          <button
                            onClick={() => handleSelectProject(project.id)}
                            className="flex-1 text-left"
                          >
                            <h3 className="font-semibold text-gray-900 mb-1">{project.title}</h3>
                            <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                              {project.description}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>{program?.name || 'Programme inconnu'}</span>
                              <ProjectStatusBadge status={project.status} />
                            </div>
                            {project.submittedAt && (
                              <div className="flex items-center text-xs text-gray-400 mt-2">
                                <Calendar className="h-3 w-3 mr-1" />
                                {new Date(project.submittedAt).toLocaleDateString('fr-FR')}
                              </div>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {!selectedProjectData ? (
            <Card>
              <CardContent className="py-16">
                <div className="text-center text-gray-500">
                  <FileText className="h-16 w-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg">Sélectionnez un projet pour commencer la vérification individuelle</p>
                  <p className="text-sm mt-2">ou utilisez les cases à cocher pour les actions par lot</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Détails du Projet</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{selectedProjectData.title}</h3>
                    <p className="text-gray-600 mt-2">{selectedProjectData.description}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t">
                    <div className="flex items-center text-sm">
                      <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Soumis le:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedProjectData.submittedAt
                          ? new Date(selectedProjectData.submittedAt).toLocaleDateString('fr-FR')
                          : 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <User className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-gray-600">Programme:</span>
                      <span className="ml-2 font-medium text-gray-900">
                        {selectedProgram?.name || 'N/A'}
                      </span>
                    </div>
                  </div>

                  {selectedProjectData.formData && (
                    <div className="pt-4 border-t">
                      <button
                        onClick={() => setIsFormDataExpanded(!isFormDataExpanded)}
                        className="flex items-center justify-between w-full font-medium text-gray-900 hover:text-primary-600 transition-colors"
                      >
                        <span className="flex items-center">
                          <FileText className="h-4 w-4 mr-2" />
                          Données du Formulaire
                        </span>
                        {isFormDataExpanded ? (
                          <ChevronUp className="h-5 w-5 text-gray-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-gray-500" />
                        )}
                      </button>

                      {isFormDataExpanded && (
                        <div className="mt-3 bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                          <pre className="text-xs text-gray-700 whitespace-pre-wrap">
                            {JSON.stringify(selectedProjectData.formData, null, 2)}
                          </pre>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Critères d'Éligibilité</span>
                    {totalCriteriaCount > 0 && (
                      <span className="text-sm font-normal bg-blue-100 text-blue-800 px-3 py-1 rounded-full">
                        {totalCriteriaCount} critère{totalCriteriaCount > 1 ? 's' : ''}
                      </span>
                    )}
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-1">
                    Vérifiez tous les critères avant de prendre une décision
                  </p>
                </CardHeader>
                <CardContent>
                  {totalCriteriaCount === 0 ? (
                    <div className="text-center py-8">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-amber-500" />
                      <p className="text-gray-600">
                        Aucun critère d'éligibilité défini pour ce programme.
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        Vous pouvez quand même approuver ou rejeter ce projet manuellement.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {textualCriteria.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">Critères textuels ({textualCriteria.length})</h4>
                          {textualCriteria.map((criteria, index) => (
                            <label
                              key={`textual-${index}`}
                              className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checkedCriteria[index] || false}
                                onChange={(e) => handleCriteriaCheck(index, e.target.checked)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-gray-700">{criteria}</span>
                            </label>
                          ))}
                        </div>
                      )}

                      {fieldCriteria.length > 0 && (
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-700">
                            Critères basés sur les champs du formulaire ({fieldCriteria.length})
                          </h4>
                          {fieldCriteria.map((criterion, index) => (
                            <label
                              key={`field-${index}`}
                              className="flex items-start p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer"
                            >
                              <input
                                type="checkbox"
                                checked={checkedCriteria[`field-${index}`] || false}
                                onChange={(e) => handleFieldCriteriaCheck(`field-${index}`, e.target.checked)}
                                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                              />
                              <span className="ml-3 text-gray-700">
                                <span className="font-medium">{criterion.fieldLabel || criterion.fieldName || `Champ ${index + 1}`}</span>
                                {criterion.conditions && (
                                  <span className="text-gray-600">
                                    {' '}- {criterion.conditions.operator} {criterion.conditions.value}
                                    {criterion.conditions.value2 && ` et ${criterion.conditions.value2}`}
                                  </span>
                                )}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle>Notes d'Éligibilité</CardTitle>
                      <p className="text-sm text-gray-600 mt-1">
                        Ajoutez des notes complémentaires pour votre décision
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const preview = generateEligibilityNotes(
                          true,
                          textualCriteria,
                          fieldCriteria,
                          checkedCriteria
                        );
                        alert('Aperçu de l\'évaluation:\n\n' + preview + '\n\nCes notes seront automatiquement ajoutées lors de la validation.');
                      }}
                      leftIcon={<FileText className="h-4 w-4" />}
                    >
                      Aperçu
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-sm text-blue-800">
                        ℹ️ Un rapport détaillé avec l'état de tous les critères sera automatiquement généré lors de la validation ou du rejet.
                      </p>
                    </div>
                    <textarea
                      value={eligibilityNotes}
                      onChange={(e) => setEligibilityNotes(e.target.value)}
                      placeholder="Ajoutez ici vos notes complémentaires (optionnel)..."
                      rows={4}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </CardContent>
              </Card>

              {selectedProjectData.status === 'submitted' ? (
                <div className="flex gap-4">
                  <Button
                    variant="success"
                    onClick={handleApprove}
                    isLoading={isProcessing}
                    leftIcon={<CheckCircle className="h-5 w-5" />}
                    className="flex-1"
                  >
                    Approuver (Éligible)
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleReject}
                    isLoading={isProcessing}
                    leftIcon={<XCircle className="h-5 w-5" />}
                    className="flex-1"
                  >
                    Rejeter (Non Éligible)
                  </Button>
                </div>
              ) : (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 mr-3 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-yellow-800">
                        Ce projet ne peut pas être évalué
                      </p>
                      <p className="text-sm text-yellow-700 mt-1">
                        Statut actuel: <ProjectStatusBadge status={selectedProjectData.status} />
                      </p>
                      <p className="text-xs text-yellow-600 mt-2">
                        Seuls les projets avec le statut "Soumis" peuvent être approuvés ou rejetés.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Modal de réinitialisation */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                  <RotateCcw className="h-6 w-6 mr-2 text-blue-600" />
                  Réinitialiser des projets
                </h2>
                <button
                  onClick={() => setShowResetModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Recherchez et réinitialisez les projets éligibles/non éligibles vers le statut "Soumis"
              </p>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto max-h-[calc(80vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Search className="inline h-4 w-4 mr-1" />
                    Recherche
                  </label>
                  <input
                    type="text"
                    value={resetSearchTerm}
                    onChange={(e) => setResetSearchTerm(e.target.value)}
                    placeholder="Titre ou description..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Filter className="inline h-4 w-4 mr-1" />
                    Statut
                  </label>
                  <select
                    value={resetStatusFilter}
                    onChange={(e) => setResetStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tous</option>
                    <option value="eligible">Éligible</option>
                    <option value="ineligible">Non éligible</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                {getResettableProjects().length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                    <p>Aucun projet trouvé</p>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-gray-600">
                        {getResettableProjects().length} projet(s) trouvé(s)
                      </p>
                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => handleResetProjects(getResettableProjects().map(p => p.id))}
                        isLoading={isProcessing}
                        leftIcon={<RotateCcw className="h-4 w-4" />}
                      >
                        Réinitialiser tout
                      </Button>
                    </div>
                    {getResettableProjects().map(project => {
                      const program = getProgram(project.programId);
                      return (
                        <div
                          key={project.id}
                          className="p-4 border-2 border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{project.title}</h3>
                              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                                {project.description}
                              </p>
                              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                <span>{program?.name || 'Programme inconnu'}</span>
                                <ProjectStatusBadge status={project.status} />
                                {project.eligibilityCheckedAt && (
                                  <span className="flex items-center">
                                    <Calendar className="h-3 w-3 mr-1" />
                                    {new Date(project.eligibilityCheckedAt).toLocaleDateString('fr-FR')}
                                  </span>
                                )}
                              </div>
                              {project.eligibilityNotes && (
                                <p className="text-xs text-gray-500 mt-2 italic">
                                  "{project.eligibilityNotes}"
                                </p>
                              )}
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleResetProjects([project.id])}
                              isLoading={isProcessing}
                              className="ml-4"
                            >
                              Réinitialiser
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </>
                )}
              </div>
            </div>

            <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowResetModal(false)}
              >
                Fermer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EligibilityPage;
