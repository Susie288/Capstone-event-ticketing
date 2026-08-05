import { Ticket } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-border">
      <div className="container flex flex-col items-center justify-between gap-4 py-8 sm:flex-row">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <Ticket className="h-4 w-4" />
          <span>© 2026 Event Registration &amp; Ticketing System</span>
        </div>
        <p className="text-sm text-muted-foreground">Susie.dev</p>
      </div>
    </footer>
  );
}
