'use client';

import * as React from 'react';
import { useMemo } from 'react';
import { addDays, format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subMonths, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon, X, Check } from 'lucide-react';
import { DateRange } from 'react-day-picker';

import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useStore } from '@/store';
import { Separator } from '@/components/ui/separator';

export function DateRangePicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const { dateRange, setDateRange } = useStore();
  const [isOpen, setIsOpen] = React.useState(false);

  // Convert store dateRange to react-day-picker DateRange format safely
  const selected: DateRange | undefined = useMemo(() => {
    if (!dateRange.from) return undefined;
    return {
      from: dateRange.from,
      to: dateRange.to,
    };
  }, [dateRange]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDateRange({ from: undefined, to: undefined });
      return;
    }
    setDateRange({ from: range.from, to: range.to });
  };

  const presets = [
    {
      label: 'Today',
      getValue: () => ({ from: new Date(), to: new Date() }),
    },
    {
      label: 'Yesterday',
      getValue: () => {
        const yesterday = subDays(new Date(), 1);
        return { from: yesterday, to: yesterday };
      },
    },
    {
      label: 'This Week',
      getValue: () => ({
        from: startOfWeek(new Date(), { weekStartsOn: 1 }),
        to: endOfWeek(new Date(), { weekStartsOn: 1 }),
      }),
    },
    {
      label: 'Last 7 Days',
      getValue: () => ({ from: subDays(new Date(), 6), to: new Date() }),
    },
    {
      label: 'Last 30 Days',
      getValue: () => ({ from: subDays(new Date(), 29), to: new Date() }),
    },
    {
      label: 'This Month',
      getValue: () => ({
        from: startOfMonth(new Date()),
        to: endOfMonth(new Date()),
      }),
    },
    {
      label: 'Last Month',
      getValue: () => {
        const lastMonth = subMonths(new Date(), 1);
        return {
          from: startOfMonth(lastMonth),
          to: endOfMonth(lastMonth),
        };
      },
    },
  ];

  const handlePresetClick = (presetInfo: { from: Date; to: Date }) => {
    setDateRange(presetInfo);
  };

  const isPresetActive = (preset: { getValue: () => { from: Date; to: Date } }) => {
    const { from, to } = preset.getValue();
    return (
      dateRange.from &&
      dateRange.to &&
      isSameDay(dateRange.from, from) &&
      isSameDay(dateRange.to, to)
    );
  };

  const clearDates = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDateRange({ from: undefined, to: undefined });
  };

  return (
    <div className={cn('grid gap-2', className)}>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={'outline'}
            className={cn(
              'w-[260px] justify-start text-left font-normal relative group h-9 px-3 text-sm hover:bg-accent hover:text-accent-foreground transition-all shadow-sm',
              !dateRange.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 opacity-50" />
            {dateRange.from ? (
              dateRange.to ? (
                <>
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </>
              ) : (
                format(dateRange.from, 'LLL dd, y')
              )
            ) : (
              <span>Pick a date range</span>
            )}
            
            {(dateRange.from || dateRange.to) && (
              <div 
                role="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-200 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={clearDates}
              >
                <X className="h-3 w-3" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="end">
          <div className="flex flex-col sm:flex-row">
            <div className="p-3 border-r border-slate-100 flex flex-col gap-1 min-w-[140px]">
               {presets.map((preset) => {
                  const isActive = isPresetActive(preset);
                  return (
                    <button
                      key={preset.label}
                      onClick={() => handlePresetClick(preset.getValue())}
                      className={cn(
                        "text-left px-3 py-2 text-sm rounded-md transition-colors w-full",
                        isActive 
                          ? "bg-slate-900 text-white font-medium" 
                          : "text-slate-600 hover:bg-slate-100"
                      )}
                    >
                      {preset.label}
                    </button>
                  );
                })}
            </div>
            <div className="p-2">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={selected}
                onSelect={handleSelect}
                numberOfMonths={2}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}