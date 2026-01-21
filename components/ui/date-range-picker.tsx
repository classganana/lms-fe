'use client';

import * as React from 'react';
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

  // Convert store dateRange to react-day-picker DateRange format
  const selected: DateRange | undefined = {
    from: dateRange.from,
    to: dateRange.to,
  };

  const handleSelect = (range: DateRange | undefined) => {
    if (range) {
       setDateRange({ from: range.from, to: range.to });
    } else {
       setDateRange({ from: undefined, to: undefined });
    }
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
              'w-[320px] justify-start text-left font-normal relative group hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all border-2 shadow-sm hover:shadow-md hover:border-blue-400 rounded-lg',
              !dateRange.from && 'text-muted-foreground'
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4 text-blue-600" />
            {dateRange.from ? (
              dateRange.to ? (
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {format(dateRange.from, 'LLL dd, y')} -{' '}
                  {format(dateRange.to, 'LLL dd, y')}
                </span>
              ) : (
                <span className="font-semibold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                  {format(dateRange.from, 'LLL dd, y')}
                </span>
              )
            ) : (
              <span className="text-slate-500 font-medium">Pick a date range</span>
            )}
            
            {(dateRange.from || dateRange.to) && (
              <div 
                role="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-red-100 text-slate-400 hover:text-red-600 transition-all hover:scale-110"
                onClick={clearDates}
              >
                <X className="h-3.5 w-3.5" />
              </div>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 shadow-2xl border-2 border-blue-100 rounded-2xl overflow-hidden bg-white" align="start">
          <div className="flex flex-col sm:flex-row">
            {/* Quick Select Sidebar */}
            <div className="flex flex-col p-3 border-r border-slate-200 min-w-[180px] bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/30">
              <div className="mb-1">
                <h4 className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-1 px-2">
                  Quick Select
                </h4>
                <div className="h-0.5 w-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
              </div>
              <div className="space-y-1">
                {presets.map((preset) => {
                  const isActive = isPresetActive(preset);
                  return (
                    <Button
                      key={preset.label}
                      variant="ghost"
                      size="sm"
                      className={cn(
                        "w-full justify-between font-medium text-sm h-10 px-4 rounded-xl transition-all duration-200", 
                        isActive 
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-200 hover:from-blue-600 hover:to-purple-600 hover:shadow-xl" 
                          : "hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 hover:text-blue-700 text-slate-700 hover:scale-[1.02]"
                      )}
                      onClick={() => handlePresetClick(preset.getValue())}
                    >
                      <span>{preset.label}</span>
                      {isActive && <Check className="h-4 w-4 ml-2" />}
                    </Button>
                  );
                })}
              </div>
            </div>
            
            {/* Calendar */}
            <div className="p-3 pl-2 bg-white">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={dateRange.from}
                selected={selected}
                onSelect={handleSelect}
                numberOfMonths={2}
                classNames={{
                  months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                  month: "space-y-4",
                  caption: "flex justify-center pt-1 relative items-center mb-2",
                  caption_label: "text-base font-bold text-slate-700",
                  nav: "space-x-1 flex items-center",
                  nav_button: "h-8 w-8 bg-transparent hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 rounded-lg transition-all duration-200 hover:scale-110",
                  nav_button_previous: "absolute left-1",
                  nav_button_next: "absolute right-1",
                  table: "w-full border-collapse space-y-1",
                  head_row: "flex",
                  head_cell: "text-slate-500 rounded-md w-10 font-semibold text-[0.8rem] uppercase tracking-wide",
                  row: "flex w-full mt-2",
                  cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-slate-100 [&:has([aria-selected].day-range-end)]:rounded-r-lg [&:has([aria-selected].day-range-start)]:rounded-l-lg first:[&:has([aria-selected])]:rounded-l-lg last:[&:has([aria-selected])]:rounded-r-lg",
                  day: "h-10 w-10 p-0 font-medium aria-selected:opacity-100 rounded-lg hover:bg-gradient-to-r hover:from-blue-100 hover:to-purple-100 hover:scale-110 transition-all duration-200 hover:shadow-md hover:z-10",
                  day_selected: "bg-gradient-to-r from-blue-500 to-purple-500 text-white hover:from-blue-600 hover:to-purple-600 hover:text-white focus:from-blue-600 focus:to-purple-600 focus:text-white font-bold shadow-lg shadow-blue-200",
                  day_today: "bg-slate-100 text-slate-900 font-bold ring-2 ring-blue-300 ring-offset-1",
                  day_outside: "text-slate-300 opacity-50 aria-selected:bg-slate-100 aria-selected:text-slate-500 aria-selected:opacity-30",
                  day_disabled: "text-slate-300 opacity-50 cursor-not-allowed",
                  day_range_middle: "aria-selected:bg-gradient-to-r aria-selected:from-blue-100 aria-selected:to-purple-100 aria-selected:text-slate-900 rounded-none",
                  day_hidden: "invisible",
                }}
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}