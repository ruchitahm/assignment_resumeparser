// backend/index.js
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const MONTHS = {
  jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
  jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
};

function normalizeDegree(degreeLine) {
  const map = {
    'b.sc': 'Bachelor of Science',
    'bachelor of science': 'Bachelor of Science', 
    'bachelor': 'Bachelor Degree',
    'm.sc': 'Master of Science',
    'master': 'Master Degree',
    'ph.d': 'Doctor of Philosophy',
    'doctor': 'Doctorate',
    'associate': 'Associate Degree',
  };

  const lower = degreeLine.toLowerCase();
  for (const key in map) {
    if (lower.includes(key)) return map[key];
  }
  return degreeLine;
}

function parseDuration(durationStr) {
  if (!durationStr) return { start: null, end: null };

  const parts = durationStr.split('-').map(s => s.trim().toLowerCase());
  if (parts.length !== 2) return { start: null, end: null, error: 'Invalid duration format' };

  const parseDatePart = (part) => {
    if (part === 'present' || part === 'current') return 'Present';

    const match = part.match(/([a-z]+)?\s*(\d{4})/);
    if (match) {
      const monthStr = match[1] || 'jan';
      const year = match[2];
      const month = MONTHS[monthStr.substring(0, 3)] || '01';
      return `${year}-${month}`;
    }

    if (/^\d{4}$/.test(part)) {
      return `${part}-01`;
    }

    return null;
  };

  const start = parseDatePart(parts[0]);
  const end = parseDatePart(parts[1]);

  if (!start || !end) return { start, end, error: 'Could not parse dates' };

  return { start, end };
}

function parseResumeText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);
  const skills = [];
  const experiences = [];
  const education = [];

  // Parse Skills (inline or bullet)
  for (let i = 0; i < lines.length; i++) {
    const skillLineMatch = lines[i].match(/^skills?:\s*(.*)/i);
    if (skillLineMatch) {
      const inlineSkills = skillLineMatch[1].trim();
      if (inlineSkills.length > 0) {
        inlineSkills.split(',').forEach(skill => {
          const trimmedSkill = skill.trim();
          if (!trimmedSkill) return;
          // Capture proficiency if present in parentheses
          const profMatch = trimmedSkill.match(/^(.+?)\s*\((.+)\)$/);
          if (profMatch) {
            skills.push({ skill: profMatch[1], proficiency: profMatch[2] });
          } else {
            skills.push({ skill: trimmedSkill, proficiency: null });
          }
        });
      } else {
        // Look for bullets below
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('-')) {
          const skillLine = lines[j].substring(1).trim();
          const profMatch = skillLine.match(/^(.+?)\s*\((.+)\)$/);
          if (profMatch) {
            skills.push({ skill: profMatch[1], proficiency: profMatch[2] });
          } else {
            skills.push({ skill: skillLine, proficiency: null });
          }
          j++;
        }
      }
      break;
    }
  }

  // Parse Experiences
  for (let i = 0; i < lines.length; i++) {
    const roleMatch = lines[i].match(/^(.+?) at (.+)$/);
    if (roleMatch) {
      const role = roleMatch[1];
      const company = roleMatch[2];
      const durationLine = lines[i + 1] || '';
      const duration = parseDuration(durationLine);

      const details = [];
      let j = i + 2;
      while (j < lines.length && lines[j].startsWith('-')) {
        details.push(lines[j].substring(1).trim());
        j++;
      }

      experiences.push({
        role,
        company,
        duration,
        details: details.join(' '),
      });

      i = j - 1; // skip processed lines
    }
  }

  // Parse Education
  for (let i = 0; i < lines.length; i++) {
    const degreeMatch = lines[i].match(/(Bachelor|Master|Doctor|Associate|Ph\.D|B\.Sc|M\.Sc)/i);
    if (degreeMatch) {
      const degreeRaw = lines[i];
      const degree = normalizeDegree(degreeRaw);
      const institution = lines[i + 1] || '';
      const duration = lines[i + 2] || '';

      education.push({
        degree,
        institution,
        duration,
      });

      i += 2;
    }
  }

  return {
    skills,
    experiences,
    education,
  };
}

app.post('/parse-resume', (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Missing resume text' });
  }

  try {
    const parsed = parseResumeText(text);
    res.json(parsed);
  } catch (err) {
    res.status(500).json({ error: 'Failed to parse resume' });
  }
});

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`Resume parser backend running on port ${PORT}`);
});
