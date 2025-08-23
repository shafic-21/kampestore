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
  loginCode: string;
  loginUrl: string;
};

export const MagicLinkEmail = ({ loginCode, loginUrl }: Props) => {
  return (
    <Html>
      <Head />
      <Preview>Log in with this magic link</Preview>
      <Tailwind>
        <Body className="bg-[#FCFCFc] font-sans">
          <Container className="px-[12px] mx-auto">
            <Heading className="text-[#1B1B1b] text-[24px] font-bold my-[40px] p-0">
              Login
            </Heading>
            <Link
              href={loginUrl}
              target="_blank"
              className="text-[#5ed285] text-[14px] underline block mb-[16px]"
            >
              Click here to log in with this magic link
            </Link>
            <Text className="text-[#1B1B1b] text-[14px] my-[24px] mb-[14px]">
              Or, copy and paste this temporary login code:
            </Text>
            <div className="inline-block py-[16px] px-[4.5%] w-[90.5%] bg-[#f4f4f4] rounded-[5px] border border-solid border-[#eee] text-[#1B1B1b] font-mono">
              {loginCode}
            </div>
            <Text className="text-[#ababab] text-[14px] my-[24px] mt-[14px] mb-[16px]">
              If you didn&apos;t try to login, you can safely ignore this email.
            </Text>
            <Text className="text-[#ababab] text-[14px] my-[24px] mt-[12px] mb-[38px]">
              Hint: You can set a permanent password in Settings & members → My
              account.
            </Text>
            <Img
              src="https://di867tnz6fwga.cloudfront.net/brand-kits/7fb84387-3e65-41a8-a615-b2fca8616cdc/primary/ffb486f8-22ed-4216-b81b-5adbc02e91a0.png"
              width="120"
              height="auto"
              alt="Kampe Logo"
              className="w-[120px] h-auto"
            />
            <Text className="text-[#898989] text-[12px] leading-[22px] mt-[12px] mb-[24px]">
              <Link
                href="https://www.kampestore.com"
                target="_blank"
                className="text-[#898989] underline"
              >
                Kampestore.com
              </Link>
              , the print-on-demand platform
              <br />
              for creators to design custom products and sell them online.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};
