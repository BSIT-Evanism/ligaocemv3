"use client"

import { useState } from "react"
import { UserDataTable, type User } from "@/components/user-data-table"
import { UserManagementDialog } from "@/components/user-management-dialog"
import { useUsers } from "@/hooks/use-users"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Users } from "lucide-react"

export default function UsersTablePage() {
    const [dialogOpen, setDialogOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
    const [searchValue] = useState("")

    const {
        users,
        total,
        isLoading,
        error,
        refetch,
        createUser,
        banUser,
        unbanUser,
        deleteUser,
        setUserRole,
        setUserPassword
    } = useUsers({
        limit: 10,
        offset: 0,
        searchValue: searchValue || undefined,
        searchField: "name",
        searchOperator: "contains"
    })

    const handleUserAction = async (action: string, userId: string) => {
        switch (action) {
            case "create":
                setDialogMode("create")
                setSelectedUser(null)
                setDialogOpen(true)
                break
            case "edit":
                const user = users.find(u => u.id === userId)
                if (user) {
                    setSelectedUser(user)
                    setDialogMode("edit")
                    setDialogOpen(true)
                }
                break
            case "ban":
                if (confirm("Are you sure you want to ban this user?")) {
                    const result = await banUser(userId, "Banned by admin")
                    if (!result.success) {
                        alert(`Failed to ban user: ${result.error}`)
                    }
                }
                break
            case "unban":
                if (confirm("Are you sure you want to unban this user?")) {
                    const result = await unbanUser(userId)
                    if (!result.success) {
                        alert(`Failed to unban user: ${result.error}`)
                    }
                }
                break
            case "delete":
                if (confirm("Are you sure you want to delete this user? This action cannot be undone.")) {
                    const result = await deleteUser(userId)
                    if (!result.success) {
                        alert(`Failed to delete user: ${result.error}`)
                    }
                }
                break
            // Role change is now handled by the dialog
            case "setRole":
                // This case is no longer used as role change is handled by the dialog
                break
        }
    }

    const handleRoleChange = async (userId: string, newRole: string) => {
        const result = await setUserRole(userId, newRole)
        if (!result.success) {
            alert(`Failed to update role: ${result.error}`)
        }
        return result
    }

    const handleSaveUser = async (userData: {
        email: string
        password: string
        name: string
        role: string
    }) => {
        if (dialogMode === "create") {
            return await createUser(userData)
        } else {
            // For edit mode, we need to handle password separately
            if (userData.password) {
                const passwordResult = await setUserPassword(selectedUser!.id, userData.password)
                if (!passwordResult.success) {
                    return passwordResult
                }
            }
            // Update other fields would need to be implemented in the backend
            // For now, just refresh the list
            await refetch()
            return { success: true }
        }
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
                    <p className="text-muted-foreground">
                        Manage users, roles, and permissions
                    </p>
                </div>
                <div className="flex items-center space-x-2">
                    <Button onClick={() => handleUserAction("create", "")}>
                        <Users className="mr-2 h-4 w-4" />
                        Add User
                    </Button>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Users</CardTitle>
                    <CardDescription>
                        A list of all users in the system. Total: {total} users
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {error && (
                        <Alert className="mb-4">
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                                {error}
                            </AlertDescription>
                        </Alert>
                    )}

                    <UserDataTable
                        data={users}
                        onUserAction={handleUserAction}
                        onRoleChange={handleRoleChange}
                        isLoading={isLoading}
                    />
                </CardContent>
            </Card>

            <UserManagementDialog
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                user={selectedUser}
                onSave={handleSaveUser}
                mode={dialogMode}
            />
        </div>
    )
}