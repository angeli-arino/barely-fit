const DATABASE_NAME = 'barely-fit';
const DATABASE_VERSION = 1;
const STATE_STORE = 'member-state';
const OUTBOX_STORE = 'outbox';

interface StoredMemberState<T> {
  memberId: string;
  value: T;
  updatedAt: string;
}

interface OutboxEntry<T> {
  id: string;
  memberId: string;
  kind: 'state-snapshot';
  payload: T;
  createdAt: string;
}

export interface PersistedStateSnapshot<T> {
  value: Partial<T>;
  updatedAt: string;
  pending: boolean;
}

function openDatabase() {
  return new Promise<IDBDatabase>((resolve, reject) => {
    const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STATE_STORE)) database.createObjectStore(STATE_STORE, { keyPath: 'memberId' });
      if (!database.objectStoreNames.contains(OUTBOX_STORE)) database.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function loadPersistedState<T>(memberId: string): Promise<Partial<T> | undefined> {
  return (await loadPersistedStateSnapshot<T>(memberId))?.value;
}

export async function loadPersistedStateSnapshot<T>(memberId: string): Promise<PersistedStateSnapshot<T> | undefined> {
  const database = await openDatabase();
  const result = await new Promise<{ stored?: StoredMemberState<T>; pending?: OutboxEntry<T> }>((resolve, reject) => {
    const transaction = database.transaction([STATE_STORE, OUTBOX_STORE], 'readonly');
    const storedRequest = transaction.objectStore(STATE_STORE).get(memberId);
    const outboxRequest = transaction.objectStore(OUTBOX_STORE).get(`pending-state-${memberId}`);
    transaction.oncomplete = () => resolve({
      stored: storedRequest.result as StoredMemberState<T> | undefined,
      pending: outboxRequest.result as OutboxEntry<T> | undefined,
    });
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
  return result.stored ? { value: result.stored.value, updatedAt: result.stored.updatedAt, pending: Boolean(result.pending) } : undefined;
}

let writeQueue: Promise<unknown> = Promise.resolve();

async function writePersistedState<T>(memberId: string, value: T, queueForSync: boolean) {
  const database = await openDatabase();
  const updatedAt = new Date().toISOString();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction([STATE_STORE, OUTBOX_STORE], 'readwrite');
    transaction.objectStore(STATE_STORE).put({ memberId, value, updatedAt } satisfies StoredMemberState<T>);
    if (queueForSync) {
      transaction.objectStore(OUTBOX_STORE).put({
        id: `pending-state-${memberId}`,
        memberId,
        kind: 'state-snapshot',
        payload: value,
        createdAt: updatedAt,
      } satisfies OutboxEntry<T>);
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
    transaction.onabort = () => reject(transaction.error);
  });
  database.close();
  return updatedAt;
}

export function savePersistedState<T>(memberId: string, value: T, queueForSync: boolean) {
  const write = writeQueue.then(() => writePersistedState(memberId, value, queueForSync));
  writeQueue = write.catch(() => undefined);
  return write;
}

export async function clearPersistedOutbox(memberId: string, expectedCreatedAt: string) {
  const database = await openDatabase();
  await new Promise<void>((resolve, reject) => {
    const transaction = database.transaction(OUTBOX_STORE, 'readwrite');
    const store = transaction.objectStore(OUTBOX_STORE);
    const request = store.get(`pending-state-${memberId}`);
    request.onsuccess = () => {
      const entry = request.result as OutboxEntry<unknown> | undefined;
      if (entry?.createdAt === expectedCreatedAt) store.delete(entry.id);
    };
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
  database.close();
}
