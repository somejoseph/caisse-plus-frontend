import { TOKEN_KEY } from './gql-client';

const BASE_URL = (() => {
  const envUrl = (import.meta as unknown as { env: Record<string, string> }).env.VITE_API_URL;
  if (envUrl) {
    const full = envUrl.startsWith('/') ? `${window.location.origin}${envUrl}` : envUrl;
    return full.replace(/\/graphql$/, '');
  }
  return window.location.origin;
})();

export async function uploadImage(file: File, folder: 'drinks' | 'logos'): Promise<string> {
  const token = localStorage.getItem(TOKEN_KEY);
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${BASE_URL}/upload?folder=caisse-plus/${folder}`, {
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
