import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { type Sale } from '@/lib/types';

export default function RecentClients({ sales }: { sales: Sale[] }) {
  const uniqueClients = [
    ...new Map(sales.map((sale) => [sale.customerEmail, sale])).values(),
  ];

  return (
    <div className="space-y-8">
      {uniqueClients.map((client) => (
        <div className="flex items-center" key={client.id}>
          <Avatar className="h-9 w-9">
            <AvatarImage
              src={`https://picsum.photos/seed/${client.customerName.replace(
                /\s/g,
                ''
              )}/40/40`}
              alt="Avatar"
            />
            <AvatarFallback>
              {client.customerName
                .split(' ')
                .map((n) => n[0])
                .join('')}
            </AvatarFallback>
          </Avatar>
          <div className="ml-4 space-y-1">
            <p className="text-sm font-medium leading-none">{client.customerName}</p>
            <p className="text-sm text-muted-foreground">{client.customerEmail}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
