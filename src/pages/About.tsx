import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Sparkles, 
  Video, 
  Music, 
  Image, 
  TrendingUp, 
  Youtube,
  Brain,
  Mic,
  MessageSquare,
  Linkedin,
  Twitter,
  Instagram
} from "lucide-react";

const About = () => {
  const features = [
    { icon: Video, title: "AI Caption & Script Generator", desc: "Create engaging captions and professional scripts" },
    { icon: Music, title: "AI Music Generator", desc: "Generate custom background music for your content" },
    { icon: Image, title: "AI Thumbnail Generator", desc: "Design eye-catching thumbnails automatically" },
    { icon: TrendingUp, title: "Trend Analyzer", desc: "Analyze trending topics in your niche" },
    { icon: Youtube, title: "YouTube Manager", desc: "Manage multiple channels and automate uploads" },
    { icon: Brain, title: "SEO Optimizer", desc: "Optimize titles, descriptions, and tags" },
    { icon: Mic, title: "Voice Tools", desc: "Text-to-speech, speech-to-text, voice cloning" },
    { icon: MessageSquare, title: "Comment Auto-Responder", desc: "AI-powered comment responses" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Hero Section */}
        <div className="text-center mb-16 space-y-6">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-4 h-4 mr-2" />
            About Fabulous Creators
          </Badge>
          
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            AI-Powered Content Studio for YouTube Creators
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Founded by <span className="font-semibold text-foreground">Jagrit Khundia</span>, 
            Fabulous Creators is revolutionizing content creation with cutting-edge AI technology.
          </p>
        </div>

        {/* Founder Section */}
        <Card className="mb-12 border-primary/20">
          <CardHeader>
            <CardTitle className="text-2xl">Meet the Founder</CardTitle>
            <CardDescription>The vision behind Fabulous Creators</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-2xl font-bold text-primary-foreground">
                JK
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">Jagrit Khundia</h3>
                <p className="text-sm text-muted-foreground mb-2">Founder & CEO</p>
                <p className="text-muted-foreground">
                  Jagrit founded Fabulous Creators to empower content creators worldwide with 
                  professional-grade AI tools. His vision is to make high-quality content creation 
                  accessible to everyone, from aspiring YouTubers to established channels managing 
                  multiple platforms.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Mission Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Our Mission</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-muted-foreground">
              To provide YouTube creators with an all-in-one AI-powered platform that streamlines 
              the entire content creation workflow—from ideation to upload and beyond.
            </p>
            <div className="grid md:grid-cols-3 gap-4 mt-6">
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">🎯 Accessibility</h4>
                <p className="text-sm text-muted-foreground">Professional tools for everyone</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">⚡ Efficiency</h4>
                <p className="text-sm text-muted-foreground">Save time with AI automation</p>
              </div>
              <div className="p-4 bg-muted/50 rounded-lg">
                <h4 className="font-semibold mb-2">📈 Growth</h4>
                <p className="text-sm text-muted-foreground">Scale your content creation</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold mb-8 text-center">15+ AI-Powered Features</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((feature, index) => (
              <Card key={index} className="hover:border-primary/50 transition-colors">
                <CardHeader>
                  <feature.icon className="w-8 h-8 mb-2 text-primary" />
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                  <CardDescription className="text-sm">{feature.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>

        {/* Pricing Overview */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Transparent Pricing</CardTitle>
            <CardDescription>Choose the plan that fits your needs</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="p-6 bg-muted/50 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Free Plan</h3>
                <p className="text-3xl font-bold mb-4">₹0<span className="text-base font-normal text-muted-foreground">/month</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ 3 video uploads/day</li>
                  <li>✓ 4 AI generations/day</li>
                  <li>✓ Up to 4 YouTube channels</li>
                  <li>✓ Daily limit resets</li>
                </ul>
              </div>
              <div className="p-6 bg-primary/10 border border-primary/20 rounded-lg">
                <h3 className="text-xl font-semibold mb-2">Pro Plan</h3>
                <p className="text-3xl font-bold mb-4">₹699<span className="text-base font-normal text-muted-foreground">/month</span></p>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>✓ Unlimited video uploads</li>
                  <li>✓ Unlimited AI captions & scripts</li>
                  <li>✓ Unlimited YouTube channels</li>
                  <li>✓ Priority support</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Connect Section */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="text-2xl">Connect With Us</CardTitle>
            <CardDescription>Follow our journey and stay updated</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3 mb-4">
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
            <p className="text-sm text-muted-foreground">
              Or reach out: <a href="mailto:contact@fabuos.com" className="text-primary hover:underline">contact@fabuos.com</a>
            </p>
          </CardContent>
        </Card>

        {/* Contact Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Get Started Today</CardTitle>
            <CardDescription>Join thousands of creators using Fabulous Creators</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <div>
                <p className="text-muted-foreground mb-2">
                  Platform: <span className="font-semibold text-foreground">fabuos.com</span>
                </p>
                <p className="text-muted-foreground">
                  Founder: <span className="font-semibold text-foreground">Jagrit Khundia</span>
                </p>
              </div>
              <div className="flex gap-4">
                <a 
                  href="/auth" 
                  className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Start Free Trial
                </a>
                <a 
                  href="/pricing" 
                  className="px-6 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                >
                  View Pricing
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default About;
