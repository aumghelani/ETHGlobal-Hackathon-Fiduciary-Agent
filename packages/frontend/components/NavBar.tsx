import Link from "next/link";

export function NavBar() {
  return (
    <nav className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-primary">
          Fiduciary
        </Link>
        <div className="flex gap-6 text-sm font-medium text-slate-700">
          <Link href="/" className="hover:text-primary">
            Home
          </Link>
          <Link href="/upload" className="hover:text-primary">
            Upload
          </Link>
          <Link href="/invest" className="hover:text-primary">
            Invest
          </Link>
        </div>
      </div>
    </nav>
  );
}
