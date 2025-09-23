import {
	Body,
	Container,
	Head,
	Heading,
	Html,
	Img,
	Link,
	Preview,
	Text,
	Tailwind,
} from "@react-email/components";

type Props = {
	email: string;
};

export const WaitlistWelcomeEmail = ({ email }: Props) => {
	return (
		<Html>
			<Tailwind>
				<Head />
				<Preview>Welcome to the Kampe waitlist!</Preview>
				<Body className="bg-[#FCFCFc] font-sans py-[40px]">
					<Container className="px-[12px] mx-auto bg-white rounded-[8px] max-w-[600px]">
						<Img
							src="https://di867tnz6fwga.cloudfront.net/brand-kits/7fb84387-3e65-41a8-a615-b2fca8616cdc/primary/ffb486f8-22ed-4216-b81b-5adbc02e91a0.png"
							width="120"
							height="auto"
							alt="Kampe Logo"
							className="w-[120px] h-auto"
						/>
						<div className="p-[32px]">
							<Heading className="text-[#1B1B1b] text-[24px] font-bold my-[40px] p-0">
								Welcome to the Kampe Waitlist!
							</Heading>

							<Text className="text-[#1B1B1b] text-[16px] my-[24px] mb-[14px] font-medium">
								Hi there! 👋
							</Text>

							<Text className="text-[#1B1B1b] text-[16px] my-[24px] mb-[14px]">
								We're absolutely thrilled to have you join the Kampe waitlist! You're now part of an exclusive group of creative minds who will be the first to experience our print-on-demand platform designed specifically for Ugandan creators.
							</Text>

							<Text className="text-[#1B1B1b] text-[16px] my-[24px] mb-[14px]">
								As a waitlist member, you'll be among the very first to know when we launch. Get ready to turn your creative ideas into beautiful custom apparel and start building your brand with Kampe!
							</Text>

							<div className="inline-block py-[20px] px-[6%] w-[88%] bg-[#f8f9fa] rounded-[8px] border border-solid border-[#e9ecef] text-[#1B1B1b] text-[16px] text-center mb-[24px]">
								<Text className="font-bold text-[18px] text-[#8b5cf6] m-0">
									You'll be the first to know when we launch! 🚀
								</Text>
							</div>

							<Text className="text-[#6c757d] text-[14px] my-[16px] mb-[32px]">
								Keep an eye on your inbox - exciting updates are coming your way soon!
							</Text>

							<Text className="text-[#ababab] text-[14px] my-[24px] mt-[14px] mb-[16px]">
								Thanks for believing in African creativity and innovation. Together, we're building something amazing!
							</Text>

							<Text className="text-[#898989] text-[12px] leading-[22px] mt-[12px] mb-[24px] m-0">
								<Link
									href="https://www.kampestore.com"
									target="_blank"
									className="text-[#898989] underline"
								>
									Kampestore.com
								</Link>
								© 2025 Kampe - Uganda
							</Text>
						</div>
					</Container>
				</Body>
			</Tailwind>
		</Html>
	);
};