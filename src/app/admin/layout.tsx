import RoleBlocker from "@/components/auth/RoleBlocker"
import ClientAdminLayout from "./ClientAdminLayout"

export default function Page({ children }: { children: React.ReactNode }) {
    return (
        <RoleBlocker rolesRequired={["admin"]} fullScreen redirectHref="/" ctaLabel="Go to dashboard">
            <ClientAdminLayout>
                {children}
            </ClientAdminLayout>
        </RoleBlocker>
    )
}
