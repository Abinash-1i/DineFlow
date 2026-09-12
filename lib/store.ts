import { create } from "zustand";

export type UserRole = "ADMIN" | "CASHIER" | "KITCHEN_STAFF";

export interface CartItem {
  id: string; // unique cart item id (to allow variations of same menu item)
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  dietaryTag: string;
  spiceLevel: string;
  spicePreference?: string;
  notes?: string;
  imageUrl?: string;
}

export interface TableItem {
  id: string;
  number: number;
  name: string;
  capacity: number;
  status: "AVAILABLE" | "OCCUPIED" | "RESERVED" | "BILLING";
  currentOrderId?: string | null;
}

interface PosState {
  // Current logged in role (for RBAC showcase)
  currentRole: UserRole;
  setRole: (role: UserRole) => void;

  // Floor / Table Selection
  selectedTable: TableItem | null;
  setSelectedTable: (table: TableItem | null) => void;
  orderType: "DINE_IN" | "TAKEAWAY";
  setOrderType: (type: "DINE_IN" | "TAKEAWAY") => void;

  // Cart
  cart: CartItem[];
  orderNotes: string;
  setOrderNotes: (notes: string) => void;
  addItem: (item: {
    id: string;
    name: string;
    price: number;
    dietaryTag: string;
    spiceLevel: string;
    imageUrl?: string;
  }) => void;
  removeItem: (cartItemId: string) => void;
  updateQuantity: (cartItemId: string, delta: number) => void;
  updateItemModifiers: (
    cartItemId: string,
    modifiers: { spicePreference?: string; notes?: string }
  ) => void;
  clearCart: () => void;

  // Summary calculations
  getCartSubtotal: () => number;
  getCartItemCount: () => number;
}

export const usePosStore = create<PosState>((set, get) => ({
  currentRole: "ADMIN",
  setRole: (role) => set({ currentRole: role }),

  selectedTable: null,
  setSelectedTable: (table) =>
    set({
      selectedTable: table,
      orderType: table?.name.toLowerCase().includes("takeaway")
        ? "TAKEAWAY"
        : "DINE_IN",
    }),

  orderType: "DINE_IN",
  setOrderType: (type) => set({ orderType: type }),

  cart: [],
  orderNotes: "",
  setOrderNotes: (notes) => set({ orderNotes: notes }),

  addItem: (item) => {
    const existingIndex = get().cart.findIndex(
      (ci) => ci.menuItemId === item.id && !ci.notes
    );

    if (existingIndex > -1) {
      const updatedCart = [...get().cart];
      updatedCart[existingIndex].quantity += 1;
      set({ cart: updatedCart });
    } else {
      const newCartItem: CartItem = {
        id: `${item.id}-${Date.now()}`,
        menuItemId: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        dietaryTag: item.dietaryTag,
        spiceLevel: item.spiceLevel,
        spicePreference: item.spiceLevel,
        imageUrl: item.imageUrl,
      };
      set({ cart: [...get().cart, newCartItem] });
    }
  },

  removeItem: (cartItemId) => {
    set({ cart: get().cart.filter((i) => i.id !== cartItemId) });
  },

  updateQuantity: (cartItemId, delta) => {
    const updatedCart = get()
      .cart.map((i) => {
        if (i.id === cartItemId) {
          const newQty = i.quantity + delta;
          return newQty > 0 ? { ...i, quantity: newQty } : null;
        }
        return i;
      })
      .filter((i): i is CartItem => i !== null);

    set({ cart: updatedCart });
  },

  updateItemModifiers: (cartItemId, modifiers) => {
    const updatedCart = get().cart.map((i) => {
      if (i.id === cartItemId) {
        return {
          ...i,
          ...modifiers,
        };
      }
      return i;
    });
    set({ cart: updatedCart });
  },

  clearCart: () => set({ cart: [], orderNotes: "" }),

  getCartSubtotal: () => {
    return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  },

  getCartItemCount: () => {
    return get().cart.reduce((sum, item) => sum + item.quantity, 0);
  },
}));
