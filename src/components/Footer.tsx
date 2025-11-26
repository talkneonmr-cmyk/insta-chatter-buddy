import { Heart } from "lucide-react";
import { Link } from "react-router-dom";

export function Footer() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>Founded by</span>
            <Link 
              to="/about" 
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              Jagrit Khundia
            </Link>
            <Heart className="w-4 h-4 text-primary fill-primary" />
          </div>
          
          <div className="flex items-center gap-6 text-sm">
            <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
              About
            </Link>
            <Link to="/press" className="text-muted-foreground hover:text-foreground transition-colors">
              Press Kit
            </Link>
            <Link to="/pricing" className="text-muted-foreground hover:text-foreground transition-colors">
              Pricing
            </Link>
          </div>
          
          <div className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Fabulous Creators
          </div>
        </div>
      </div>
    </footer>
  );
}
