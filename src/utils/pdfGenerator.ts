import jsPDF from 'jspdf';
import { Project } from '../stores/projectStore';
import { Program, Partner } from '../stores/programStore';
import type { AIEvaluationResponse } from '../services/aiEvaluationService';

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

export const generateWolumaEvaluationReport = async (
  project: Project,
  program: Program,
  partner: Partner | null,
  evaluatorName?: string,
  aiAnalysis?: AIEvaluationResponse
): Promise<void> => {
  const pdf = new jsPDF();
  const pageWidth = pdf.internal.pageSize.width;
  const pageHeight = pdf.internal.pageSize.height;
  const margin = 20;
  let yPosition = margin;

  const addText = (text: string, x: number, y: number, maxWidth: number, fontSize: number = 10) => {
    pdf.setFontSize(fontSize);
    const lines = pdf.splitTextToSize(text, maxWidth);
    pdf.text(lines, x, y);
    return y + (lines.length * fontSize * 0.35);
  };

  const checkPageBreak = (requiredSpace: number) => {
    if (yPosition + requiredSpace > pageHeight - margin) {
      pdf.addPage();
      yPosition = margin;
      return true;
    }
    return false;
  };

  const addSection = (title: string) => {
    checkPageBreak(20);
    pdf.setFontSize(14);
    pdf.setFont('helvetica', 'bold');
    pdf.text(title, margin, yPosition);
    yPosition += 8;
  };

  // TITRE PRINCIPAL
  pdf.setFontSize(20);
  pdf.setFont('helvetica', 'bold');
  pdf.text('RAPPORT D\'ÉVALUATION DE PROJET', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 15;

  // Sous-titre plateforme
  pdf.setFontSize(12);
  pdf.setFont('helvetica', 'bolditalic');
  pdf.text('Plateforme Woluma', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 6;

  pdf.setFont('helvetica', 'italic');
  pdf.setFontSize(10);
  pdf.text('Solution d\'évaluation et de financement intelligent des PME africaines', pageWidth / 2, yPosition, { align: 'center' });
  yPosition += 20;

  // 1. INFORMATIONS GÉNÉRALES DU PROJET
  addSection('1. Informations Générales du Projet');

  // Tableau d'informations
  const tableData = [
    ['Titre du projet', project.title],
    ['Chiffre d\'Affaires', `${project.budget.toLocaleString()} FCFA`],
    ['Durée d\'existence', project.timeline],
    ['Programme de rattachement', program.name],
    ['Partenaire d\'exécution', partner?.name || 'N/A'],
    ['Date d\'évaluation', new Date().toLocaleDateString('fr-FR')],
    ['Évaluateur', evaluatorName || 'Système automatique']
  ];

  pdf.setFillColor(230, 230, 230);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);

  tableData.forEach((row, index) => {
    checkPageBreak(10);
    if (index % 2 === 0) {
      pdf.setFillColor(245, 245, 245);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'F');
    }

    pdf.setFont('helvetica', 'bold');
    pdf.text(row[0], margin + 2, yPosition);
    pdf.setFont('helvetica', 'normal');
    const textLines = pdf.splitTextToSize(row[1], pageWidth - 2 * margin - 60);
    pdf.text(textLines, margin + 60, yPosition);
    yPosition += Math.max(8, textLines.length * 5);
  });

  yPosition += 10;

  // 2. PRÉSENTATION SYNTHÉTIQUE DU PROJET
  addSection('2. Présentation Synthétique du Projet');
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(10);
  yPosition = addText(project.description, margin, yPosition, pageWidth - 2 * margin, 10);
  yPosition += 10;

  // 3. OBJECTIF DE L'ÉVALUATION
  addSection('3. Objectif de l\'Évaluation');
  pdf.setFont('helvetica', 'normal');
  const objectives = [
    'Mesurer la pertinence, la faisabilité et la viabilité économique du projet ;',
    'Identifier les risques et les leviers de succès ;',
    'Formuler des recommandations pour la décision de financement.'
  ];
  objectives.forEach(obj => {
    checkPageBreak(8);
    pdf.text('• ' + obj, margin + 5, yPosition);
    yPosition += 6;
  });
  yPosition += 10;

  // 4. MÉTHODOLOGIE
  addSection('4. Méthodologie');
  pdf.setFont('helvetica', 'normal');
  const methodology = [
    'Analyse documentaire et validation des données financières ;',
    'Évaluation selon les critères de la plateforme Woluma-Flow : pertinence, faisabilité, impact, durabilité, innovation et gouvernance ;',
    'Scoring automatique et revue experte (hybrid model IA + analyse humain).'
  ];
  methodology.forEach(method => {
    checkPageBreak(8);
    pdf.text('• ' + method, margin + 5, yPosition);
    yPosition += 6;
  });
  yPosition += 10;

  // 5. RÉSULTATS DE L'ÉVALUATION
  checkPageBreak(40);
  addSection('5. Résultats de l\'Évaluation');

  // Calculer le score total
  const totalScore = program.evaluationCriteria.reduce((total, criterion) => {
    const score = project.evaluationScores?.[criterion.id] || 0;
    return total + (score / criterion.maxScore) * criterion.weight;
  }, 0);

  const maxTotalScore = program.evaluationCriteria.reduce((total, criterion) => {
    return total + criterion.maxScore * (criterion.weight / 100);
  }, 0);

  // Tableau des scores
  pdf.setFillColor(230, 230, 230);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);

  // En-tête du tableau
  pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 8, 'FD');
  pdf.text('Critère', margin + 2, yPosition);
  pdf.text('Pondération', pageWidth / 2 - 10, yPosition);
  pdf.text('Score obtenu', pageWidth / 2 + 30, yPosition);
  pdf.text('Observation', pageWidth - margin - 45, yPosition);
  yPosition += 8;

  // Lignes du tableau
  pdf.setFont('helvetica', 'normal');
  program.evaluationCriteria.forEach((criterion, index) => {
    checkPageBreak(12);

    const score = project.evaluationScores?.[criterion.id] || 0;
    const observation = aiAnalysis?.detailedAnalysis?.observations?.[criterion.name] ||
                       project.evaluationComments?.[criterion.id] ||
                       'Conforme aux attentes';

    if (index % 2 === 0) {
      pdf.setFillColor(250, 250, 250);
      pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'F');
    }

    pdf.text(criterion.name, margin + 2, yPosition);
    pdf.text(criterion.weight.toString(), pageWidth / 2 - 5, yPosition);
    pdf.text(`${score.toFixed(1)}`, pageWidth / 2 + 35, yPosition);

    const obsLines = pdf.splitTextToSize(observation, 45);
    pdf.setFontSize(8);
    pdf.text(obsLines[0], pageWidth - margin - 45, yPosition);
    pdf.setFontSize(9);

    yPosition += 10;
  });

  // Score global
  checkPageBreak(12);
  pdf.setFillColor(220, 220, 220);
  pdf.rect(margin, yPosition - 4, pageWidth - 2 * margin, 10, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.text(`Score global / ${Math.round(maxTotalScore)}`, margin + 2, yPosition);
  pdf.text(`${totalScore.toFixed(1)} / ${Math.round(maxTotalScore)}`, pageWidth / 2 + 30, yPosition);
  pdf.text(`(${Math.round((totalScore / maxTotalScore) * 100)}%)`, pageWidth / 2 + 55, yPosition);

  const recommendation = totalScore >= maxTotalScore * 0.8 ? 'Projet recommandé pour financement' :
                        totalScore >= maxTotalScore * 0.6 ? 'Projet à considérer avec ajustements' :
                        'Projet non recommandé';
  pdf.setFontSize(9);
  pdf.text(recommendation, pageWidth - margin - 45, yPosition);
  yPosition += 15;

  // 6. ANALYSE ET INTERPRÉTATION
  checkPageBreak(40);
  addSection('6. Analyse et Interprétation');

  if (aiAnalysis?.detailedAnalysis) {
    const analysis = aiAnalysis.detailedAnalysis;

    // Forces
    if (analysis.strengths?.length > 0) {
      checkPageBreak(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Les forces', margin, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      analysis.strengths.forEach(strength => {
        checkPageBreak(8);
        pdf.text('• ' + strength, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Faiblesses
    if (analysis.weaknesses?.length > 0) {
      checkPageBreak(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Les faiblesses', margin, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      analysis.weaknesses.forEach(weakness => {
        checkPageBreak(8);
        pdf.text('• ' + weakness, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Opportunités
    if (analysis.opportunities?.length > 0) {
      checkPageBreak(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Les opportunités', margin, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      analysis.opportunities.forEach(opportunity => {
        checkPageBreak(8);
        pdf.text('• ' + opportunity, margin + 5, yPosition);
        yPosition += 6;
      });
      yPosition += 5;
    }

    // Risques
    if (analysis.risks?.length > 0) {
      checkPageBreak(20);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(11);
      pdf.text('Les risques', margin, yPosition);
      yPosition += 6;

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(10);
      analysis.risks.forEach(risk => {
        checkPageBreak(8);
        pdf.text('• ' + risk, margin + 5, yPosition);
        yPosition += 6;
      });
    }
  }

  // Notes générales
  if (project.evaluationNotes || aiAnalysis?.notes) {
    checkPageBreak(30);
    yPosition += 10;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text('Synthèse globale', margin, yPosition);
    yPosition += 8;

    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    const notes = aiAnalysis?.notes || project.evaluationNotes || '';
    yPosition = addText(notes, margin, yPosition, pageWidth - 2 * margin, 10);
  }

  // Footer sur toutes les pages
  const totalPages = pdf.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    pdf.setPage(i);
    pdf.setDrawColor(200, 200, 200);
    pdf.line(margin, pageHeight - 15, pageWidth - margin, pageHeight - 15);

    pdf.setFontSize(8);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Page ${i} / ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    pdf.text('Woluma Platform - Rapport d\'évaluation', margin, pageHeight - 10);
    pdf.text(new Date().toLocaleDateString('fr-FR'), pageWidth - margin - 20, pageHeight - 10);
    pdf.setTextColor(0, 0, 0);
  }

  // Save the PDF
  const fileName = `Rapport_Woluma_${project.title.replace(/[^a-zA-Z0-9]/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  pdf.save(fileName);
};