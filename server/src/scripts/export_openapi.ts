import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { swaggerDocument } from '../docs/swaggerSpec.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const targetPath = path.resolve(__dirname, '../../../docs/openapi.json');
fs.writeFileSync(targetPath, JSON.stringify(swaggerDocument, null, 2), 'utf-8');
console.log(`[OpenAPI] Successfully generated: ${targetPath}`);
