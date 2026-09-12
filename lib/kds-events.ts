import { EventEmitter } from "events";

export type KDSEventType =
  | "ORDER_CREATED"
  | "ORDER_STATUS_CHANGED"
  | "ORDER_ITEM_UPDATED"
  | "BILL_SETTLED"
  | "MENU_STOCK_CHANGED";

export interface KDSEventPayload {
  type: KDSEventType;
  timestamp: string;
  orderId?: string;
  orderNumber?: string;
  status?: string;
  tableNumber?: number;
  data?: any;
}

class KDSEventBroadcaster extends EventEmitter {
  constructor() {
    super();
    // Allow up to 100 concurrent SSE client listeners
    this.setMaxListeners(100);
  }

  broadcast(event: KDSEventPayload) {
    this.emit("kds_event", event);
  }
}

const globalForKDS = globalThis as unknown as {
  kdsBroadcaster: KDSEventBroadcaster | undefined;
};

export const kdsEvents =
  globalForKDS.kdsBroadcaster ?? new KDSEventBroadcaster();

if (process.env.NODE_ENV !== "production") {
  globalForKDS.kdsBroadcaster = kdsEvents;
}
