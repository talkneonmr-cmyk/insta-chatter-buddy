import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Download, 
  Sparkles, 
  User, 
  Mail, 
  Globe, 
  Linkedin, 
  Twitter,
  Youtube,
  Instagram
} from "lucide-react";

export default function Press() {
  const features = [
    "AI Caption Generator", "AI Script Writer", "AI Thumbnail Generator",
    "Text to Speech", "Speech to Text", "AI Music Generator",
    "Background Removal", "Image Enhancement", "Voice Cloning",
    "Video Dubbing", "AI Hashtag Generator", "SEO Optimizer",
    "Trend Analyzer", "YouTube Manager", "Shorts Factory"
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Press & Media Kit
          </Badge>
          <h1 className="text-4xl font-bold mb-4">Fabulous Creators</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            AI-powered content creation platform helping YouTube creators save time and grow their channels
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2 mb-12">
          {/* Company Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="w-5 h-5" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">About</h3>
                <p className="text-sm text-muted-foreground">
                  Fabulous Creators is an all-in-one AI platform that empowers YouTube content creators 
                  with 15+ AI-powered tools for content creation, video enhancement, and channel management.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Founded</h3>
                <p className="text-sm text-muted-foreground">2024</p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Website</h3>
                <a href="https://fabuos.com" className="text-sm text-primary hover:underline">
                  fabuos.com
                </a>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Industry</h3>
                <p className="text-sm text-muted-foreground">AI-powered Content Creation, Creator Tools</p>
              </div>
            </CardContent>
          </Card>

          {/* Founder Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Founder & CEO
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Jagrit Khundia</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Founder & CEO of Fabulous Creators. Passionate about empowering content creators 
                  with AI technology to streamline their workflow and maximize their creative potential.
                </p>
              </div>
              <div>
                <h3 className="font-semibold mb-2">Connect</h3>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://linkedin.com/in/jagritkhundia" target="_blank" rel="noopener noreferrer">
                      <Linkedin className="w-4 h-4 mr-1" />
                      LinkedIn
                    </a>
                  </Button>
                  <Button variant="outline" size="sm" asChild>
                    <a href="https://twitter.com/jagritkhundia" target="_blank" rel="noopener noreferrer">
                      <Twitter className="w-4 h-4 mr-1" />
                      Twitter
                    </a>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Platform Features */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Platform Features</CardTitle>
            <CardDescription>15+ AI-powered tools for content creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {features.map((feature) => (
                <Badge key={feature} variant="secondary">
                  {feature}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Pricing */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Pricing Plans</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-4 border rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Free Plan</h3>
                <p className="text-3xl font-bold mb-4">₹0<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Daily usage limits on all AI tools</li>
                  <li>• Access to all 15+ features</li>
                  <li>• Perfect for trying the platform</li>
                </ul>
              </div>
              <div className="p-4 border-2 border-primary rounded-lg">
                <h3 className="font-semibold text-lg mb-2">Pro Plan</h3>
                <p className="text-3xl font-bold mb-4">₹699<span className="text-sm font-normal text-muted-foreground">/month</span></p>
                <ul className="text-sm space-y-2 text-muted-foreground">
                  <li>• Unlimited AI generations</li>
                  <li>• Priority support</li>
                  <li>• All premium features included</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Brand Assets */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="w-5 h-5" />
              Brand Assets
            </CardTitle>
            <CardDescription>Logos and brand materials (coming soon)</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Brand guidelines, logos, and promotional materials will be available here soon.
            </p>
          </CardContent>
        </Card>

        {/* Social Links */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle>Connect With Us</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <a href="https://linkedin.com/company/fabulous-creators" target="_blank" rel="noopener noreferrer">
                  <Linkedin className="w-4 h-4 mr-2" />
                  LinkedIn
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://twitter.com/fabuoscreators" target="_blank" rel="noopener noreferrer">
                  <Twitter className="w-4 h-4 mr-2" />
                  Twitter
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://youtube.com/@fabuoscreators" target="_blank" rel="noopener noreferrer">
                  <Youtube className="w-4 h-4 mr-2" />
                  YouTube
                </a>
              </Button>
              <Button variant="outline" asChild>
                <a href="https://instagram.com/fabuoscreators" target="_blank" rel="noopener noreferrer">
                  <Instagram className="w-4 h-4 mr-2" />
                  Instagram
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              Media Contact
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-2">
              For press inquiries, partnerships, or interviews:
            </p>
            <a href="mailto:contact@fabuos.com" className="text-primary hover:underline">
              contact@fabuos.com
            </a>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
}
