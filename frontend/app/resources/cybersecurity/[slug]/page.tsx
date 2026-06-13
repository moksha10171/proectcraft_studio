import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, ExternalLink, Shield, Download, Star, Clock, Users } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import cybersecurityResources from '@/data/resources/cybersecurity-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const resource = cybersecurityResources.resources.find((r: any) => r.slug === slug);

  if (!resource) {
    return {
      title: 'Resource Not Found',
    };
  }

  return generatePageMetadata({
    title: `${resource.name} - Cybersecurity Tool Guide`,
    description: resource.fullDescription || resource.shortDesc,
    path: `/resources/cybersecurity/${slug}`,
    keywords: [resource.name, 'cybersecurity', 'security tools', 'penetration testing'],
  });
}

export default async function CybersecurityResourcePage({ params }: PageProps) {
  const { slug } = await params;
  const resource = cybersecurityResources.resources.find((r: any) => r.slug === slug);

  if (!resource) {
    notFound();
  }

  const breadcrumbs = generateBreadcrumbs(`/resources/cybersecurity/${slug}`);

  // Get theme color based on category
  const getThemeColor = (category: string) => {
    switch (category) {
      case 'Web Application Security': return 'red';
      case 'Network Security': return 'blue';
      case 'Penetration Testing': return 'orange';
      case 'Digital Forensics': return 'purple';
      default: return 'red';
    }
  };

  const themeColor = getThemeColor(resource.category);

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <main role="main" aria-label={`${resource.name} Details`} className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className={`bg-gradient-to-b from-${themeColor}-500/5 via-background to-background py-12 md:py-20`}>
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <Link
              href="/resources/cybersecurity"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6 transition-colors touch-action-manipulation active:scale-[0.98]"
              aria-label="Go back to cybersecurity resources"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Cybersecurity Resources
            </Link>

            <div className="flex items-center gap-4 mb-6">
              <div className={`p-4 bg-${themeColor}-500/10 rounded-xl`}>
                <Shield className={`h-10 w-10 text-${themeColor}-500`} />
              </div>
              <div>
                <Badge className={`bg-${themeColor}-100 text-${themeColor}-700 dark:bg-${themeColor}-500/10 dark:text-${themeColor}-400 mb-2`}>
                  {resource.category}
                </Badge>
                <h1 className="text-4xl md:text-5xl font-bold">
                  {resource.name}
                </h1>
              </div>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {resource.fullDescription}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl">
              <Card>
                <CardContent className="pt-4">
                  <Download className="h-6 w-6 text-muted-foreground mb-2" />
                  <div className="text-lg font-semibold">{resource.pricing}</div>
                  <p className="text-xs text-muted-foreground">Pricing</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <Star className="h-6 w-6 text-yellow-500 mb-2" />
                  <div className="text-lg font-semibold">Professional</div>
                  <p className="text-xs text-muted-foreground">Level</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <Shield className="h-6 w-6 text-green-500 mb-2" />
                  <div className="text-lg font-semibold">Security</div>
                  <p className="text-xs text-muted-foreground">Focus</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-4">
                  <Users className="h-6 w-6 text-blue-500 mb-2" />
                  <div className="text-lg font-semibold">Enterprise</div>
                  <p className="text-xs text-muted-foreground">Usage</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Specifications */}
        {resource.specifications && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Technical Specifications</h2>
              <div className="grid gap-6 md:grid-cols-2">
                {Object.entries(resource.specifications).map(([key, value]: [string, any]) => (
                  <Card key={key}>
                    <CardContent className="pt-6">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </h3>
                          <p className="text-lg font-medium mt-1">{value}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Features */}
        {resource.features && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Key Features</h2>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {Object.entries(resource.features).map(([feature, description]: [string, any]) => (
                  <Card key={feature} className="hover:shadow-md transition-shadow">
                    <CardContent className="pt-6">
                      <h3 className="font-semibold mb-2">{feature}</h3>
                      <p className="text-sm text-muted-foreground">{description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Use Cases */}
        {resource.useCases && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Common Use Cases</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {resource.useCases.map((useCase: string, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full bg-${themeColor}-500 mt-2 flex-shrink-0`} />
                        <p className="text-muted-foreground">{useCase}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Best Practices */}
        {resource.bestPractices && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Best Practices</h2>
              <div className="grid gap-4">
                {resource.bestPractices.map((practice: string, index: number) => (
                  <Card key={index}>
                    <CardContent className="pt-6">
                      <div className="flex items-start gap-3">
                        <div className={`w-6 h-6 rounded-full bg-${themeColor}-500 flex items-center justify-center flex-shrink-0 mt-0.5`}>
                          <span className="text-white text-xs font-semibold">{index + 1}</span>
                        </div>
                        <p className="text-muted-foreground">{practice}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Code Example */}
        {resource.codeSnippet && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Code Example</h2>
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">{resource.codeSnippet.title}</CardTitle>
                  <CardDescription>{resource.codeSnippet.language}</CardDescription>
                </CardHeader>
                <CardContent>
                  <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-sm">
                    <code>{resource.codeSnippet.code}</code>
                  </pre>
                </CardContent>
              </Card>
            </div>
          </section>
        )}

        {/* Tutorials */}
        {resource.tutorials && resource.tutorials.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Learning Resources</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {resource.tutorials.map((tutorial: any, index: number) => (
                  <Card key={index} className={`hover:border-${themeColor}-500/50 transition-colors`}>
                    <CardContent className="pt-6">
                      <a
                        href={tutorial.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-start gap-3 group"
                      >
                        <div className="flex-1">
                          <h3 className="font-semibold mb-1 group-hover:text-primary transition-colors">
                            {tutorial.title}
                          </h3>
                          <p className="text-xs text-muted-foreground">{tutorial.url}</p>
                        </div>
                        <ExternalLink className={`h-4 w-4 text-muted-foreground group-hover:text-${themeColor}-600 dark:group-hover:text-${themeColor}-400 shrink-0 mt-1`} />
                      </a>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Alternatives */}
        {resource.alternatives && resource.alternatives.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <h2 className="text-3xl font-bold mb-8">Alternative Tools</h2>
              <div className="flex flex-wrap gap-2">
                {resource.alternatives.map((alternative: string, index: number) => (
                  <Badge key={index} variant="secondary" className="text-sm py-1 px-3">
                    {alternative}
                  </Badge>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className={`py-16 bg-${themeColor}-500/5`}>
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Ready to Master {resource.name}?</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Start learning cybersecurity with hands-on projects and virtual labs. Build real-world security skills.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/studio"
                  className={`inline-flex items-center justify-center px-6 py-3 bg-${themeColor}-600 text-white rounded-lg font-medium hover:bg-${themeColor}-700 transition-colors`}
                >
                  Try Virtual Security Labs
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Link>
                <Link
                  href="/projects"
                  className={`inline-flex items-center justify-center px-6 py-3 border border-${themeColor}-200 text-${themeColor}-600 rounded-lg font-medium hover:bg-${themeColor}-50 dark:hover:bg-${themeColor}-500/10 transition-colors`}
                >
                  Explore Security Projects
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