import Image from "next/image";

export function AuthHeader() {
	return (
		<header className="w-full py-6 px-6 lg:px-8">
			<div className="flex justify-start">
				<Image
					src="/logo/full-logo-black.svg"
					alt="Kampe Logo"
					width={120}
					height={40}
					className="h-8 w-auto"
				/>
			</div>
		</header>
	);
}
