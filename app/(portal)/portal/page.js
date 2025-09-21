/**
 * Portal Redirect Page
 * 
 * Redirects users to the main dashboard page.
 * This maintains backward compatibility for the /portal route.
 */

import { redirect } from 'next/navigation'

export default function PortalPage() {
  // Redirect to the main dashboard
  redirect('/dashboard')
}