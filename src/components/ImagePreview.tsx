"use client";

interface ImagePreviewProps {
    src: string | null;
    onClose: () => void;
}

export default function ImagePreview({ src, onClose }: ImagePreviewProps) {
    if (!src) return null;

    return (
        <div
            className="fixed inset-0 z-[2000] flex items-center justify-center bg-black/90"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
        >
            <button
                type="button"
                aria-label="Close image preview"
                className="absolute right-4 top-4 rounded bg-white/10 px-3 py-1.5 text-white backdrop-blur hover:bg-white/20"
                onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
                Close
            </button>
            <img
                src={src}
                alt="Preview"
                className="max-h-[92vh] max-w-[92vw] object-contain"
                onClick={(e) => e.stopPropagation()}
            />
        </div>
    );
}
