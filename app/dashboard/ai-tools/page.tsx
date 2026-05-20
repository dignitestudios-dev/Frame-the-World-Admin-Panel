import { Bot, XCircle, ImageOff, Info } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead,
  TableHeader, TableRow,
} from "@/components/ui/table";

const mockRejections = [
  { id: 1, uploader: "travel_lens", reason: "Nudity detected", date: "2025-05-14", confidence: "98%" },
  { id: 2, uploader: "world_shots", reason: "Violence/Gore", date: "2025-05-13", confidence: "94%" },
  { id: 3, uploader: "photo_pro_99", reason: "Spam / Watermark", date: "2025-05-12", confidence: "87%" },
];

export default function AIToolsPage() {
  return (
    <div className="flex flex-col gap-6 px-4 lg:px-6">
      <div className="flex items-center gap-3">
        <div className="flex size-10 items-center justify-center rounded-full bg-brand-gradient">
          <Bot className="size-5 text-white" />
        </div>
        <div>
          <h1 className="text-2xl font-semibold">AI Tools</h1>
          <p className="text-sm text-muted-foreground">Rejected image review logs from AI moderation</p>
        </div>
      </div>

      <div className="rounded-md border bg-blue-50 border-blue-200 px-4 py-3 text-sm text-blue-800 flex gap-2">
        <Info className="size-4 mt-0.5 shrink-0" />
        <span>Rejection threshold and detailed rejection categories are pending confirmation from AM.</span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total AI Rejections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">—</div>
            <p className="text-xs text-muted-foreground mt-1">All time</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejections This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Rejection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">—%</div>
            <p className="text-xs text-muted-foreground mt-1">Of total uploads</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="size-4 text-destructive" />
            Recent AI Rejections
          </CardTitle>
          <CardDescription>Posts automatically rejected by the AI moderation system</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Uploader</TableHead>
                <TableHead>Rejection Reason</TableHead>
                <TableHead>Confidence</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockRejections.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium">{r.uploader}</TableCell>
                  <TableCell>{r.reason}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-red-50 text-red-700">{r.confidence}</Badge>
                  </TableCell>
                  <TableCell>{r.date}</TableCell>
                  <TableCell>
                    <Badge variant="secondary" className="bg-gray-100 text-gray-600">Auto-rejected</Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
