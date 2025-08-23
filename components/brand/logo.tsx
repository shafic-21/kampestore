import Image from "next/image";
import { cn } from "../../lib/utils";

export const Logo = ({
  className,
  src="/logo.svg"
}: {
  className?: string;
  src?: string;
}) => {
  return (
    <Image
      src={src}
      alt="logo"
      width={200}
      height={200}
      className={cn("w-auto h-10 object-contain", className)}
    />
  );
};
