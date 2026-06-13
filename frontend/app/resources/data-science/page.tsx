import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, BarChart3, Zap, Code2, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import dsResources from '@/data/resources/data-science-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

export const metadata: Metadata = generatePageMetadata({
  title: 'Data Science Tools & Libraries',
  description: 'Essential tools and libraries for data analysis, visualization, statistical computing, and data manipulation in Python, R, and interactive environments.',
  path: '/resources/data-science',
  keywords: ['data science', 'pandas', 'numpy', 'matplotlib', 'jupyter', 'R programming', 'tableau', 'data analysis'],
});

export default function DataScienceResourcesPage() {
  const { resources, overview } = dsResources;
  const categories = Array.from(new Set(resources.map(r => r.category)));

  // Categorize resources
  const dataManipulation = resources.filter(r => r.category === 'Data Manipulation');
  const dataVisualization = resources.filter(r => r.category === 'Data Visualization');
  const statisticalComputing = resources.filter(r => r.category === 'Statistical Computing');
  const interactiveComputing = resources.filter(r => r.category === 'Interactive Computing');
  const businessIntelligence = resources.filter(r => r.category === 'Business Intelligence');
  const bigData = resources.filter(r => r.category === 'Big Data Processing');

  const freeOptions = resources.filter(r =>
    r.pricing?.includes('Free') || r.pricing?.includes('100% Free')
  );

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('/resources/data-science')} />
      <Header />
      <main role="main" aria-label="Data Science Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-teal-500/5 via-background to-background py-12 md:py-20">
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
              <div className="p-3 bg-teal-500/10 rounded-lg">
                <BarChart3 className="h-8 w-8 text-teal-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-teal-600 to-teal-400 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card>
                <CardContent className="pt-6">
                  <BarChart3 className="h-8 w-8 text-teal-500 mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">Data Tools</p>
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
                  <div className="text-2xl font-bold">Data</div>
                  <p className="text-sm text-muted-foreground">Driven</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Data Manipulation */}
        {dataManipulation.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Data Manipulation</h2>
                <p className="text-muted-foreground text-lg">
                  Powerful libraries for data cleaning, transformation, and analysis
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {dataManipulation.map((resource: any) => (
                  <Card key={resource.slug} className="group hover:shadow-lg transition-all duration-300">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="group-hover:text-teal-600 transition-colors">
                            {resource.name}
                          </CardTitle>
                          <CardDescription className="mt-2">
                            {resource.shortDesc}
                          </CardDescription>
                        </div>
                        <Badge className="bg-teal-100 text-teal-700 dark:bg-teal-500/10 dark:text-teal-400 ml-4">
                          Data Manipulation
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
                            <span>Data Processing</span>
                          </div>
                          <Link
                            href={`/resources/data-science/${resource.slug}`}
                            className="inline-flex items-center gap-2 text-teal-600 hover:text-teal-700 font-medium transition-colors"
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

        {/* Data Visualization */}
        {dataVisualization.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Data Visualization</h2>
                <p className="text-muted-foreground text-lg">
                  Beautiful and insightful data visualization libraries and tools
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {dataVisualization.map((resource: any) => (
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
                          Visualization
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
                            <BarChart3 className="h-4 w-4" />
                            <span>Charts & Plots</span>
                          </div>
                          <Link
                            href={`/resources/data-science/${resource.slug}`}
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

        {/* Interactive Computing */}
        {interactiveComputing.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Interactive Computing</h2>
                <p className="text-muted-foreground text-lg">
                  Web-based environments for interactive data analysis and collaboration
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {interactiveComputing.map((resource: any) => (
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
                          Interactive
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
                            <span>Web-based</span>
                          </div>
                          <Link
                            href={`/resources/data-science/${resource.slug}`}
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

        {/* Statistical Computing */}
        {statisticalComputing.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Statistical Computing</h2>
                <p className="text-muted-foreground text-lg">
                  Powerful programming languages and environments for statistical analysis
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {statisticalComputing.map((resource: any) => (
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
                          Statistics
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
                            <TrendingUp className="h-4 w-4" />
                            <span>Statistical Analysis</span>
                          </div>
                          <Link
                            href={`/resources/data-science/${resource.slug}`}
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

        {/* Business Intelligence */}
        {businessIntelligence.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Business Intelligence</h2>
                <p className="text-muted-foreground text-lg">
                  Enterprise-grade tools for data visualization and business analytics
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {businessIntelligence.map((resource: any) => (
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
                          BI Tools
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
                            <BarChart3 className="h-4 w-4" />
                            <span>Enterprise</span>
                          </div>
                          <Link
                            href={`/resources/data-science/${resource.slug}`}
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

        {/* Big Data Processing */}
        {bigData.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Big Data Processing</h2>
                <p className="text-muted-foreground text-lg">
                  Distributed computing frameworks for processing large-scale datasets
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {bigData.map((resource: any) => (
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
                          Big Data
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
                            <span>Distributed</span>
                          </div>
                          <Link
                            href={`/resources/data-science/${resource.slug}`}
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

        {/* CTA Section */}
        <section className="py-16 bg-teal-500/5">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Start Your Data Science Journey</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Master data analysis, visualization, and statistical computing with hands-on projects. Transform data into insights.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white rounded-lg font-medium hover:bg-teal-700 transition-colors"
                >
                  Try Data Science Studio
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Link>
                <Link
                  href="/resources/data-science/pandas"
                  className="inline-flex items-center justify-center px-6 py-3 border border-teal-200 text-teal-600 rounded-lg font-medium hover:bg-teal-50 dark:hover:bg-teal-500/10 transition-colors"
                >
                  Start with Pandas
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