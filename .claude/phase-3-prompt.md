# PHASE 3: PDF Export & Print Layout

**Duration**: 1 week | **Lead**: Document Agent | **No questions, full autopilot**

**Prerequisite**: Phase 2 complete (worksheet generation working)

## Objective

Teacher can preview worksheet in A4 format → adjust layout (headers, footers, page breaks) → Export as PDF. PDF must be print-ready: proper margins, page numbers, marks aligned, answer key formatted correctly.

## Acceptance Criteria

- [ ] A4 preview page (responsive, print preview)
- [ ] Print CSS (proper margins, page breaks, headers/footers)
- [ ] PDF export via Playwright (A4 page size)
- [ ] Page numbers in footer
- [ ] School name + logo (if provided) in header
- [ ] Question numbering continues across pages
- [ ] Marks aligned right
- [ ] Answer key on separate page (optional checkbox)
- [ ] PDF file saved to storage (MinIO or local)
- [ ] Download link works
- [ ] Print button (opens browser print dialog)
- [ ] No layout shift on print
- [ ] Page break logic (no orphaned questions)
- [ ] Answer key formatting (marks breakdown visible)
- [ ] Landscape orientation option
- [ ] All TypeScript strict
- [ ] Tests pass (layout tests, PDF generation)
- [ ] CI/CD green

## What to Build

### 1. Document Rendering Engine

**`packages/document-engine/src/worksheet-html.ts`** — Generate HTML for worksheet:

```ts
export function generateWorksheetHTML(doc: WorksheetDocument, options: {
  includeAnswerKey?: boolean;
  includeMarks?: boolean;
  orientation?: 'portrait' | 'landscape';
  schoolLogo?: string;
}): string {
  // Return complete HTML ready for print/PDF
  // Must include all CSS, no external stylesheets
  return `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          ${getWorksheetCSS(options.orientation)}
        </style>
      </head>
      <body>
        ${renderWorksheetHeader(doc, options)}
        ${renderQuestions(doc.questions)}
        ${options.includeAnswerKey ? renderAnswerKey(doc.answerKey) : ''}
      </body>
    </html>
  `;
}
```

**CSS in TypeScript** (not separate files):
```ts
function getWorksheetCSS(orientation: string): string {
  return `
    @page {
      size: A4 ${orientation === 'landscape' ? 'landscape' : 'portrait'};
      margin: 2cm;
      @bottom-center {
        content: "Page " counter(page) " of " counter(pages);
        font-size: 10px;
      }
    }
    
    body {
      font-family: Arial, sans-serif;
      font-size: 11px;
      line-height: 1.5;
      color: #333;
    }
    
    .worksheet-header {
      text-align: center;
      border-bottom: 2px solid #000;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    
    .school-name {
      font-size: 14px;
      font-weight: bold;
    }
    
    .question {
      page-break-inside: avoid;
      margin-bottom: 15px;
      padding-bottom: 10px;
      border-bottom: 1px solid #eee;
    }
    
    .question-number {
      display: inline-block;
      width: 2.5cm;
      font-weight: bold;
    }
    
    .question-text {
      display: inline-block;
      width: calc(100% - 3.5cm);
      vertical-align: top;
    }
    
    .marks {
      float: right;
      font-weight: bold;
      color: #666;
    }
    
    .answer-key {
      page-break-before: always;
      margin-top: 30px;
    }
    
    .answer-key h2 {
      text-align: center;
      font-size: 16px;
      margin-bottom: 20px;
    }
    
    .answer-item {
      page-break-inside: avoid;
      margin-bottom: 15px;
      padding: 10px;
      background: #f9f9f9;
      border-left: 3px solid #007bff;
    }
    
    @media print {
      body { margin: 0; padding: 0; }
      .no-print { display: none; }
    }
  `;
}
```

### 2. PDF Generation Service

**`apps/web/src/lib/pdf-generator.ts`** — Use Playwright to render HTML to PDF:

```ts
import { chromium } from 'playwright';

export async function generatePDF(html: string, filename: string): Promise<Buffer> {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.setContent(html, { waitUntil: 'networkidle' });
    const pdf = await page.pdf({
      format: 'A4',
      margin: { top: '2cm', right: '2cm', bottom: '2cm', left: '2cm' },
      printBackground: true,
    });
    return pdf;
  } finally {
    await browser.close();
  }
}
```

**API Route**: `POST /api/worksheets/{id}/export/pdf`

```ts
export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await getServerSession();
  if (!session?.user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  
  const document = await prisma.document.findUnique({
    where: { id: params.id, userId: session.user.id },
  });
  
  if (!document) return Response.json({ error: 'Not found' }, { status: 404 });
  
  const { includeAnswerKey = true } = await req.json();
  
  const html = generateWorksheetHTML(document.contentJson, {
    includeAnswerKey,
    includeMarks: true,
    schoolLogo: session.user.schoolLogo,
  });
  
  const pdf = await generatePDF(html, `${document.title}.pdf`);
  
  // Save to storage
  const url = await storage.upload(`worksheets/${params.id}.pdf`, pdf);
  
  // Log export
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: 'EXPORT_PDF',
      targetType: 'Document',
      targetId: params.id,
    },
  });
  
  return Response.json({ url, filename: `${document.title}.pdf` });
}
```

### 3. Preview Page

**`apps/web/src/app/worksheet/\[id\]/preview/page.tsx`**:

```tsx
'use client';

import { useEffect, useRef, useState } from 'react';
import { generateWorksheetHTML } from '@teacher-paper-maker/document-engine';

export default function PreviewPage({ params }: { params: { id: string } }) {
  const [doc, setDoc] = useState(null);
  const [options, setOptions] = useState({
    includeAnswerKey: true,
    includeMarks: true,
    orientation: 'portrait',
  });
  const iframeRef = useRef<HTMLIFrameElement>(null);
  
  useEffect(() => {
    // Fetch document
    fetch(`/api/worksheets/${params.id}`)
      .then(r => r.json())
      .then(d => setDoc(d));
  }, [params.id]);
  
  useEffect(() => {
    if (!doc || !iframeRef.current) return;
    
    const html = generateWorksheetHTML(doc.contentJson, options);
    iframeRef.current.srcdoc = html;
  }, [doc, options]);
  
  const handleExport = async () => {
    const response = await fetch(`/api/worksheets/${params.id}/export/pdf`, {
      method: 'POST',
      body: JSON.stringify({ includeAnswerKey: options.includeAnswerKey }),
    });
    const { url } = await response.json();
    window.open(url, '_blank');
  };
  
  const handlePrint = () => {
    iframeRef.current?.contentWindow?.print();
  };
  
  return (
    <div className="flex flex-col h-screen">
      {/* Controls */}
      <div className="border-b p-4 bg-white flex gap-4 items-center">
        <label>
          <input
            type="checkbox"
            checked={options.includeAnswerKey}
            onChange={(e) => setOptions(prev => ({
              ...prev,
              includeAnswerKey: e.target.checked
            }))}
          />
          Include Answer Key
        </label>
        
        <select
          value={options.orientation}
          onChange={(e) => setOptions(prev => ({
            ...prev,
            orientation: e.target.value as 'portrait' | 'landscape'
          }))}
        >
          <option value="portrait">Portrait</option>
          <option value="landscape">Landscape</option>
        </select>
        
        <button onClick={handlePrint} className="btn-outline">
          Print
        </button>
        
        <button onClick={handleExport} className="btn-primary">
          Download PDF
        </button>
      </div>
      
      {/* Preview */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div className="max-w-4xl mx-auto bg-white shadow-lg">
          <iframe
            ref={iframeRef}
            className="w-full"
            style={{ height: '1200px' }}
            title="Preview"
          />
        </div>
      </div>
    </div>
  );
}
```

### 4. Page Break Logic

**`packages/document-engine/src/page-break.ts`**:

```ts
export function insertPageBreaks(questions: Question[], pageHeight: number = 1000): Question[] {
  // Estimate height per question, insert page breaks to avoid orphans
  let currentHeight = 0;
  const result = [];
  
  for (const question of questions) {
    const estimatedHeight = estimateQuestionHeight(question);
    
    if (currentHeight + estimatedHeight > pageHeight) {
      // Insert page break
      result.push({ type: 'page_break' });
      currentHeight = 0;
    }
    
    result.push(question);
    currentHeight += estimatedHeight;
  }
  
  return result;
}

function estimateQuestionHeight(q: Question): number {
  const baseHeight = 60; // Header + spacing
  const textHeight = Math.ceil(q.question.length / 80) * 15;
  
  if (q.type === 'multiple_choice') {
    return baseHeight + textHeight + (q.options.length * 15);
  }
  
  if (q.type === 'long_answer') {
    return baseHeight + textHeight + 100; // More space for long answer
  }
  
  return baseHeight + textHeight;
}
```

### 5. Storage Integration

**`packages/storage/src/pdf-storage.ts`**:

```ts
export async function savePDF(userId: string, documentId: string, pdf: Buffer): Promise<string> {
  const key = `worksheets/${userId}/${documentId}/${Date.now()}.pdf`;
  
  try {
    return await storageProvider.upload(key, pdf);
  } catch (error) {
    console.error('PDF upload failed:', error);
    throw new Error('Failed to save PDF');
  }
}

export async function getPDFUrl(userId: string, documentId: string): Promise<string> {
  const key = `worksheets/${userId}/${documentId}`;
  return await storageProvider.getUrl(key);
}
```

### 6. Answer Key Formatting

**`packages/document-engine/src/answer-key-renderer.ts`**:

```ts
export function renderAnswerKey(answerKey: AnswerKeySchema): string {
  return `
    <div class="answer-key">
      <h2>Answer Key</h2>
      ${answerKey.answerKey.map((item, idx) => `
        <div class="answer-item">
          <div class="answer-number">Q${idx + 1}</div>
          <div class="answer-text">
            <strong>Correct Answer:</strong> ${item.correctAnswer}
          </div>
          ${item.keywords ? `
            <div class="keywords">
              <strong>Keywords:</strong> ${item.keywords.join(', ')}
            </div>
          ` : ''}
          ${item.explanation ? `
            <div class="explanation">
              <strong>Explanation:</strong> ${item.explanation}
            </div>
          ` : ''}
          <div class="marks">
            <strong>Marks:</strong> ${item.marksAllocation.fullMarks}
          </div>
          ${item.teacherNotes ? `
            <div class="teacher-notes">
              <em>${item.teacherNotes}</em>
            </div>
          ` : ''}
        </div>
      `).join('')}
      <div class="summary">
        <p>Total Marks: ${answerKey.totalMarks}</p>
        <p>Estimated Marking Time: ${answerKey.estimatedTimeToMark}</p>
      </div>
    </div>
  `;
}
```

### 7. Layout Testing

**`tests/integration/pdf-layout.test.ts`**:

```ts
describe('PDF Layout', () => {
  it('generates valid HTML for worksheet', () => {
    const doc = fixtures.sampleWorksheet;
    const html = generateWorksheetHTML(doc.contentJson, {});
    
    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('<style>');
    expect(html).toContain(doc.title);
  });
  
  it('includes answer key when requested', () => {
    const doc = fixtures.sampleWorksheet;
    const htmlWithKey = generateWorksheetHTML(doc.contentJson, { includeAnswerKey: true });
    const htmlWithoutKey = generateWorksheetHTML(doc.contentJson, { includeAnswerKey: false });
    
    expect(htmlWithKey).toContain('Answer Key');
    expect(htmlWithoutKey).not.toContain('Answer Key');
  });
  
  it('generates PDF without errors', async () => {
    const doc = fixtures.sampleWorksheet;
    const html = generateWorksheetHTML(doc.contentJson, {});
    const pdf = await generatePDF(html, 'test.pdf');
    
    expect(pdf).toBeInstanceOf(Buffer);
    expect(pdf.length).toBeGreaterThan(1000);
  });
  
  it('page breaks avoid orphaned questions', () => {
    const questions = Array.from({ length: 50 }, (_, i) => ({
      ...fixtures.sampleQuestion,
      id: `q${i}`,
    }));
    
    const withBreaks = insertPageBreaks(questions);
    expect(withBreaks).toContain({ type: 'page_break' });
  });
});
```

### 8. E2E Test

**`tests/e2e/pdf-export.spec.ts`**:

```
1. Login
2. Go to worksheet
3. Click "Preview"
4. Verify A4 layout appears
5. Toggle "Include Answer Key"
6. Verify answer key appears/disappears
7. Change orientation to Landscape
8. Click "Download PDF"
9. Verify PDF file downloaded
10. Verify PDF opens (can be viewed)
```

### 9. Storage Setup

**Docker**: MinIO already configured (port 9000)

**Local Development**: Files stored in `./uploads/worksheets/`

**Production**: S3-compatible bucket (R2, DigitalOcean Spaces, etc.)

### 10. API Updates

**Existing routes**:
- `GET /api/worksheets/{id}` — Fetch document

**New routes**:
- `POST /api/worksheets/{id}/export/pdf` — Generate & save PDF
- `GET /api/worksheets/{id}/download` — Redirect to PDF URL

### What NOT to Do

- ❌ Do NOT use external CDN for CSS (inline everything)
- ❌ Do NOT add watermarks or digital signatures yet
- ❌ Do NOT implement DOCX export (Phase X)
- ❌ Do NOT add batch exports (Phase X)
- ❌ Do NOT implement collaborative editing markup
- ❌ Do NOT use browser's canvas API (use Playwright)
- ❌ Do NOT save PDF in database (use storage only)

## Steps to Execute

### 1. HTML Generation
- Create worksheet-html.ts with CSS
- Test HTML generation with fixtures

### 2. PDF Service
- Implement generatePDF() using Playwright
- Test with sample HTML

### 3. API Route
- Create `/api/worksheets/{id}/export/pdf`
- Save PDF to storage
- Return download URL

### 4. Preview Page
- Create preview UI
- Show live preview in iframe
- Add controls (answer key toggle, orientation)

### 5. Page Break Logic
- Implement insertPageBreaks()
- Test with 50-question worksheet

### 6. Answer Key Rendering
- Create answer key HTML
- Test with sample answer keys

### 7. Storage Integration
- Implement file upload to MinIO/local
- Test retrieval

### 8. Testing
- Unit tests (HTML generation, page breaks)
- Integration tests (PDF generation, storage)
- E2E test (full export flow)

### 9. Build & Verify
- Tests pass, > 80% coverage
- CI/CD green
- PDF quality visually acceptable

## Validation Checklist

- [ ] Preview page loads
- [ ] A4 layout displays correctly
- [ ] Answer key toggle works
- [ ] Orientation selector works
- [ ] Print button opens print dialog
- [ ] Export button generates PDF
- [ ] PDF file downloads successfully
- [ ] PDF opens in reader
- [ ] Marks are visible and aligned
- [ ] Page numbers appear in footer
- [ ] School name appears in header
- [ ] Questions don't split across pages (orphans avoided)
- [ ] Answer key is on separate page
- [ ] No layout shift on print
- [ ] Tests pass, > 80% coverage
- [ ] No secrets in logs
- [ ] CI/CD green

## Exit Criteria (Phase 3 DONE when)

1. ✅ All acceptance criteria met
2. ✅ Teacher can preview worksheet in A4 format
3. ✅ PDF exports cleanly and is print-ready
4. ✅ Answer key formats correctly
5. ✅ Page breaks avoid orphans
6. ✅ Storage integration works (MinIO + local)
7. ✅ PDF file downloaded successfully
8. ✅ Tests pass, > 80% coverage
9. ✅ PR merged to `develop`, CI green

---

**CRITICAL**: Follow UNIVERSAL_PROMPT_LAWS.md. Playwright must handle all PDF generation (not browser canvas).

**EXECUTE WITHOUT ASKING.**
