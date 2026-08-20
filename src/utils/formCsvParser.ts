import { ApplicationFormField, ApplicationFormSection, BulkUploadRow, BulkUploadValidationError, FormFieldType } from '../types';

export const FIELD_TYPE_LABELS: Record<FormFieldType, string> = {
  short_text: 'Short text',
  long_text: 'Long text',
  email: 'Email',
  phone: 'Phone',
  number: 'Number',
  date: 'Date',
  dropdown: 'Dropdown',
  radio: 'Radio',
  checkbox: 'Checkbox',
  multiple_choice: 'Multiple choice',
  file_upload: 'File upload',
  url: 'URL',
};

export const NORMALIZED_TYPE_MAP: Record<string, FormFieldType> = {
  // Short text
  'short text': 'short_text',
  'short_text': 'short_text',
  'shorttext': 'short_text',
  'text': 'short_text',
  'string': 'short_text',
  'single line': 'short_text',
  
  // Long text
  'long text': 'long_text',
  'long_text': 'long_text',
  'longtext': 'long_text',
  'textarea': 'long_text',
  'paragraph': 'long_text',
  'essay': 'long_text',
  
  // Email
  'email': 'email',
  'email address': 'email',
  
  // Phone
  'phone': 'phone',
  'phone number': 'phone',
  'telephone': 'phone',
  'tel': 'phone',
  'mobile': 'phone',
  
  // Number
  'number': 'number',
  'numeric': 'number',
  'integer': 'number',
  'decimal': 'number',
  
  // Date
  'date': 'date',
  'calendar': 'date',
  'dob': 'date',
  
  // Dropdown
  'dropdown': 'dropdown',
  'select': 'dropdown',
  'single select': 'dropdown',
  
  // Radio
  'radio': 'radio',
  'radio button': 'radio',
  'radio buttons': 'radio',
  'single choice': 'radio',
  
  // Checkbox
  'checkbox': 'checkbox',
  'check box': 'checkbox',
  'checkboxes': 'checkbox',
  'boolean': 'checkbox',
  'agreement': 'checkbox',
  
  // Multiple choice
  'multiple choice': 'multiple_choice',
  'multiple_choice': 'multiple_choice',
  'multiple choice questions': 'multiple_choice',
  'multi choice': 'multiple_choice',
  'multi select': 'multiple_choice',
  'multiple select': 'multiple_choice',
  'multiselect': 'multiple_choice',
  
  // File upload
  'file upload': 'file_upload',
  'file_upload': 'file_upload',
  'fileupload': 'file_upload',
  'file': 'file_upload',
  'upload': 'file_upload',
  'attachment': 'file_upload',
  'document': 'file_upload',
  
  // URL
  'url': 'url',
  'link': 'url',
  'website': 'url',
  'web link': 'url',
};

/**
 * Parses raw CSV or TSV string into structured rows with quotes and escape handling
 */
export function parseRawCsv(content: string): string[][] {
  const lines: string[][] = [];
  const cleanContent = content.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  
  let currentRow: string[] = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < cleanContent.length; i++) {
    const char = cleanContent[i];
    const nextChar = cleanContent[i + 1];
    
    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentField += '"';
        i++; // Skip the escaped quote
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',' || char === '\t') {
        currentRow.push(currentField.trim());
        currentField = '';
      } else if (char === '\n') {
        currentRow.push(currentField.trim());
        if (currentRow.some(c => c.length > 0)) {
          lines.push(currentRow);
        }
        currentRow = [];
        currentField = '';
      } else {
        currentField += char;
      }
    }
  }
  
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField.trim());
    if (currentRow.some(c => c.length > 0)) {
      lines.push(currentRow);
    }
  }
  
  return lines;
}

export interface CsvParseResult {
  validRows: BulkUploadRow[];
  errors: BulkUploadValidationError[];
  sectionsMap: Map<string, ApplicationFormField[]>;
}

/**
 * Validates and converts parsed CSV rows into typed form field definitions
 */
export function validateAndParseFormCsv(csvContent: string, targetFormId: string): CsvParseResult {
  const rows = parseRawCsv(csvContent);
  const errors: BulkUploadValidationError[] = [];
  const validRows: BulkUploadRow[] = [];
  
  if (rows.length === 0) {
    return {
      validRows: [],
      errors: [{ row: 0, column: 'File', message: 'The uploaded file is empty.' }],
      sectionsMap: new Map(),
    };
  }
  
  // Detect header row
  const headerRow = rows[0].map(h => h.toLowerCase().trim());
  const sectionIdx = headerRow.findIndex(h => h.includes('section'));
  const questionIdx = headerRow.findIndex(h => h.includes('question') || h.includes('label') || h.includes('field'));
  const typeIdx = headerRow.findIndex(h => h.includes('type'));
  const requiredIdx = headerRow.findIndex(h => h.includes('required') || h.includes('mandatory'));
  const optionsIdx = headerRow.findIndex(h => h.includes('option') || h.includes('choices') || h.includes('values'));
  const descIdx = headerRow.findIndex(h => h.includes('desc') || h.includes('help') || h.includes('hint'));
  
  // Mandatory header check
  if (questionIdx === -1) {
    errors.push({
      row: 1,
      column: 'Headers',
      message: 'Missing mandatory header: "Question" or "Label". Expected headers: Section, Question, Type, Required, Options, Description',
    });
  }
  
  if (typeIdx === -1) {
    errors.push({
      row: 1,
      column: 'Headers',
      message: 'Missing mandatory header: "Type". Expected headers: Section, Question, Type, Required, Options, Description',
    });
  }
  
  if (errors.length > 0) {
    return { validRows: [], errors, sectionsMap: new Map() };
  }
  
  // Process each data row
  for (let r = 1; r < rows.length; r++) {
    const row = rows[r];
    const rowNum = r + 1; // 1-based display for humans
    
    // Ignore completely empty rows
    if (row.every(col => !col || col.trim() === '')) {
      continue;
    }
    
    const sectionName = (sectionIdx !== -1 && row[sectionIdx]) ? row[sectionIdx].trim() : 'General Information';
    const questionText = (questionIdx !== -1 && row[questionIdx]) ? row[questionIdx].trim() : '';
    const rawType = (typeIdx !== -1 && row[typeIdx]) ? row[typeIdx].trim().toLowerCase() : '';
    const rawRequired = (requiredIdx !== -1 && row[requiredIdx]) ? row[requiredIdx].trim().toLowerCase() : 'false';
    const rawOptions = (optionsIdx !== -1 && row[optionsIdx]) ? row[optionsIdx].trim() : '';
    const descriptionText = (descIdx !== -1 && row[descIdx]) ? row[descIdx].trim() : undefined;
    
    // Validation 1: Question/Label must not be empty
    if (!questionText) {
      errors.push({
        row: rowNum,
        column: 'Question',
        message: 'Question / Field Label cannot be empty.',
      });
    }
    
    // Validation 2: Field Type must be recognized
    const normalizedType = NORMALIZED_TYPE_MAP[rawType];
    if (!normalizedType) {
      errors.push({
        row: rowNum,
        column: 'Type',
        message: `Unknown field type "${row[typeIdx] || ''}". Supported types: Short text, Long text, Email, Phone, Number, Date, Dropdown, Radio, Checkbox, Multiple choice, File upload, URL.`,
      });
    }
    
    // Validation 3: Parse options for choice types
    let parsedOptions: string[] = [];
    if (rawOptions) {
      // Split by semicolon, pipe, or comma
      parsedOptions = rawOptions
        .split(/;|\||\n/)
        .map(opt => opt.trim())
        .filter(opt => opt.length > 0);
      
      // If only 1 item and contains commas, split by comma
      if (parsedOptions.length === 1 && parsedOptions[0].includes(',')) {
        parsedOptions = parsedOptions[0].split(',').map(o => o.trim()).filter(o => o.length > 0);
      }
    }
    
    // Check if choice types have sufficient options
    const choiceTypes: FormFieldType[] = ['dropdown', 'radio', 'checkbox', 'multiple_choice'];
    if (normalizedType && choiceTypes.includes(normalizedType)) {
      if (parsedOptions.length < 2) {
        errors.push({
          row: rowNum,
          column: 'Options',
          message: `Field type "${FIELD_TYPE_LABELS[normalizedType]}" requires at least 2 options (separated by semicolons, e.g. "Option A; Option B; Option C").`,
        });
      }
    }
    
    // Parse required flag
    const isRequired = ['true', 'yes', '1', 'y', 'required'].includes(rawRequired);
    
    if (questionText && normalizedType) {
      validRows.push({
        section: sectionName || 'General Information',
        question: questionText,
        type: normalizedType,
        required: isRequired,
        options: parsedOptions,
        description: descriptionText,
        rowNumber: rowNum,
      });
    }
  }
  
  // Group valid rows by Section
  const sectionsMap = new Map<string, ApplicationFormField[]>();
  
  validRows.forEach((item, index) => {
    if (!sectionsMap.has(item.section)) {
      sectionsMap.set(item.section, []);
    }
    
    const field: ApplicationFormField = {
      id: `fld-imported-${Date.now()}-${index}`,
      formId: targetFormId,
      sectionId: '', // Will be assigned during integration
      fieldType: item.type as FormFieldType,
      label: item.question,
      description: item.description,
      required: item.required,
      options: item.options.length > 0 ? item.options : undefined,
      placeholder: item.type === 'short_text' || item.type === 'email' || item.type === 'phone' || item.type === 'url' ? `Enter ${item.question.toLowerCase()}...` : undefined,
      displayOrder: (sectionsMap.get(item.section)?.length || 0) + 1,
    };
    
    sectionsMap.get(item.section)!.push(field);
  });
  
  return {
    validRows,
    errors,
    sectionsMap,
  };
}

/**
 * Standard CSV Template for Program Managers to download or copy
 */
export const SAMPLE_FORM_CSV = `Section,Question,Type,Required,Options,Description
Personal Details,Full Legal Name,Short text,true,,Enter your name as shown on official identification
Personal Details,Primary Email Address,Email,true,,Official email for admissions notifications
Personal Details,Phone Number (WhatsApp),Phone,true,,Include country code (+234 / +254 / +44)
Personal Details,Date of Birth,Date,true,,Must be at least 18 years of age
Background & Experience,Highest Level of Education,Dropdown,true,High School; Associate Degree; Bachelor Degree; Master Degree; Doctorate; Self-Taught,Select your highest educational qualification
Background & Experience,Years of Software Experience,Number,true,,Enter 0 if complete beginner
Background & Experience,Primary Tech Stack & Tools,Multiple choice,true,Python; TypeScript; React; Node.js; SQL; Docker; AWS / GCP; PyTorch,Select all technologies you are proficient in
Background & Experience,Describe a technical challenge you solved,Long text,true,,Explain your thought process and solution
Profiles & Documents,GitHub or Portfolio URL,URL,false,,Link to your repositories or website
Profiles & Documents,Upload Updated CV / Resume,File upload,true,,Upload PDF format (Max 5MB)
Commitment,Academy Code of Conduct Agreement,Checkbox,true,I agree to attend scheduled sessions and uphold academic integrity; I commit 15+ hours weekly,Confirm your commitment to the cohort`;
