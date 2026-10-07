export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children?: React.ReactNode;
}) {
  return (
    <header className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 sm:pt-24">
      {eyebrow && (
        <p className="mb-4 text-sm font-medium text-slate">{eyebrow}</p>
      )}
      <h1 className="max-w-4xl text-4xl leading-[0.95] font-black tracking-tight sm:text-6xl">
        {title}
      </h1>
      {children && (
        <div className="mt-6 max-w-prose text-lg text-slate">{children}</div>
      )}
    </header>
  );
}
