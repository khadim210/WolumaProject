import jsPDF from 'jspdf';
import { Project } from '../stores/projectStore';
import { Program, Partner } from '../stores/programStore';

export const generateEvaluationReport = async (
  project: Project, 
  program: Program, 
  partner: Partner | null
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 12) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.4);
  };

  // Helper function to add a new page if needed
  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
    }
  };

  // Header with logo space and title
  pdf.setFillColor(0, 51, 102); // Woluma blue
  pdf.rect(0, 0, pageWidth, 40, 'F');
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RAPPORT D\'ÉVALUATION DE PROJET', margin, 25);
  
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(10);
  pdf.text('Woluma-Flow - Plateforme d\'Évaluation et de Financement', margin, 35);

  yPosition = 60;
  pdf.setTextColor(0, 0, 0);

  // Project Information Section
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text('INFORMATIONS DU PROJET', margin, yPosition);
  yPosition += 15;

  // Project details in a box
  pdf.setDrawColor(200, 200, 200);
  pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 60);
  
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bold');
  pdf.text('Titre:', margin + 5, yPosition + 5);
  pdf.setFont('helvetica', 'normal');
  yPosition = addText(project.title, margin + 25, yPosition + 5, pageWidth - 2 * margin - 30, 12);
  yPosition += 5;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Budget:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${project.budget.toLocaleString()} FCFA`, margin + 30, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Durée:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(project.timeline, margin + 25, yPosition);
  yPosition += 8;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Programme:', margin + 5, yPosition);
  pdf.setFont('helvetica', 'normal');
  pdf.text(program.name, margin + 35, yPosition);
  yPosition += 8;

  if (partner) {
    pdf.setFont('helvetica', 'bold');
    pdf.text('Partenaire:', margin + 5, yPosition);
    pdf.setFont('helvetica', 'normal');
    pdf.text(partner.name, margin + 35, yPosition);
    yPosition += 8;
  }

  yPosition += 15;

  // Project Description
  checkPageBreak(40);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('DESCRIPTION DU PROJET', margin, yPosition);
  yPosition += 10;

  pdf.setFontSize(11);
  pdf.setFont('helvetica', 'normal');
  yPosition = addText(project.description, margin, yPosition, pageWidth - 2 * margin, 11);
  yPosition += 15;

  // Tags
  if (project.tags.length > 0) {
    checkPageBreak(20);
    pdf.setFontSize(12);
    pdf.setFont('helvetica', 'bold');
    pdf.text('MOTS-CLÉS:', margin, yPosition);
    yPosition += 8;
    
    pdf.setFont('helvetica', 'normal');
    pdf.text(project.tags.join(', '), margin, yPosition);
    yPosition += 15;
  }

  // Evaluation Results
  if (project.evaluationScores && project.totalEvaluationScore !== undefined) {
    checkPageBreak(60);
    pdf.setFontSize(16);
    pdf.setFont('helvetica', 'bold');
    pdf.text('RÉSULTATS DE L\'ÉVALUATION', margin, yPosition);
    yPosition += 15;

    // Overall Score Box
    pdf.setFillColor(240, 248, 255);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25, 'F');
    pdf.setDrawColor(59, 130, 246);
    pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 25);

    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('SCORE TOTAL PONDÉRÉ:', margin + 5, yPosition + 8);
    
    pdf.setFontSize(18);
    pdf.setTextColor(59, 130, 246);
    pdf.text(`${project.totalEvaluationScore}%`, pageWidth - margin - 30, yPosition + 8);
    pdf.setTextColor(0, 0, 0);
    
    yPosition += 35;

    // Detailed Scores
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DÉTAIL PAR CRITÈRE', margin, yPosition);
    yPosition += 15;

    program.evaluationCriteria.forEach((criterion, index) => {
      checkPageBreak(35);
      
      const score = project.evaluationScores![criterion.id] || 0;
      const comment = project.evaluationComments?.[criterion.id] || '';
      const percentage = (score / criterion.maxScore) * 100;

      // Criterion box
      pdf.setDrawColor(200, 200, 200);
      const boxHeight = comment ? 30 : 20;
      pdf.rect(margin, yPosition - 3, pageWidth - 2 * margin, boxHeight);

      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(`${index + 1}. ${criterion.name}`, margin + 5, yPosition + 5);
      
      pdf.setFont('helvetica', 'normal');
      pdf.text(`${score}/${criterion.maxScore} (${Math.round(percentage)}%)`, pageWidth - margin - 50, yPosition + 5);
      
      pdf.setFontSize(10);
      pdf.text(`Poids: ${criterion.weight}%`, pageWidth - margin - 50, yPosition + 12);

      if (comment) {
        pdf.setFontSize(10);
        pdf.setFont('helvetica', 'italic');
        yPosition = addText(`Justification: ${comment}`, margin + 5, yPosition + 15, pageWidth - 2 * margin - 10, 10);
      } else {
        yPosition += 15;
      }

      yPosition += 10;
    });

    // Evaluation Notes
    if (project.evaluationNotes) {
      checkPageBreak(40);
      pdf.setFontSize(14);
      pdf.setFont('helvetica', 'bold');
      pdf.text('SYNTHÈSE DE L\'ÉVALUATION', margin, yPosition);
      yPosition += 10;

      pdf.setFontSize(11);
      pdf.setFont('helvetica', 'normal');
      yPosition = addText(project.evaluationNotes, margin, yPosition, pageWidth - 2 * margin, 11);
      yPosition += 15;
    }

    // Recommendation
    if (project.recommendedStatus) {
      checkPageBreak(30);
      const recommendations = {
        'selected': { text: 'SÉLECTIONNÉ', color: [34, 197, 94] },
        'pre_selected': { text: 'PRÉSÉLECTIONNÉ', color: [251, 191, 36] },
        'rejected': { text: 'REJETÉ', color: [239, 68, 68] }
      };

      const rec = recommendations[project.recommendedStatus as keyof typeof recommendations];
      if (rec) {
        pdf.setFillColor(rec.color[0], rec.color[1], rec.color[2], 0.1);
        pdf.rect(margin, yPosition - 5, pageWidth - 2 * margin, 20, 'F');
        
        pdf.setFontSize(14);
        pdf.setFont('helvetica', 'bold');
        pdf.text('RECOMMANDATION:', margin + 5, yPosition + 8);
        
        pdf.setTextColor(rec.color[0], rec.color[1], rec.color[2]);
        pdf.text(rec.text, margin + 80, yPosition + 8);
        pdf.setTextColor(0, 0, 0);
      }
    }
  }

  // Footer
  const footerY = pageHeight - 20;
  pdf.setDrawColor(200, 200, 200);
  pdf.line(margin, footerY, pageWidth - margin, footerY);
  
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Généré le ' + new Date().toLocaleDateString('fr-FR'), margin, footerY + 8);
  pdf.text('Woluma-Flow - Plateforme d\'Évaluation et de Financement de Projets', pageWidth - margin - 100, footerY + 8);

  // Save the PDF
  const fileName = `Rapport_Evaluation_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};