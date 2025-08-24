import { auth } from "@/server/auth";
import { redirect } from "next/navigation";
import { createCaller } from "@/trpc/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Store, ExternalLink, Settings, Plus } from "lucide-react";
import { headers } from "next/headers";

export default async function CreatorDashboardPage() {
  const Headers = await headers();
  const session = await auth.api.getSession({
    headers: Headers,
  });

  if (!session) {
    redirect("/auth/sign-in");
  }

  const caller = createCaller();
  const creator = await caller.creators.getMyCreatorProfile();

  if (!creator) {
    redirect("/creator/onboarding");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <div className="container mx-auto py-8 px-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{creator.storeName}</h1>
              <p className="text-muted-foreground">
                kampestore.com/{creator.creatorSlug}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="secondary">Active Store</Badge>
            <Button variant="outline" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              Visit Store
            </Button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Store Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Store Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Products</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Orders</span>
                <span className="font-semibold">0</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Revenue</span>
                <span className="font-semibold">UGX 0</span>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full justify-start" variant="outline">
                <Plus className="w-4 h-4 mr-2" />
                Add Product
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <Settings className="w-4 h-4 mr-2" />
                Store Settings
              </Button>
              <Button className="w-full justify-start" variant="outline">
                <ExternalLink className="w-4 h-4 mr-2" />
                Preview Store
              </Button>
            </CardContent>
          </Card>

          {/* Getting Started */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Getting Started</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Store Created</p>
                    <p className="text-xs text-muted-foreground">
                      Your store is ready to go!
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">
                      Add Your First Product
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Start selling by adding products
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-gray-300 mt-2 flex-shrink-0" />
                  <div>
                    <p className="font-medium text-sm">Customize Store</p>
                    <p className="text-xs text-muted-foreground">
                      Make it uniquely yours
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <Store className="w-12 h-12 mx-auto mb-4 opacity-20" />
              <p>No activity yet. Start by adding your first product!</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
