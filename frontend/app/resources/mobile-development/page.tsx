import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Smartphone, Zap, Code2, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import mobileResources from '@/data/resources/mobile-development-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

export const metadata: Metadata = generatePageMetadata({
  title: 'Mobile Development Frameworks & Tools',
  description: 'Comprehensive mobile development ecosystem covering native iOS/Android development, cross-platform frameworks, and essential tools for building modern mobile applications.',
  path: '/resources/mobile-development',
  keywords: ['mobile development', 'React Native', 'Flutter', 'Swift', 'Kotlin', 'iOS development', 'Android development'],
});

export default function MobileDevelopmentResourcesPage() {
  const { resources, overview } = mobileResources;
  const categories = Array.from(new Set(resources.map(r => r.category)));

  // Categorize resources
  const crossPlatform = resources.filter(r => r.category === 'Cross-Platform Frameworks');
  const nativeIOS = resources.filter(r => r.category === 'Native iOS Development');
  const nativeAndroid = resources.filter(r => r.category === 'Native Android Development');
  const hybrid = resources.filter(r => r.category === 'Hybrid Development');
  const uiDesign = resources.filter(r => r.category === 'Mobile UI/UX Design');
  const devTools = resources.filter(r => r.category === 'Development Tools');

  const freeOptions = resources.filter(r =>
    r.pricing?.includes('Free') || r.pricing?.includes('100% Free')
  );

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('/resources/mobile-development')} />
      <Header />
      <main role="main" aria-label="Mobile Development Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-indigo-500/5 via-background to-background py-12 md:py-20">
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
              <div className="p-3 bg-indigo-500/10 rounded-lg">
                <Smartphone className="h-8 w-8 text-indigo-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-indigo-600 to-indigo-400 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card>
                <CardContent className="pt-6">
                  <Smartphone className="h-8 w-8 text-indigo-500 mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">Mobile Frameworks</p>
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
                  <Code2 className="h-8 w-8 text-orange-500 mb-2" />
                  <div className="text-2xl font-bold">Cross</div>
                  <p className="text-sm text-muted-foreground">Platform</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Cross-Platform Frameworks */}
        {crossPlatform.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Cross-Platform Frameworks</h2>
                <p className="text-muted-foreground text-lg">
                  Single codebase solutions for building apps that run on both iOS and Android
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {crossPlatform.map((resource) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-indigo-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-indigo-100 text-indigo-700 dark:bg-indigo-500/10 dark:text-indigo-400 ml-4">
                          Cross-Platform
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
                            <span>Single Codebase</span>
                          </div>
                          <Link
                            href={`/resources/mobile-development/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
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

        {/* Native iOS Development */}
        {nativeIOS.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Native iOS Development</h2>
                <p className="text-muted-foreground text-lg">
                  Apple's official frameworks and tools for building native iOS applications
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {nativeIOS.map((resource) => (
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
                          iOS Native
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
                            <Smartphone className="h-4 w-4" />
                            <span>Apple Ecosystem</span>
                          </div>
                          <Link
                            href={`/resources/mobile-development/${resource.slug}`}
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

        {/* Native Android Development */}
        {nativeAndroid.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Native Android Development</h2>
                <p className="text-muted-foreground text-lg">
                  Google's official frameworks and tools for building native Android applications
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {nativeAndroid.map((resource) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-green-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 ml-4">
                          Android Native
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
                            <span>Google Ecosystem</span>
                          </div>
                          <Link
                            href={`/resources/mobile-development/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-green-600 hover:text-green-700 font-medium transition-colors"
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

        {/* Hybrid Development */}
        {hybrid.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Hybrid Development</h2>
                <p className="text-muted-foreground text-lg">
                  Web technologies wrapped in native containers for cross-platform mobile apps
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {hybrid.map((resource) => (
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
                          Hybrid
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
                            <span>Web Technologies</span>
                          </div>
                          <Link
                            href={`/resources/mobile-development/${resource.slug}`}
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
        <section className="py-16 bg-indigo-500/5">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Start Building Mobile Apps</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Create amazing mobile experiences with modern frameworks and tools. Build once, deploy everywhere.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
                >
                  Try Mobile Development Studio
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Link>
                <Link
                  href="/resources/mobile-development/react-native"
                  className="inline-flex items-center justify-center px-6 py-3 border border-indigo-200 text-indigo-600 rounded-lg font-medium hover:bg-indigo-50 dark:hover:bg-indigo-500/10 transition-colors"
                >
                  Start with React Native
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