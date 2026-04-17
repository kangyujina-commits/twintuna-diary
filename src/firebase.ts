import { initializeApp } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyDYyrhwTQiYvPTELm6wy1Nj_psVlSkidz8',
  authDomain: 'twintuna-diary.firebaseapp.com',
  projectId: 'twintuna-diary',
  storageBucket: 'twintuna-diary.firebasestorage.app',
  messagingSenderId: '909367084937',
  appId: '1:909367084937:web:3ea0bc28517d911c580358',
}

const app = initializeApp(firebaseConfig)
export const db = getFirestore(app)
