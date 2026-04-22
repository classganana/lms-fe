import * as React from "react"
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react"
import { DayPicker, getDefaultClassNames } from "react-day-picker"
import "react-day-picker/style.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  components,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames()

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      numberOfMonths={1}
      className={cn("p-3", className)}
      classNames={{
        root: cn("p-0", defaultClassNames.root),
        months: cn(
          "relative flex flex-col gap-6 sm:flex-row",
          defaultClassNames.months
        ),
        month: cn("w-full space-y-4", defaultClassNames.month),
        month_caption: cn(
          "relative flex h-9 w-full items-center justify-center pt-1",
          defaultClassNames.month_caption
        ),
        caption_label: cn(
          "text-sm font-semibold text-foreground",
          defaultClassNames.caption_label
        ),
        nav: cn(
          "absolute left-0 right-0 top-0 z-10 flex items-center justify-between px-1",
          defaultClassNames.nav
        ),
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted border-border",
          defaultClassNames.button_previous
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 hover:bg-muted border-border",
          defaultClassNames.button_next
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        /** Flex row keeps 7 weekday headers aligned with the 7 day columns below (v9 uses <tr> + flex, not mismatched grid/table). */
        weekdays: cn("flex w-full", defaultClassNames.weekdays),
        weekday: cn(
          "text-muted-foreground flex-1 select-none rounded-md text-center text-[0.8rem] font-normal",
          defaultClassNames.weekday
        ),
        weeks: defaultClassNames.weeks,
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        day: cn(
          "relative flex flex-1 items-center justify-center p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-primary/10 [&:has([aria-selected])]:bg-primary/15 first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
          defaultClassNames.day
        ),
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "mx-auto flex h-9 w-9 items-center justify-center p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground",
          defaultClassNames.day_button
        ),
        selected: cn(
          "[&_button]:border-primary [&_button]:bg-primary [&_button]:text-primary-foreground [&_button]:hover:bg-primary [&_button]:hover:text-primary-foreground [&_button]:focus:bg-primary",
          defaultClassNames.selected
        ),
        today: cn("bg-accent text-accent-foreground", defaultClassNames.today),
        outside: cn(
          "text-muted-foreground opacity-50 aria-selected:bg-accent/40 aria-selected:text-muted-foreground aria-selected:opacity-30",
          defaultClassNames.outside
        ),
        disabled: cn("text-muted-foreground opacity-50", defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        range_middle: cn(
          "aria-selected:bg-primary/15 aria-selected:text-foreground",
          defaultClassNames.range_middle
        ),
        range_start: defaultClassNames.range_start,
        range_end: defaultClassNames.range_end,
        ...classNames,
      }}
      components={{
        Chevron: ({ orientation, ...chevronProps }) => {
          const baseClasses = "h-4 w-4"
          if (orientation === "left") {
            return <ChevronLeft className={baseClasses} {...chevronProps} />
          }
          if (orientation === "right") {
            return <ChevronRight className={baseClasses} {...chevronProps} />
          }
          if (orientation === "up") {
            return <ChevronUp className={baseClasses} {...chevronProps} />
          }
          if (orientation === "down") {
            return <ChevronDown className={baseClasses} {...chevronProps} />
          }
          return <></>
        },
        ...components,
      }}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
