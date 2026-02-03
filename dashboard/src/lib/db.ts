import Dexie, { type Table } from 'dexie';

export interface LocalProduct {
    id: string;
    name: string;
    base_price: string;
    category_id: string;
    image_url?: string;
    send_to_kds: boolean;
    tenant_id: string;
    last_updated: number;
}

export interface LocalVariant {
    id: string;
    product_id: string;
    name: string;
    sku: string;
    price_override?: string;
    tenant_id: string;
    last_updated: number;
}

export interface LocalInventory {
    id: string;
    product_id: string;
    variant_id?: string;
    store_id: string;
    quantity: string;
    min_threshold: string;
    tenant_id: string;
    last_updated: number;
}

export interface PendingOrder {
    id?: number; // Auto-increment locally
    temp_id: string; // Original client-side ID
    order_data: any;
    status: 'pending' | 'syncing' | 'failed';
    created_at: number;
    tenant_id: string;
}

export interface SyncMetadata {
    key: string;
    value: string | number;
}

export class PosDatabase extends Dexie {
    products!: Table<LocalProduct>;
    variants!: Table<LocalVariant>;
    inventory!: Table<LocalInventory>;
    ordersQueue!: Table<PendingOrder>;
    syncMetadata!: Table<SyncMetadata>;

    constructor() {
        super('PosDatabase');
        this.version(1).stores({
            products: 'id, category_id, tenant_id',
            variants: 'id, product_id, tenant_id',
            inventory: 'id, product_id, variant_id, store_id, tenant_id',
            ordersQueue: '++id, temp_id, status, tenant_id',
            syncMetadata: 'key'
        });
    }
}

export const db = new PosDatabase();
