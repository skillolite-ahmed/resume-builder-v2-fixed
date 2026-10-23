import React, { useRef, useState } from 'react';
import type { ResumeData } from '../types/resume';
import { ProfessionalClassic } from '../templates/ProfessionalClassic';
import { printResume } from '../utils/pdfExport';
import { Download, ZoomIn, ZoomOut } from 'lucide-react';

interface ResumePreviewProps {
  resume: ResumeData;
  onDensityChange?: (density: 'auto' | 'compact' | 'spacious') => void;
}

export const ResumePreview: React.FC<ResumePreviewProps> = ({ resume, onDensityChange }) => {
  const [zoom, setZoom] = useState<number>(0.9);

  const sheetRef = useRef<HTMLDivElement | null>(null);

  const handlePrint = () => {
    printResume(resume.contact.name);
  };

  return (
    <div className="preview-pane-container">
      {/* Preview Action Bar */}
      <div className="preview-toolbar no-print">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Template:</span>
          <span className="template-pill">Professional Classic</span>

          {onDensityChange && (
            <select
              value={resume.density || 'auto'}
              onChange={e => onDensityChange(e.target.value as any)}
              className="density-select text-xs font-medium border border-gray-300 rounded px-1.5 py-0.5 bg-white text-gray-700 ml-2 cursor-pointer"
              title="Adjust font size and spacing (does not compress text)"
            >
              <option value="compact">Compact (9pt)</option>
              <option value="auto">Standard (9.5pt)</option>
              <option value="spacious">Spacious (10pt)</option>
            </select>
          )}
        </div>

        {/* Zoom Controls */}
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
          <button
            type="button"
            onClick={() => setZoom(0.9)}
            className="text-xs text-gray-500 hover:text-gray-800 underline ml-1"
          >
            Fit
          </button>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrint}
            title="Opens browser Print dialog — choose 'Save as PDF' to download a vector PDF with selectable text and correct word spacing"
            className="btn-primary btn-sm flex items-center gap-1.5"
          >
            <Download size={14} />
            <span>Save as PDF</span>
          </button>
        </div>
      </div>

      {/* Scaled Preview Canvas */}
      <div className="preview-canvas-wrapper">
        <div
          className="preview-scaler"
          style={{
            transform: `scale(${zoom})`,
            transformOrigin: 'top center',
          }}
        >
          {resume.contact.name.trim() || resume.sections.length > 0 ? (
            <ProfessionalClassic resume={resume} sheetRef={sheetRef} />
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
