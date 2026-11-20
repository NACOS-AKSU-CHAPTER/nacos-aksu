import { Link } from "react-router-dom";
import { Mail, MapPin, Instagram, Twitter, Facebook, Youtube } from "lucide-react";

const Tiktok = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
  </svg>
);

export const Footer = () => {
  return (
    <footer className="bg-primary text-primary-foreground mt-20">
      <div className="container mx-auto container-px py-14">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img
                src="/logo.png"
                alt="NACOS AKSU Logo"
                className="h-10 w-10 object-contain"
              />
              <div className="leading-tight">
                <div className="font-display font-bold text-lg">NACOS</div>
                <div className="text-xs uppercase tracking-wider opacity-70">Akwa Ibom State University Chapter</div>
              </div>
            </div>
            <p className="text-sm opacity-80 max-w-md leading-relaxed">
              The official hub of the Nigeria Association of Computing Students,
              Akwa Ibom State University chapter uniting students, sharing knowledge,
              and building the future of tech in our department.
            </p>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider">Explore</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/about" className="hover:text-accent transition-smooth">About Us</Link></li>
              <li><Link to="/executives" className="hover:text-accent transition-smooth">Executives</Link></li>
              <li><Link to="/studies" className="hover:text-accent transition-smooth">Studies</Link></li>
              <li><Link to="/events" className="hover:text-accent transition-smooth">Events & News</Link></li>
              <li><Link to="/gallery" className="hover:text-accent transition-smooth">Gallery</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-display font-semibold mb-4 text-sm uppercase tracking-wider">Connect</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                <span>Department of Computer Science, <br /> Faculty of Computing & Information Technology. <br /> Akwa Ibom State University, Ikot Akpaden</span>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4 shrink-0" />
                <a href="mailto:nacos@aksu.edu.ng" className="hover:text-accent transition-smooth">nacos@aksu.edu.ng</a>
              </li>
            </ul>
            <div className="flex gap-3 mt-4">
              <a href="https://www.instagram.com/nacos_aksu?igsh=YWdnb2oxZW5nM2Zv" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="https://x.com/nacos_aksu" target="_blank" rel="noopener noreferrer" aria-label="Twitter" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
                <Twitter className="h-4 w-4" />
              </a>
              <a href="https://www.facebook.com/share/1H8YhwYnPF/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="https://www.tiktok.com/@nacos_aksu?_r=1&_t=ZS-97mWa7Q8BUW" target="_blank" rel="noopener noreferrer" aria-label="Tiktok" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
                <Tiktok className="h-4 w-4" />
              </a>
              <a href="https://youtube.com/@nacos_aksu?si=geRZ7OCkty8a9uXt" target="_blank" rel="noopener noreferrer" aria-label="Youtube" className="h-9 w-9 inline-flex items-center justify-center rounded-full bg-primary-foreground/10 hover:bg-accent hover:text-accent-foreground transition-smooth">
                <Youtube className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-primary-foreground/15 flex flex-col sm:flex-row justify-between gap-3 text-xs opacity-70">
          <p>© {new Date().getFullYear()} NACOS AKSU Chapter. All rights reserved.</p>
          <p>Built with care by the Software Directorate.</p>
        </div>
      </div>
    </footer>
  );
};
