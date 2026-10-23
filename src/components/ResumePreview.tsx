import React, { useRef, useState } from 'react';
import type { ResumeData } from '../types/resume';
import { ProfessionalClassic } from '../templates/ProfessionalClassic';
import { ModernMinimal } from '../templates/ModernMinimal';
import { exportToPDFBlob } from '../utils/pdfExport';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ResumePreviewProps {
  resume: ResumeData;
  onDensityChange?: (density: 'auto' | 'compact' | 'spacious') => void;
  onTemplateChange?: (templateId: ResumeData['templateId']) => void;
}

const templateMap = {
  'professional-classic': ProfessionalClassic,
  'modern-minimal': ModernMinimal,
} as const;

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, onDensityChange, onTemplateChange }) => {
  const [zoom, setZoom] = useState<number>(0.9);
  const [exportError, setExportError] = useState<string>('');
  const sheetRef = useRef<HTMLDivElement | null>(null);

  const handleDownload = async () => {
    try {
      setExportError('');
      const blob = await exportToPDFBlob(resume, { candidateName: resume.contact.name });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${resume.contact.name?.trim() ? resume.contact.name.trim().replace(/\s+/g, '_') : 'Resume'}_Resume.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : 'An error occurred while generating the PDF.'
      );
    }
  };

  const TemplateComponent = templateMap[resume.templateId] ?? ProfessionalClassic;

  return (
    <div className="preview-pane-container">
      {exportError && <div className="export-error-banner">{exportError}</div>}

      <div className="preview-toolbar no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Template:</span>
          <select
            value={resume.templateId || 'professional-classic'}
            onChange={e => onTemplateChange?.(e.target.value as ResumeData['templateId'])}
            className="density-select text-xs font-medium border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 ml-2 cursor-pointer"
            title="Change resume template"
          >
            <option value="professional-classic">Professional Classic</option>
            <option value="modern-minimal">Modern Minimal</option>
          </select>

          {onDensityChange && (
            <select
              value={resume.density || 'auto'}
              onChange={e => onDensityChange(e.target.value as 'auto' | 'compact' | 'spacious')}
              className="density-select text-xs font-medium border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 ml-2 cursor-pointer"
              title="Adjust font size and spacing (does not compress text)"
            >
              <option value="compact">Compact (9pt)</option>
              <option value="auto">Standard (9.5pt)</option>
              <option value="spacious">Spacious (10pt)</option>
            </select>
          )}
        </div>

        <div className="zoom-controls">
          <button
            type="button"
            title="Zoom out"
            onClick={() => setZoom(z => Math.max(0.6, Number((z - 0.1).toFixed(1))))}
            className="icon-btn-sm"
          >
            <ZoomOut size={14} />
          </button>
          <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            type="button"
            title="Zoom in"
            onClick={() => setZoom(z => Math.min(1.3, Number((z + 0.1).toFixed(1))))}
            className="icon-btn-sm"
          >
            <ZoomIn size={14} />
          </button>
          <button type="button" onClick={() => setZoom(0.9)} className="text-xs text-gray-500 hover:text-gray-800 underline ml-1">
            Fit
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            title="Download a browser-generated PDF with selectable text and multi-page support"
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      <div className="preview-canvas-wrapper">
        <div
          className="preview-scaler"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {resume.contact.name.trim() || resume.sections.length > 0 ? (
            <TemplateComponent resume={resume} sheetRef={sheetRef} />
          ) : (
            <div className="resume-empty-state" role="status">
              <div className="resume-empty-icon"><Download size={26} /></div>
              <h2>Your resume preview will appear here</h2>
              <p>Paste your resume text, then select <strong>Parse Resume Content</strong> to build and edit your resume.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
