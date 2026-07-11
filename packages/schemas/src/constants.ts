/** Shared domain constants used across schemas, UI, and API validation. */

export const SUPPORTED_CURRICULA = ['CBSE', 'ICSE', 'IB', 'UAE', 'IGCSE'] as const;
export type Curriculum = (typeof SUPPORTED_CURRICULA)[number];

export const SUPPORTED_GRADES = [
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const;
export type Grade = (typeof SUPPORTED_GRADES)[number];

export const SUPPORTED_SUBJECTS = [
  'English',
  'Mathematics',
  'Science',
  'Social Studies',
  'EVS',
  'Hindi',
] as const;
export type Subject = (typeof SUPPORTED_SUBJECTS)[number];

export const DOCUMENT_STATUSES = ['DRAFT', 'GENERATING', 'READY', 'ARCHIVED'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
