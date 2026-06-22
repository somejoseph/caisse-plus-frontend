import { API_BASE, TOKEN_KEY } from './gql-client';

export async function uploadImage(file: File, folder: 'drinks' | 'logos'): Promise<string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload?folder=caisse-plus/${folder}`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: formData,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error((err as { message?: string }).message ?? "Erreur lors de l'upload");
  }

  return ((await res.json()) as { url: string }).url;
}
