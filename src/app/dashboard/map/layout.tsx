import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Map",
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
    return (
        <div className="container mx-auto px-4 py-4 md:py-6">
            {children}
        </div>
    );
}


