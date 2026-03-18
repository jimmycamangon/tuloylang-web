const links = [
  { label: "Features", href: "#features" },
  { label: "GitHub", href: "https://github.com/jimmycamangon" },
]

export default function NavigationPage() {
  return (
    <nav className="w-full bg-white">
      <div className="mx-auto flex items-center gap-4 px-8 py-4">
        
        {/* Logo */}
        <a 
        href="/" 
        className="flex items-center"
        >
        <img 
            src="/TuloyLang-Logov2.png"  
            alt="LOGO" 
            className="h-8 w-auto object-contain"
        />
        </a>

        {/* Links */}
        <div className="flex items-center gap-4">
          {links.map((link) => (
            <div key={link.label} className="flex items-center gap-4">
              
              {/* Separator */}
              <span className="text-gray-300 select-none">|</span>

              {/* Link */}
              <a
                href={link.href}
                className="text-sm font-medium text-black hover:text-gray-600 transition"
              >
                {link.label}
              </a>

            </div>
          ))}
        </div>

      </div>
    </nav>
  )
}