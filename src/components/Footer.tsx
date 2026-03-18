const Footer = () => {
  return (
    <footer className="w-full px-6 py-6">
      <div className="mx-auto text-sm text-gray-500 flex gap-4">
        <span className="cursor-pointer hover:text-black">
          <a href="https://github.com/jimmycamangon">Github</a>
        </span>
        <span>|</span>
        <span className="cursor-pointer hover:text-black">Version v1.0.0</span>
        <span>|</span>
        <span className="cursor-pointer hover:text-black">Contact</span>
      </div>
    </footer>
  );
};

export default Footer;