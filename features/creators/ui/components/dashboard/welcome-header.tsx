import type { CreatorProfile } from "@/features/creators/types";

interface WelcomeHeaderProps {
	creator: CreatorProfile;
}

export function WelcomeHeader({ creator }: WelcomeHeaderProps) {
	const getGreeting = () => {
		const hour = new Date().getHours();
		if (hour < 12) return "Good morning";
		if (hour < 17) return "Good afternoon";
		return "Good evening";
	};

	return (
		<div className="mb-8">
			<h1 className="text-3xl font-bold text-foreground mb-2">
				{getGreeting()}, {creator.firstName}!
			</h1>
			<p className="text-lg text-muted-foreground">
				Let's make today productive!
			</p>
		</div>
	);
}
