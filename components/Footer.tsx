'use client';

export const Footer = () => {
  return (
    <footer className="w-full py-4 px-4 bg-background border-t border-border/40">
      <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
        <a
          href="https://www.onurgumus.com"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors duration-200"
        >
          onurgumus.com
        </a>
        <span>•</span>
        <a
          href="https://github.com/gumusonur/wedding-memories"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-primary transition-colors duration-200"
        >
          View on GitHub
        </a>
      </div>
    </footer>
  );
};
