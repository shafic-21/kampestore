import { Button } from "@/components/ui/button";
import Link from "next/link";

export function AuthFooter() {
  return (
    <footer className="w-full py-6 px-6 lg:px-8">
      <div className="flex flex-col items-center space-y-4">
        <Button variant="ghost" size="sm">
          Help
        </Button>
        <div className="flex space-x-6 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground transition-colors">
            Terms of Service
          </Link>
          <Link href="/privacy" className="hover:text-foreground transition-colors">
            Privacy Policy
          </Link>
        </div>
      </div>
    </footer>
  );
}