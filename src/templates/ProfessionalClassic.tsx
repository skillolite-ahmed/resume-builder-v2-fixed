import React from 'react';
import type { ResumeData } from '../types/resume';
import './ProfessionalClassic.css';

interface ProfessionalClassicProps {
  resume: ResumeData;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
}

export const ProfessionalClassic: React.FC<ProfessionalClassicProps> = ({ resume, sheetRef }) => {
  const { contact, sections } = resume;

  // Build contact items array
  const contactItems: { id: string; label: string; href?: string }[] = [];

  if (contact.email) {
    contactItems.push({
      id: 'email',
      label: contact.email,
      href: `mailto:${contact.email}`,
    });
  }

  if (contact.phone) {
    contactItems.push({
      id: 'phone',
      label: contact.phone,
      href: `tel:${contact.phone.replace(/\s+/g, '')}`,
    });
  }

  if (contact.location) {
    contactItems.push({
      id: 'location',
      label: contact.location,
    });
  }

  if (contact.linkedin) {
    const display = contact.linkedin.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const url = contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}`;
    contactItems.push({
      id: 'linkedin',
      label: display,
      href: url,
    });
  }

  if (contact.github) {
    const display = contact.github.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    const url = contact.github.startsWith('http') ? contact.github : `https://${contact.github}`;
    contactItems.push({
      id: 'github',
      label: display,
      href: url,
    });
  }

  if (contact.website) {
    const display = contact.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    contactItems.push({
      id: 'website',
      label: display,
      href: contact.website,
    });
  }

  const densityClass = resume.density ? `density-${resume.density}` : '';

  return (
    <div className={`resume-sheet ${densityClass}`.trim()} ref={sheetRef} id="resume-document">
      {/* Candidate Header */}
      <header className="resume-header">
        <h1 className="resume-candidate-name">{contact.name || 'Candidate Name'}</h1>
        {contactItems.length > 0 && (
          <div className="resume-contact-bar">
            {contactItems.map((item, idx) => (
              <React.Fragment key={item.id}>
                <span className="resume-contact-item">
                  {item.href ? (
                    <a href={item.href} target="_blank" rel="noopener noreferrer">
                      {item.label}
                    </a>
                  ) : (
                    <span>{item.label}</span>
                  )}
                </span>
                {idx < contactItems.length - 1 && <span className="resume-contact-sep">•</span>}
              </React.Fragment>
            ))}
          </div>
        )}
      </header>

      {/* Sections */}
      {sections.map(section => (
        <section key={section.id} className="resume-section" data-section-type={section.type}>
          {section.title && <h2 className="resume-section-title">{section.title}</h2>}

          {/* Simple text content (e.g. Summary, Objectives, Custom Notes) */}
          {section.content && (
            <p className="resume-section-content">{section.content}</p>
          )}

          {/* Skills with categories */}
          {section.type === 'skills' && section.skillCategories && (
            <div className="resume-skills-block">
              {section.skillCategories.map((cat, idx) => (
                <div key={idx} className="resume-skill-cat">
                  {cat.category && (
                    <strong className="resume-skill-cat-title">{cat.category}: </strong>
                  )}
                  {cat.skills && cat.skills.length > 0 && <span>{cat.skills.join(', ')}</span>}
                </div>
              ))}
            </div>
          )}

          {/* Structured Entries (Experience, Education, Projects, Certifications, Awards, etc.) */}
          {section.entries && section.entries.length > 0 && (
            <div className="resume-entries-block">
              {section.entries.map(entry => {
                const entryMetaItems = [entry.subtitle, entry.location].filter(Boolean);

                return (
                  <article key={entry.id} className="resume-entry">
                    {/* Title and Date row */}
                    {(entry.title || entry.date) && (
                      <div className="resume-entry-header">
                        {entry.title && <div className="resume-entry-title">{entry.title}</div>}
                        {entry.date && <div className="resume-entry-date">{entry.date}</div>}
                      </div>
                    )}

                    {/* Subtitle (Company / School) and Location row */}
                    {entryMetaItems.length > 0 && (
                      <div className="resume-entry-subline">
                        {entryMetaItems.map((item, index) => (
                          <span
                            key={`${entry.id}-meta-${index}`}
                            className={index === 0 ? 'resume-entry-subtitle' : 'resume-entry-location'}
                          >
                            {item}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Entry Description */}
                    {entry.description && (
                      <p className="resume-entry-desc">{entry.description}</p>
                    )}

                    {/* Bullet points */}
                    {entry.bullets && entry.bullets.length > 0 && (
                      <ul className="resume-bullets-list">
                        {entry.bullets.map((bullet, bIdx) => (
                          <li key={bIdx} className="resume-bullet-item">
                            {bullet}
                          </li>
                        ))}
                      </ul>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};

