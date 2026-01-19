import { useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TIME_RANGES } from '@/lib/constants';
import type { EventsQueryParams } from '@/types';
import { subHours } from 'date-fns';
import { Search } from 'lucide-react';

interface EventFiltersProps {
  filters: EventsQueryParams;
  onFiltersChange: (filters: EventsQueryParams) => void;
}

export default function EventFilters({ filters, onFiltersChange }: EventFiltersProps) {
  const [timeRange, setTimeRange] = useState('24h');

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    const range = TIME_RANGES.find((r) => r.value === value);
    if (range) {
      onFiltersChange({
        ...filters,
        start_time: subHours(new Date(), range.hours).toISOString(),
        end_time: new Date().toISOString(),
        page: 1,
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Quick search */}
      <div className="relative">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search events..."
          className="pl-9 w-[200px]"
          value={filters.search || ''}
          onChange={(e) =>
            onFiltersChange({ ...filters, search: e.target.value, page: 1 })
          }
        />
      </div>

      {/* Time range quick select */}
      <Select value={timeRange} onValueChange={handleTimeRangeChange}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="Time range" />
        </SelectTrigger>
        <SelectContent>
          {TIME_RANGES.map((range) => (
            <SelectItem key={range.value} value={range.value}>
              {range.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
