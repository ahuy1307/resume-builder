import FormSection from "./FormSection";
import RichTextBullet from "./RichTextBullet";

function TextField({ label, value, onChange, placeholder, multiline }) {
  return (
    <div className="field-group">
      <label>{label}</label>
      {multiline ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={5} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} />
      )}
    </div>
  );
}

export default function ResumeForm({ resume, onChange }) {
  const update = (path, value) => {
    const keys = path.split(".");
    const newResume = JSON.parse(JSON.stringify(resume));
    let obj = newResume;
    for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
    obj[keys[keys.length - 1]] = value;
    onChange(newResume);
  };

  const updateList = (section, id, field, value) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    const item = newResume[section].find((x) => x.id === id);
    if (item) item[field] = value;
    onChange(newResume);
  };

  const addItem = (section, template) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    newResume[section].push({ ...template, id: `${section}-${Date.now()}` });
    onChange(newResume);
  };

  const removeItem = (section, id) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    newResume[section] = newResume[section].filter((x) => x.id !== id);
    onChange(newResume);
  };

  const updateBullet = (expId, bulletIndex, value) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    const exp = newResume.experience.find((x) => x.id === expId);
    if (exp) exp.bullets[bulletIndex] = value;
    onChange(newResume);
  };

  const addBullet = (expId) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    const exp = newResume.experience.find((x) => x.id === expId);
    if (exp) exp.bullets.push("");
    onChange(newResume);
  };

  const removeBullet = (expId, bulletIndex) => {
    const newResume = JSON.parse(JSON.stringify(resume));
    const exp = newResume.experience.find((x) => x.id === expId);
    if (exp) exp.bullets.splice(bulletIndex, 1);
    onChange(newResume);
  };

  return (
    <div className="resume-form">
      {/* ── Personal Info ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Personal Information
        </span>
      }>
        <TextField label="Full Name" value={resume.personalInfo.name} onChange={(v) => update("personalInfo.name", v)} placeholder="Full Name" />
        <TextField label="Email" value={resume.personalInfo.email} onChange={(v) => update("personalInfo.email", v)} placeholder="email@example.com" />
        <TextField label="Phone" value={resume.personalInfo.phone} onChange={(v) => update("personalInfo.phone", v)} placeholder="+1 000 000 0000" />
        <TextField label="Location" value={resume.personalInfo.location} onChange={(v) => update("personalInfo.location", v)} placeholder="City, State, Country" />
        <TextField label="LinkedIn URL" value={resume.personalInfo.linkedin} onChange={(v) => update("personalInfo.linkedin", v)} placeholder="https://linkedin.com/in/..." />
        <TextField label="GitHub URL" value={resume.personalInfo.github} onChange={(v) => update("personalInfo.github", v)} placeholder="https://github.com/..." />
      </FormSection>

      {/* ── Summary ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
          Professional Summary
        </span>
      }>
        <TextField label="Summary" value={resume.summary} onChange={(v) => update("summary", v)} placeholder="Write your professional summary..." multiline />
      </FormSection>

      {/* ── Experience ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2"/></svg>
          Work Experience
        </span>
      }>
        {resume.experience.map((exp, ei) => (
          <div key={exp.id} className="list-card">
            <div className="list-card-header">
              <span>Experience {ei + 1}</span>
              <button className="btn-remove" onClick={() => removeItem("experience", exp.id)}>✕ Remove</button>
            </div>
            <TextField label="Job Title" value={exp.title} onChange={(v) => updateList("experience", exp.id, "title", v)} placeholder="Software Engineer" />
            <TextField label="Company" value={exp.company} onChange={(v) => updateList("experience", exp.id, "company", v)} placeholder="Company Name" />
            <div className="row-2">
              <TextField label="Start Date" value={exp.startDate} onChange={(v) => updateList("experience", exp.id, "startDate", v)} placeholder="Jan 2024" />
              <TextField label="End Date" value={exp.endDate} onChange={(v) => updateList("experience", exp.id, "endDate", v)} placeholder="Present" />
            </div>
            <TextField label="Location" value={exp.location} onChange={(v) => updateList("experience", exp.id, "location", v)} placeholder="City, Country" />
            <div className="sub-label">Bullet Points</div>
            {exp.bullets.map((b, bi) => (
              <div key={bi} className="bullet-row">
                <RichTextBullet
                  value={b}
                  onChange={(v) => updateBullet(exp.id, bi, v)}
                  placeholder={`Bullet ${bi + 1}`}
                />
                <button className="btn-icon-remove" onClick={() => removeBullet(exp.id, bi)}>✕</button>
              </div>
            ))}
            <button className="btn-add-small" onClick={() => addBullet(exp.id)}>+ Add Bullet</button>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem("experience", { title: "", company: "", startDate: "", endDate: "", location: "", bullets: [""] })}>
          + Add Experience
        </button>
      </FormSection>

      {/* ── Education ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>
          Education
        </span>
      }>
        {resume.education.map((edu, ei) => (
          <div key={edu.id} className="list-card">
            <div className="list-card-header">
              <span>Education {ei + 1}</span>
              <button className="btn-remove" onClick={() => removeItem("education", edu.id)}>✕ Remove</button>
            </div>
            <TextField label="Institution" value={edu.institution} onChange={(v) => updateList("education", edu.id, "institution", v)} placeholder="University Name" />
            <TextField label="Degree" value={edu.degree} onChange={(v) => updateList("education", edu.id, "degree", v)} placeholder="Bachelor of Science" />
            <div className="row-2">
              <TextField label="Start" value={edu.startDate} onChange={(v) => updateList("education", edu.id, "startDate", v)} placeholder="2018" />
              <TextField label="End" value={edu.endDate} onChange={(v) => updateList("education", edu.id, "endDate", v)} placeholder="2022" />
            </div>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem("education", { institution: "", degree: "", startDate: "", endDate: "" })}>
          + Add Education
        </button>
      </FormSection>

      {/* ── Certifications ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11"/></svg>
          Certifications
        </span>
      }>
        {resume.certifications.map((cert, ci) => (
          <div key={cert.id} className="list-card">
            <div className="list-card-header">
              <span>Cert {ci + 1}</span>
              <button className="btn-remove" onClick={() => removeItem("certifications", cert.id)}>✕ Remove</button>
            </div>
            <TextField label="Name" value={cert.name} onChange={(v) => updateList("certifications", cert.id, "name", v)} placeholder="Certification Name" />
            <div className="row-2">
              <TextField label="Issuer" value={cert.issuer} onChange={(v) => updateList("certifications", cert.id, "issuer", v)} placeholder="Issuer" />
              <TextField label="Date" value={cert.date} onChange={(v) => updateList("certifications", cert.id, "date", v)} placeholder="Jan 2024" />
            </div>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem("certifications", { name: "", issuer: "", date: "" })}>
          + Add Certification
        </button>
      </FormSection>

      {/* ── Skills ── */}
      <FormSection title={
        <span style={{display:'flex',alignItems:'center',gap:7}}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>
          Skills
        </span>
      }>
        {resume.skills.map((skill, si) => (
          <div key={skill.id} className="list-card">
            <div className="list-card-header">
              <span>Skill Group {si + 1}</span>
              <button className="btn-remove" onClick={() => removeItem("skills", skill.id)}>✕ Remove</button>
            </div>
            <div className="row-2">
              <TextField label="Category" value={skill.label} onChange={(v) => updateList("skills", skill.id, "label", v)} placeholder="Languages" />
              <TextField label="Values" value={skill.value} onChange={(v) => updateList("skills", skill.id, "value", v)} placeholder="Python, JavaScript..." />
            </div>
          </div>
        ))}
        <button className="btn-add" onClick={() => addItem("skills", { label: "", value: "" })}>
          + Add Skill Group
        </button>
      </FormSection>
    </div>
  );
}
