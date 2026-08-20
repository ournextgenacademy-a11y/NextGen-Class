import { Question, QuestionType, QuestionOption } from '../types';

export interface QuestionUploadRow {
  rowNumber: number;
  questionId: string;
  prompt: string;
  type: QuestionType | string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  marks: number | string;
  category?: string;
  context?: string;
  errors: string[];
  isValid: boolean;
}

export interface BulkUploadParseResult {
  totalRows: number;
  validRows: QuestionUploadRow[];
  errorRows: QuestionUploadRow[];
  allRows: QuestionUploadRow[];
  parsedQuestions: Question[];
}

/**
 * Standard CSV row parser supporting quoted strings and commas
 */
function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cell = '';
  let inQuotes = false;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cell += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if ((char === ',' || char === '\t' || char === ';') && !inQuotes) {
      result.push(cell.trim());
      cell = '';
    } else {
      cell += char;
    }
  }
  result.push(cell.trim());
  return result;
}

/**
 * Normalize question type from various user input formats
 */
export function normalizeQuestionType(typeStr: string): QuestionType | null {
  const clean = (typeStr || '').toLowerCase().trim().replace(/[\s-_]/g, '');
  
  if (['singlechoice', 'single', 'radio', 'sc', 'mcqsingle'].includes(clean)) {
    return 'single_choice';
  }
  if (['multiplechoice', 'multiple', 'multichoice', 'checkbox', 'mcq', 'mc', 'multiselect'].includes(clean)) {
    return 'multiple_choice';
  }
  if (['truefalse', 'tf', 'boolean', 'true_false', 'true/false'].includes(clean)) {
    return 'true_false';
  }
  if (['shortanswer', 'short', 'text', 'input', 'string', 'short_answer'].includes(clean)) {
    return 'short_answer';
  }
  if (['longanswer', 'long', 'essay', 'paragraph', 'textarea', 'long_answer', 'open_text'].includes(clean)) {
    return 'long_answer';
  }
  
  return null;
}

/**
 * Parse and validate Question CSV/XLSX text
 */
export function parseQuestionBulkCSV(
  csvContent: string, 
  existingQuestionIds: string[] = []
): BulkUploadParseResult {
  const rawLines = csvContent.split(/\r?\n/).filter(line => line.trim().length > 0);
  
  if (rawLines.length === 0) {
    return {
      totalRows: 0,
      validRows: [],
      errorRows: [],
      allRows: [],
      parsedQuestions: [],
    };
  }

  // Parse header line
  const headerLine = rawLines[0];
  const headers = parseCSVLine(headerLine).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));
  
  // Find column indices
  const idIdx = headers.findIndex(h => h.includes('id') || h.includes('code') || h.includes('num'));
  const promptIdx = headers.findIndex(h => h.includes('question') || h.includes('prompt') || h.includes('title'));
  const typeIdx = headers.findIndex(h => h.includes('type') || h.includes('format'));
  const optAIdx = headers.findIndex(h => h === 'optiona' || h === 'opta' || h === 'a' || h.includes('opt1'));
  const optBIdx = headers.findIndex(h => h === 'optionb' || h === 'optb' || h === 'b' || h.includes('opt2'));
  const optCIdx = headers.findIndex(h => h === 'optionc' || h === 'optc' || h === 'c' || h.includes('opt3'));
  const optDIdx = headers.findIndex(h => h === 'optiond' || h === 'optd' || h === 'd' || h.includes('opt4'));
  const correctIdx = headers.findIndex(h => h.includes('correct') || h.includes('answer') || h.includes('key'));
  const marksIdx = headers.findIndex(h => h.includes('mark') || h.includes('point') || h.includes('score'));
  const catIdx = headers.findIndex(h => h.includes('cat') || h.includes('topic') || h.includes('domain'));

  const seenIdsInBatch = new Set<string>();
  const allRows: QuestionUploadRow[] = [];
  const parsedQuestions: Question[] = [];

  for (let i = 1; i < rawLines.length; i++) {
    const rawLine = rawLines[i].trim();
    if (!rawLine) continue;

    const cols = parseCSVLine(rawLine);
    const rowErrors: string[] = [];

    const rawId = (idIdx !== -1 && cols[idIdx]) ? cols[idIdx].trim() : `Q${i}`;
    const rawPrompt = (promptIdx !== -1 && cols[promptIdx]) ? cols[promptIdx].trim() : (cols[1] || '');
    const rawType = (typeIdx !== -1 && cols[typeIdx]) ? cols[typeIdx].trim() : (cols[2] || 'single_choice');
    const optA = (optAIdx !== -1 && cols[optAIdx]) ? cols[optAIdx].trim() : (cols[3] || '');
    const optB = (optBIdx !== -1 && cols[optBIdx]) ? cols[optBIdx].trim() : (cols[4] || '');
    const optC = (optCIdx !== -1 && cols[optCIdx]) ? cols[optCIdx].trim() : (cols[5] || '');
    const optD = (optDIdx !== -1 && cols[optDIdx]) ? cols[optDIdx].trim() : (cols[6] || '');
    const rawCorrect = (correctIdx !== -1 && cols[correctIdx]) ? cols[correctIdx].trim() : (cols[7] || '');
    const rawMarks = (marksIdx !== -1 && cols[marksIdx]) ? cols[marksIdx].trim() : (cols[8] || '10');
    const category = (catIdx !== -1 && cols[catIdx]) ? cols[catIdx].trim() : 'General Aptitude';

    // 1. Validate Question ID
    if (!rawId) {
      rowErrors.push('Missing Question ID');
    } else if (seenIdsInBatch.has(rawId.toLowerCase())) {
      rowErrors.push(`Duplicate Question ID in CSV ("${rawId}")`);
    } else if (existingQuestionIds.some(eid => eid.toLowerCase() === rawId.toLowerCase())) {
      rowErrors.push(`Question ID already exists in assessment ("${rawId}")`);
    } else {
      seenIdsInBatch.add(rawId.toLowerCase());
    }

    // 2. Validate Question Prompt
    if (!rawPrompt || rawPrompt.length < 3) {
      rowErrors.push('Missing or too short question prompt (minimum 3 characters)');
    }

    // 3. Validate Type
    const normType = normalizeQuestionType(rawType);
    if (!normType) {
      rowErrors.push(`Invalid type "${rawType}". Allowed: single_choice, multiple_choice, true_false, short_answer, long_answer`);
    }

    // 4. Validate Marks
    const marksNum = parseFloat(rawMarks);
    if (isNaN(marksNum) || marksNum <= 0) {
      rowErrors.push(`Invalid marks "${rawMarks}". Must be a positive number greater than 0.`);
    }

    // 5. Validate Options & Correct Answer based on type
    const options: QuestionOption[] = [];
    let formattedCorrectAnswer: string | string[] = rawCorrect;

    if (normType === 'single_choice' || normType === 'multiple_choice') {
      const optionPool: { id: string; label: string }[] = [];
      if (optA) optionPool.push({ id: 'A', label: optA });
      if (optB) optionPool.push({ id: 'B', label: optB });
      if (optC) optionPool.push({ id: 'C', label: optC });
      if (optD) optionPool.push({ id: 'D', label: optD });

      if (optionPool.length < 2) {
        rowErrors.push(`Choice questions must have at least 2 non-empty options (found ${optionPool.length})`);
      }

      if (!rawCorrect) {
        rowErrors.push('Missing correct answer for choice question');
      } else {
        // Parse correct answer (e.g. 'A', 'A,B', 'Option A', 'B;C')
        const splitAnswers = rawCorrect
          .toUpperCase()
          .replace(/OPTION/g, '')
          .split(/[,;&|\s]+/)
          .map(s => s.trim())
          .filter(Boolean);

        if (splitAnswers.length === 0) {
          rowErrors.push(`Invalid correct answer format "${rawCorrect}"`);
        } else {
          // Check if each referenced option exists
          const invalidOptionRefs = splitAnswers.filter(ansKey => {
            return !optionPool.some(opt => opt.id === ansKey || opt.label.toUpperCase() === ansKey);
          });

          if (invalidOptionRefs.length > 0) {
            rowErrors.push(`Invalid option reference in correct answer: [${invalidOptionRefs.join(', ')}] does not match any provided options`);
          }

          if (normType === 'single_choice') {
            formattedCorrectAnswer = splitAnswers[0];
            options.push(...optionPool.map(o => ({
              ...o,
              isCorrect: o.id === splitAnswers[0] || o.label.toUpperCase() === splitAnswers[0],
            })));
          } else {
            formattedCorrectAnswer = splitAnswers;
            options.push(...optionPool.map(o => ({
              ...o,
              isCorrect: splitAnswers.includes(o.id) || splitAnswers.includes(o.label.toUpperCase()),
            })));
          }
        }
      }
    } else if (normType === 'true_false') {
      options.push(
        { id: 'True', label: 'True', isCorrect: rawCorrect.toLowerCase().startsWith('t') || rawCorrect === '1' },
        { id: 'False', label: 'False', isCorrect: rawCorrect.toLowerCase().startsWith('f') || rawCorrect === '0' }
      );

      if (!rawCorrect) {
        rowErrors.push('Missing correct answer for True/False question (must be True or False)');
      } else {
        const isTrue = rawCorrect.toLowerCase().startsWith('t') || rawCorrect === '1';
        const isFalse = rawCorrect.toLowerCase().startsWith('f') || rawCorrect === '0';
        if (!isTrue && !isFalse) {
          rowErrors.push(`Invalid correct answer "${rawCorrect}" for True/False question. Must be "True" or "False".`);
        } else {
          formattedCorrectAnswer = isTrue ? 'True' : 'False';
        }
      }
    } else if (normType === 'short_answer') {
      // Short answer can have text key
      formattedCorrectAnswer = rawCorrect;
    } else if (normType === 'long_answer') {
      // Long answer is open-ended
      formattedCorrectAnswer = rawCorrect || 'Subjective / Rubric Evaluation';
    }

    const isValid = rowErrors.length === 0;

    const rowObj: QuestionUploadRow = {
      rowNumber: i + 1,
      questionId: rawId,
      prompt: rawPrompt,
      type: normType || rawType,
      optionA: optA,
      optionB: optB,
      optionC: optC,
      optionD: optD,
      correctAnswer: Array.isArray(formattedCorrectAnswer) ? formattedCorrectAnswer.join(', ') : formattedCorrectAnswer,
      marks: isNaN(marksNum) ? rawMarks : marksNum,
      category,
      errors: rowErrors,
      isValid,
    };

    allRows.push(rowObj);

    if (isValid && normType) {
      parsedQuestions.push({
        id: rawId,
        type: normType,
        prompt: rawPrompt,
        options: options.length > 0 ? options : undefined,
        correctAnswer: formattedCorrectAnswer,
        points: Number(marksNum),
        category,
        displayOrder: parsedQuestions.length + 1,
      });
    }
  }

  const validRows = allRows.filter(r => r.isValid);
  const errorRows = allRows.filter(r => !r.isValid);

  return {
    totalRows: allRows.length,
    validRows,
    errorRows,
    allRows,
    parsedQuestions,
  };
}

/**
 * Generate standard CSV template for download
 */
export function generateQuestionCSVTemplate(): string {
  const header = 'Question ID,Question,Type,Option A,Option B,Option C,Option D,Correct Answer,Marks,Category';
  const sampleRows = [
    'Q1,"In RAG systems, what is the role of Vector Embeddings?",single_choice,"Compress audio","Represent text as mathematical vectors for semantic similarity","Fine-tune LLM weights","Encrypt HTTP headers",B,10,"AI & Automation Concepts"',
    'Q2,"Which techniques mitigate model hallucinations in production?",multiple_choice,"Grounding with verified context (RAG)","Structured JSON schema enforcement","Increase temperature to 2.0","Few-shot calibrated examples","A, B, D",15,"AI & Automation Concepts"',
    'Q3,"A temperature setting of 0.0 results in deterministic greedy token selection.",true_false,,,,"True",10,"AI & Automation Concepts"',
    'Q4,"What Python data structure provides average O(1) lookup time?",short_answer,,,,"dict",10,"Technical Fundamentals"',
    'Q5,"Explain two data privacy safeguards when deploying healthcare AI agents.",long_answer,,,,"Include patient consent, HIPAA compliance, and de-identification",20,"Communication & Ethics"'
  ];

  return [header, ...sampleRows].join('\n');
}

/**
 * Download sample CSV file to client browser
 */
export function downloadSampleAssessmentCSV(): void {
  const content = generateQuestionCSVTemplate();
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', 'NextGen_Assessment_Questions_Template.csv');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
