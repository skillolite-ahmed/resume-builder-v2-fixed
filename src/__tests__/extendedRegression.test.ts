import { describe, it, expect } from 'vitest';
import { parseResume } from '../parser/universalParser';
import { validateResume } from '../validation/validator';
import { generateFilename } from '../utils/pdfExport';

describe('Comprehensive Extended Regression Test Suite', () => {
  // 1. Fresher with no employment history
  it('correctly parses a fresher with only education, projects, skills, and certifications', () => {
    const raw = `Priya Patel
priya.patel@eng.edu | +91 9123456789 | Ahmedabad, India | github.com/priyapatel

OBJECTIVE
Passionate computer engineering graduate seeking an associate software engineer role.

EDUCATION
B.Tech in Information Technology 2021 - 2025
Nirma University | CPI: 9.1 / 10

PROJECTS
Smart Attendance System using Facial Recognition 2024
• Implemented computer vision pipeline with OpenCV and Python.
• Achieved 98% accuracy on 200 student samples.

SKILLS
Python, C++, Java, SQL, Git, Linux, Docker

CERTIFICATIONS
Google Cloud Certified Associate Cloud Engineer 2024`;

    const resume = parseResume(raw);
    const val = validateResume(resume);

    expect(resume.contact.name).toBe('Priya Patel');
    expect(resume.contact.email).toBe('priya.patel@eng.edu');
    expect(resume.sections.some(s => s.type === 'experience')).toBe(false);
    expect(resume.sections.some(s => s.type === 'education')).toBe(true);
    expect(resume.sections.some(s => s.type === 'projects')).toBe(true);
    expect(val.unknownPlaceholdersCount).toBe(0);
    expect(val.overallStatus).toBe('PASS');
  });

  // 2. Experienced professional with several jobs
  it('correctly parses an experienced executive with 5 distinct jobs and dates', () => {
    const raw = `David Kim
david.kim@exec.com | (415) 555-0199 | San Francisco, CA | linkedin.com/in/davidkim

SUMMARY
Technology executive with 15 years leading enterprise engineering teams.

EXPERIENCE
VP of Engineering 2022 - Present
Stripe
• Led organization of 120 engineers across payment infrastructure.

Director of Software Engineering 2019 - 2022
Square
• Managed core merchant onboarding and ledger platforms.

Principal Software Architect 2016 - 2019
Twitter
• Designed high-throughput distributed event streaming.

Senior Staff Engineer 2013 - 2016
Salesforce
• Architected multi-tenant CRM database partitioning.

Software Engineer 2009 - 2013
Google
• Worked on indexing crawler pipelines.`;

    const resume = parseResume(raw);
    const val = validateResume(resume);
    const expSec = resume.sections.find(s => s.type === 'experience')!;

    expect(expSec.entries?.length).toBe(5);
    expect(expSec.entries?.[0].title).toBe('VP of Engineering');
    expect(expSec.entries?.[0].date).toBe('2022 - Present');
    expect(expSec.entries?.[0].subtitle).toBe('Stripe');
    expect(expSec.entries?.[4].title).toBe('Software Engineer');
    expect(expSec.entries?.[4].subtitle).toBe('Google');
    expect(val.unknownPlaceholdersCount).toBe(0);
  });

  // 3. Resume with a very long skills section
  it('preserves extensive categorized skills without loss', () => {
    const raw = `Anita Rao
anita@cloudops.net | Bengaluru, India

SKILLS
Frontend: React, Next.js, Vue, Svelte, Tailwind CSS, Redux, Zustand
Backend: Node.js, Go, Rust, Python, FastAPI, Java Spring Boot
Databases: PostgreSQL, MySQL, MongoDB, Redis, Cassandra, Neo4j
DevOps & Cloud: AWS, GCP, Azure, Kubernetes, Docker, Terraform, CI/CD, Prometheus, Grafana
Security & Compliance: OAuth2, OpenID Connect, SOC2, GDPR, Pen Testing`;

    const resume = parseResume(raw);
    const skillsSec = resume.sections.find(s => s.type === 'skills')!;

    expect(skillsSec.skillCategories?.length).toBe(5);
    const totalSkills = skillsSec.skillCategories?.reduce((acc, cat) => acc + cat.skills.length, 0);
    expect(totalSkills).toBeGreaterThan(25);
  });

  // 4. Resume with many certifications
  it('correctly associates multiple certifications and licensing bodies', () => {
    const raw = `Marcus Vance
marcus@infosec.org | London, UK

CERTIFICATIONS
CISSP - Certified Information Systems Security Professional 2024
ISC2
CISM - Certified Information Security Manager 2023
ISACA
CEH - Certified Ethical Hacker 2022
EC-Council
CompTIA Security+ 2021
CompTIA`;

    const resume = parseResume(raw);
    const certSec = resume.sections.find(s => s.type === 'certifications')!;

    expect(certSec.entries?.length).toBe(4);
    expect(certSec.entries?.[0].title).toContain('CISSP');
    expect(certSec.entries?.[0].subtitle).toBe('ISC2');
    expect(certSec.entries?.[0].date).toBe('2024');
  });

  // 5. Resume with multiple projects
  it('preserves multiple projects with descriptions and bullet points', () => {
    const raw = `Sarah Jenkins
sarah@ai.mit.edu | Boston, MA

PROJECTS
Autonomous Drone Navigation System
• Built real-time SLAM navigation using ROS2 and LiDAR sensors.
• Reduced drift errors by 40% under turbulent wind tunnel conditions.

Neural Style Transfer for Architectural CAD
• Developed PyTorch neural network generating photorealistic building renderings.
• Published open source weights with 1,200 GitHub stars.

High-Frequency Order Routing Engine
• Implemented low-latency order router in C++ achieving sub-microsecond tick-to-trade.`;

    const resume = parseResume(raw);
    const projSec = resume.sections.find(s => s.type === 'projects')!;

    expect(projSec.entries?.length).toBe(3);
    expect(projSec.entries?.[0].title).toBe('Autonomous Drone Navigation System');
    expect(projSec.entries?.[0].bullets?.length).toBe(2);
    expect(projSec.entries?.[1].title).toBe('Neural Style Transfer for Architectural CAD');
  });

  // 6. Resume with unfamiliar or custom section headings
  it('preserves unfamiliar section headings without forcing rename or discarding content', () => {
    const raw = `Lucas Gomez
lucas@creative.io | Madrid, Spain

EXHIBITIONS & INSTALLATIONS
Interactive Light Sculpture at ARCO Madrid 2024
• Created generative audiovisual installation visited by 45,000 attendees.

COMMUNITY CONTRIBUTIONS
Maintainer, OpenAudioDSP 2023 - Present
• Supervised release cadence and triaged 150+ community bug reports.

PHILANTHROPY & SERVICE
Volunteer Code Instructor, TechForYouth 2022
• Taught weekend Python fundamentals to underprivileged youth.`;

    const resume = parseResume(raw);
    const titles = resume.sections.map(s => s.title);

    expect(titles).toContain('EXHIBITIONS & INSTALLATIONS');
    expect(titles).toContain('COMMUNITY CONTRIBUTIONS');
    expect(titles).toContain('PHILANTHROPY & SERVICE');

    const val = validateResume(resume);
    expect(val.unknownPlaceholdersCount).toBe(0);
    expect(val.overallStatus).toBe('PASS');
  });

  // 7. Resume with dates on separate lines
  it('associates dates cleanly when dates appear on their own lines', () => {
    const raw = `Chen Wei
chen@finance.hk | Hong Kong

EXPERIENCE
Quantitative Research Analyst
Citadel Securities
Aug 2022 - Present
Hong Kong
• Researched intraday equity market microstructure anomalies.`;

    const resume = parseResume(raw);
    const expSec = resume.sections.find(s => s.type === 'experience')!;

    expect(expSec.entries?.[0].title).toBe('Quantitative Research Analyst');
    expect(expSec.entries?.[0].subtitle).toBe('Citadel Securities');
    expect(expSec.entries?.[0].date).toBe('Aug 2022 - Present');
    expect(expSec.entries?.[0].location).toBe('Hong Kong');
  });

  // 8. Resume with no dates in optional sections
  it('does not fail validation when optional sections contain no dates', () => {
    const raw = `Olivia Taylor
olivia@uxdesign.com | Melbourne, Australia

SUMMARY
UX researcher obsessed with human-centered product systems.

AWARDS & RECOGNITION
Red Dot Design Concept Award
Best Mobile Experience Design - Good Design Awards

INTERESTS
Ceramics, Mountaineering, Analog Photography`;

    const resume = parseResume(raw);
    const val = validateResume(resume);

    expect(val.overallStatus).toBe('PASS');
    expect(val.unknownPlaceholdersCount).toBe(0);
  });

  // 9. Resume with long bullets and multiple paragraphs
  it('preserves multi-sentence wrapped bullet points without truncation', () => {
    const longBullet = 'Spearheaded comprehensive digital transformation of legacy mainframe batch processing into an event-driven Kafka and Apache Flink stream architecture across 4 global data centers, reducing overnight transaction latency from 7 hours to 4 minutes while strictly adhering to Basel III liquidity reporting frameworks and zero downtime SLA.';
    const raw = `Robert MacIntyre
robert@enterprise.com | Edinburgh, UK

EXPERIENCE
Chief Solutions Architect 2020 - Present
Global Financial Services
• ${longBullet}`;

    const resume = parseResume(raw);
    const expSec = resume.sections.find(s => s.type === 'experience')!;

    expect(expSec.entries?.[0].bullets?.[0]).toBe(longBullet);
  });

  // 10. Resume with unusual punctuation, currency, and Unicode characters
  it('preserves currency symbols (₹, €, £, $), en-dashes, and unicode characters', () => {
    const raw = `Rohan Verma
rohan@fin.in | Mumbai, India

EXPERIENCE
Senior Treasury Analyst 2022 – 2024
HDFC Bank
• Managed ₹500 Cr daily currency swaps and hedging portfolios in USD/INR & EUR/INR.
• Generated £2.5M in cost efficiencies through algorithmic liquidity routing.
• Awarded "Star Performer — Q3" for exceptional precision.`;

    const resume = parseResume(raw);
    const expSec = resume.sections.find(s => s.type === 'experience')!;

    expect(expSec.entries?.[0].bullets?.[0]).toContain('₹500 Cr');
    expect(expSec.entries?.[0].bullets?.[1]).toContain('£2.5M');
    expect(expSec.entries?.[0].bullets?.[2]).toContain('"Star Performer');
  });

  // 11. PDF filename generation sanitization
  it('generates clean, professional PDF filenames from candidate names', () => {
    expect(generateFilename('Mohd Sohail')).toBe('Mohd_Sohail_Resume.pdf');
    expect(generateFilename('BISWA LAKSHMI RAJKUMARI')).toBe('BISWA_LAKSHMI_RAJKUMARI_Resume.pdf');
    expect(generateFilename('Nitika Yadav')).toBe('Nitika_Yadav_Resume.pdf');
    expect(generateFilename('')).toBe('Resume.pdf');
  });
});
