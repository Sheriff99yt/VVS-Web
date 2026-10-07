import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { listNodeDocs } from '../src/lib/nodeDocCatalog';
import { NODE_DOC_GUIDES } from '../src/lib/nodeDocGuides';
const directory = join(import.meta.dir, '../public/docs/data');
mkdirSync(directory, { recursive: true });
for (const node of listNodeDocs()) {
  const guide = NODE_DOC_GUIDES[node.kindId];
  writeFileSync(join(directory, `${node.kindId}.json`), JSON.stringify({ schemaVersion: 1, ...node, guide }, null, 2) + '\n');
  writeFileSync(join(directory, `${node.kindId}.md`), `# ${node.title}\n\n${guide?.summary ?? `${node.title} (${node.kindId}): ${node.semantics}.`}\n\nStatus: ${node.status}. Registry listing does not certify every target or environment.\n\n${guide ? `${guide.use}\n\n${guide.example}\n\n${guide.note}\n\n` : ''}## Registry facts\n\n\`\`\`json\n${JSON.stringify({ inputs: node.inputs, outputs: node.outputs, options: node.options }, null, 2)}\n\`\`\`\n`);
}
