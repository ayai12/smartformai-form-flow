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

const autonomyPillars = [
  {
    icon: Lightbulb,
    title: 'Product Truth',
    description: 'Creation, interpretation, and evolution already exist in one system. Auto-Rebuild is shipping from private testing to public launch.'
  },
  {
    icon: TrendingUp,
    title: 'Strategic Positioning',
    description: 'Own the category by defining SmartFormAI as a thinking system, not another form tool. Differentiation beats comparison.'
  },
  {
    icon: Shield,
    title: 'Perception & Trust',
    description: 'Marketing leads vision, not fiction. Users join an evolving platform and get transparent updates as autonomy rolls out.'
  }
];

const features = [
  {
    icon: BrainCircuit,
    title: 'Cognitive Initiation',
    description: 'Describe your goal and the AI drafts a full survey with tone, logic, and targeting — zero manual question writing.'
  },
  {
    icon: BarChart3,
    title: 'Insight Engine',
    description: 'Go beyond dashboards. Receive structured summaries, behavioral notes, and recommended next moves automatically.'
  },
  {
    icon: Infinity,
    title: 'Auto-Rebuild Loop',
    description: 'Agents learn from every dataset and prepare the next iteration autonomously — available now in private testing.'
  },
  {
    icon: Settings,
    title: 'Human Control Rails',
    description: 'Keep governance in place with approval checkpoints, audit trails, and guardrails before each relaunch.'
  },
  {
    icon: LineChart,
    title: 'Live Research Telemetry',
    description: 'Track completion rates, reliability signals, and sentiment shifts as the AI interprets responses in real time.'
  },
  {
    icon: Shield,
    title: 'Enterprise Trust Layer',
    description: 'SOC2-ready infrastructure, private storage, and role-based permissions to protect sensitive research data.'
  },
];

const howItWorks = [
  {
    step: '1',
    title: 'Initiate',
    description: 'Describe your research intent. SmartFormAI assembles the full survey architecture — tone, structure, branching, and scoring logic.',
    icon: BrainCircuit
  },
  {
    step: '2',
    title: 'Deploy & Interpret',
    description: 'Launch anywhere. As responses flow in, the AI insight engine summarizes completion, trends, behavioral signals, and strategic recommendations.',
    icon: Rocket
  },
  {
    step: '3',
    title: 'Evolve',
    description: 'Auto-Rebuild prepares the next version using the insight engine’s learnings. Approve or let it relaunch autonomously in a continuous loop.',
    icon: Infinity
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
    <Layout metaTitle="SmartFormAI SurveyAgent — The World’s First Autonomous, Survey-Driven Market Research Engine" metaDescription="Tell SurveyAgent what you need to learn and the autonomous research engine designs surveys, recruits respondents, and distills AI-ready insight loops without manual work.">
      <Helmet>
        <link rel="canonical" href="https://smartformai.com/" />
        <meta property="og:title" content="SmartFormAI SurveyAgent — The World’s First Autonomous, Survey-Driven Market Research Engine" />
        <meta property="og:description" content="SurveyAgent designs the questionnaire, gathers qualified responses, and explains the signal so your team ships confident decisions." />
        <meta property="og:url" content="https://smartformai.com/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SmartFormAI SurveyAgent — Autonomous Market Research Engine",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "SurveyAgent drafts surveys, recruits respondents, and translates response streams into decision-ready narratives without manual lift."
            }
          `}
        </script>
      </Helmet>

      {/* Hero Section */}
      <Hero />

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Autonomy Validation Section */}
      <section className="w-full bg-white py-20 px-4" id="autonomy-proof">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-purple-50 text-sm font-medium text-purple-700">
              <Sparkles className="h-4 w-4" />
              The future of research is autonomous
            </span>
            <h2 className="text-3xl sm:text-4xl font-semibold text-black mt-6 mb-4">Autonomy isn&rsquo;t hype — it&rsquo;s engineered in</h2>
            <p className="text-base sm:text-lg text-black/70 leading-relaxed max-w-3xl mx-auto">
              We define autonomy as systems that act on intent, synthesize feedback, and improve themselves with minimal intervention. SmartFormAI already ships the first two layers and is rolling the third into public release.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {autonomyPillars.map((pillar, idx) => {
              const Icon = pillar.icon;
              return (
                <div key={idx} className="p-6 border border-black/10 rounded-2xl bg-white shadow-sm hover:shadow-md transition-shadow">
                  <div className="w-11 h-11 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="text-xl font-semibold text-black mb-3">{pillar.title}</h3>
                  <p className="text-sm text-black/65 leading-relaxed">{pillar.description}</p>
                </div>
              );
            })}
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="col-span-2 bg-gradient-to-r from-purple-50 via-white to-white border border-purple-100 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-3">Layered truth in the product narrative</h3>
              <ul className="space-y-3 text-sm text-purple-900/80">
                <li><strong>Headline:</strong> The world’s first fully autonomous, survey-based market research tool.</li>
                <li><strong>Subheadline:</strong> Powered by the SmartFormAI Insight Engine, with Auto-Rebuild capabilities rolling out.</li>
                <li><strong>Transparency:</strong> Agents already create, interpret, and summarize autonomously. Auto-Rebuild is in final testing before public release.</li>
              </ul>
            </div>
            <div className="bg-black text-white rounded-2xl p-6 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-semibold mb-3">What&rsquo;s next?</h3>
                <p className="text-sm text-white/80 leading-relaxed">
                  Auto-Rebuild moves from private testing to full launch soon. You&rsquo;ll get an in-product announcement the moment fully autonomous relaunch is available for every agent.
                </p>
              </div>
              <div className="mt-6 text-sm text-white/60">
                Stay ahead of the curve — build with the autonomy architecture today.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Documentation teaser */}
      <section className="w-full bg-white py-16 px-4">
        <div className="max-w-5xl mx-auto rounded-3xl border border-black/10 bg-gradient-to-r from-[#7B3FE4]/10 via-white to-white shadow-sm px-6 py-10 sm:px-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div className="space-y-3 max-w-2xl">
              <h2 className="text-2xl font-semibold text-black">Documentation Hub is coming soon</h2>
              <p className="text-sm sm:text-base text-black/70 leading-relaxed">
                We’re compiling deep-dive guides, setup playbooks, and API recipes. Everything will ship together once every example has been battle-tested with real survey traffic.
              </p>
            </div>
            <Button disabled variant="outline" className="w-full cursor-not-allowed opacity-70 sm:w-auto">
              Docs (Coming Soon)
            </Button>
          </div>
        </div>
      </section>

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
            <h2 className="text-3xl font-medium text-black mb-3">Autonomous research, engineered</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Each layer works together so your agents can initiate, interpret, and evolve market research without manual rebuilds.
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
            <h2 className="text-3xl font-medium text-black mb-3">See the autonomy stack in action</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Watch how SmartFormAI creates agents, interprets data, and prepares the next iteration — all inside one loop.
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
            <h2 className="text-3xl font-medium text-black mb-3">Trusted by teams building continuous insight loops</h2>
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

      {/* Who's it for Section - Unique: Target audience segmentation */}
      <section className="w-full bg-gradient-to-br from-purple-50 via-white to-pink-50 py-24 px-4" id="whos-it-for">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">Who it&rsquo;s for</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              SmartFormAI Agents adapts to your needs, whether you're validating ideas, gathering feedback, or conducting research
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Startup Founders */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-purple-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-pink-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Startup Founders</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-purple-50 to-transparent p-4 rounded-lg border border-purple-100">
                    <p className="text-sm font-semibold text-purple-800 mb-2">What They Want</p>
                    <p className="text-gray-700">Validate ideas, test messaging, and understand customer pain points</p>
                  </div>
                  <div className="bg-gradient-to-r from-pink-50 to-transparent p-4 rounded-lg border border-pink-100">
                    <p className="text-sm font-semibold text-pink-800 mb-2">Why They'll Love It</p>
                    <p className="text-gray-700">The agent learns and improves questions to reveal real customer needs and validate product-market fit automatically.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Marketers / Agencies */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-blue-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-cyan-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Marketers & Agencies</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-blue-50 to-transparent p-4 rounded-lg border border-blue-100">
                    <p className="text-sm font-semibold text-blue-800 mb-2">What They Want</p>
                    <p className="text-gray-700">Continuous feedback, campaign insights, and audience understanding</p>
                  </div>
                  <div className="bg-gradient-to-r from-cyan-50 to-transparent p-4 rounded-lg border border-cyan-100">
                    <p className="text-sm font-semibold text-cyan-800 mb-2">Why They'll Love It</p>
                    <p className="text-gray-700">Never rebuild surveys manually — AI adapts automatically based on campaign performance.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* UX / Product Teams */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-green-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-green-50/50 to-emerald-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">UX & Product Teams</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-green-50 to-transparent p-4 rounded-lg border border-green-100">
                    <p className="text-sm font-semibold text-green-800 mb-2">What They Want</p>
                    <p className="text-gray-700">Ongoing user research, usability testing, and feature validation</p>
                  </div>
                  <div className="bg-gradient-to-r from-emerald-50 to-transparent p-4 rounded-lg border border-emerald-100">
                    <p className="text-sm font-semibold text-emerald-800 mb-2">Why They'll Love It</p>
                    <p className="text-gray-700">Forms evolve based on usage patterns and user feedback to uncover deeper insights without manual edits.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Researchers */}
            <div className="group relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-white/20 hover:border-orange-200 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-50/50 to-red-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10">
                <div className="flex items-center mb-6">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg mr-4">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                    </svg>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Researchers</h3>
                </div>
                <div className="space-y-4">
                  <div className="bg-gradient-to-r from-orange-50 to-transparent p-4 rounded-lg border border-orange-100">
                    <p className="text-sm font-semibold text-orange-800 mb-2">What They Want</p>
                    <p className="text-gray-700">Faster, cleaner insights and statistically significant data collection</p>
                  </div>
                  <div className="bg-gradient-to-r from-red-50 to-transparent p-4 rounded-lg border border-red-100">
                    <p className="text-sm font-semibold text-red-800 mb-2">Why They'll Love It</p>
                    <p className="text-gray-700">Agents identify data trends and automatically refine questions to deepen research insights over time.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Divider */}
      <div className="w-full border-t border-black/10"></div>

      {/* Pricing Section - Unique: Elevated cards with shadow */}
      <section className="w-full bg-white py-24 px-4" id="pricing">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-medium text-black mb-3">Choose how you unlock autonomy</h2>
            <p className="text-base text-black/60 max-w-2xl mx-auto">
              Start experimenting for free or upgrade for unlimited autonomous agents and premium controls.
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
                <p className="text-sm text-black/60">Full access to all autonomy features</p>
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
                  SmartFormAI Agents is an autonomous research platform. Describe your intent and the AI creates, interprets, and evolves surveys for you — no manual question writing required.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q2" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  How does SmartFormAI Agents generate questions?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Our AI analyzes your prompt and context to architect the full survey — from tone to logic — and iterates using live data. It is the fastest way to launch research agents that continuously improve.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q3" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Can I embed agents on my website?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Yes. Every agent you create can be shared via a secure link or embedded directly on your website — and once deployed, autonomy keeps the loop running.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q4" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Is SmartFormAI Agents free to use?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  You can get started for free. The free plan lets you experience autonomous creation and insights. Paid plans unlock unlimited agents, advanced analytics, and governance controls.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q5" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Does SmartFormAI Agents include analytics?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Yes. Responses stream into your dashboard where the insight engine provides real-time analytics, summaries, and recommended actions.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q6" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  How is SmartFormAI Agents different from Google Forms?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Unlike Google Forms, SmartFormAI Agents initiate, interpret, and evolve surveys autonomously. You get a thinking system for research, not just a static form builder.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q7" className="border-b border-black/10">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Can I use SmartFormAI Agents for market research?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Absolutely. SmartFormAI Agents create professional surveys, surface insights, and prepare the next launch automatically — perfect for modern market research teams.
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="q8" className="border-b-0">
                <AccordionTrigger className="text-base font-medium text-black hover:text-[#7B3FE4] transition-colors py-4">
                  Is SmartFormAI Agents mobile-friendly?
                </AccordionTrigger>
                <AccordionContent className="text-sm text-black/60 pb-4 leading-relaxed pt-1">
                  Yes. Agents are responsive across devices, so every participant experiences the autonomous flow without friction.
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
            Ready to launch autonomous research?
          </h2>
          <p className="text-base text-black/60 mb-10 max-w-xl mx-auto">
            Create your first autonomous agent in seconds. No code, no hassle—just a self-improving insight loop.
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