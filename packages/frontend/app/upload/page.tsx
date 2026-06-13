import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export default function UploadPage() {
  return (
    <div className="mx-auto max-w-md">
      <h1 className="text-3xl font-bold text-slate-900">Get cash today</h1>
      <p className="mt-2 text-slate-600">
        Sell your unpaid invoice. We&apos;ll have offers in 30 seconds.
      </p>

      <div className="mt-6 flex flex-wrap gap-3">
        <VerifiedBadge label="Identity verified" source="World ID" />
        <VerifiedBadge label="Domain verified" source="DKIM proof" />
      </div>

      <form className="mt-8 space-y-5">
        <div className="space-y-2">
          <Label htmlFor="file">Upload invoice PDF or photo</Label>
          <Input id="file" type="file" accept="image/*,application/pdf" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="clientName">Client name</Label>
          <Input id="clientName" type="text" placeholder="BigCorp" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="amountUsd">Amount due</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              $
            </span>
            <Input
              id="amountUsd"
              type="number"
              placeholder="5000"
              className="pl-7"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="daysUntilDue">Days until payment</Label>
          <div className="relative">
            <Input id="daysUntilDue" type="number" defaultValue={60} className="pr-14" />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500">
              days
            </span>
          </div>
        </div>

        <Button type="submit" size="lg" className="w-full">
          Get offers
        </Button>

        <p className="text-center text-xs text-slate-400">
          Trusted by 70M+ freelancers
        </p>
      </form>
    </div>
  );
}
