export interface TicketEmailData {
  ticketId: string;
  ticketTitle: string;
  ticketCategory: string;
  ticketDescription: string;
  status: string;
  createdBy: string;
  createdByName: string;
  assignedTo?: string | null;
  assignedToName?: string | null;
  createDate: string;
  eventType: 'created' | 'updated' | 'assigned' | 'resolved';
  latestUpdate?: {
    timestamp: string;
    userId: string;
    userName: string;
    updateText: string;
  } | null;
  ticketUrl: string;
}
