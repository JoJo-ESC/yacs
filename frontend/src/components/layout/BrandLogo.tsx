import React from "react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  imageClassName?: string;
}

function BrandLogoImage({ imageClassName }: Pick<BrandLogoProps, "imageClassName">) {
  return (
    <>
      <img
        src="/logo/color-sticker.png"
        alt="YACS logo"
        className={cn("block h-10 w-auto dark:hidden", imageClassName)}
      />
      <img
        src="/logo/white-for-web.png"
        alt="YACS logo"
        className={cn("hidden h-10 w-auto dark:block", imageClassName)}
      />
    </>
  );
}

export function BrandLogo({ className, imageClassName }: BrandLogoProps) {
  return (
    <Link to="/" className={cn("inline-flex items-center", className)} aria-label="Go to YACS home">
      <BrandLogoImage imageClassName={imageClassName} />
    </Link>
  );
}
