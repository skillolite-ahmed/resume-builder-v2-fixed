import React from 'react';
import type { ResumeData } from '../types/resume';
import './ModernMinimal.css';

interface ModernMinimalProps {
  resume: ResumeData;
  sheetRef?: React.RefObject<HTMLDivElement | null>;
}

export const ModernMinimal: React.FC<ModernMinimalProps> = ({ resume, sheetRef }) => {
  const { contact, sections } = resume;

  const contactItems: { id: string; label: string; href?: string }[] = [];
  if (contact.email) {
    contactItems.push({ id: 'email', label: contact.email, href: `mailto:${contact.email}` });
  }
  if (contact.phone) {
    contactItems.push({ id: 'phone', label: contact.phone, href: `tel:${contact.phone.replace(/\s+/g, '')}` });
  }
  if (contact.location) {
    contactItems.push({ id: 'location', label: contact.location });
  }
  if (contact.linkedin) {
    const display = contact.linkedin.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    contactItems.push({ id: 'linkedin', label: display, href: contact.linkedin.startsWith('http') ? contact.linkedin : `https://${contact.linkedin}` });
  }
  if (contact.github) {
    const display = contact.github.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    contactItems.push({ id: 'github', label: display, href: contact.github.startsWith('http') ? contact.github : `https://${contact.github}` });
  }
  if (contact.website) {
    const display = contact.website.replace(/^https?:\/\//i, '').replace(/^www\./i, '');
    contactItems.push({ id: 'website', label: display, href: contact.website.startsWith('http') ? contact.website : `https://${contact.website}` });
  }

  return (
    <div className="resume-sheet modern-template" ref={sheetRef} id="resume-document">
      <header className="modern-header">
        <div>
          <h1 className="modern-name">{contact.name || 'Candidate Name'}</h1>
        </div>
        {contactItems.length > 0 && (
          <div className="modern-contact-grid">
            {contactItems.map(item => (
              <span key={item.id} className="modern-contact-item">
                {item.href ? (
                  <a href={item.href} target="_blank" rel="noopener noreferrer">
                    {item.label}
                  </a>
                ) : (
                  <>{item.label}</>
                )}
              </span>
            ))}
          </div>
        )}
      </header>

      {sections.map(section => (
        <section key={section.id} className="modern-section">
          <h2 className="modern-section-title">{section.title}</h2>

          {section.content && <p className="modern-content">{section.content}</p>}

          {section.type === 'skills' && section.skillCategories && (
            <div className="modern-skills">
              {section.skillCategories.map((cat, idx) => (
                <div key={idx} className="modern-skill-row">
                  {cat.category && <strong>{cat.category}:</strong>}
                  <span>{cat.skills.join(', ')}</span>
                </div>
              ))}
            </div>
          )}

          {section.entries && section.entries.length > 0 && (
            <div className="modern-entry-list">
              {section.entries.map(entry => (
                <article key={entry.id} className="modern-entry">
                  {(entry.title || entry.date) && (
                    <div className="modern-entry-head">
                      {entry.title && <div className="modern-entry-title">{entry.title}</div>}
                      {entry.date && <div className="modern-entry-date">{entry.date}</div>}
                    </div>
                  )}

                  {(entry.subtitle || entry.location) && (
                    <div className="modern-entry-meta">
                      {entry.subtitle && <span>{entry.subtitle}</span>}
                      {entry.location && <span>{entry.location}</span>}
                    </div>
                  )}

                  {entry.description && <p className="modern-entry-desc">{entry.description}</p>}

                  {entry.bullets && entry.bullets.length > 0 && (
                    <ul className="modern-bullets">
                      {entry.bullets.map((bullet, idx) => (
                        <li key={idx}>{bullet}</li>
                      ))}
                    </ul>
                  )}
                </article>
              ))}
            </div>
          )}
        </section>
      ))}
    </div>
  );
};
