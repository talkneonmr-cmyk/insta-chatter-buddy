import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Calendar, Info, Users, PartyPopper } from "lucide-react";

const templates = [
  {
    id: "coupon-share",
    name: "Coupon Share",
    description: "Automatically send discount codes to interested customers",
    icon: Sparkles,
    keywords: "interested, yes, want, send, DM, coupon, discount",
    tone: "friendly",
    goal: "share coupon",
    example: "Hi [Name]! 🎉 Thanks for your interest! Here's your exclusive 20% discount code: SAVE20. Use it at checkout!",
  },
  {
    id: "appointment-booking",
    name: "Appointment Booking",
    description: "Guide users to schedule appointments or consultations",
    icon: Calendar,
    keywords: "book, schedule, appointment, available, consultation, meeting",
    tone: "professional",
    goal: "book appointment",
    example: "Hello [Name], thank you for reaching out! I'd be happy to schedule a consultation. Please visit our booking page: [link]",
  },
  {
    id: "product-info",
    name: "Product Info",
    description: "Provide detailed information about your products",
    icon: Info,
    keywords: "details, info, learn more, tell me, specs, features",
    tone: "helpful",
    goal: "provide info",
    example: "Hi [Name]! I'd love to share more details with you. Here's everything you need to know: [product info link]",
  },
  {
    id: "lead-generation",
    name: "Lead Generation",
    description: "Capture leads and qualify potential customers",
    icon: Users,
    keywords: "pricing, cost, quote, interested, business, service",
    tone: "professional",
    goal: "generate lead",
    example: "Hello [Name], thanks for your inquiry! I'd be happy to provide a custom quote. Let's discuss your needs: [contact form]",
  },
  {
    id: "event-registration",
    name: "Event Registration",
    description: "Drive registrations for events and webinars",
    icon: PartyPopper,
    keywords: "register, join, attend, sign up, event, webinar",
    tone: "enthusiastic",
    goal: "event registration",
    example: "Hey [Name]! 🎊 So excited you want to join us! Register here to secure your spot: [registration link]",
  },
];

interface RuleTemplatesProps {
  onApplyTemplate: (template: typeof templates[0]) => void;
}

export function RuleTemplates({ onApplyTemplate }: RuleTemplatesProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Quick Start Templates</h2>
        <p className="text-sm text-muted-foreground">Choose a pre-built template to get started quickly</p>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {templates.map((template) => {
          const Icon = template.icon;
          return (
            <Card key={template.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                  </div>
                </div>
                <CardDescription>{template.description}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="secondary">{template.tone}</Badge>
                    <Badge variant="outline">{template.goal}</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    <strong>Keywords:</strong> {template.keywords.split(',').slice(0, 3).join(',')}...
                  </div>
                </div>
                <div className="p-3 bg-muted rounded-lg text-xs">
                  <strong className="text-muted-foreground">Example DM:</strong>
                  <p className="mt-1 text-foreground">{template.example}</p>
                </div>
                <Button
                  className="w-full"
                  variant="outline"
                  onClick={() => onApplyTemplate(template)}
                >
                  Use Template
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
