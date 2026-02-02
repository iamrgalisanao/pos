import type { PoolClient } from 'pg';

export interface PricingRule {
    channel?: string;
    location_id?: string;
    price_override?: number;
    start_time?: string;
    end_time?: string;
    days_of_week?: number[];
    priority: number;
}

export async function evaluatePrice(
    client: PoolClient,
    productId: string,
    context: {
        channel?: string;
        locationId?: string;
        variantId?: string;
        currentTime?: Date;
    }
): Promise<number | null> {
    const { channel, locationId, variantId, currentTime = new Date() } = context;
    const dayOfWeek = currentTime.getDay();
    const timeStr = currentTime.toTimeString().split(' ')[0]; // HH:MM:SS

    // Query applicable rules
    // Priority: Higher priority number wins
    const query = `
        SELECT price_override 
        FROM product_pricing_rules
        WHERE product_id = $1
          AND is_active = TRUE
          AND (variant_id IS NULL OR variant_id = $2)
          AND (channel IS NULL OR channel = $3)
          AND (location_id IS NULL OR location_id = $4)
          AND (start_time IS NULL OR start_time <= $5)
          AND (end_time IS NULL OR end_time >= $5)
          AND (days_of_week IS NULL OR $6 = ANY(days_of_week))
        ORDER BY priority DESC, created_at DESC
        LIMIT 1
    `;

    const result = await client.query(query, [
        productId, variantId || null, channel || null, locationId || null, timeStr, dayOfWeek
    ]);

    if (result.rows.length > 0) {
        return parseFloat(result.rows[0].price_override);
    }

    return null;
}

export async function checkAvailability(
    client: PoolClient,
    productId: string,
    context: {
        locationId?: string;
        currentTime?: Date;
    }
): Promise<boolean> {
    const { locationId, currentTime = new Date() } = context;
    const dayOfWeek = currentTime.getDay();
    const timeStr = currentTime.toTimeString().split(' ')[0];

    // Availability rules explicitly restrict visibility.
    // If rules exist for this product/location, at least one must pass.
    // If NO rules exist, it's available by default.
    const countRes = await client.query(
        'SELECT COUNT(*) FROM product_availability_rules WHERE product_id = $1 AND is_active = TRUE',
        [productId]
    );

    if (parseInt(countRes.rows[0].count) === 0) return true;

    const query = `
        SELECT 1
        FROM product_availability_rules
        WHERE product_id = $1
          AND is_active = TRUE
          AND (location_id IS NULL OR location_id = $2)
          AND (start_time IS NULL OR start_time <= $3)
          AND (end_time IS NULL OR end_time >= $3)
          AND (days_of_week IS NULL OR $4 = ANY(days_of_week))
        LIMIT 1
    `;

    const result = await client.query(query, [
        productId, locationId || null, timeStr, dayOfWeek
    ]);

    return result.rows.length > 0;
}
