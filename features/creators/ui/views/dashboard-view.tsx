import { WelcomeHeader } from '@/features/creators/ui/components/dashboard/welcome-header';
import { QuickActions } from '@/features/creators/ui/components/dashboard/quick-actions';
import { StatsCards } from '@/features/creators/ui/components/dashboard/stats-cards';
import { SampleBanner } from '@/features/creators/ui/components/dashboard/sample-banner';
import { BestsellersSection } from '@/features/creators/ui/components/dashboard/bestsellers-section';
import { ArticlesSection } from '@/features/creators/ui/components/dashboard/articles-section';
import type { DashboardData } from '@/features/creators/types';

interface DashboardViewProps {
  data: DashboardData;
}

export function DashboardView({ data }: DashboardViewProps) {
  const { creator, stats, bestsellerProducts, featuredArticles } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8 px-4 max-w-7xl space-y-10">
        {/* Welcome Header */}
        <WelcomeHeader creator={creator} />
        
        {/* Stats Overview */}
        <StatsCards />
        
        {/* Quick Actions */}
        <QuickActions />
        
        {/* Sample Banner */}
        <SampleBanner />
        
        {/* Bestsellers Section */}
        <BestsellersSection products={bestsellerProducts} />
        
        {/* Educational Articles */}
        <ArticlesSection articles={featuredArticles} />
      </div>
    </div>
  );
}