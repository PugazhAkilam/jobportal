const puppeteer = require('puppeteer');

const generateResumePDF = async (resumeData) => {
  let browser;
  
  try {
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    
    // Generate HTML content from resume data
    const htmlContent = generateResumeHTML(resumeData);
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
    
    // Generate PDF with streaming
    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20px',
        right: '20px',
        bottom: '20px',
        left: '20px'
      }
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('PDF generation error:', error);
    throw new Error('Failed to generate PDF');
  } finally {
    if (browser) {
      await browser.close();
    }
  }
};

const generateResumeHTML = (resumeData) => {
  const { profile, education, experience, skills, projects } = resumeData.content;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${profile?.name || 'Resume'}</title>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .header { text-align: center; margin-bottom: 30px; }
        .header h1 { margin: 0; color: #2c3e50; }
        .header p { margin: 5px 0; color: #7f8c8d; }
        .section { margin-bottom: 25px; }
        .section h2 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 5px; }
        .item { margin-bottom: 15px; }
        .item h3 { margin: 0; color: #34495e; }
        .item .meta { color: #7f8c8d; font-style: italic; }
        .skills { display: flex; flex-wrap: wrap; gap: 10px; }
        .skill { background: #ecf0f1; padding: 5px 10px; border-radius: 15px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${profile?.name || 'N/A'}</h1>
        <p>${profile?.email || ''} | ${profile?.phone || ''}</p>
        <p>${profile?.location || ''}</p>
        ${profile?.summary ? `<p>${profile.summary}</p>` : ''}
      </div>
      
      ${education?.length ? `
        <div class="section">
          <h2>Education</h2>
          ${education.map(edu => `
            <div class="item">
              <h3>${edu.degree}</h3>
              <div class="meta">${edu.institution} | ${edu.year} | Grade: ${edu.grade}</div>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${experience?.length ? `
        <div class="section">
          <h2>Experience</h2>
          ${experience.map(exp => `
            <div class="item">
              <h3>${exp.role}</h3>
              <div class="meta">${exp.company} | ${exp.duration}</div>
              <p>${exp.description}</p>
            </div>
          `).join('')}
        </div>
      ` : ''}
      
      ${skills?.length ? `
        <div class="section">
          <h2>Skills</h2>
          <div class="skills">
            ${skills.map(skill => `
              <span class="skill">${skill.name} (${skill.proficiency})</span>
            `).join('')}
          </div>
        </div>
      ` : ''}
      
      ${projects?.length ? `
        <div class="section">
          <h2>Projects</h2>
          ${projects.map(project => `
            <div class="item">
              <h3>${project.title}</h3>
              <p>${project.description}</p>
              <div class="meta">Tech Stack: ${project.techStack}</div>
              ${project.links ? `<div class="meta">Links: ${project.links}</div>` : ''}
            </div>
          `).join('')}
        </div>
      ` : ''}
    </body>
    </html>
  `;
};

module.exports = { generateResumePDF };