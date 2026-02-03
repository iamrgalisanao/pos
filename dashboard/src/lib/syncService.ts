import api from './api';
import { db, type LocalProduct, type LocalVariant, type LocalInventory } from './db';

const SYNC_INTERVAL = 30000; // 30 seconds

export const SyncService = {
    async getLastSequence(): Promise<number> {
        const meta = await db.syncMetadata.get('last_sequence');
        return meta ? (meta.value as number) : 0;
    },

    async setLastSequence(seq: number) {
        await db.syncMetadata.put({ key: 'last_sequence', value: seq });
    },

    async pullDeltas(tenantId: string) {
        try {
            const since = await this.getLastSequence();
            const response = await api.get('/sync', {
                params: { since },
                headers: { 'X-Tenant-ID': tenantId }
            });

            const deltas = response.data;
            if (deltas.length === 0) return;

            for (const delta of deltas) {
                const { table_name, record_id, operation } = delta;

                if (operation === 'DELETE') {
                    if (table_name === 'products') await db.products.delete(record_id);
                    if (table_name === 'product_variants') await db.variants.delete(record_id);
                    if (table_name === 'inventory') await db.inventory.delete(record_id);
                } else {
                    // For INSERT/UPDATE, we fetch the latest record state
                    // This is a simplified approach. In a more robust system, 
                    // the delta itself might contain the data.
                    await this.syncRecord(table_name, record_id, tenantId);
                }
            }

            const maxSeq = Math.max(...deltas.map((d: any) => d.sequence));
            await this.setLastSequence(maxSeq);
        } catch (error) {
            console.error('Sync pull failed:', error);
        }
    },

    async syncRecord(tableName: string, recordId: string, tenantId: string) {
        try {
            if (tableName === 'products') {
                const resp = await api.get(`/products/${recordId}`, { headers: { 'X-Tenant-ID': tenantId } });
                await db.products.put({ ...resp.data, last_updated: Date.now() });
            } else if (tableName === 'product_variants') {
                // Variants are usually fetched with products or individually
                // For now, let's assume we fetch all variants for a product if one changes
                // or just fetch this specific one if we have an endpoint
                const resp = await api.get(`/variants/${recordId}`, { headers: { 'X-Tenant-ID': tenantId } });
                await db.variants.put({ ...resp.data, last_updated: Date.now() });
            } else if (tableName === 'inventory') {
                const resp = await api.get(`/inventory/${recordId}`, { headers: { 'X-Tenant-ID': tenantId } });
                await db.inventory.put({ ...resp.data, last_updated: Date.now() });
            }
        } catch (err) {
            console.warn(`Failed to sync record ${recordId} in ${tableName}`, err);
        }
    },

    async pushOrders(tenantId: string) {
        const pending = await db.ordersQueue.where('status').equals('pending').toArray();
        for (const order of pending) {
            try {
                await db.ordersQueue.update(order.id!, { status: 'syncing' });
                await api.post('/orders', order.order_data, {
                    headers: { 'X-Tenant-ID': tenantId }
                });
                await db.ordersQueue.delete(order.id!);
            } catch (error) {
                console.error('Failed to push order:', error);
                await db.ordersQueue.update(order.id!, { status: 'failed' });
            }
        }
    },

    startBackgroundSync(tenantId: string) {
        const interval = setInterval(() => {
            if (navigator.onLine) {
                this.pullDeltas(tenantId);
                this.pushOrders(tenantId);
            }
        }, SYNC_INTERVAL);
        return () => clearInterval(interval);
    }
};
