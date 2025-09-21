/**
 * Professional Footer component for Alumni Platform
 * Displays copyright notice with clean styling
 */

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-white border-t border-gray-200 py-6 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            © {currentYear} Department of Higher Education, Punjab. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  )
}