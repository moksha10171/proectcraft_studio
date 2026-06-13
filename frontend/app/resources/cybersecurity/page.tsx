import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Shield, Zap, Code2, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import cybersecurityResources from '@/data/resources/cybersecurity-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

export const metadata: Metadata = generatePageMetadata({
  title: 'Cybersecurity Tools & Resources',
  description: 'Master penetration testing, network security, web application security, and ethical hacking with industry-standard tools and methodologies.',
  path: '/resources/cybersecurity',
  keywords: ['cybersecurity tools', 'penetration testing', 'Burp Suite', 'OWASP ZAP', 'Metasploit', 'Wireshark', 'Nmap', 'Kali Linux'],
});

export default function CybersecurityResourcesPage() {
  const { resources, overview } = cybersecurityResources;
  const categories = Array.from(new Set(resources.map(r => r.category)));

  // Categorize resources
  const webSecurity = resources.filter(r => r.category === 'Web Application Security');
  const networkSecurity = resources.filter(r => r.category === 'Network Security');
  const penetrationTesting = resources.filter(r => r.category === 'Penetration Testing');
  const forensics = resources.filter(r => r.category === 'Digital Forensics');

  const freeOptions = resources.filter(r =>
    r.pricing?.includes('Free') || r.pricing?.includes('100% Free')
  );

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('/resources/cybersecurity')} />
      <Header />
      <main role="main" aria-label="Cybersecurity Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-red-500/5 via-background to-background py-12 md:py-20">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <Link
              href="/resources"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors touch-action-manipulation active:scale-[0.98]"
              aria-label="Go back to all resources page"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Resources
            </Link>

            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-red-500/10 rounded-lg">
                <Shield className="h-8 w-8 text-red-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-red-600 to-red-400 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card>
                <CardContent className="pt-6">
                  <Shield className="h-8 w-8 text-red-500 mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">Security Tools</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{freeOptions.length}</div>
                  <p className="text-sm text-muted-foreground">Free Options</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">{categories.length}</div>
                  <p className="text-sm text-muted-foreground">Categories</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Code2 className="h-8 w-8 text-purple-500 mb-2" />
                  <div className="text-2xl font-bold">24/7</div>
                  <p className="text-sm text-muted-foreground">Security Focus</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Web Application Security */}
        {webSecurity.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Web Application Security</h2>
                <p className="text-muted-foreground text-lg">
                  Tools for identifying and exploiting web application vulnerabilities
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {webSecurity.map((resource: any) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-red-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 ml-4">
                          Web Security
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Pricing:</span>
                            <p className="font-semibold">{resource.pricing}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Category:</span>
                            <p>{resource.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Sparkles className="h-4 w-4" />
                            <span>Professional Tool</span>
                          </div>
                          <Link
                            href={`/resources/cybersecurity/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-red-600 hover:text-red-700 font-medium transition-colors"
                          >
                            Learn More
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Network Security */}
        {networkSecurity.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Network Security</h2>
                <p className="text-muted-foreground text-lg">
                  Network analysis, monitoring, and security assessment tools
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {networkSecurity.map((resource: any) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-blue-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 ml-4">
                          Network
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Pricing:</span>
                            <p className="font-semibold">{resource.pricing}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Category:</span>
                            <p>{resource.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Zap className="h-4 w-4" />
                            <span>Analysis Tool</span>
                          </div>
                          <Link
                            href={`/resources/cybersecurity/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                          >
                            Learn More
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Penetration Testing */}
        {penetrationTesting.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Penetration Testing</h2>
                <p className="text-muted-foreground text-lg">
                  Comprehensive frameworks and distributions for ethical hacking and penetration testing
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {penetrationTesting.map((resource: any) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-orange-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-500/10 dark:text-orange-400 ml-4">
                          Penetration Testing
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Pricing:</span>
                            <p className="font-semibold">{resource.pricing}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Category:</span>
                            <p>{resource.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Shield className="h-4 w-4" />
                            <span>Testing Framework</span>
                          </div>
                          <Link
                            href={`/resources/cybersecurity/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-orange-600 hover:text-orange-700 font-medium transition-colors"
                          >
                            Learn More
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Digital Forensics */}
        {forensics.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Digital Forensics</h2>
                <p className="text-muted-foreground text-lg">
                  Password cracking and digital evidence analysis tools
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {forensics.map((resource: any) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-purple-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 ml-4">
                          Forensics
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="font-medium text-muted-foreground">Pricing:</span>
                            <p className="font-semibold">{resource.pricing}</p>
                          </div>
                          <div>
                            <span className="font-medium text-muted-foreground">Category:</span>
                            <p>{resource.category}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Code2 className="h-4 w-4" />
                            <span>Analysis Tool</span>
                          </div>
                          <Link
                            href={`/resources/cybersecurity/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-purple-600 hover:text-purple-700 font-medium transition-colors"
                          >
                            Learn More
                            <ArrowLeft className="h-4 w-4 rotate-180" />
                          </Link>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="py-16 bg-red-500/5">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Start Your Cybersecurity Journey</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Learn ethical hacking, penetration testing, and security best practices with our comprehensive guides and tutorials.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center px-6 py-3 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                >
                  Try Virtual Labs
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Link>
                <Link
                  href="/resources/cybersecurity/burp-suite"
                  className="inline-flex items-center justify-center px-6 py-3 border border-red-200 text-red-600 rounded-lg font-medium hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
                >
                  Start with Burp Suite
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  );
}