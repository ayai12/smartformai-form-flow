import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/sections/Hero';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';
import { 
  Sparkles, 
  Rocket, 
  BarChart3, 
  FileText, 
  Link2, 
  Shield,
  MessageSquare,
  TrendingUp,
  Users,
  Calendar,
  BrainCircuit,
  Play,
  Star,
  Check,
  Zap,
  Infinity,
  ArrowRight,
  Lightbulb,
  Settings,
  LineChart,
  Plug2,
  Code,
  GripVertical
} from 'lucide-react';

const features = [
  {
    icon: Sparkles,
    title: 'AI-Powered Question Generation',
    description: 'Leverage advanced AI to instantly generate professional, relevant questions for any business use case—no technical skills required.'
  },
  {
    icon: Rocket,
    title: 'Instant Agent Publishing',
    description: 'Launch secure, branded agents in seconds. Share via custom link or embed directly on your website.'
  },
  {
    icon: BarChart3,
    title: 'Real-Time Analytics',
    description: 'Track responses and visualize data with live dashboards—empowering data-driven decisions for your team.'
  },
  {
    icon: FileText,
    title: 'No-Code Agent Builder',
    description: 'Easily edit, customize, and manage agents with a modern, intuitive interface—built for business users.'
  },
  {
    icon: Link2,
    title: 'Seamless Integrations',
    description: 'Connect with your favorite tools and automate workflows. SmartFormAI Agents fits right into your business stack.'
  },
  {
    icon: Shield,
    title: 'Enterprise-Grade Security',
    description: 'Your data is protected with industry-leading security, compliance, and privacy standards.'
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Train',
    description: 'Tell the AI what you want to learn — it instantly creates a survey with questions designed to get useful answers.',
    icon: BrainCircuit
  },
  {
    step: '2',
    title: 'Deploy',
    description: 'Share your survey link or embed it anywhere. Your agent runs everything automatically and collects responses in real time.',
    icon: Rocket
  },
  {
    step: '3',
    title: 'Analyze & Improve',
    description: 'See live insights as results come in. After around 20 responses, your AI agent can automatically rebuild the survey — improving questions to get even better data next time.',
    icon: BarChart3
  }
];

const testimonials = [
  {
    name: "Sarah T.",
    role: "Head of Marketing",
    company: "TechStartup Inc.",
    quote: "SmartFormAI Agents enabled our team to launch market research agents 5x faster. The analytics and AI-generated questions are a game changer for B2B feedback." 
  },
  {
    name: "Michael R.",
    role: "Research Lead",
    company: "Consumer Brands Ltd.",
    quote: "We trust SmartFormAI Agents for all our enterprise agent needs. The platform is secure, reliable, and delivers actionable insights instantly."
  },
  {
    name: "Jessica K.",
    role: "Customer Experience Director",
    company: "Service Solutions",
    quote: "SmartFormAI Agents' AI-powered agents have improved our response rates and data quality. Highly recommended for any business focused on customer feedback."
  }
];

const integrations = [
  { name: 'Slack', icon: MessageSquare },
  { name: 'Zapier', icon: Plug2 },
  { name: 'Webhooks', icon: Code },
  { name: 'API', icon: GripVertical },
];

const Index: React.FC = () => {
  return (
    <Layout metaTitle="SmartFormAI Agents — Build Your Own AI Survey Agents" metaDescription="Train AI agents that create, adapt, and analyze surveys automatically.">
      <Helmet>
        <link rel="canonical" href="https://smartformai.vercel.app/" />
        <meta property="og:title" content="SmartFormAI Agents — Build Your Own AI Survey Agents" />
        <meta property="og:description" content="Train AI agents that create, adapt, and analyze surveys automatically." />
        <meta property="og:url" content="https://smartformai.vercel.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SmartFormAI Agents - AI Survey Agents",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Train AI agents that create, adapt, and analyze surveys automatically."
            }
          `}
        </script>
      </Helmet>

      {/* Hero Section - UNCHANGED */}
      <Hero />

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Features Section - Unique: Subtle pattern background */}
      <section className="w-full bg-white py-24 px-4 relative overflow-hidden" id="features">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
          <div className="absolute inset-0" style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, #7B3FE4 1px, transparent 0)`,
            backgroundSize: '40px 40px'
          }}></div>
        </div>
        <div className="max-w-6xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-black mb-3">Everything You Need to Succeed</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Powerful features designed to help you create, manage, and analyze agents at scale
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, idx) => {
              const IconComponent = feature.icon;
              return (
                <div 
                  key={idx} 
                  className="border border-black/10 rounded-xl p-6 hover:border-[#7B3FE4]/30 hover:shadow-sm transition-all bg-white group"
                >
                  <div className="bg-[#7B3FE4]/10 p-2.5 rounded-lg w-fit mb-4 group-hover:bg-[#7B3FE4]/20 transition-colors">
                    <IconComponent className="h-5 w-5 text-[#7B3FE4]" />
                  </div>
                  <h3 className="text-lg font-medium text-black mb-2">{feature.title}</h3>
                  <p className="text-sm text-black/60 leading-relaxed">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

     
  

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Showcase / Demo Section - Unique: Centered with accent shadow */}
      <section className="w-full bg-white py-24 px-4" id="demo">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-medium text-black mb-3">See SmartFormAI Agents in Action</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Watch how you can create, publish, and analyze professional agents in seconds—no code, no hassle.
            </p>
          </div>
          
          <div className="relative w-full aspect-video rounded-xl overflow-hidden border border-black/10 mb-8 shadow-lg">
            <div className="absolute -inset-1 bg-gradient-to-br from-[#7B3FE4]/10 to-transparent rounded-xl opacity-50 blur-xl"></div>
            <div className="relative w-full h-full bg-black">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/614L29Y-jO0?rel=0" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
                title="AI Agent Generator Demo - SmartFormAI Agents"
                className="w-full h-full"
              ></iframe>
            </div>
          </div>
          
          <div className="text-center">
            <Button 
              className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium px-6 py-2.5 rounded-lg transition-colors inline-flex items-center gap-2 shadow-sm hover:shadow-md" 
              asChild
            >
              <a href="https://smartformai.vercel.app/survey/0c1c6074-2241-43e4-a109-b35960f887ae" target="_blank" rel="noopener noreferrer" aria-label="Try our AI form generator demo">
                <Play className="h-4 w-4" />
                Try the Demo
              </a>
            </Button>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Testimonials / Social Proof Section - Unique: Alternating card styles */}
      <section className="w-full bg-white py-24 px-4" id="testimonials">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-black mb-3">Trusted by Teams Worldwide</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              See what our customers are saying about SmartFormAI Agents
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, idx) => (
              <div 
                key={idx} 
                className={`border rounded-xl p-6 bg-white transition-all hover:shadow-md ${
                  idx === 1 
                    ? 'border-[#7B3FE4]/30 bg-[#7B3FE4]/5' 
                    : 'border-black/10'
                }`}
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-4 w-4 fill-[#7B3FE4] text-[#7B3FE4]" />
                  ))}
                </div>
                <p className="text-sm text-black/80 leading-relaxed mb-6">"{testimonial.quote}"</p>
                <div className="border-t border-black/10 pt-4">
                  <p className="font-medium text-black text-sm">{testimonial.name}</p>
                  <p className="text-xs text-black/50 mt-1">{testimonial.role}, {testimonial.company}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Integrations Section - Unique: Compact grid with hover lift */}
      <section className="w-full bg-black/5 py-24 px-4" id="integrations">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-medium text-black mb-3">Integrations</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Connect SmartFormAI Agents with your favorite tools and workflows
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {integrations.map((integration, idx) => {
              const IconComponent = integration.icon;
              return (
                <div 
                  key={idx}
                  className="border border-black/10 rounded-lg p-6 hover:border-[#7B3FE4]/30 hover:bg-white hover:-translate-y-1 transition-all bg-white flex flex-col items-center justify-center text-center cursor-pointer"
                >
                  <div className="bg-[#7B3FE4]/10 p-3 rounded-lg w-fit mb-3 hover:bg-[#7B3FE4]/20 transition-colors">
                    <IconComponent className="h-5 w-5 text-[#7B3FE4]" />
                  </div>
                  <p className="text-sm font-medium text-black">{integration.name}</p>
                </div>
              );
            })}
          </div>
          
          <div className="text-center mt-10">
            <Link 
              to="/integrations"
              className="text-sm font-medium text-[#7B3FE4] hover:text-[#6B35D0] transition-colors inline-flex items-center gap-1"
            >
              View all integrations <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Pricing Section - Unique: Elevated cards with shadow */}
      <section className="w-full bg-white py-24 px-4" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-black mb-3">Simple, Transparent Pricing</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free, upgrade anytime.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free Plan */}
            <div className="border border-black/10 rounded-xl p-8 bg-white shadow-sm hover:shadow-md transition-shadow">
              <div className="text-center mb-6">
                <h3 className="text-xl font-medium text-black mb-2">Free</h3>
                <div className="mb-2">
                  <span className="text-3xl font-semibold text-black">$0</span>
                  <span className="text-black/60 text-sm">/month</span>
                </div>
                <p className="text-sm text-black/60">Perfect for exploring</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-black/60">View existing agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-black/60">Basic features</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-black/60">Community support</span>
                </li>
              </ul>
              
              <Button 
                variant="outline" 
                className="w-full border-black/10 hover:bg-black/5"
                asChild
              >
                <Link to="/signup">Get Started</Link>
              </Button>
            </div>

            {/* Pro Plan */}
            <div className="border-2 border-[#7B3FE4] rounded-xl p-8 bg-white relative shadow-lg hover:shadow-xl transition-shadow">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#7B3FE4] text-white px-3 py-1 rounded-full text-xs font-medium shadow-sm">
                  Most Popular
                </span>
              </div>
              
              <div className="text-center mb-6">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-5 w-5 text-[#7B3FE4]" />
                  <h3 className="text-xl font-medium text-black">Pro</h3>
                </div>
                <div className="mb-2">
                  <span className="text-3xl font-semibold text-black">€14.99</span>
                  <span className="text-black/60 text-sm">/month</span>
                </div>
                <p className="text-sm text-black/60">Full access to all features</p>
              </div>
              
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-2">
                  <Zap className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-black">Unlimited AI Agents</span>
                </li>
                <li className="flex items-start gap-2">
                  <BarChart3 className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-black">Full Analytics Access</span>
                </li>
                <li className="flex items-start gap-2">
                  <Shield className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-black">Advanced Security</span>
                </li>
                <li className="flex items-start gap-2">
                  <Infinity className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-black">Unlimited Responses</span>
                </li>
                <li className="flex items-start gap-2">
                  <Check className="h-4 w-4 text-[#7B3FE4] mt-0.5 flex-shrink-0" />
                  <span className="text-sm font-medium text-black">Priority Support</span>
                </li>
              </ul>
              
              <Button 
                className="w-full bg-[#7B3FE4] hover:bg-[#6B35D0] text-white shadow-sm hover:shadow-md transition-shadow"
                asChild
              >
                <Link to="/pricing">Upgrade to Pro</Link>
              </Button>
            </div>
          </div>
          
          <div className="text-center mt-10">
            <Link 
              to="/pricing"
              className="text-sm font-medium text-[#7B3FE4] hover:text-[#6B35D0] transition-colors inline-flex items-center gap-1"
            >
              View full pricing details <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* FAQ Section - Unique: Centered narrow layout with subtle background */}
      <section className="w-full bg-black/5 py-24 px-4" id="faq">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-medium text-black mb-3">Frequently Asked Questions</h2>
            <p className="text-base text-black/60">
              Everything you need to know about SmartFormAI Agents
            </p>
          </div>
          
          <div className="bg-white rounded-xl border border-black/10 p-6 shadow-sm">
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="q1" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  What is SmartFormAI Agents?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  SmartFormAI Agents is an enterprise-grade AI agent platform that empowers businesses to create, publish, and analyze agents instantly. Describe your needs, and our AI generates tailored questions for surveys, feedback, and more—no coding required.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q2" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  How does SmartFormAI Agents generate questions?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Our AI analyzes your prompt and context to create relevant, clear, and effective questions, adapting to your business requirements. It's the fastest way to build professional agents for any use case.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q3" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Can I embed agents on my website?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Yes. Every agent you create can be shared via a secure link or embedded directly on your website. Perfect for businesses that want custom agents without complex software.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q4" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Is SmartFormAI Agents free to use?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  You can get started for free. Our free plan includes essential features, while paid plans unlock advanced analytics, customization, and integrations for business needs.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q5" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Does SmartFormAI Agents include analytics?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Yes. All responses are collected in your dashboard, where you can view real-time insights and visual charts for every agent you publish.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q6" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  How is SmartFormAI Agents different from Google Forms?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Unlike Google Forms, SmartFormAI Agents uses AI to automatically create tailored questions, offers advanced analytics, custom branding, and enterprise-grade security—making it the best choice for business agents.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q7" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Can I use SmartFormAI Agents for market research?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Absolutely. SmartFormAI Agents creates professional agents with intelligent questions designed to gather meaningful data. Built-in analytics help you extract valuable insights for your business.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q8" className="border-b-0">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Is SmartFormAI Agents mobile-friendly?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Yes. All agents are fully responsive and mobile-friendly, ensuring a seamless experience for your respondents on any device.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Call-to-Action Section - Unique: Centered with subtle gradient background */}
      <section className="w-full bg-gradient-to-b from-white to-black/5 py-24 px-4" id="get-started">
        <div className="max-w-3xl mx-auto text-center">
          <div className="inline-block mb-6">
            <div className="bg-[#7B3FE4]/10 px-4 py-2 rounded-full">
              <span className="text-sm font-medium text-[#7B3FE4]">Start your free trial today</span>
            </div>
          </div>
          <h2 className="text-3xl font-medium text-black mb-4">
            Ready to Build Smarter Agents?
          </h2>
          <p className="text-base text-black/60 mb-10 max-w-xl mx-auto">
            Create your first AI-powered agent in seconds. No code, no hassle—just results.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Button 
              className="bg-[#7B3FE4] hover:bg-[#6B35D0] text-white font-medium px-8 py-3 rounded-lg transition-colors shadow-sm hover:shadow-md" 
              size="lg"
              asChild
            >
              <Link to="/signup">Get Started Free</Link>
            </Button>
            <Button 
              variant="outline"
              className="border-black/10 hover:bg-black/5 text-black font-medium px-8 py-3 rounded-lg transition-colors"
              asChild
            >
              <Link to="/pricing">View Pricing</Link>
            </Button>
          </div>
          <p className="text-sm text-black/50">Created by Rein Watashi</p>
        </div>
      </section>
    </Layout>
  );
};

export default Index;