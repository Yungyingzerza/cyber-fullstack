import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SEVERITIES } from '@/lib/constants';

interface SeverityBarChartProps {
  data: Record<string, number>;
}

export default function SeverityBarChart({ data }: SeverityBarChartProps) {
  const chartData = SEVERITIES.map((sev) => ({
    name: sev.value.toString(),
    label: sev.label,
    value: data[sev.value.toString()] || 0,
    color: sev.color,
  })).filter((item) => item.value > 0);

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Events by Severity</CardTitle>
        </CardHeader>
        <CardContent className="h-[300px] flex items-center justify-center text-muted-foreground">
          No data available
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Events by Severity</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
            <XAxis type="number" />
            <YAxis
              dataKey="name"
              type="category"
              width={40}
              tickFormatter={(value) => `${value}`}
            />
            <Tooltip
              formatter={(value) => [Number(value).toLocaleString(), 'Events']}
              labelFormatter={(label) => `Severity ${label}`}
            />
            <Bar dataKey="value" radius={[0, 4, 4, 0]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
