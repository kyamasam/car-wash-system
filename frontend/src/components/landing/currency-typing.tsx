"use client";

import { useEffect, useMemo, useState } from "react";

const currencies = [
    { code: "KES" },
    { code: "TZS" },
    { code: "UGX" },
    { code: "RWF" },
    { code: "BIF" },
    { code: "ETB" },
    { code: "NGN" },
    { code: "GHS" },
    { code: "ZAR" },
    { code: "EGP" },
    { code: "MAD" },
    { code: "XOF" },
    { code: "XAF" },
    { code: "USD" },
];

function splitGraphemes(value: string) {
    if (typeof Intl !== "undefined" && "Segmenter" in Intl) {
        const segmenter = new Intl.Segmenter(undefined, {
            granularity: "grapheme",
        });

        return Array.from(segmenter.segment(value), (item) => item.segment);
    }

    return Array.from(value);
}

export function CurrencyTyping() {
    const [index, setIndex] = useState(0);
    const [charCount, setCharCount] = useState(0);
    const [deleting, setDeleting] = useState(false);

    const fullText = currencies[index].code;

    const characters = useMemo(() => splitGraphemes(fullText), [fullText]);

    const text = characters.slice(0, charCount).join("");

    useEffect(() => {
        const timeout = setTimeout(
            () => {
                if (!deleting && charCount < characters.length) {
                    setCharCount((prev) => prev + 1);
                } else if (!deleting && charCount === characters.length) {
                    setDeleting(true);
                } else if (deleting && charCount > 0) {
                    setCharCount((prev) => prev - 1);
                } else {
                    setDeleting(false);
                    setIndex((prev) => (prev + 1) % currencies.length);
                }
            },
            !deleting && charCount === characters.length ? 900 : deleting ? 45 : 85
        );

        return () => clearTimeout(timeout);
    }, [charCount, deleting, characters.length]);

    return (
        <span className="inline-flex min-w-[120px] items-center justify-center rounded-full border border-primary/20 px-4 py-2 text-sm font-bold shadow-sm">
            {text}
            <span className="ml-1 animate-pulse text-primary">|</span>
        </span>
    );
}