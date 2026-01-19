import { Badge } from '@/components/ui/badge';
import type { AlertStatus } from '@/types';
import { getAlertStatusColor, getAlertStatusLabel } from '@/lib/formatters';

interface AlertStatusBadgeProps {
  status: AlertStatus;
}

export default function AlertStatusBadge({ status }: AlertStatusBadgeProps) {
  const color = getAlertStatusColor(status);

  return (
    <Badge
      style={{
        backgroundColor: `${color}20`,
        color: color,
        borderColor: color,
      }}
      variant="outline"
    >
      {getAlertStatusLabel(status)}
    </Badge>
  );
}
