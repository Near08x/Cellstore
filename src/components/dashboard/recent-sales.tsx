'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Sale } from '@/lib/types';

export default function RecentSales({ sales }: { sales: Sale[] }) {
  return (
    <div className="space-y-8">
      {sales.map((sale) => (
        <div className="flex items-center" key={sale.id}>
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://picsum.photos/seed/${sale.customerName.replace(
                /\s/g,
                ''
              )}/40/40`}
              alt="Avatar"
            />
            <AvatarFallback>
              {sale.customerName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{sale.customerName}</p>
            <p className="text-sm text-muted-foreground">{sale.customerEmail}</p>
          </div>
          <div className="ml-auto font-medium">
            +$
            {sale.amount.toLocaleString('es-ES', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
