import { useEffect, useMemo, useRef, useState } from 'react';
import type { ResumeData } from './types/resume';
import { parseResume } from './parser/universalParser';
import { validateResume } from './validation/validator';
import { ResumeEditor } from './components/ResumeEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { ResumePreview } from './components/ResumePreview';
import { SAMPLE_RESUMES } from './test-fixtures/sampleResumes';
import { clearResumeStorage, loadResumeFromStorage, saveResumeToStorage } from './utils/resumeStorage';
import { readTextFile, isTextImportSupported } from './utils/fileInput';
import {
  FileText,
  Edit3,
  CheckCircle,
  RotateCcw,
  Sparkles,
  BookOpen,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  Upload,
} from 'lucide-react';
import './App.css';

type ActiveTab = 'input' | 'editor' | 'validation';

const EMPTY_RESUME: ResumeData = {
  contact: { name: '' },
  sections: [],
  rawText: '',
  templateId: 'professional-classic',
};

export default function App() {
  const [inputText, setInputText] = useState<string>('');
  const [resumeData, setResumeData] = useState<ResumeData>(() => {
    const restored = loadResumeFromStorage();
    return restored ?? EMPTY_RESUME;
  });
  const [activeTab, setActiveTab] = useState<ActiveTab>('input');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [parseError, setParseError] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const shouldPersist = Boolean(
      resumeData.contact.name?.trim() ||
        resumeData.contact.email ||
        resumeData.contact.phone ||
        resumeData.contact.location ||
        resumeData.sections.length > 0
    );

    if (shouldPersist) {
      saveResumeToStorage(resumeData);
    } else {
      clearResumeStorage();
    }
  }, [resumeData]);

  const validationSummary = useMemo(() => validateResume(resumeData), [resumeData]);

  const applyParsedResume = (nextResume: ResumeData, nextTab: ActiveTab = 'editor') => {
    if (!nextResume.contact.name?.trim() && nextResume.sections.length === 0) {
      setParseError('No recognizable resume content was found. Please paste a different resume or upload a supported text file.');
      return;
    }

    setResumeData(nextResume);
    setInputText(nextResume.rawText || inputText);
    setParseError('');
    setActiveTab(nextTab);
  };

  const handleParse = () => {
    if (!inputText.trim()) {
      setParseError('Please paste resume text or upload a supported text file before parsing.');
      return;
    }

    setSelectedSampleId('');
    setIsParsing(true);
    setParseError('');

    try {
      const parsed = parseResume(inputText);
      const hasContent = Boolean(parsed.contact.name?.trim() || parsed.sections.length > 0);
      if (!hasContent) {
        throw new Error('No recognisable resume structure could be extracted from the text.');
      }
      applyParsedResume(parsed, 'editor');
    } catch (error) {
      setParseError(
        error instanceof Error
          ? error.message
          : 'The resume could not be parsed. Please verify the text is valid and try again.'
      );
    } finally {
      setIsParsing(false);
    }
  };

  const handleLoadSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setInputText('');
    setIsParsing(false);
    setShowResetConfirm(false);
    setParseError('');

    if (!sampleId) {
      setResumeData(EMPTY_RESUME);
      setActiveTab('input');
      return;
    }

    const sample = SAMPLE_RESUMES.find(s => s.id === sampleId);
    if (sample) {
      const parsed = parseResume(sample.text);
      setResumeData(parsed);
      setActiveTab('editor');
    }
  };

  const handleReset = () => {
    setInputText('');
    setSelectedSampleId('');
    setResumeData(EMPTY_RESUME);
    setParseError('');
    setShowResetConfirm(false);
    clearResumeStorage();
    setActiveTab('input');
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    event.target.value = '';

    if (!isTextImportSupported(file)) {
      setParseError('Unsupported file type. Please upload a .txt, .md, or .json resume file, or paste the text directly. PDF files are not supported for direct parsing in this browser-only workflow.');
      return;
    }

    try {
      const text = await readTextFile(file);
      if (!text.trim()) {
        setParseError('The selected file is empty. Please choose a valid resume file.');
        return;
      }

      setInputText(text);
      setParseError('');
      const parsed = parseResume(text);
      if (!parsed.contact.name?.trim() && parsed.sections.length === 0) {
        throw new Error('The uploaded file does not contain recognizable resume content.');
      }
      setResumeData(parsed);
      setActiveTab('editor');
    } catch (error) {
      setParseError(
        error instanceof Error
          ? error.message
          : 'The file could not be read. Please upload a plain-text resume file or paste the content directly.'
      );
    }
  };

  return (
    <div className="app-container">
      <header className="app-navbar no-print">
        <div className="nav-brand">
          <div className="brand-icon-wrapper">
            <FileText className="text-white" size={20} />
          </div>
          <div>
            <h1 className="brand-title">Resume Builder</h1>
            <p className="brand-subtitle">Universal Text-to-Resume &bull; Faithful Formatting</p>
          </div>
        </div>

        <div className="nav-actions">
          <div className="sample-selector-wrapper">
            <BookOpen size={15} className="text-gray-500" />
            <select
              value={selectedSampleId}
              onChange={e => handleLoadSample(e.target.value)}
              className="sample-select"
              aria-label="Load Sample Resume"
            >
              <option value="">Start with a blank resume</option>
              <optgroup label="Reference Documents">
                {SAMPLE_RESUMES.filter(s => s.category === 'reference').map(sample => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Synthetic Test Cases">
                {SAMPLE_RESUMES.filter(s => s.category === 'synthetic').map(sample => (
                  <option key={sample.id} value={sample.id}>
                    {sample.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary btn-sm flex items-center gap-1.5"
            title="Upload a text resume file"
          >
            <Upload size={14} />
            <span>Upload</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.json,text/plain,application/json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />

          <button
            type="button"
            onClick={() => setShowResetConfirm(true)}
            className="btn-ghost btn-sm flex items-center gap-1.5 text-gray-600 hover:text-red-600"
            title="Reset to blank resume"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      <main className="app-main-layout">
        <div className="app-left-panel no-print">
          <div className="panel-tab-bar">
            <button
              type="button"
              onClick={() => setActiveTab('input')}
              className={`panel-tab ${activeTab === 'input' ? 'tab-active' : ''}`}
            >
              <FileText size={15} />
              <span>Paste Text</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`panel-tab ${activeTab === 'editor' ? 'tab-active' : ''}`}
            >
              <Edit3 size={15} />
              <span>Structured Editor</span>
              {resumeData.sections.length > 0 && <span className="tab-pill">{resumeData.sections.length}</span>}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('validation')}
              className={`panel-tab ${activeTab === 'validation' ? 'tab-active' : ''}`}
            >
              <CheckCircle size={15} />
              <span>Validation</span>
              <span
                className={`tab-pill ${validationSummary.overallStatus === 'PASS' ? 'pill-green' : 'pill-red'}`}
              >
                {validationSummary.overallStatus}
              </span>
            </button>
          </div>

          {activeTab === 'input' && (
            <div className="tab-content input-tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Paste your resume text</h2>
                  <p className="pane-desc">
                    Supports plain text, Word exports, markdown, and custom resume formats.
                  </p>
                </div>
              </div>

              {parseError && (
                <div className="error-banner" role="alert">
                  {parseError}
                </div>
              )}

              <div className="textarea-container">
                <textarea
                  className="resume-raw-textarea"
                  rows={18}
                  placeholder="Paste your resume text here..."
                  value={inputText}
                  onChange={e => setInputText(e.target.value)}
                />
              </div>

              <div className="input-actions-bar">
                <button
                  type="button"
                  onClick={handleParse}
                  disabled={!inputText.trim() || isParsing}
                  className="btn-primary w-full py-2.5 flex items-center justify-center gap-2 font-medium"
                >
                  <Sparkles size={16} />
                  <span>{isParsing ? 'Parsing Structure...' : 'Parse Resume Content'}</span>
                  <ArrowRight size={16} />
                </button>
              </div>

              <div className="info-box mt-4">
                <HelpCircle size={16} className="text-blue-500 shrink-0" />
                <div className="text-xs text-gray-600 leading-relaxed">
                  <strong>Faithful Formatting Guarantee:</strong> Our parser preserves the original wording,
                  dates, section order, and achievements without adding placeholder text.
                </div>
              </div>
            </div>
          )}

          {activeTab === 'editor' && (
            <div className="tab-content editor-tab-pane">
              <ResumeEditor resume={resumeData} onChange={setResumeData} />
            </div>
          )}

          {activeTab === 'validation' && (
            <div className="tab-content validation-tab-pane">
              <ValidationPanel summary={validationSummary} />
            </div>
          )}
        </div>

        <div className="app-right-panel">
          <ResumePreview
            resume={resumeData}
            onDensityChange={d => setResumeData(prev => ({ ...prev, density: d }))}
            onTemplateChange={templateId => setResumeData(prev => ({ ...prev, templateId }))}
          />
        </div>
      </main>

      {showResetConfirm && (
        <div className="modal-overlay">
          <div className="modal-dialog">
            <div className="modal-header">
              <AlertCircle size={20} className="text-red-600" />
              <h3 className="text-base font-semibold text-gray-900">Reset Resume Content?</h3>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Are you sure you want to discard your current resume text and parsed sections? This action cannot be undone.
            </p>
            <div className="modal-actions mt-4">
              <button type="button" onClick={() => setShowResetConfirm(false)} className="btn-secondary btn-sm">
                Cancel
              </button>
              <button type="button" onClick={handleReset} className="btn-danger btn-sm">
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
