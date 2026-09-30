import { createSourceImportWorkerService } from './sourceImportWorkerService';
import type { ImportWorkerRequest } from './sourceImportWorkerProtocol';

const handle = createSourceImportWorkerService();
self.onmessage = async (event: MessageEvent<ImportWorkerRequest>) => {
  self.postMessage(await handle(event.data));
};
