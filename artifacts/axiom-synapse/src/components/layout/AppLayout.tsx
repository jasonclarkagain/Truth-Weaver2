import React from "react";
import { Link, useLocation } from "wouter";
import { CommandPalette } from "./CommandPalette";
import { ScanText, Database, RadioTower } from "lucide-react";

export function AppLayout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground font-sans selection:bg-primary/30 selection:text-primary">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="bg-primary text-primary-foreground p-1.5 group-hover:scale-105 transition-transform duration-300">
                <RadioTower className="w-5 h-5" />
              </div>
              <span className="font-mono tracking-tighter font-bold text-lg hidden sm:inline-block">
                AXIOM<span className="text-primary opacity-80">SYNAPSE</span>
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-mono tracking-widest text-muted-foreground uppercase">
              <Link href="/articles" className={`hover:text-primary transition-colors ${location === '/articles' ? 'text-primary' : ''}`}>
                Briefings
              </Link>
              <Link href="/search" className={`hover:text-primary transition-colors ${location === '/search' ? 'text-primary' : ''}`}>
                Database
              </Link>
              <Link href="/ingest" className={`hover:text-primary transition-colors flex items-center gap-2 ${location === '/ingest' ? 'text-primary' : ''}`}>
                <ScanText className="w-4 h-4" /> Ingest
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <CommandPalette />
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border/30 bg-card/50 py-12 mt-20">
        <div className="container mx-auto px-4 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary/20 text-primary p-1">
                <RadioTower className="w-4 h-4" />
              </div>
              <span className="font-mono tracking-tighter font-bold text-lg">
                AXIOM<span className="text-primary opacity-80">SYNAPSE</span>
              </span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-xs leading-relaxed font-serif">
              Surfacing suppressed science, deep geopolitical forensics, and cognitive research into cinematic long-form journalism.
            </p>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Protocol</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/articles" className="hover:text-foreground transition-colors">Briefings</Link></li>
              <li><Link href="/categories/esoteric-physics" className="hover:text-foreground transition-colors">Esoteric Physics</Link></li>
              <li><Link href="/categories/advanced-geopolitics" className="hover:text-foreground transition-colors">Advanced Geopolitics</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-mono text-xs uppercase tracking-widest text-primary mb-4">Operations</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/ingest" className="hover:text-foreground transition-colors">Ingest Console</Link></li>
              <li><Link href="/search" className="hover:text-foreground transition-colors">Database Search</Link></li>
            </ul>
          </div>
        </div>
        <div className="container mx-auto px-4 mt-12 pt-8 border-t border-border/20 text-xs text-muted-foreground flex justify-between font-mono">
          <span>&copy; {new Date().getFullYear()} AXIOM SYNAPSE. RESTRICTED ACCESS.</span>
          <span>SYS.OP.ACTIVE</span>
        </div>
      </footer>
    </div>
  );
}