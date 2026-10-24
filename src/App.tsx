import { useState, useMemo } from 'react';
import type { ResumeData } from './types/resume';
import { parseResume } from './parser/universalParser';
import { validateResume } from './validation/validator';
import { ResumeEditor } from './components/ResumeEditor';
import { ValidationPanel } from './components/ValidationPanel';
import { ResumePreview } from './components/ResumePreview';
import { SAMPLE_RESUMES } from './test-fixtures/sampleResumes';
import { parseResumeWithGemini } from './utils/geminiParser';
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
} from 'lucide-react';
import './App.css';

type ActiveTab = 'input' | 'editor' | 'validation';

export default function App() {
  // Start with a clean workspace; samples are loaded only when explicitly selected.
  const [inputText, setInputText] = useState<string>('');
  const [resumeData, setResumeData] = useState<ResumeData>(() => ({
    contact: { name: '' },
    sections: [],
    rawText: '',
    templateId: 'professional-classic',
  }));
  const [activeTab, setActiveTab] = useState<ActiveTab>('input');
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [selectedSampleId, setSelectedSampleId] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);

  // Computed validation summary
  const validationSummary = useMemo(() => {
    return validateResume(resumeData);
  }, [resumeData]);

// Handler for parsing raw input text
  const handleParse = async () => {
    if (!inputText.trim()) return;
    setSelectedSampleId('');
    setIsParsing(true);
    
    try {
      const parsed = await parseResumeWithGemini(inputText);
      setResumeData(parsed);
      setActiveTab('editor');
    } catch (err: any) {
      console.error('Gemini parsing failed, falling back to local parser:', err);
      alert(`Gemini AI failed: ${err.message}. Falling back to standard parser.`);
      
      const fallback = parseResume(inputText);
      setResumeData(fallback);
      setActiveTab('editor');
    } finally {
      setIsParsing(false);
    }
  };
  // Reference samples are preview-only: never place sample content in the user's paste box.
  // Choosing the blank option clears all current content, including previously pasted data.
  const handleLoadSample = (sampleId: string) => {
    setSelectedSampleId(sampleId);
    setInputText('');
    setIsParsing(false);
    setShowResetConfirm(false);

    if (!sampleId) {
      setResumeData({
        contact: { name: '' },
        sections: [],
        rawText: '',
        templateId: 'professional-classic',
      });
      setActiveTab('input');
      return;
    }

    const sample = SAMPLE_RESUMES.find(s => s.id === sampleId);
    if (sample) {
      // Load only into the preview/editor state; the Paste Text box remains empty.
      setResumeData(parseResume(sample.text));
    }
  };

  // Handler for reset with confirmation
  const handleReset = () => {
    setInputText('');
    setSelectedSampleId('');
    setResumeData({
      contact: { name: '' },
      sections: [],
      rawText: '',
      templateId: 'professional-classic',
    });
    setShowResetConfirm(false);
    setActiveTab('input');
  };

  return (
    <div className="app-container">
      {/* Top Navbar */}
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
          {/* Sample Selector */}
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
            onClick={() => setShowResetConfirm(true)}
            className="btn-ghost btn-sm flex items-center gap-1.5 text-gray-600 hover:text-red-600"
            title="Reset to blank resume"
          >
            <RotateCcw size={14} />
            <span>Reset</span>
          </button>
        </div>
      </header>

      {/* Main Two-Panel Layout */}
      <main className="app-main-layout">
        {/* Left Control Panel: Input, Editor, Validation */}
        <div className="app-left-panel no-print">
          {/* Tab Navigation */}
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
              {resumeData.sections.length > 0 && (
                <span className="tab-pill">{resumeData.sections.length}</span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('validation')}
              className={`panel-tab ${activeTab === 'validation' ? 'tab-active' : ''}`}
            >
              <CheckCircle size={15} />
              <span>Validation</span>
              <span
                className={`tab-pill ${
                  validationSummary.overallStatus === 'PASS' ? 'pill-green' : 'pill-red'
                }`}
              >
                {validationSummary.overallStatus}
              </span>
            </button>
          </div>

          {/* Tab 1: Text Input Area */}
          {activeTab === 'input' && (
            <div className="tab-content input-tab-pane">
              <div className="pane-header">
                <div>
                  <h2 className="pane-title">Paste your resume text</h2>
                  <p className="pane-desc">
                    Supports plain text, Word, PDF extracts, markdown, and custom formats.
                  </p>
                </div>
              </div>

              <div className="textarea-container">
                <textarea
                  className="resume-raw-textarea"
                  rows={18}
                  placeholder="Paste your resume text here...&#10;&#10;For example:&#10;Full Name&#10;name@example.com | Phone | City | LinkedIn&#10;&#10;PROFESSIONAL SUMMARY&#10;Your professional summary...&#10;&#10;PROFESSIONAL EXPERIENCE&#10;Job Title | Company | Dates&#10;• Describe your responsibilities and achievements..."
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
                  <strong>Faithful Formatting Guarantee:</strong> Our parser strictly preserves your original words, dates, section order, and achievements without injecting artificial placeholders or AI rewriting.
                </div>
              </div>
            </div>
          )}

          {/* Tab 2: Structured Editor */}
          {activeTab === 'editor' && (
            <div className="tab-content editor-tab-pane">
              <ResumeEditor resume={resumeData} onChange={setResumeData} />
            </div>
          )}

          {/* Tab 3: Validation Summary */}
          {activeTab === 'validation' && (
            <div className="tab-content validation-tab-pane">
              <ValidationPanel summary={validationSummary} />
            </div>
          )}
        </div>

        {/* Right Panel: Live Document Preview & PDF Export */}
        <div className="app-right-panel">
          <ResumePreview
            resume={resumeData}
            onDensityChange={d => setResumeData(prev => ({ ...prev, density: d }))}
          />
        </div>
      </main>

      {/* Reset Confirmation Modal */}
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
              <button
                type="button"
                onClick={() => setShowResetConfirm(false)}
                className="btn-secondary btn-sm"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleReset}
                className="btn-danger btn-sm"
              >
                Yes, Reset All
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
