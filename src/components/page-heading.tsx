export function PageHeading({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col justify-between gap-7 lg:flex-row lg:items-end">
      <div>
        <p className="text-[11px] font-bold tracking-[0.2em] text-[var(--brass)] uppercase">
          {eyebrow}
        </p>
        <h1 className="font-display mt-3 text-5xl leading-none tracking-[-0.04em] sm:text-7xl">
          {title}
        </h1>
        {description ? (
          <p className="mt-5 max-w-2xl text-base leading-7 text-white/48">
            {description}
          </p>
        ) : null}
      </div>
      {action}
    </header>
  );
}
