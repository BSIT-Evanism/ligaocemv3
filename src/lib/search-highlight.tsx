import React from 'react';

interface HighlightTextProps {
    text: string | undefined | null;
    searchTerm: string;
    className?: string;
    highlightClassName?: string;
}

/**
 * Component that highlights matching text in search results
 * @param text - The text to search within
 * @param searchTerm - The term to highlight
 * @param className - CSS class for the container
 * @param highlightClassName - CSS class for highlighted text
 */
export function HighlightText({
    text,
    searchTerm,
    className = "",
    highlightClassName = "bg-yellow-200 font-semibold"
}: HighlightTextProps) {
    // Handle undefined/null text values
    if (!text) {
        return <span className={className}></span>;
    }

    if (!searchTerm.trim()) {
        return <span className={className}>{text}</span>;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span className={className}>
            {parts.map((part, index) => {
                const isMatch = regex.test(part);
                return (
                    <span
                        key={index}
                        className={isMatch ? highlightClassName : ''}
                    >
                        {part}
                    </span>
                );
            })}
        </span>
    );
}

/**
 * Utility function to get highlighted text as JSX elements
 * @param text - The text to search within
 * @param searchTerm - The term to highlight
 * @param highlightClassName - CSS class for highlighted text
 */
export function getHighlightedText(
    text: string | undefined | null,
    searchTerm: string,
    highlightClassName = "bg-yellow-200 font-semibold"
) {
    // Handle undefined/null text values
    if (!text) {
        return '';
    }

    if (!searchTerm.trim()) {
        return text;
    }

    const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return parts.map((part, index) => {
        const isMatch = regex.test(part);
        return isMatch ? (
            <span key={index} className={highlightClassName}>
                {part}
            </span>
        ) : part;
    });
}
