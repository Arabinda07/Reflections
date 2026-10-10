export { embeddingService } from './embeddingService';
export { vectorStore } from './vectorStore';
export { formatDocumentText, formatQueryText } from './asymmetricPrefixes';
export { truncateAndNormalizeVector, calculateStorageSavings, DEFAULT_MRL_DIM } from './mrl';
export { tierManager } from './tierManager';
export type {
  EmbeddingStatus,
  StoredNoteVector,
  EmbeddingWorkerRequest,
  EmbeddingWorkerResponse,
  EmbeddingModelTier,
  SupportedEmbeddingModel,
} from './embeddingTypes';
export {
  EMBEDDING_MODEL,
  EMBEDDING_DIM,
  TIER1_MODEL,
  TIER2_MODEL,
  TIER1_DIM,
  TIER2_RAW_DIM,
  TIER2_MRL_DIM,
} from './embeddingTypes';

