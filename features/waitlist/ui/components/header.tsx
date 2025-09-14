import { Logo } from "@/components/brand/logo";

export function HeroHeader() {
	return (
		<header className="absolute inset-x-0 top-0 z-50">
			<nav className="flex items-center justify-between p-6 lg:px-8">
				<div className="flex lg:flex-1">
					<Logo />
				</div>
			</nav>
		</header>
	);
}
