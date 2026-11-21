import Link from "next/link";
import { Logo } from "./Logo";
export function PublicHeader() {
  return (
    <header className="max-w-5xl mx-auto px-5 py-5 flex items-center justify-between">
      <Link href="/"><Logo /></Link>
      <nav className="flex gap-1 text-sm"><Link className="btn btn-quiet" href="/method">How it works</Link><Link className="btn btn-quiet" href="/stories">Switch stories</Link><Link className="btn btn-ghost" href="/app">Workspace</Link></nav>
    </header>
  );
}
