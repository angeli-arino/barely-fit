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
  const database = await openDatabase();
  const stored = await new Promise<StoredMemberState<T> | undefined>((resolve, reject) => {
    const request = database.transaction(STATE_STORE, 'readonly').objectStore(STATE_STORE).get(memberId);
    request.onsuccess = () => resolve(request.result as StoredMemberState<T> | undefined);
    request.onerror = () => reject(request.error);
  });
  database.close();
  return stored?.value;
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
