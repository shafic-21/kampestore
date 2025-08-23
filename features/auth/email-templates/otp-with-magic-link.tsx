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
  otp: string;
};

export const OTPWithMagicLinkEmail = ({ otp }: Props) => {
  return (
    <Html>
          <Tailwind>
            <Head />
            <Preview>Your 6-digit verification code</Preview>
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
                    Your Verification Code
                  </Heading>

                  <Text className="text-[#1B1B1b] text-[16px] my-[24px] mb-[14px] font-medium">
                    Enter this 6-digit verification code to complete your login:
                  </Text>

                  <div className="inline-block py-[20px] px-[6%] w-[88%] bg-[#f8f9fa] rounded-[8px] border border-solid border-[#e9ecef] text-[#1B1B1b] font-mono text-[32px] font-bold text-center tracking-[8px] mb-[24px]">
                    {otp}
                  </div>

                  <Text className="text-[#6c757d] text-[13px] my-[16px] mb-[32px] text-center">
                    This code will expire in 5 minutes
                  </Text>

                  <Text className="text-[#ababab] text-[14px] my-[24px] mt-[14px] mb-[16px]">
                    If you didn't try to login, you can safely ignore this email.
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

