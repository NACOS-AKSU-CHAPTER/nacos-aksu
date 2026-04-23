import { Target, Eye, Heart, GraduationCap } from "lucide-react";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/layout/PageHeader";
import { useScrollAnimation } from "@/hooks/useScrollAnimation";

const About = () => {
  const introSection = useScrollAnimation();
  const valuesSection = useScrollAnimation();
  const activitiesSection = useScrollAnimation();

  return (
    <>
      <PageHeader
        eyebrow="About Us"
        title="Empowering the next generation of computing leaders."
        description="NACOS AKSU is the student-led body bringing together every computing student at Akwa Ibom State University — from 100 level newcomers to graduating finalists."
      />

      <section className="py-16 md:py-24">
        <div className="container mx-auto container-px max-w-5xl">
          <div ref={introSection.ref} className={`prose prose-slate max-w-none scroll-animate ${introSection.isVisible ? 'animate-in' : ''}`}>
            <h2 className="font-display text-2xl md:text-3xl font-bold mb-4">Who we are</h2>
            <p className="text-muted-foreground leading-relaxed text-lg">
              The Nigeria Association of Computing Students (NACOS), Akwa Ibom State University chapter,
              is the official body representing all students of the Department of Computing. We exist to
              foster academic excellence, build community, and prepare members for the realities of a
              fast-moving tech industry.
            </p>
          </div>

          <div ref={valuesSection.ref} className="grid md:grid-cols-3 gap-5 mt-12">
            {[
              {
                icon: Target,
                title: "Our Mission",
                body: "To create an environment where every computing student can thrive academically, socially, and professionally.",
              },
              {
                icon: Eye,
                title: "Our Vision",
                body: "A united, well-equipped community of computing students leading innovation across Nigeria and beyond.",
              },
              {
                icon: Heart,
                title: "Our Values",
                body: "Integrity, collaboration, curiosity, and service — the principles that guide every decision we make.",
              },
            ].map((c, idx) => (
              <Card
                key={c.title}
                className={`p-7 border-border shadow-card-soft scroll-animate-scale ${valuesSection.isVisible ? 'animate-in' : ''}`}
                style={{ animationDelay: `${idx * 0.15}s` }}
              >
                <div className="h-11 w-11 rounded-lg bg-accent-soft text-accent inline-flex items-center justify-center mb-4">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-display text-xl font-semibold mb-2">{c.title}</h3>
                <p className="text-muted-foreground leading-relaxed text-sm">{c.body}</p>
              </Card>
            ))}
          </div>

          <div ref={activitiesSection.ref} className="mt-16">
            <h2 className={`font-display text-2xl md:text-3xl font-bold mb-6 scroll-animate ${activitiesSection.isVisible ? 'animate-in' : ''}`}>What we do for students</h2>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                "Organize departmental events: tech weeks, hackathons, and seminars",
                "Curate and share course materials across all levels",
                "Connect students with industry mentors and internship opportunities",
                "Represent student interests before faculty and administration",
                "Run study groups, peer tutoring, and career-readiness sessions",
                "Celebrate excellence through awards and recognition",
              ].map((item, idx) => (
                <div
                  key={item}
                  className={`flex items-start gap-3 p-4 rounded-lg bg-secondary/50 scroll-animate ${activitiesSection.isVisible ? 'animate-in' : ''}`}
                  style={{ animationDelay: `${idx * 0.1}s` }}
                >
                  <div className="h-6 w-6 rounded-full bg-accent text-accent-foreground inline-flex items-center justify-center shrink-0 mt-0.5">
                    <GraduationCap className="h-3.5 w-3.5" />
                  </div>
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default About;
