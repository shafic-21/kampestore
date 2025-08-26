import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Package } from "lucide-react";
import Link from "next/link";

export function SampleBanner() {
  return (
    <div>
      <Card className="bg-accent border-none">
        <CardContent className="p-8 relative">
          {/* Decorative elements */}

          <div className="relative z-10 max-w-2xl">
            <div className="flex items-center gap-2 mb-4">
              <h2 className="text-2xl font-semibold">
                Want to see your product in action first? Order a Sample to Touch, Feel, and See!
              </h2>
            </div>

            <Link href="/creator/design-launcher">
              <Button size="lg" className="">
                Order a sample
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
