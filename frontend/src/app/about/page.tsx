import { redirect } from 'next/navigation';

// /about redirects to /about/about-us
export default function AboutIndexPage() {
  redirect('/about/about-us');
}
