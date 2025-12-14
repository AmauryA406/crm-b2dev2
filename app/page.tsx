import { redirect } from 'next/navigation';

export default function Home() {
  // Redirection vers la page de scraping (comme spécifié dans CLAUDE.md)
  redirect('/scraping');
}
