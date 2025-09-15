import Link from "next/link";
import { auth } from "@/server/auth";
import { Logo } from "@/components/brand/logo";
import UserMenu from "@/components/navbar-components/user-menu";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { headers } from "next/headers";

// Navigation links array to be used in both desktop and mobile menus
const navigationLinks = [
  { href: "/", label: "Home", active: true },
  { href: "/products", label: "Products" },
  { href: "/how-it-works", label: "How It Works" },
  { href: "/pricing", label: "Pricing" },
];

export default async function Header() {
  const Headers = await headers();
  const session = await auth.api.getSession({
    headers: Headers,
  });
  const user = session?.user;

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Left side - Logo and Mobile Menu */}
          <div className="flex items-center gap-4">
            {/* Mobile menu trigger */}
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  className="group size-8 md:hidden"
                  variant="ghost"
                  size="icon"
                >
                  <svg
                    className="pointer-events-none"
                    width={16}
                    height={16}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M4 12L20 12"
                      className="origin-center -translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-x-0 group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[315deg]"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] group-aria-expanded:rotate-45"
                    />
                    <path
                      d="M4 12H20"
                      className="origin-center translate-y-[7px] transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] group-aria-expanded:translate-y-0 group-aria-expanded:rotate-[135deg]"
                    />
                  </svg>
                </Button>
              </PopoverTrigger>
              <PopoverContent align="start" className="w-44 p-1 md:hidden">
                <NavigationMenu className="max-w-none *:w-full">
                  <NavigationMenuList className="flex-col items-start gap-0">
                    {navigationLinks.map((link, index) => (
                      <NavigationMenuItem key={index} className="w-full">
                        <NavigationMenuLink
                          href={link.href}
                          className="py-2.5 px-3 w-full justify-start"
                          active={link.active}
                        >
                          {link.label}
                        </NavigationMenuLink>
                      </NavigationMenuItem>
                    ))}
                  </NavigationMenuList>
                </NavigationMenu>
              </PopoverContent>
            </Popover>

            {/* Logo */}
            <Link
              href="/"
              className="flex items-center hover:opacity-80 transition-opacity"
            >
              <Logo className="h-6" src="/logo/logo-mark-primary.svg" />
              <span className="text-base font-semibold ml-1">Kampe</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-6">
              {navigationLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.href}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right side - Auth or User Menu */}
          <div className="flex items-center gap-3">
            {user ? (
              <UserMenu
                user={{
                  id: user.id,
                  name: user.name,
                  email: user.email,
                  image: user.image || undefined,
                }}
              />
            ) : (
              <div className="flex items-center gap-3">
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/register">
                  <Button size="sm">Start Selling</Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
