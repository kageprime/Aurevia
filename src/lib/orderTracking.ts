import type { OrderRecord, OrderStatusHistoryEntry } from '@/lib/ordersApi';

export type TrackingStepState = 'complete' | 'current' | 'upcoming';

export type TrackingStep = {
  key: string;
  title: string;
  description: string;
  statuses: string[];
};

export type TrackingTimelineStep = TrackingStep & {
  state: TrackingStepState;
  reachedAt?: string;
  currentStatus?: string;
};

export type TrackingStatusOption = {
  value: string;
  label: string;
  description: string;
};

const statusLabels: Record<string, { label: string; description: string }> = {
  awaiting_payment: {
    label: 'Awaiting payment',
    description: 'The order is waiting for payment confirmation.',
  },
  awaiting_verification: {
    label: 'Awaiting verification',
    description: 'Payment proof or card details are being checked.',
  },
  paid: {
    label: 'Payment confirmed',
    description: 'The payment has been captured and the order is live.',
  },
  processing: {
    label: 'Processing',
    description: 'The team is packing and preparing the parcel.',
  },
  packed: {
    label: 'Packed',
    description: 'The parcel is sealed and ready for dispatch.',
  },
  left_origin: {
    label: 'Left origin',
    description: 'The parcel has left the warehouse or dispatch point.',
  },
  shipped: {
    label: 'Shipped',
    description: 'The parcel has been handed to the carrier.',
  },
  in_transit: {
    label: 'In transit',
    description: 'The parcel is moving between logistics hubs.',
  },
  arrived_hub: {
    label: 'Arrived at hub',
    description: 'The parcel has reached a sorting center.',
  },
  out_for_delivery: {
    label: 'Out for delivery',
    description: 'A courier is carrying the parcel to its destination.',
  },
  delivered: {
    label: 'Delivered',
    description: 'The order has been delivered successfully.',
  },
  failed: {
    label: 'Failed',
    description: 'The delivery or payment process failed.',
  },
  refunded: {
    label: 'Refunded',
    description: 'The order has been refunded.',
  },
};

export const trackingSteps: TrackingStep[] = [
  {
    key: 'payment',
    title: 'Payment',
    description: 'Confirm the payment and reserve the order.',
    statuses: ['awaiting_payment', 'awaiting_verification', 'paid'],
  },
  {
    key: 'processing',
    title: 'Processing',
    description: 'The order is being packed and prepared for dispatch.',
    statuses: ['processing', 'packed'],
  },
  {
    key: 'handoff',
    title: 'Courier handoff',
    description: 'The parcel leaves the studio and moves into the carrier network.',
    statuses: ['left_origin', 'shipped'],
  },
  {
    key: 'transit',
    title: 'In transit',
    description: 'The parcel is moving between logistics hubs.',
    statuses: ['in_transit', 'arrived_hub'],
  },
  {
    key: 'delivery',
    title: 'Delivery',
    description: 'The courier is on the final stretch.',
    statuses: ['out_for_delivery', 'delivered'],
  },
];

export const trackingStatusOptions: TrackingStatusOption[] = Object.entries(statusLabels).map(([value, meta]) => ({
  value,
  label: meta.label,
  description: meta.description,
}));

export function formatTrackingStatus(status: string) {
  if (!status) {
    return 'Unknown status';
  }

  return statusLabels[status]?.label ?? status.replace(/[_-]+/g, ' ').replace(/\b\w/g, (character) => character.toUpperCase());
}

export function describeTrackingStatus(status: string) {
  return statusLabels[status]?.description ?? 'Order progress is being updated.';
}

function findTimelinePosition(status: string) {
  return trackingSteps.findIndex((step) => step.statuses.includes(status));
}

export function buildTrackingTimeline(order?: Pick<OrderRecord, 'status' | 'statusHistory'> | null): TrackingTimelineStep[] {
  const history = (order?.statusHistory ?? []) as OrderStatusHistoryEntry[];
  const currentStatus = history.at(-1)?.status ?? order?.status ?? '';
  const currentIndex = findTimelinePosition(currentStatus);

  return trackingSteps.map((step, index) => {
    const reachedEntry = [...history].reverse().find((entry) => step.statuses.includes(entry.status));
    const state: TrackingStepState =
      currentIndex === -1 ? 'upcoming' : index < currentIndex ? 'complete' : index === currentIndex ? 'current' : 'upcoming';

    return {
      ...step,
      state,
      reachedAt: reachedEntry?.at,
      currentStatus,
    };
  });
}
