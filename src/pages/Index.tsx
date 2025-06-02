import React from 'react';
import { Helmet } from 'react-helmet';
import Layout from '@/components/layout/Layout';
import Hero from '@/components/sections/Hero';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@/components/ui/accordion';

const features = [
  {
    icon: '✍️',
    title: 'AI-Powered Question Generation',
    description: 'Leverage advanced AI to instantly generate professional, relevant questions for any business use case—no technical skills required.'
  },
  {
    icon: '🚀',
    title: 'Instant Form Publishing',
    description: 'Launch secure, branded forms in seconds. Share via custom link or embed directly on your website.'
  },
  {
    icon: '📊',
    title: 'Real-Time Analytics',
    description: 'Track responses and visualize data with live dashboards—empowering data-driven decisions for your team.'
  },
  {
    icon: '🤖',
    title: 'No-Code Form Builder',
    description: 'Easily edit, customize, and manage forms with a modern, intuitive interface—built for business users.'
  },
  {
    icon: '🔗',
    title: 'Seamless Integrations',
    description: 'Connect with your favorite tools and automate workflows. SmartFormAI fits right into your business stack.'
  },
  {
    icon: '⚡',
    title: 'Enterprise-Grade Security',
    description: 'Your data is protected with industry-leading security, compliance, and privacy standards.'
  },
];

const testimonials = [
  {
    name: "Sarah T.",
    role: "Head of Marketing",
    company: "TechStartup Inc.",
    quote: "SmartFormAI enabled our team to launch market research surveys 5x faster. The analytics and AI-generated questions are a game changer for B2B feedback." 
  },
  {
    name: "Michael R.",
    role: "Research Lead",
    company: "Consumer Brands Ltd.",
    quote: "We trust SmartFormAI for all our enterprise survey needs. The platform is secure, reliable, and delivers actionable insights instantly."
  },
  {
    name: "Jessica K.",
    role: "Customer Experience Director",
    company: "Service Solutions",
    quote: "SmartFormAI's AI-powered forms have improved our response rates and data quality. Highly recommended for any business focused on customer feedback."
  }
];

const useCases = [
  {
    title: "Customer Feedback",
    description: "Collect actionable feedback with AI-generated forms tailored for business insights.",
    icon: "🎯",
    link: "/ai-form-generator-for-feedback"
  },
  {
    title: "Market Research",
    description: "Launch targeted surveys and analyze results in real time—no manual question writing required.",
    icon: "📊",
    link: "/ai-form-generator-types"
  },
  {
    title: "Lead Generation",
    description: "Capture qualified leads with high-converting, customizable forms powered by AI.",
    icon: "💼",
    link: "/ai-form-generator-types"
  },
  {
    title: "Event Registration",
    description: "Streamline event signups with branded, intelligent registration forms.",
    icon: "🎟️",
    link: "/ai-form-generator-types"
  }
];

const trustedBy = [
  { name: 'Acme Corp', logo: '/trusted/acme.svg' },
  { name: 'Globex', logo: '/trusted/globex.svg' },
  { name: 'Initech', logo: '/trusted/initech.svg' },
  { name: 'Umbrella', logo: '/trusted/umbrella.svg' },
];

const Index: React.FC = () => {
  return (
    <Layout metaTitle="AI Form Generator for Business | SmartFormAI" metaDescription="SmartFormAI is the enterprise-grade AI form generator for business, research, and feedback. Instantly create, publish, and analyze secure forms with advanced AI and real-time analytics. Created by Rein Watashi.">
      <Helmet>
        <link rel="canonical" href="https://smartformai.vercel.app/" />
        <meta property="og:title" content="AI Form Generator for Business | SmartFormAI" />
        <meta property="og:description" content="Enterprise-grade AI form generator for business, research, and feedback. Instantly create, publish, and analyze secure forms with advanced AI and real-time analytics." />
        <meta property="og:url" content="https://smartformai.vercel.app/" />
        <meta property="og:type" content="website" />
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "SmartFormAI - AI Form Generator",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "USD"
              },
              "description": "Enterprise-grade AI form generator for business, research, and feedback. Instantly create, publish, and analyze secure forms with advanced AI and real-time analytics."
            }
          `}
        </script>
      </Helmet>

      {/* Hero Section */}
      <Hero />
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300 rounded-full opacity-30" />
</div>
      {/* Demo Video Section */}
      <section className="container mx-auto px-4 py-12 text-center" id="demo">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">See SmartFormAI in Action</h2>
             <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
          Watch how you can create, publish, and analyze professional forms in seconds—no code, no hassle.
             </p>
        <div className="relative w-full max-w-4xl mx-auto h-[300px] md:h-[450px] rounded-lg overflow-hidden shadow-xl border border-gray-200 mb-8">
              <iframe 
                width="100%" 
                height="100%" 
                src="https://www.youtube.com/embed/614L29Y-jO0?rel=0" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                allowFullScreen
            title="AI Form Generator Demo - SmartFormAI"
              ></iframe>
            </div>
        <Button className="bg-smartform-blue hover:bg-blue-700 text-white font-bold text-lg px-8 py-3 rounded-lg shadow-md transition-all duration-200" asChild>
          <a href="https://smartformai.vercel.app/survey/0c1c6074-2241-43e4-a109-b35960f887ae" target="_blank" rel="noopener noreferrer" aria-label="Try our AI form generator demo">
            Try the Demo
              </a>
            </Button>
      </section>
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300 rounded-full opacity-30" />
      </div>
      {/* Use Cases Section */}
      <section className="container mx-auto px-4 py-12 bg-gray-50 rounded-xl" id="use-cases">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Business Use Cases</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {useCases.map((useCase, idx) => (
            <Card key={idx} className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <span className="text-3xl">{useCase.icon}</span>
                <CardTitle className="text-lg font-bold">{useCase.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-base mb-4">{useCase.description}</p>
                <Button className="w-full" variant="outline" asChild>
                  <Link to={useCase.link}>Learn More</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300 rounded-full opacity-30" />
              </div>
      {/* Features/Benefits Section */}
      <section className="container mx-auto px-4 py-12" id="features">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {features.map((feature, idx) => (
            <Card key={idx} className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all">
              <CardHeader className="flex flex-row items-center gap-4">
                <span className="text-3xl">{feature.icon}</span>
                <CardTitle className="text-lg">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 text-base">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300 rounded-full opacity-30" />
        </div>
      {/* Testimonials Section */}
      <section className="container mx-auto px-4 py-12 bg-gray-50 rounded-xl" id="testimonials">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">What Our Clients Say</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {testimonials.map((testimonial, idx) => (
            <Card key={idx} className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all">
              <CardContent className="pt-6">
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-400">
                    {'★★★★★'.split('').map((star, i) => (
                      <span key={i}>{star}</span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-700 text-base italic mb-4">"{testimonial.quote}"</p>
                <div className="border-t pt-4">
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-gray-600">{testimonial.role}, {testimonial.company}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      {/* Specialized AI Form Generators Section */}
      <section className="container mx-auto px-4 py-12" id="specialized-generators">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Specialized AI Form Generators</h2>
        <p className="text-lg text-gray-700 max-w-3xl mx-auto mb-8 text-center">
          Explore tools for surveys, feedback, research, and more—tailored for business.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center gap-4">
              <span className="text-3xl">📊</span>
              <CardTitle className="text-lg">AI Form Generator for Surveys</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-base mb-4">Create professional survey forms with AI-generated questions that maximize response rates and valuable insights.</p>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/ai-form-generator-for-surveys">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center gap-4">
              <span className="text-3xl">💬</span>
              <CardTitle className="text-lg">AI Form Generator for Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-base mb-4">Get actionable customer feedback with intelligently designed forms that encourage detailed, useful responses.</p>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/ai-form-generator-for-feedback">Learn More</Link>
              </Button>
            </CardContent>
          </Card>
          <Card className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-all">
            <CardHeader className="flex flex-row items-center gap-4">
              <span className="text-3xl">📋</span>
              <CardTitle className="text-lg">More Form Generator Tools</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 text-base mb-4">Explore our full range of AI form generators for market research, lead generation, event registration, and more.</p>
              <Button className="w-full" variant="outline" asChild>
                <Link to="/ai-form-generator-types">View All Types</Link>
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Call to Action Section */}
      <section className="text-center py-12 bg-gradient-to-r from-gray-50 to-blue-50 rounded-xl my-12" id="get-started">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6 leading-tight">
          Ready to Build Smarter Forms?
            </h2>
             <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-700">
          Create your first AI-powered form in seconds. No code, no hassle—just results.
             </p>
        <Button className="bg-smartform-blue hover:bg-blue-700 text-white font-bold text-lg px-10 py-4 rounded-lg shadow-lg" size="lg" asChild>
          <Link to="/signup">Get Started</Link>
            </Button>
        <p className="text-sm text-gray-600 mt-3">Created by Rein Watashi</p>
           </section>
      {/* Divider */}
      <div className="my-12 w-full flex justify-center">
        <div className="h-1 w-24 bg-gradient-to-r from-gray-300 via-blue-200 to-gray-300 rounded-full opacity-30" />
      </div>
      {/* FAQ Section */}
      <section className="container mx-auto px-4 py-12 max-w-2xl" id="faq">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Frequently Asked Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="q1">
            <AccordionTrigger>What is SmartFormAI?</AccordionTrigger>
            <AccordionContent>
              SmartFormAI is an enterprise-grade AI form generator that empowers businesses to create, publish, and analyze forms instantly. Describe your needs, and our AI generates tailored questions for surveys, feedback, and more—no coding required.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q2">
            <AccordionTrigger>How does SmartFormAI generate questions?</AccordionTrigger>
            <AccordionContent>
              Our AI analyzes your prompt and context to create relevant, clear, and effective questions, adapting to your business requirements. It's the fastest way to build professional forms for any use case.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q3">
            <AccordionTrigger>Can I embed forms on my website?</AccordionTrigger>
            <AccordionContent>
              Yes. Every form you create can be shared via a secure link or embedded directly on your website. Perfect for businesses that want custom forms without complex software.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q4">
            <AccordionTrigger>Is SmartFormAI free to use?</AccordionTrigger>
            <AccordionContent>
              You can get started for free. Our free plan includes essential features, while paid plans unlock advanced analytics, customization, and integrations for business needs.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q5">
            <AccordionTrigger>Does SmartFormAI include analytics?</AccordionTrigger>
            <AccordionContent>
              Yes. All responses are collected in your dashboard, where you can view real-time insights and visual charts for every form you publish.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q6">
            <AccordionTrigger>How is SmartFormAI different from Google Forms?</AccordionTrigger>
            <AccordionContent>
              Unlike Google Forms, SmartFormAI uses AI to automatically create tailored questions, offers advanced analytics, custom branding, and enterprise-grade security—making it the best choice for business forms.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q7">
            <AccordionTrigger>Can I use SmartFormAI for market research?</AccordionTrigger>
            <AccordionContent>
              Absolutely. SmartFormAI creates professional surveys with intelligent questions designed to gather meaningful data. Built-in analytics help you extract valuable insights for your business.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="q8">
            <AccordionTrigger>Is SmartFormAI mobile-friendly?</AccordionTrigger>
            <AccordionContent>
              Yes. All forms are fully responsive and mobile-friendly, ensuring a seamless experience for your respondents on any device.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </section>
    </Layout>
  );
};

export default Index;
