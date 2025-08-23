import Image from "next/image";
import { cn } from "../../lib/utils";

export const Logo = ({
  className,
  uniColor,
}: {
  className?: string;
  uniColor?: boolean;
}) => {
  return (
    <Image
      src="/logo.svg"
      alt="logo"
      width={200}
      height={200}
      className="w-auto h-10 object-contain"
    />
  );
};
