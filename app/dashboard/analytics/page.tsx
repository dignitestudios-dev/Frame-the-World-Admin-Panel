import { BarChart3, TrendingUp, Users, Upload, ThumbsUp, Download, CreditCard, Smartphone } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const stats = [
  { label: "Active Subscribers", value: "—", icon: Users, status: "done" },
  { label: "Revenue Generated", value: "—", icon: CreditCard, status: "pending", note: "Stripe + Apple + Google" },
  { label: "Total Posts", value: "—", icon: Upload, status: "done" },
  { label: "Upvotes", value: "—", icon: ThumbsUp, status: "done" },
  { label: "Downloads", value: "—", icon: Download, status: "done" },
  { label: "Web vs Mobile Subscriptions", value: "—", icon: Smartphone, status: "pending" },
];

export default function AnalyticsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-gradient">
          <BarChart3 className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">Advanced Analytics</h1>
          <p className="text-sm text-muted-foreground">Platform-wide performance metrics</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">{stat.label}</CardTitle>
              <div className="flex items-center gap-2">
                {stat.status === "pending" && (
                  <Badge variant="secondary" className="text-xs bg-orange-50 text-orange-600">Pending API</Badge>
                )}
                <stat.icon className="size-4 text-muted-foreground" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              {stat.note && (
                <p className="text-xs text-muted-foreground mt-1">{stat.note}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4" />
            Revenue Breakdown
          </CardTitle>
          <CardDescription>Stripe + Apple In-App + Google Play — awaiting API integration</CardDescription>
        </CardHeader>
        <CardContent className="flex h-40 items-center justify-center text-muted-foreground text-sm">
          Chart will render here once API is connected
        </CardContent>
      </Card>
    </div>
  );
}
