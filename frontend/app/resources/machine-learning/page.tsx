import { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft, Brain, Zap, Code2, Sparkles, TrendingUp, DollarSign } from 'lucide-react';
import { generatePageMetadata, generateBreadcrumbs } from '@/lib/metadata-utils';
import { BreadcrumbSchema } from '@/components/seo/breadcrumb-schema';
import mlResources from '@/data/resources/machine-learning-resources.json';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { BottomNavigation } from '@/components/bottom-navigation';

export const metadata: Metadata = generatePageMetadata({
  title: 'Machine Learning Frameworks & Tools',
  description: 'Master deep learning, computer vision, NLP, and traditional ML with industry-leading frameworks and libraries for building intelligent systems.',
  path: '/resources/machine-learning',
  keywords: ['machine learning', 'deep learning', 'TensorFlow', 'PyTorch', 'scikit-learn', 'neural networks', 'AI frameworks'],
});

export default function MachineLearningResourcesPage() {
  const { resources, overview } = mlResources;
  const categories = Array.from(new Set(resources.map(r => r.category)));

  // Categorize resources
  const deepLearning = resources.filter(r => r.category === 'Deep Learning Frameworks');
  const traditionalML = resources.filter(r => r.category === 'Traditional ML Libraries');
  const nlpTransformers = resources.filter(r => r.category === 'NLP & Transformers');
  const mlops = resources.filter(r => r.category === 'MLOps & Production');

  const freeOptions = resources.filter(r =>
    r.pricing?.includes('Free') || r.pricing?.includes('100% Free')
  );

  return (
    <>
      <BreadcrumbSchema items={generateBreadcrumbs('/resources/machine-learning')} />
      <Header />
      <main role="main" aria-label="Machine Learning Resources" className="min-h-screen bg-background pb-20 md:pb-0">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-purple-500/5 via-background to-background py-12 md:py-20">
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
              <div className="p-3 bg-purple-500/10 rounded-lg">
                <Brain className="h-8 w-8 text-purple-500" />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-purple-400 bg-clip-text text-transparent">
                {overview.title}
              </h1>
            </div>

            <p className="text-xl text-muted-foreground max-w-3xl mb-8">
              {overview.description}
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl">
              <Card>
                <CardContent className="pt-6">
                  <Brain className="h-8 w-8 text-purple-500 mb-2" />
                  <div className="text-2xl font-bold">{resources.length}</div>
                  <p className="text-sm text-muted-foreground">ML Frameworks</p>
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
                  <div className="text-2xl font-bold">AI</div>
                  <p className="text-sm text-muted-foreground">Powered</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Deep Learning Frameworks */}
        {deepLearning.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Deep Learning Frameworks</h2>
                <p className="text-muted-foreground text-lg">
                  Powerful frameworks for building and training neural networks
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {deepLearning.map((resource: any) => (
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
                          Deep Learning
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
                            <span>Neural Networks</span>
                          </div>
                          <Link
                            href={`/resources/machine-learning/${resource.slug}`}
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

        {/* Traditional ML Libraries */}
        {traditionalML.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">Traditional ML Libraries</h2>
                <p className="text-muted-foreground text-lg">
                  Essential libraries for classical machine learning algorithms
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {traditionalML.map((resource: any) => (
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
                          Traditional ML
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
                            <span>Algorithms</span>
                          </div>
                          <Link
                            href={`/resources/machine-learning/${resource.slug}`}
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

        {/* NLP & Transformers */}
        {nlpTransformers.length > 0 && (
          <section className="py-16">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">NLP & Transformers</h2>
                <p className="text-muted-foreground text-lg">
                  State-of-the-art models and libraries for natural language processing
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {nlpTransformers.map((resource: any) => (
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
                          NLP
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
                            <span>Transformers</span>
                          </div>
                          <Link
                            href={`/resources/machine-learning/${resource.slug}`}
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

        {/* MLOps & Production */}
        {mlops.length > 0 && (
          <section className="py-16 bg-muted/30">
            <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
              <div className="mb-8">
                <h2 className="text-3xl font-bold mb-4">MLOps & Production</h2>
                <p className="text-muted-foreground text-lg">
                  Tools for deploying, monitoring, and managing machine learning models in production
                </p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                {mlops.map((resource: any) => (
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
                          MLOps
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
                            <span>Production</span>
                          </div>
                          <Link
                            href={`/resources/machine-learning/${resource.slug}`}
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

        {/* CTA Section */}
        <section className="py-16 bg-purple-500/5">
          <div className="container mx-auto px-6 sm:px-8 lg:px-12 xl:px-16">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4">Start Building AI Systems</h2>
              <p className="text-muted-foreground mb-8 text-lg">
                Learn machine learning with hands-on projects, from traditional algorithms to cutting-edge deep learning. Build real AI applications.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  href="/studio"
                  className="inline-flex items-center justify-center px-6 py-3 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors"
                >
                  Try AI Development Studio
                  <ArrowLeft className="ml-2 h-4 w-4 rotate-180" />
                </Link>
                <Link
                  href="/resources/machine-learning/tensorflow"
                  className="inline-flex items-center justify-center px-6 py-3 border border-purple-200 text-purple-600 rounded-lg font-medium hover:bg-purple-50 dark:hover:bg-purple-500/10 transition-colors"
                >
                  Start with TensorFlow
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