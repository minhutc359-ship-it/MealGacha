export declare const AW2_DELIVERY_SECURITY_PROFILE: "aw2-static-v1"
export declare const AW2_SECURITY_HEADERS: Readonly<Record<string, string>>
export declare const AW2_CACHE_HEADERS: Readonly<Record<string, string>>
export declare const AW2_VERCEL_IGNORE_RULES: readonly string[]
export declare function validateAw2DeliveryConfig(config: unknown): string[]
export declare function validateAw2VercelIgnore(source: unknown): string[]
