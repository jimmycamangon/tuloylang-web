const Footer = () => {
  return (
    <footer className="w-full border-t border-border px-6 py-6">
      <div className="mx-auto flex gap-4 text-sm text-muted-foreground">
        <span className="cursor-pointer transition hover:text-foreground">
          <a href="https://github.com/jimmycamangon">Github</a>
        </span>
        <span>|</span>
        <span className="cursor-pointer transition hover:text-foreground">
          Version v{__APP_VERSION__}
        </span>
        <span>|</span>
        <span className="cursor-pointer transition hover:text-foreground">Contact</span>
      </div>
    </footer>
  );
};

export default Footer;
