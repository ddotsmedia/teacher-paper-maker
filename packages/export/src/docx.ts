import { Document } from '@tpm/schemas';
import { ExportOptions } from './types';

export async function generateDocx(_doc: Document, _options: ExportOptions): Promise<Buffer> {
  throw new Error('DOCX generation not yet implemented');
}
