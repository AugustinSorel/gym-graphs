import * as React from "react";
import { cn } from "~/styles/styles.utils";

const Table = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableElement>) => (
  <div className="relative w-full overflow-auto">
    <table
      className={cn("w-full caption-bottom text-sm", className)}
      {...props}
    />
  </div>
);
Table.displayName = "Table";

const TableHeader = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <thead className={cn("[&_tr]:border-b", className)} {...props} />
);
TableHeader.displayName = "TableHeader";

const TableBody = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />
);
TableBody.displayName = "TableBody";

const TableFooter = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableSectionElement>) => (
  <tfoot
    className={cn(
      "bg-muted/50 border-t font-medium last:[&>tr]:border-b-0",
      className,
    )}
    {...props}
  />
);
TableFooter.displayName = "TableFooter";

const TableRow = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement>) => (
  <tr
    className={cn(
      "hover:bg-muted/50 data-[state=selected]:bg-muted border-b transition-colors",
      className,
    )}
    {...props}
  />
);
TableRow.displayName = "TableRow";

const TableHead = ({
  className,
  ...props
}: React.ThHTMLAttributes<HTMLTableCellElement>) => (
  <th
    className={cn(
      "text-muted-foreground h-10 text-left align-middle font-medium [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
);
TableHead.displayName = "TableHead";

const TableCell = ({
  className,
  ...props
}: React.TdHTMLAttributes<HTMLTableCellElement>) => (
  <td
    className={cn(
      "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>[role=checkbox]]:translate-y-[2px]",
      className,
    )}
    {...props}
  />
);
TableCell.displayName = "TableCell";

const TableCaption = ({
  className,
  ...props
}: React.HTMLAttributes<HTMLTableCaptionElement>) => (
  <caption
    className={cn("text-muted-foreground mt-4 text-sm", className)}
    {...props}
  />
);
TableCaption.displayName = "TableCaption";

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
};
