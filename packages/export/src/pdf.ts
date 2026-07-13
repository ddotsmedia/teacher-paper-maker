import { Document } from '@tpm/schemas';
import { ExportOptions } from './types';

export async function generatePdf(_doc: Document, _options: ExportOptions): Promise<Buffer> {
  throw new Error('PDF generation not yet implemented');
}
