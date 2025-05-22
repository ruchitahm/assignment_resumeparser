import React, { useState } from 'react';

export default function App() {
  const [resumeText, setResumeText] = useState('');
  const [parsedData, setParsedData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleParse() {
    setLoading(true);
    setError(null);
    setParsedData(null);
 
    
    try {
      const response = await fetch('http://localhost:4000/parse-resume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: resumeText }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to parse resume');
      }

      const data = await response.json();
      setParsedData(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: 'auto', padding: 20, fontFamily: 'Arial, sans-serif' }}>
      <h1>Intelligent Resume Parser</h1>

      <textarea
        rows={10}
        value={resumeText}
        onChange={(e) => setResumeText(e.target.value)}
        placeholder="Paste your resume text here..."
        style={{ width: '100%', fontSize: 16, padding: 10, marginBottom: 10 }}
      />

      <button onClick={handleParse} disabled={loading || !resumeText} style={{ padding: '10px 20px', fontSize: 16 }}>
        {loading ? 'Parsing...' : 'Parse Resume'}
      </button>

      {error && <p style={{ color: 'red' }}>Error: {error}</p>}

      {parsedData && (
        <div style={{ marginTop: 20 }}>
          <h2>Parsed Data</h2>

          <section>
            <h3>Skills</h3>
            {parsedData.skills.length === 0 ? (
              <p>No skills found</p>
            ) : (
              <ul>
                {parsedData.skills.map(({ skill, proficiency }, i) => (
                  <li key={i}>
                    {skill} {proficiency ? `(${proficiency})` : ''}
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section>
            <h3>Work Experience</h3>
            {parsedData.experiences.length === 0 ? (
              <p>No work experience found</p>
            ) : (
              parsedData.experiences.map((exp, i) => (
                <div key={i} style={{ marginBottom: 12, paddingLeft: 10, borderLeft: '3px solid #007acc' }}>
                  <strong>
                    {exp.role} at {exp.company}
                  </strong>
                  <br />
                  <em>
                    Duration: {exp.duration.start || 'N/A'} - {exp.duration.end || 'Present'}
                  </em>
                  <br />
                  {exp.duration.error && <span style={{ color: 'red' }}>{exp.duration.error}</span>}
                  <p>{exp.details}</p>
                </div>
              ))
            )}
          </section>

          <section>
            <h3>Education</h3>
            {parsedData.education.length === 0 ? (
              <p>No education details found</p>
            ) : (
              parsedData.education.map((edu, i) => (
                <div key={i} style={{ marginBottom: 12, paddingLeft: 10, borderLeft: '3px solid #007acc' }}>
                  <strong>{edu.degree}</strong>
                  <br />
                  <em>{edu.institution}</em>
                  <br />
                  <p>{edu.duration}</p>
                </div>
              ))
            )}
          </section>
        </div>
      )}
    </div>
  );
}
