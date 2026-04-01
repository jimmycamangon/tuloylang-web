const links = [
  { label: "Features", href: "#features" },
  { label: "GitHub", href: "https://github.com/jimmycamangon" },
]

type NavigationPageProps = {
  showLinks?: boolean
}

export default function NavigationPage({ showLinks = true }: NavigationPageProps) {
  return (
    <nav className="w-full border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex items-center gap-4 px-8 py-4">
        
        {/* Logo */}
        <a 
        href="/" 
        className="flex items-center"
        >
        <img 
            src="/TuloyLang-Logov2.png"  
            alt="LOGO" 
            className="h-8 w-auto object-contain dark:invert"
        />
        </a>

        {/* Links */}
        {showLinks && (
          <div className="flex items-center gap-4">
            {links.map((link) => (
              <div key={link.label} className="flex items-center gap-4">
                
                {/* Separator */}
                <span className="select-none text-muted-foreground/40">|</span>

                {/* Link */}
                <a
                  href={link.href}
                  className="text-sm font-medium text-foreground transition hover:text-muted-foreground"
                >
                  {link.label}
                </a>

              </div>
            ))}
          </div>
        )}

      </div>
    </nav>
  )
}
