import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { storage } from '../firebase'

/**
 * 로컬 URI(파일/blob)를 Firebase Storage에 업로드하고 다운로드 URL 반환
 * 이미 https URL이면 그대로 반환 (재업로드 방지)
 */
export async function uploadPhoto(uri: string, storagePath: string): Promise<string> {
  if (uri.startsWith('https://')) return uri
  const response = await fetch(uri)
  const blob = await response.blob()
  const storageRef = ref(storage, storagePath)
  await uploadBytes(storageRef, blob)
  return getDownloadURL(storageRef)
}
