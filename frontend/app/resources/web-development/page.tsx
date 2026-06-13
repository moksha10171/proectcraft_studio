import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Globe, Code2, Zap, Package, TrendingUp, DollarSign, BookOpen } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import webResources from '@/data/resources/web-development-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';
import { Button } from '@/components/ui/button';
import { CodeSnippet } from '@/components/code-snippet';

export const metadata: Metadata = generatePageMetadata({
  title: 'Web Development Resources - React, Next.js, Node.js & More',
  description: 'Master modern web development: React 18+, Next.js 15, Node.js, TypeScript, Tailwind CSS. Build production-ready apps with best practices and code examples.',
  path: '/resources/web-development',
  keywords: ['React 18', 'Next.js 15', 'Node.js', 'TypeScript', 'Tailwind CSS', 'web development', 'frontend frameworks'],
});

export default function WebDevelopmentResourcesPage() {
  const { resources, overview } = webResources;
  const categories = Array.from(new Set(resources.map(r => r.category)));
  const breadcrumbs = generateBreadcrumbs('/resources/web-development');

  // Categorize resources
  const frontendFrameworks = resources.filter(r => r.category === 'Frontend Frameworks');
  const backendTools = resources.filter(r => r.category === 'Backend Development');
  const fullStackTools = resources.filter(r => r.category === 'Full-Stack Tools');

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <main role="main" aria-label="Web Development Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-emerald-500/5 via-background to-background py-12 md:py-20 border-b border-border">
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
              <div className="p-3 bg-emerald-500/10 rounded-lg">
                <Globe className="h-8 w-8 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-emerald-600 to-emerald-400 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="pt-6">
                  <Code2 className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">Frameworks</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">Free & Open</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="pt-6">
                  <TrendingUp className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold">Top</div>
                  <p className="text-sm text-muted-foreground">Industry Tools</p>
                </CardContent>
              </Card>
              <Card className="bg-emerald-500/5 border-emerald-500/20">
                <CardContent className="pt-6">
                  <BookOpen className="h-8 w-8 text-emerald-600 dark:text-emerald-400 mb-2" />
                  <div className="text-2xl font-bold">50+</div>
                  <p className="text-sm text-muted-foreground">Examples</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Frontend Frameworks Section */}
        <section className="py-16 border-b border-border">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-emerald-500/10 rounded-lg">
                <Code2 className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h2 className="text-3xl font-bold">Frontend Frameworks</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {frontendFrameworks.map((resource) => (
                <Card key={resource.slug} className="group hover:shadow-lg transition-all hover:border-emerald-500/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20">
                        {resource.category}
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {resource.pricing}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition-colors">
                      {resource.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {resource.shortDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                        Key Features
                      </h4>
                      <ul className="space-y-1">
                        {Object.entries(resource.features || {}).slice(0, 4).map(([key, value]) => (
                          <li key={key} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-emerald-500 mt-1">•</span>
                            <span><strong>{key}:</strong> {value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {resource.bestFor && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                        <div className="flex flex-wrap gap-2">
                          {resource.bestFor.slice(0, 3).map((use, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs max-w-full truncate" title={use}>
                              {use}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border space-y-2">
                      <Link
                        href={`/resources/web-development/${resource.slug}`}
                        className="block w-full py-2 px-4 bg-emerald-600 text-white rounded-md text-center text-sm font-medium hover:bg-emerald-700 transition-colors touch-action-manipulation active:scale-[0.98]"
                        aria-label={`View full details and code examples for ${resource.name}`}
                      >
                        View Full Details & Code Examples
                      </Link>
                      {resource.tutorials && resource.tutorials.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full touch-action-manipulation active:scale-[0.98]"
                        >
                          <a
                            href={resource.tutorials[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <BookOpen className="h-4 w-4" />
                            Official Docs
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Backend Development Section */}
        <section className="py-16 border-b border-border bg-muted/30">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h2 className="text-3xl font-bold">Backend Development</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {backendTools.map((resource) => (
                <Card key={resource.slug} className="group hover:shadow-lg transition-all hover:border-blue-500/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-500/20">
                        {resource.category}
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {resource.pricing}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {resource.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {resource.shortDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                        Key Features
                      </h4>
                      <ul className="space-y-1">
                        {Object.entries(resource.features || {}).slice(0, 4).map(([key, value]) => (
                          <li key={key} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-blue-500 mt-1">•</span>
                            <span><strong>{key}:</strong> {value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {resource.bestFor && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                        <div className="flex flex-wrap gap-2">
                          {resource.bestFor.slice(0, 3).map((use, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs max-w-full truncate" title={use}>
                              {use}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border space-y-2">
                      <Link
                        href={`/resources/web-development/${resource.slug}`}
                        className="block w-full py-2 px-4 bg-emerald-600 text-white rounded-md text-center text-sm font-medium hover:bg-emerald-700 transition-colors touch-action-manipulation active:scale-[0.98]"
                      >
                        View Full Details & Code Examples
                      </Link>
                      {resource.tutorials && resource.tutorials.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full touch-action-manipulation active:scale-[0.98]"
                        >
                          <a
                            href={resource.tutorials[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <BookOpen className="h-4 w-4" />
                            Official Docs
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Full-Stack Tools Section */}
        <section className="py-16 border-b border-border">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-2 bg-purple-500/10 rounded-lg">
                <Zap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h2 className="text-3xl font-bold">Full-Stack Tools & Build Tools</h2>
            </div>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {fullStackTools.map((resource) => (
                <Card key={resource.slug} className="group hover:shadow-lg transition-all hover:border-purple-500/50">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-2">
                      <Badge className="bg-purple-100 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400 border-purple-200 dark:border-purple-500/20">
                        {resource.category}
                      </Badge>
                      <Badge variant="secondary" className="ml-2">
                        <DollarSign className="h-3 w-3 mr-1" />
                        {resource.pricing}
                      </Badge>
                    </div>
                    <CardTitle className="text-2xl group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                      {resource.name}
                    </CardTitle>
                    <CardDescription className="text-base">
                      {resource.shortDesc}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-sm mb-2 flex items-center gap-2">
                        <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                        Key Features
                      </h4>
                      <ul className="space-y-1">
                        {Object.entries(resource.features || {}).slice(0, 4).map(([key, value]) => (
                          <li key={key} className="text-sm text-muted-foreground flex items-start gap-2">
                            <span className="text-purple-500 mt-1">•</span>
                            <span><strong>{key}:</strong> {value}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {resource.bestFor && (
                      <div>
                        <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                        <div className="flex flex-wrap gap-2">
                          {resource.bestFor.slice(0, 3).map((use, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs max-w-full truncate" title={use}>
                              {use}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-4 border-t border-border space-y-2">
                      <Link
                        href={`/resources/web-development/${resource.slug}`}
                        className="block w-full py-2 px-4 bg-emerald-600 text-white rounded-md text-center text-sm font-medium hover:bg-emerald-700 transition-colors touch-action-manipulation active:scale-[0.98]"
                      >
                        View Full Details & Code Examples
                      </Link>
                      {resource.tutorials && resource.tutorials.length > 0 && (
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                          className="w-full touch-action-manipulation active:scale-[0.98]"
                        >
                          <a
                            href={resource.tutorials[0].url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2"
                          >
                            <BookOpen className="h-4 w-4" />
                            Official Docs
                          </a>
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-gradient-to-b from-emerald-500/5 to-background">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <Card className="border-2 border-emerald-500/20 bg-emerald-500/5">
              <CardContent className="pt-6">
                <div className="text-center max-w-2xl mx-auto">
                  <Globe className="h-12 w-12 text-emerald-600 dark:text-emerald-400 mx-auto mb-4" />
                  <h2 className="text-3xl font-bold mb-4">Start Building Modern Web Apps</h2>
                  <p className="text-muted-foreground mb-6">
                    Test your web projects in our Build IDE with live preview, or explore AI-powered tools to build faster.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button size="lg" asChild className="touch-action-manipulation active:scale-[0.98]">
                      <Link href="/build">
                        Try Build IDE
                      </Link>
                    </Button>
                    <Button size="lg" variant="outline" asChild className="touch-action-manipulation active:scale-[0.98]">
                      <Link href="/resources/ai-development">
                        AI Coding Tools
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      </main>

      <Footer />
      <BottomNavigation />
    </>
  );
}
