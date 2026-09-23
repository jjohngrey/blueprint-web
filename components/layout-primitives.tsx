import Image from "next/image";

type ImagePlaceholderProps = {
  label: string;
  ratio?: string;
  caption?: string;
  src?: string;
  objectPosition?: string;
};

export function ImagePlaceholder({
  label,
  ratio = "4 / 3",
  caption,
  src,
  objectPosition = "center",
}: ImagePlaceholderProps) {
  return (
    <div className="space-y-2">
      <div
        className="relative min-h-48 overflow-hidden rounded-xl border border-black/15"
        role={src ? undefined : "img"}
        aria-label={src ? undefined : label}
        style={{ aspectRatio: ratio }}
      >
        {src ? (
          <Image
            src={src}
            alt={label}
            fill
            sizes="(max-width: 640px) 100vw, 50vw"
            className="object-cover"
            style={{ objectPosition }}
          />
        ) : null}
      </div>
      {caption ? <p className="text-xs text-black/50">{caption}</p> : null}
    </div>
  );
}

export function PageIntro({ eyebrow, title }: { eyebrow?: string; title: string }) {
  return (
    <div className="max-w-xl space-y-3">
      {eyebrow ? <p className="site-eyebrow">{eyebrow}</p> : null}
      <h1 className="site-page-title">{title}</h1>
    </div>
  );
}
