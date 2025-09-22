"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { User } from "@/components/user-data-table"

interface RoleChangeDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    user: User | null
    onRoleChange: (userId: string, newRole: string) => Promise<{ success: boolean; error?: string }>
}

export function RoleChangeDialog({
    open,
    onOpenChange,
    user,
    onRoleChange
}: RoleChangeDialogProps) {
    const [selectedRole, setSelectedRole] = useState("")
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        if (user) {
            setSelectedRole(user.role)
        }
    }, [user])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!user || !selectedRole) return

        setIsLoading(true)
        setError(null)

        try {
            const result = await onRoleChange(user.id, selectedRole)
            if (result.success) {
                onOpenChange(false)
            } else {
                setError(result.error || "An error occurred")
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const handleOpenChange = (newOpen: boolean) => {
        if (!newOpen) {
            setError(null)
            setSelectedRole(user?.role || "")
        }
        onOpenChange(newOpen)
    }

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Change User Role</DialogTitle>
                    <DialogDescription>
                        Change the role for {user?.name} ({user?.email}). This will affect their permissions in the system.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <label htmlFor="role" className="text-right font-medium">
                                Role
                            </label>
                            <Select
                                value={selectedRole}
                                onValueChange={setSelectedRole}
                            >
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">User</SelectItem>
                                    <SelectItem value="admin">Admin</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    {error && (
                        <div className="text-sm text-red-600 mb-4">
                            {error}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => handleOpenChange(false)}
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isLoading || !selectedRole || selectedRole === user?.role}
                        >
                            {isLoading ? "Updating..." : "Update Role"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}
