import { cn } from "@/lib/utils";

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
}

export const PageHeader = ({ eyebrow, title, description, className }: PageHeaderProps) => {
  return (
    <section className={cn("gradient-hero text-primary-foreground", className)}>
      <div className="container mx-auto container-px py-16 md:py-24">
        <div className="max-w-3xl animate-fade-in-up">
          {eyebrow && (
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 backdrop-blur text-xs font-medium uppercase tracking-wider mb-5 border border-primary-foreground/20">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              {eyebrow}
            </div>
          )}
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-balance leading-[1.05]">
            {title}
          </h1>
          {description && (
            <p className="mt-5 text-lg md:text-xl opacity-85 max-w-2xl leading-relaxed">
              {description}
            </p>
          )}
        </div>
      </div>
    </section>
  );
};
