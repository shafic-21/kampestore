import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, ArrowRight, BookOpen } from 'lucide-react';
import Link from 'next/link';
import type { Article } from '@/features/creators/types';

interface ArticlesSectionProps {
  articles: Article[];
}

// Mock data for demonstration
const mockArticles: Article[] = [
  {
    id: '1',
    title: 'The 10 best online selling sites for 2025',
    description: 'Discover the top platforms to sell your print-on-demand products online and maximize your revenue.',
    image: '/placeholder-article-1.jpg',
    readTime: 8,
    publishedAt: new Date('2024-12-15'),
    category: 'Business tips & ideas',
    href: '/creator/resources/articles/best-selling-sites-2025'
  },
  {
    id: '2', 
    title: 'What is a Niche? 5 Examples of Print on Demand niche ideas',
    description: 'Learn how to find profitable niches for your print-on-demand business with real examples.',
    image: '/placeholder-article-2.jpg',
    readTime: 6,
    publishedAt: new Date('2024-12-12'),
    category: 'Business tips & ideas',
    href: '/creator/resources/articles/pod-niche-ideas'
  },
  {
    id: '3',
    title: 'How to sell t-shirts on Etsy: Your 5-step guide with expert tips',
    description: 'Master the art of selling t-shirts on Etsy with our comprehensive step-by-step guide.',
    image: '/placeholder-article-3.jpg',
    readTime: 10,
    publishedAt: new Date('2024-12-08'),
    category: 'Business tips & ideas', 
    href: '/creator/resources/articles/sell-tshirts-etsy-guide'
  }
];

const formatDate = (date: Date): string => {
  const options: Intl.DateTimeFormatOptions = { 
    month: 'short', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('en-US', options);
};

export function ArticlesSection({ articles = mockArticles }: ArticlesSectionProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold">Start something great today</h2>
        <Link href="/creator/resources/articles">
          <Button variant="ghost" className="text-primary hover:text-primary/80">
            See more
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {articles.slice(0, 3).map((article) => (
          <Link key={article.id} href={article.href}>
            <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden h-full cursor-pointer">
              <div className="relative aspect-video bg-muted">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center">
                  <BookOpen className="w-12 h-12 text-primary/30" />
                </div>
              </div>
              
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Badge variant="secondary" className="text-xs">
                    {article.category}
                  </Badge>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="w-3 h-3 mr-1" />
                    {article.readTime} min read
                  </div>
                </div>
                
                <h3 className="font-semibold text-lg mb-2 line-clamp-2 group-hover:text-primary transition-colors">
                  {article.title}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-4 line-clamp-3 leading-relaxed">
                  {article.description}
                </p>
                
                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <span className="text-xs text-muted-foreground">
                    {formatDate(article.publishedAt)}
                  </span>
                  <div className="flex items-center text-primary text-sm font-medium group-hover:gap-2 transition-all">
                    Read article
                    <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}