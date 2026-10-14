import { useEffect, useState } from "react";
import { AWAKENING_MEDIA, type SpiritSkillDetails } from "../game/adventureRpg/awakening";
let cached: SpiritSkillDetails | null = null, pending: Promise<SpiritSkillDetails> | null = null;
function load() {
    if (cached)
        return Promise.resolve(cached);
    pending ??= fetch(`${AWAKENING_MEDIA}/skill-details.json`).then(async (r) => {
        if (!r.ok)
            throw Error("skill details");
        const data = await r.json();
        for (const [key, length] of Object.entries({ primary: 25, support: 16, ultimate: 20, passive: 12, oaths: 6, legendary: 6 }))
            if (!Array.isArray(data[key]) || data[key].length !== length || !data[key].every((s: unknown) => typeof s === "string"))
                throw Error("skill details shape");
        cached = data;
        return data as SpiritSkillDetails;
    }).finally(() => { pending = null; });
    return pending;
}
export function useSpiritDetails() {
    const [details, setDetails] = useState(cached), [error, setError] = useState(false), [attempt, setAttempt] = useState(0);
    useEffect(() => { let active = true; setError(false); void load().then(d => { if (active)
        setDetails(d); }).catch(() => { if (active)
        setError(true); }); return () => { active = false; }; }, [attempt]);
    return { details, error, retry: () => setAttempt(n => n + 1) };
}
