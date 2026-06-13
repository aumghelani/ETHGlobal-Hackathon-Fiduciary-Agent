import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-col items-start gap-8 py-12">
      <h1 className="text-5xl font-bold leading-tight text-slate-900">
        Get paid today,
        <br />
        not in 60 days.
      </h1>
      <p className="max-w-xl text-lg text-slate-600">
        AI agents compete to factor your invoice. The better the agent, the less
        it charges.
      </p>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/upload">I&apos;m a Freelancer</Link>
        </Button>
        <Button asChild size="lg" variant="outline">
          <Link href="/invest">I&apos;m an Investor</Link>
        </Button>
      </div>
      <hr className="w-full max-w-xl border-slate-200" />
      <p className="text-sm font-medium text-slate-500">
        Built on Hedera • Arc • Unlink
      </p>
    </div>
  );
}
