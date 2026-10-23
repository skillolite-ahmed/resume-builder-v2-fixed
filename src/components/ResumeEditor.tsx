import React, { useState } from 'react';
import type { ResumeData, ResumeSection, ResumeEntry } from '../types/resume';
import {
  ChevronDown,
  ChevronUp,
  Trash2,
  Plus,
  ArrowUp,
  ArrowDown,
  User,
  Mail,
  Phone,
  MapPin,
  Link,
  Code2,
  Globe,
  Briefcase,
} from 'lucide-react';

interface ResumeEditorProps {
  resume: ResumeData;
  onChange: (updated: ResumeData) => void;
}

export const ResumeEditor: React.FC<ResumeEditorProps> = ({ resume, onChange }) => {
  const [openSectionId, setOpenSectionId] = useState<string | null>(
    resume.sections.length > 0 ? resume.sections[0].id : null
  );

  const updateContact = (field: keyof ResumeData['contact'], val: string) => {
    onChange({
      ...resume,
      contact: {
        ...resume.contact,
        [field]: val,
      },
    });
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= resume.sections.length) return;

    const newSections = [...resume.sections];
    const [moved] = newSections.splice(index, 1);
    newSections.splice(targetIndex, 0, moved);

    onChange({
      ...resume,
      sections: newSections,
    });
  };

  const removeSection = (index: number) => {
    const newSections = resume.sections.filter((_, i) => i !== index);
    onChange({
      ...resume,
      sections: newSections,
    });
  };

  const addSection = () => {
    const newSec: ResumeSection = {
      id: `sec-user-${Date.now()}`,
      title: 'ADDITIONAL SECTION',
      type: 'custom',
      entries: [
        {
          id: `entry-${Date.now()}`,
          title: 'New Entry Title',
          subtitle: 'Organization / Subtitle',
          date: '2025–Present',
          bullets: ['Key achievement or contribution'],
        },
      ],
    };

    onChange({
      ...resume,
      sections: [...resume.sections, newSec],
    });
    setOpenSectionId(newSec.id);
  };

  const updateSectionTitle = (index: number, newTitle: string) => {
    const newSections = [...resume.sections];
    newSections[index] = { ...newSections[index], title: newTitle };
    onChange({ ...resume, sections: newSections });
  };

  const updateSectionContent = (index: number, content: string) => {
    const newSections = [...resume.sections];
    newSections[index] = { ...newSections[index], content };
    onChange({ ...resume, sections: newSections });
  };

  const addEntry = (secIndex: number) => {
    const newSections = [...resume.sections];
    const sec = newSections[secIndex];
    const newEntry: ResumeEntry = {
      id: `entry-${Date.now()}`,
      title: 'New Role or Project',
      subtitle: '',
      date: 'Present',
      bullets: ['Describe your impact and achievements here'],
    };

    newSections[secIndex] = {
      ...sec,
      entries: [...(sec.entries || []), newEntry],
    };
    onChange({ ...resume, sections: newSections });
  };

  const removeEntry = (secIndex: number, entryIndex: number) => {
    const newSections = [...resume.sections];
    const sec = newSections[secIndex];
    newSections[secIndex] = {
      ...sec,
      entries: (sec.entries || []).filter((_, idx) => idx !== entryIndex),
    };
    onChange({ ...resume, sections: newSections });
  };

  const updateEntry = (secIndex: number, entryIndex: number, field: keyof ResumeEntry, value: any) => {
    const newSections = [...resume.sections];
    const sec = newSections[secIndex];
    const entries = [...(sec.entries || [])];
    entries[entryIndex] = {
      ...entries[entryIndex],
      [field]: value,
    };
    newSections[secIndex] = { ...sec, entries };
    onChange({ ...resume, sections: newSections });
  };

  const addBullet = (secIndex: number, entryIndex: number) => {
    const newSections = [...resume.sections];
    const sec = newSections[secIndex];
    const entries = [...(sec.entries || [])];
    const entry = entries[entryIndex];
    entries[entryIndex] = {
      ...entry,
      bullets: [...(entry.bullets || []), 'New responsibility or measurable outcome.'],
    };
    newSections[secIndex] = { ...sec, entries };
    onChange({ ...resume, sections: newSections });
  };

  const removeBullet = (secIndex: number, entryIndex: number, bulletIndex: number) => {
    const newSections = [...resume.sections];
    const sec = newSections[secIndex];
    const entries = [...(sec.entries || [])];
    const entry = entries[entryIndex];
    entries[entryIndex] = {
      ...entry,
      bullets: (entry.bullets || []).filter((_, bIdx) => bIdx !== bulletIndex),
    };
    newSections[secIndex] = { ...sec, entries };
    onChange({ ...resume, sections: newSections });
  };

  const updateBullet = (secIndex: number, entryIndex: number, bulletIndex: number, val: string) => {
    const newSections = [...resume.sections];
    const sec = newSections[secIndex];
    const entries = [...(sec.entries || [])];
    const entry = entries[entryIndex];
    const bullets = [...(entry.bullets || [])];
    bullets[bulletIndex] = val;
    entries[entryIndex] = { ...entry, bullets };
    newSections[secIndex] = { ...sec, entries };
    onChange({ ...resume, sections: newSections });
  };

  return (
    <div className="editor-container">
      {/* Contact Information Editor Card */}
      <div className="editor-card">
        <h4 className="editor-card-title flex items-center gap-2">
          <User size={16} className="text-blue-600" />
          <span>Candidate & Contact Details</span>
        </h4>
        <div className="grid-form">
          <div className="form-group col-span-2">
            <label>Full Name</label>
            <input
              type="text"
              value={resume.contact.name || ''}
              onChange={e => updateContact('name', e.target.value)}
              placeholder="Candidate Name"
              className="form-input font-medium"
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-1.5">
              <Mail size={13} /> Email
            </label>
            <input
              type="email"
              value={resume.contact.email || ''}
              onChange={e => updateContact('email', e.target.value)}
              placeholder="user@example.com"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-1.5">
              <Phone size={13} /> Phone
            </label>
            <input
              type="text"
              value={resume.contact.phone || ''}
              onChange={e => updateContact('phone', e.target.value)}
              placeholder="+91 9876543210"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-1.5">
              <MapPin size={13} /> Location
            </label>
            <input
              type="text"
              value={resume.contact.location || ''}
              onChange={e => updateContact('location', e.target.value)}
              placeholder="City, State / Country"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-1.5">
              <Link size={13} /> LinkedIn
            </label>
            <input
              type="text"
              value={resume.contact.linkedin || ''}
              onChange={e => updateContact('linkedin', e.target.value)}
              placeholder="linkedin.com/in/username"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-1.5">
              <Code2 size={13} /> GitHub
            </label>
            <input
              type="text"
              value={resume.contact.github || ''}
              onChange={e => updateContact('github', e.target.value)}
              placeholder="github.com/username"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="flex items-center gap-1.5">
              <Globe size={13} /> Portfolio / Website
            </label>
            <input
              type="text"
              value={resume.contact.website || ''}
              onChange={e => updateContact('website', e.target.value)}
              placeholder="https://mywebsite.com"
              className="form-input"
            />
          </div>
        </div>
      </div>

      {/* Sections List */}
      <div className="sections-header-row">
        <h4 className="font-semibold text-gray-800 text-sm flex items-center gap-2">
          <Briefcase size={16} className="text-blue-600" />
          <span>Resume Sections ({resume.sections.length})</span>
        </h4>
        <button type="button" onClick={addSection} className="btn-secondary btn-sm flex items-center gap-1">
          <Plus size={14} /> Add Section
        </button>
      </div>

      <div className="sections-accordion">
        {resume.sections.map((section, secIdx) => {
          const isOpen = openSectionId === section.id;
          return (
            <div key={section.id} className="section-item-card">
              {/* Accordion Header */}
              <div
                className="section-item-header"
                onClick={() => setOpenSectionId(isOpen ? null : section.id)}
              >
                <div className="flex items-center gap-2 flex-1">
                  <span className="section-badge">{section.type}</span>
                  <span className="font-semibold text-gray-800 text-sm">{section.title}</span>
                </div>

                <div className="flex items-center gap-1" onClick={e => e.stopPropagation()}>
                  <button
                    type="button"
                    title="Move section up"
                    disabled={secIdx === 0}
                    onClick={() => moveSection(secIdx, 'up')}
                    className="icon-btn"
                  >
                    <ArrowUp size={14} />
                  </button>
                  <button
                    type="button"
                    title="Move section down"
                    disabled={secIdx === resume.sections.length - 1}
                    onClick={() => moveSection(secIdx, 'down')}
                    className="icon-btn"
                  >
                    <ArrowDown size={14} />
                  </button>
                  <button
                    type="button"
                    title="Delete section"
                    onClick={() => removeSection(secIdx)}
                    className="icon-btn text-red-500 hover:text-red-700"
                  >
                    <Trash2 size={14} />
                  </button>
                  <button type="button" className="icon-btn">
                    {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>
                </div>
              </div>

              {/* Accordion Body */}
              {isOpen && (
                <div className="section-item-body">
                  <div className="form-group mb-3">
                    <label>Section Heading Title</label>
                    <input
                      type="text"
                      value={section.title}
                      onChange={e => updateSectionTitle(secIdx, e.target.value)}
                      className="form-input font-semibold"
                    />
                  </div>

                  {/* If Summary or Content Section */}
                  {section.type === 'summary' && (
                    <div className="form-group">
                      <label>Professional Summary Content</label>
                      <textarea
                        rows={4}
                        value={section.content || ''}
                        onChange={e => updateSectionContent(secIdx, e.target.value)}
                        className="form-textarea"
                      />
                    </div>
                  )}

                  {/* If Skills Section */}
                  {section.type === 'skills' && section.skillCategories && (
                    <div className="skills-editor">
                      {section.skillCategories.map((cat, catIdx) => (
                        <div key={catIdx} className="cat-card">
                          <input
                            type="text"
                            placeholder="Category (e.g. Technical Skills)"
                            value={cat.category || ''}
                            onChange={e => {
                              const newSecs = [...resume.sections];
                              const cats = [...(section.skillCategories || [])];
                              cats[catIdx] = { ...cats[catIdx], category: e.target.value };
                              newSecs[secIdx] = { ...section, skillCategories: cats };
                              onChange({ ...resume, sections: newSecs });
                            }}
                            className="form-input font-medium mb-1.5 text-xs"
                          />
                          <textarea
                            rows={2}
                            placeholder="Skills separated by commas"
                            value={cat.skills.join(', ')}
                            onChange={e => {
                              const newSecs = [...resume.sections];
                              const cats = [...(section.skillCategories || [])];
                              cats[catIdx] = {
                                ...cats[catIdx],
                                skills: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                              };
                              newSecs[secIdx] = { ...section, skillCategories: cats };
                              onChange({ ...resume, sections: newSecs });
                            }}
                            className="form-textarea text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* If Structured Entries Section */}
                  {section.entries && (
                    <div className="entries-list">
                      {section.entries.map((entry, entryIdx) => (
                        <div key={entry.id} className="entry-card">
                          <div className="entry-card-header">
                            <span className="text-xs font-semibold text-gray-700">
                              Entry #{entryIdx + 1}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeEntry(secIdx, entryIdx)}
                              className="text-red-500 hover:text-red-700 text-xs flex items-center gap-1"
                            >
                              <Trash2 size={12} /> Remove
                            </button>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-xs text-gray-500">Title / Role / Degree</label>
                              <input
                                type="text"
                                value={entry.title || ''}
                                onChange={e => updateEntry(secIdx, entryIdx, 'title', e.target.value)}
                                className="form-input text-xs"
                                placeholder="Job Title or Degree"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Dates</label>
                              <input
                                type="text"
                                value={entry.date || ''}
                                onChange={e => updateEntry(secIdx, entryIdx, 'date', e.target.value)}
                                className="form-input text-xs"
                                placeholder="e.g. Apr 2024–Present"
                              />
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                              <label className="text-xs text-gray-500">Company / Institution (Optional)</label>
                              <input
                                type="text"
                                value={entry.subtitle || ''}
                                onChange={e => updateEntry(secIdx, entryIdx, 'subtitle', e.target.value)}
                                className="form-input text-xs"
                                placeholder="Company or School Name"
                              />
                            </div>
                            <div>
                              <label className="text-xs text-gray-500">Location (Optional)</label>
                              <input
                                type="text"
                                value={entry.location || ''}
                                onChange={e => updateEntry(secIdx, entryIdx, 'location', e.target.value)}
                                className="form-input text-xs"
                                placeholder="e.g. New Delhi, India"
                              />
                            </div>
                          </div>

                          {/* Bullets editor */}
                          <div className="bullets-subeditor">
                            <div className="flex justify-between items-center mb-1">
                              <label className="text-xs font-medium text-gray-600">Bullet Points</label>
                              <button
                                type="button"
                                onClick={() => addBullet(secIdx, entryIdx)}
                                className="text-blue-600 hover:text-blue-800 text-xs flex items-center gap-0.5"
                              >
                                <Plus size={12} /> Add Bullet
                              </button>
                            </div>
                            {(entry.bullets || []).map((bullet, bIdx) => (
                              <div key={bIdx} className="bullet-row">
                                <span className="bullet-dot">•</span>
                                <textarea
                                  rows={2}
                                  value={bullet}
                                  onChange={e => updateBullet(secIdx, entryIdx, bIdx, e.target.value)}
                                  className="form-textarea text-xs flex-1"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeBullet(secIdx, entryIdx, bIdx)}
                                  className="icon-btn text-gray-400 hover:text-red-500"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}

                      <button
                        type="button"
                        onClick={() => addEntry(secIdx)}
                        className="btn-dashed w-full flex items-center justify-center gap-1.5 py-2 mt-2 text-xs"
                      >
                        <Plus size={14} /> Add New Entry to {section.title}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
