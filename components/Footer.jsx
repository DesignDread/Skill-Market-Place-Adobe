export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="mt-auto border-t border-border/70 bg-card/20 py-6">
      <div className="mx-auto flex w-full max-w-7xl flex-col items-center justify-between gap-4 px-5 text-xs text-muted-foreground md:flex-row md:px-10">
        <p>
          &copy; {currentYear} SkillIQ. Developed for Adobe University Hackathon 2026.
        </p>
        <div className="flex gap-6 font-medium">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
          <a href="https://github.com/DesignDread/Skill-Market-Place-Adobe" target="_blank" rel="noreferrer" className="hover:text-foreground transition-colors">GitHub</a>
        </div>
      </div>
    </footer>
  );
}
