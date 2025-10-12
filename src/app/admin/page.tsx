import RoleBlocker from "@/components/auth/RoleBlocker";
import AdminDashboard from "./_components/admin-dashboard";




export default function AdminPage() {
    return (
        <RoleBlocker rolesRequired={["admin"]} fullScreen redirectHref="/" ctaLabel="Go to dashboard">
            <AdminDashboard />
        </RoleBlocker>
    )
}