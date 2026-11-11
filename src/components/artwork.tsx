"use client";

import { Disc3 } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

import { cn } from "@/lib/utils";

type ArtworkProps = {
  src?: string | undefined;
  alt: string;
  className?: string;
  priority?: boolean;
};

export function Artwork({ src, alt, className, priority }: ArtworkProps) {
  const [failed, setFailed] = useState(false);

  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden bg-[#28231f] shadow-[0_28px_60px_rgba(0,0,0,0.3)]",
        className,
      )}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={alt}
          fill
          {...(priority ? { priority: true } : {})}
          sizes="(max-width: 640px) 80vw, (max-width: 1100px) 40vw, 320px"
          className="object-cover"
          onError={() => setFailed(true)}
          unoptimized={src.startsWith("https://coverartarchive.org")}
        />
      ) : (
        <div className="vinyl-grooves absolute inset-0 grid place-items-center text-[var(--brass)]/70">
          <Disc3 className="size-1/3" strokeWidth={1} aria-hidden="true" />
          <span className="sr-only">No cover artwork available</span>
        </div>
      )}
    </div>
  );
}
