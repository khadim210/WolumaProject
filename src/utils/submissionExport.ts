import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Project } from '../stores/projectStore';
import type { Program } from '../stores/programStore';

interface SubmissionExportData {
  projects: Project[];
  program: Program;
}

export const exportSubmissionsToExcel = (data: SubmissionExportData): void => {
  const { projects, program } = data;

  if (projects.length === 0) {
    alert('Aucune soumission à exporter pour ce programme');
    return;
  }

  const exportData = projects.map(project => {
    const baseData: any = {
      'Titre': project.title,
      'Description': project.description,
      'Statut': getStatusLabel(project.status),
      'Budget': project.budget,
      'Durée': project.timeline,
      'Date de soumission': project.submissionDate
        ? project.submissionDate.toLocaleDateString('fr-FR')
        : 'Non soumis',
      'Date de création': project.createdAt.toLocaleDateString('fr-FR'),
      'Tags': project.tags.join(', ')
    };

    if (project.formData) {
      Object.entries(project.formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          if (Array.isArray(value)) {
            baseData[key] = value.join(', ');
          } else if (typeof value === 'object') {
            baseData[key] = JSON.stringify(value);
          } else {
            baseData[key] = value;
          }
        }
      });
    }

    if (project.evaluationScores) {
      baseData['Score d\'évaluation'] = project.totalEvaluationScore || 'N/A';
      baseData['Évalué par'] = project.evaluatedBy || 'N/A';
      baseData['Date d\'évaluation'] = project.evaluationDate
        ? new Date(project.evaluationDate).toLocaleDateString('fr-FR')
        : 'N/A';
      baseData['Statut recommandé'] = project.recommendedStatus
        ? getStatusLabel(project.recommendedStatus as any)
        : 'N/A';
    }

    if (project.eligibilityNotes) {
      baseData['Notes d\'éligibilité'] = project.eligibilityNotes;
      baseData['Vérifié par'] = project.eligibilityCheckedBy || 'N/A';
      baseData['Date de vérification'] = project.eligibilityCheckedAt
        ? new Date(project.eligibilityCheckedAt).toLocaleDateString('fr-FR')
        : 'N/A';
    }

    return baseData;
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Soumissions');

  const maxWidth = 50;
  const colWidths = Object.keys(exportData[0]).map(key => ({
    wch: Math.min(Math.max(key.length, 15), maxWidth)
  }));
  worksheet['!cols'] = colWidths;

  const fileName = `Soumissions_${program.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(workbook, fileName);
};

export const exportSubmissionsToPDF = (data: SubmissionExportData): void => {
  const { projects, program } = data;

  if (projects.length === 0) {
    alert('Aucune soumission à exporter pour ce programme');
    return;
  }

  const allColumns = new Set<string>();
  const processedData = projects.map(project => {
    const rowData: any = {
      'Titre': project.title,
      'Description': truncateText(project.description, 100),
      'Statut': getStatusLabel(project.status),
      'Budget': project.budget.toLocaleString('fr-FR'),
      'Durée': project.timeline,
      'Soumis le': project.submissionDate
        ? project.submissionDate.toLocaleDateString('fr-FR')
        : 'Non soumis',
      'Tags': project.tags.join(', ')
    };

    if (project.formData) {
      Object.entries(project.formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          let displayValue: string;
          if (Array.isArray(value)) {
            displayValue = value.join(', ');
          } else if (typeof value === 'object') {
            displayValue = JSON.stringify(value);
          } else {
            displayValue = String(value);
          }
          rowData[key] = truncateText(displayValue, 80);
        }
      });
    }

    if (project.evaluationScores) {
      rowData['Score'] = project.totalEvaluationScore ? `${project.totalEvaluationScore}%` : 'N/A';
      rowData['Recommandation'] = project.recommendedStatus
        ? getStatusLabel(project.recommendedStatus as any)
        : 'N/A';
    }

    Object.keys(rowData).forEach(key => allColumns.add(key));
    return rowData;
  });

  const columns = Array.from(allColumns);

  const columnCount = columns.length;
  let pageFormat: 'a4' | 'a3' | 'a2' | [number, number] = 'a4';
  let orientation: 'portrait' | 'landscape' = 'landscape';

  if (columnCount > 12) {
    const estimatedWidth = columnCount * 30;
    const a3Width = 420;
    const a2Width = 594;

    if (estimatedWidth > a3Width) {
      pageFormat = [a2Width, 420];
    } else if (estimatedWidth > 297) {
      pageFormat = 'a3';
    }
  } else if (columnCount > 8) {
    pageFormat = 'a3';
  }

  const doc = new jsPDF({
    orientation,
    unit: 'mm',
    format: pageFormat
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 10;

  doc.setFontSize(16);
  doc.text(`Soumissions - ${program.name}`, margin, 15);

  doc.setFontSize(10);
  doc.text(`Exporté le ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, margin, 22);
  doc.text(`Total: ${projects.length} soumission(s)`, margin, 27);

  const tableData = processedData.map(row =>
    columns.map(col => row[col] || '')
  );

  const columnWidth = Math.max((pageWidth - (2 * margin)) / columnCount, 20);

  autoTable(doc, {
    head: [columns],
    body: tableData,
    startY: 32,
    margin: { left: margin, right: margin },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
      cellWidth: 'wrap'
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8
    },
    columnStyles: columns.reduce((acc, col, index) => {
      acc[index] = {
        cellWidth: columnWidth,
        halign: 'left',
        valign: 'top'
      };
      return acc;
    }, {} as any),
    alternateRowStyles: {
      fillColor: [245, 247, 250]
    },
    tableWidth: 'auto',
    theme: 'grid'
  });

  const fileName = `Soumissions_${program.name.replace(/[^a-z0-9]/gi, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

const getStatusLabel = (status: string): string => {
  const labels: Record<string, string> = {
    draft: 'Brouillon',
    submitted: 'Soumis',
    under_review: 'En revue',
    eligible: 'Éligible',
    ineligible: 'Non éligible',
    pre_selected: 'Présélectionné',
    selected: 'Sélectionné',
    formalization: 'Formalisation',
    financed: 'Financé',
    monitoring: 'Suivi',
    closed: 'Clôturé',
    rejected: 'Rejeté'
  };
  return labels[status] || status;
};

const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
};
