import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function StatsCards() {
  return (
    <>
      {/* Mobile Carousel View */}
      <div className="md:hidden">
        <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
          <Card className="@container/card flex-shrink-0 w-[280px] snap-start">
            <CardHeader>
              <CardDescription>Total Revenue</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[280px]/card:text-3xl">
                $1,250.00
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  +12.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Trending up this month <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Visitors for the last 6 months
              </div>
            </CardFooter>
          </Card>
          <Card className="@container/card flex-shrink-0 w-[280px] snap-start">
            <CardHeader>
              <CardDescription>New Customers</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[280px]/card:text-3xl">
                1,234
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingDown />
                  -20%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Down 20% this period <IconTrendingDown className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Acquisition needs attention
              </div>
            </CardFooter>
          </Card>
          <Card className="@container/card flex-shrink-0 w-[280px] snap-start">
            <CardHeader>
              <CardDescription>Active Accounts</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[280px]/card:text-3xl">
                45,678
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  +12.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Strong user retention <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Engagement exceed targets
              </div>
            </CardFooter>
          </Card>
          <Card className="@container/card flex-shrink-0 w-[280px] snap-start">
            <CardHeader>
              <CardDescription>Growth Rate</CardDescription>
              <CardTitle className="text-xl font-semibold tabular-nums @[200px]/card:text-2xl @[280px]/card:text-3xl">
                4.5%
              </CardTitle>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  +4.5%
                </Badge>
              </CardAction>
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <div className="line-clamp-1 flex gap-2 font-medium">
                Steady performance increase{" "}
                <IconTrendingUp className="size-4" />
              </div>
              <div className="text-muted-foreground">
                Meets growth projections
              </div>
            </CardFooter>
          </Card>
        </div>
      </div>

      {/* Desktop Grid View */}
      <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="@container/card">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex w-full items-start justify-between">
              <CardDescription>Total Revenue</CardDescription>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  +12.5%
                </Badge>
              </CardAction>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              UGX1,250,000
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Trending up this month <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Visitors for the last 6 months
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex w-full items-start justify-between">
              <CardDescription>New Customers</CardDescription>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingDown />
                  -20%
                </Badge>
              </CardAction>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              1,234
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Down 20% this period <IconTrendingDown className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Acquisition needs attention
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex w-full items-start justify-between">
              <CardDescription>Active Accounts</CardDescription>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  +12.5%
                </Badge>
              </CardAction>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              45,678
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Strong user retention <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Engagement exceed targets
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader className="flex flex-col gap-3">
            <div className="flex w-full items-start justify-between">
              <CardDescription>Growth Rate</CardDescription>
              <CardAction>
                <Badge variant="outline">
                  <IconTrendingUp />
                  +4.5%
                </Badge>
              </CardAction>
            </div>
            <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
              4.5%
            </CardTitle>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1.5 text-sm">
            <div className="line-clamp-1 flex gap-2 font-medium">
              Steady performance increase <IconTrendingUp className="size-4" />
            </div>
            <div className="text-muted-foreground">
              Meets growth projections
            </div>
          </CardFooter>
        </Card>
      </div>
    </>
  )
}
