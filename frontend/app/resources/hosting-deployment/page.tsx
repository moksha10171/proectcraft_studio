import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Cloud, DollarSign, Zap, Globe, Database, Server } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import hostingResources from '@/data/resources/hosting-deployment-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

export const metadata: Metadata = generatePageMetadata({
  title: 'Hosting & Deployment Guide 2026 - Free & Paid Options',
  description: 'Deploy your web apps with Vercel, Netlify, Railway, or Render. Compare free tiers, pricing, and features. Learn domain registration and database hosting.',
  path: '/resources/hosting-deployment',
  keywords: ['web hosting 2026', 'Vercel deployment', 'Netlify hosting', 'Railway', 'Render', 'free hosting', 'domain registration'],
});

export default function HostingDeploymentPage() {
  const { resources, overview } = hostingResources;
  const breadcrumbs = generateBreadcrumbs('/resources/hosting-deployment');

  const platformHosting = resources.filter(r => r.category === 'Platform Hosting');
  const backendHosting = resources.filter(r => r.category === 'Backend Hosting');
  const domains = resources.filter(r => r.category === 'Domain & DNS');
  const databases = resources.filter(r => r.category === 'Database Hosting');

  return (
    <>
      <BreadcrumbSchema items={breadcrumbs} />
      <Header />
      <main role="main" aria-label="Hosting and Deployment Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-primary/5 via-background to-background py-12 md:py-20">
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
              <div className="p-3 bg-primary/10 rounded-lg">
                <Cloud className="h-8 w-8 text-primary" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card>
                <CardContent className="pt-6">
                  <Server className="h-8 w-8 text-primary mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">Platforms</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <DollarSign className="h-8 w-8 text-green-500 mb-2" />
                  <div className="text-2xl font-bold">Free</div>
                  <p className="text-sm text-muted-foreground">Tier Available</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Zap className="h-8 w-8 text-yellow-500 mb-2" />
                  <div className="text-2xl font-bold">&lt;5min</div>
                  <p className="text-sm text-muted-foreground">Deploy Time</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <Globe className="h-8 w-8 text-blue-500 mb-2" />
                  <div className="text-2xl font-bold">Global</div>
                  <p className="text-sm text-muted-foreground">CDN Included</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Quick Start Guide */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-6">🚀 From Localhost to Production in 5 Minutes</h2>
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
                <Card>
                  <CardHeader>
                    <div className="text-3xl font-bold text-primary mb-2">1</div>
                    <CardTitle className="text-lg">Build Your App</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Test locally with our Build IDE or your own setup
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="text-3xl font-bold text-primary mb-2">2</div>
                    <CardTitle className="text-lg">Push to GitHub</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Commit your code to a GitHub repository
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="text-3xl font-bold text-primary mb-2">3</div>
                    <CardTitle className="text-lg">Connect Platform</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Link GitHub to Vercel/Netlify (one click)
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader>
                    <div className="text-3xl font-bold text-primary mb-2">4</div>
                    <CardTitle className="text-lg">Live in Seconds</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Auto-deploy with free SSL and global CDN
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Platform Hosting (Frontend) */}
        <section className="py-12">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-2">Frontend Hosting Platforms</h2>
            <p className="text-muted-foreground mb-8">
              Perfect for Next.js, React, Vue, and static sites with automatic deployments
            </p>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {platformHosting.map((platform) => (
                <Card key={platform.slug} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{platform.name}</CardTitle>
                        <CardDescription>{platform.shortDesc}</CardDescription>
                      </div>
                      <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                        FREE
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Specifications */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Free Bandwidth:</span>
                        <span className="font-semibold">{platform.specifications['Free Tier']}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Custom Domains:</span>
                        <span className="font-semibold">{platform.specifications['Custom Domains']}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Pricing:</span>
                        <span className="font-semibold text-primary">{platform.pricing}</span>
                      </div>
                    </div>

                    {/* Best For */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                      <div className="flex flex-wrap gap-2">
                        {platform.bestFor.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs max-w-full truncate" title={item}>
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/resources/hosting-deployment/${platform.slug}`}
                      className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-center font-medium hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98]"
                    >
                      View Setup Guide
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Backend Hosting */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <h2 className="text-3xl font-bold mb-2">Backend & Full-Stack Hosting</h2>
            <p className="text-muted-foreground mb-8">
              Deploy Node.js, Python, Go APIs with built-in databases
            </p>

            <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2">
              {backendHosting.map((platform) => (
                <Card key={platform.slug} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl mb-2">{platform.name}</CardTitle>
                        <CardDescription>{platform.shortDesc}</CardDescription>
                      </div>
                      {platform.specifications['Free Tier'] && (
                        <Badge className="bg-green-500/10 text-green-700 dark:text-green-400">
                          FREE
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Specifications */}
                    <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Free Tier:</span>
                        <span className="font-semibold">{platform.specifications['Free Tier']}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Databases:</span>
                        <span className="font-semibold">{platform.specifications['Databases']}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Est. Cost:</span>
                        <span className="font-semibold text-primary">{platform.pricing}</span>
                      </div>
                    </div>

                    {/* Best For */}
                    <div>
                      <h4 className="font-semibold text-sm mb-2">Best For:</h4>
                      <div className="flex flex-wrap gap-2">
                        {platform.bestFor.slice(0, 3).map((item, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs max-w-full truncate" title={item}>
                            {item}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* CTA */}
                    <Link
                      href={`/resources/hosting-deployment/${platform.slug}`}
                      className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-center font-medium hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98]"
                    >
                      View Setup Guide
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Domain & Database */}
        <section className="py-12">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="grid gap-8 sm:grid-cols-1 md:grid-cols-2">
              {/* Domains */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Globe className="h-6 w-6 text-primary" />
                  Domain Registration
                </h2>
                {domains.map((domain) => (
                  <Card key={domain.slug} className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-lg">{domain.name}</CardTitle>
                      <CardDescription>{domain.shortDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">.com domain:</span>
                          <span className="font-semibold">{domain.specifications['Pricing (.com)']}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Free features:</span>
                          <span className="font-semibold">{domain.specifications['Free Features']}</span>
                        </div>
                      </div>
                      <Link
                        href={`/resources/hosting-deployment/${domain.slug}`}
                        className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-center font-medium hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98]"
                      >
                        Domain Setup Guide
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Databases */}
              <div>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Database className="h-6 w-6 text-primary" />
                  Database Hosting
                </h2>
                {databases.map((db) => (
                  <Card key={db.slug} className="mb-4">
                    <CardHeader>
                      <CardTitle className="text-lg">{db.name}</CardTitle>
                      <CardDescription>{db.shortDesc}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Free tier:</span>
                          <span className="font-semibold">{db.specifications['Free Tier']}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Database:</span>
                          <span className="font-semibold">{db.specifications['Database']}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Pricing:</span>
                          <span className="font-semibold text-primary">{db.pricing}</span>
                        </div>
                      </div>
                      <Link
                        href={`/resources/hosting-deployment/${db.slug}`}
                        className="block w-full py-2 px-4 bg-primary text-primary-foreground rounded-md text-center font-medium hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98]"
                      >
                        Database Setup Guide
                      </Link>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Cost Calculator */}
        <section className="py-12 bg-muted/30">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8 text-center">💰 Typical Monthly Costs</h2>

              <div className="grid gap-6 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                <Card className="border-2 border-green-500/20">
                  <CardHeader>
                    <Badge className="w-fit bg-green-500 mb-2">FREE</Badge>
                    <CardTitle>Hobby Project</CardTitle>
                    <CardDescription>Perfect for learning and side projects</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">$0/mo</div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Vercel/Netlify (frontend)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Render (backend, 750 hrs)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Supabase (500MB DB)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>GitHub Pages (static)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-primary/20">
                  <CardHeader>
                    <Badge className="w-fit mb-2">STARTER</Badge>
                    <CardTitle>Small Business</CardTitle>
                    <CardDescription>Low-traffic production apps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">$15-30/mo</div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Domain: $10/year (~$1/mo)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Railway: $5-10/mo</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Vercel Pro: $20/mo (optional)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Supabase: $25/mo (8GB DB)</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="border-2 border-blue-500/20">
                  <CardHeader>
                    <Badge className="w-fit bg-blue-500 mb-2">SCALE</Badge>
                    <CardTitle>Growing Startup</CardTitle>
                    <CardDescription>High-traffic production apps</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold mb-4">$50-100/mo</div>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Vercel Pro: $20/mo</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Railway: $20-40/mo</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Supabase Pro: $25/mo</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">✓</span>
                        <span>Monitoring & extras: $10/mo</span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16 text-center">
            <h2 className="text-3xl font-bold mb-4">Build First, Deploy Later</h2>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Test your web apps in our Build IDE before deploying to production
            </p>
            <Link
              href="/build"
              className="px-8 py-4 bg-primary text-primary-foreground rounded-lg font-semibold hover:bg-primary/90 transition-colors touch-action-manipulation active:scale-[0.98] inline-flex items-center gap-2"
            >
              <Zap className="h-5 w-5" />
              Launch Build IDE
            </Link>
          </div>
        </section>
      </main>
      <Footer />
      <BottomNavigation />
    </>
  );
}
