import { 
  collection, 
  addDoc, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  deleteDoc, 
  doc,
  updateDoc
} from 'firebase/firestore';
import { db, auth, getServerTimestamp, handleFirestoreError } from '../lib/firebase';

export type TransactionType = 'receita' | 'despesa' | 'investimento';

export interface Transaction {
  id?: string;
  description: string;
  amount: number;
  date: string; // ISO Date String
  dueDate: string; // ISO Date String
  type: TransactionType;
  userId: string;
  createdAt?: any;
}

const COLLECTION_NAME = 'transactions';

export function subscribeToTransactions(userId: string, callback: (transactions: Transaction[]) => void) {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('userId', '==', userId),
    orderBy('date', 'desc')
  );

  return onSnapshot(q, (snapshot) => {
    const transactions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Transaction[];
    callback(transactions);
  }, (error) => {
    handleFirestoreError(error, 'list', COLLECTION_NAME);
  });
}

export async function createTransaction(data: Omit<Transaction, 'id' | 'userId' | 'createdAt'>) {
  if (!auth.currentUser) throw new Error('User not authenticated');
  
  try {
    const docRef = await addDoc(collection(db, COLLECTION_NAME), {
      ...data,
      userId: auth.currentUser.uid,
      createdAt: getServerTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, 'create', COLLECTION_NAME);
  }
}

export async function deleteTransaction(id: string) {
  try {
    await deleteDoc(doc(db, COLLECTION_NAME, id));
  } catch (error) {
    handleFirestoreError(error, 'delete', `${COLLECTION_NAME}/${id}`);
  }
}
