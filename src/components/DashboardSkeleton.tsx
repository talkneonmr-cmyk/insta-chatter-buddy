import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

const DashboardSkeleton = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/20 to-background animate-fade-in">
      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-6 md:py-8 space-y-4 sm:space-y-6 md:space-y-8">
        
        {/* Hero Section Skeleton */}
        <div className="relative overflow-hidden rounded-2xl border-2 border-border/50 p-4 sm:p-6 md:p-8 lg:p-12 bg-gradient-to-br from-muted/30 via-muted/20 to-muted/30">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
              <Skeleton className="h-10 w-3/4 max-w-md rounded-lg" />
              <Skeleton className="h-5 w-full max-w-2xl rounded-lg" />
            </div>
            <Skeleton className="h-12 w-40 rounded-lg" />
          </div>
        </div>

        {/* Stats Overview Cards Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 md:gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="border-2 overflow-hidden" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-3 flex-1">
                    <Skeleton className="h-4 w-24 rounded" />
                    <Skeleton className="h-9 w-16 rounded-lg" />
                    <Skeleton className="h-3 w-32 rounded" />
                  </div>
                  <Skeleton className="h-12 w-12 rounded-xl" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-4 sm:gap-6">
          
          {/* Quick Actions Skeleton */}
          <div className="lg:col-span-2 space-y-4 sm:space-y-6">
            <div>
              <Skeleton className="h-8 w-48 mb-2 rounded-lg" />
              <Skeleton className="h-4 w-64 rounded" />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 sm:gap-4">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <Card key={i} className="border-2 overflow-hidden" style={{ animationDelay: `${0.2 + i * 0.05}s` }}>
                  <CardHeader className="pb-2 sm:pb-3">
                    <div className="flex items-center gap-3 mb-3">
                      <Skeleton className="h-10 w-10 rounded-xl" />
                      <Skeleton className="h-6 w-32 rounded-lg" />
                    </div>
                    <Skeleton className="h-4 w-full rounded" />
                    <Skeleton className="h-4 w-3/4 rounded mt-1" />
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-28 rounded" />
                      <Skeleton className="h-4 w-4 rounded" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Sidebar Content Skeleton */}
          <div className="space-y-4 sm:space-y-6">
            {/* Usage Stats Skeleton */}
            <Card className="border-2">
              <CardHeader>
                <div className="flex items-center justify-between mb-2">
                  <Skeleton className="h-6 w-32 rounded-lg" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
              </CardHeader>
              <CardContent className="space-y-5">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="space-y-2.5" style={{ animationDelay: `${0.5 + i * 0.1}s` }}>
                    <div className="flex items-center justify-between">
                      <Skeleton className="h-4 w-24 rounded" />
                      <Skeleton className="h-4 w-16 rounded" />
                    </div>
                    <Skeleton className="h-2.5 w-full rounded-full" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Activity Card Skeleton */}
            <Card className="border-2">
              <CardHeader>
                <Skeleton className="h-6 w-40 mb-2 rounded-lg" />
                <Skeleton className="h-4 w-full rounded" />
              </CardHeader>
              <CardContent className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-start gap-3" style={{ animationDelay: `${0.7 + i * 0.1}s` }}>
                    <Skeleton className="h-10 w-10 rounded-lg flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-full rounded" />
                      <Skeleton className="h-3 w-24 rounded" />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Bottom Section Skeleton */}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
          {[1, 2].map((i) => (
            <Card key={i} className="border-2" style={{ animationDelay: `${1 + i * 0.1}s` }}>
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <Skeleton className="h-6 w-40 rounded-lg" />
                </div>
                <Skeleton className="h-4 w-full rounded" />
              </CardHeader>
              <CardContent className="space-y-3">
                {[1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-muted/20">
                    <Skeleton className="h-12 w-12 rounded-lg" />
                    <div className="flex-1 space-y-2.5">
                      <Skeleton className="h-4 w-3/4 rounded" />
                      <Skeleton className="h-3 w-1/2 rounded" />
                    </div>
                    <Skeleton className="h-9 w-16 rounded-md" />
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DashboardSkeleton;
