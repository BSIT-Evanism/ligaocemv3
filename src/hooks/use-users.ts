"use client"

import { useState, useEffect } from "react"
import { authClient } from "@/lib/auth-client"
import { type User } from "@/components/user-data-table"

interface UseUsersOptions {
    limit?: number
    offset?: number
    searchValue?: string
    searchField?: "email" | "name"
    searchOperator?: "contains" | "starts_with" | "ends_with"
    sortBy?: string
    sortDirection?: "asc" | "desc"
}

interface UseUsersReturn {
    users: User[]
    total: number
    isLoading: boolean
    error: string | null
    refetch: () => Promise<void>
    createUser: (userData: {
        email: string
        password: string
        name: string
        role?: string
    }) => Promise<{ success: boolean; error?: string }>
    banUser: (userId: string, banReason?: string) => Promise<{ success: boolean; error?: string }>
    unbanUser: (userId: string) => Promise<{ success: boolean; error?: string }>
    deleteUser: (userId: string) => Promise<{ success: boolean; error?: string }>
    setUserRole: (userId: string, role: string) => Promise<{ success: boolean; error?: string }>
    setUserPassword: (userId: string, newPassword: string) => Promise<{ success: boolean; error?: string }>
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
    const [users, setUsers] = useState<User[]>([])
    const [total, setTotal] = useState(0)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const {
        limit = 10,
        offset = 0,
        searchValue,
        searchField = "name",
        searchOperator = "contains",
        sortBy = "createdAt",
        sortDirection = "desc"
    } = options

    const fetchUsers = async () => {
        try {
            setIsLoading(true)
            setError(null)

            const { data, error: fetchError } = await authClient.admin.listUsers({
                query: {
                    limit,
                    offset,
                    searchValue,
                    searchField,
                    searchOperator,
                    sortBy,
                    sortDirection
                }
            })

            if (fetchError) {
                setError(fetchError.message ?? "Failed to fetch users")
                return
            }

            if (data) {
                setUsers(data.users ?? [])
                setTotal(data.total ?? 0)
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred")
        } finally {
            setIsLoading(false)
        }
    }

    const createUser = async (userData: {
        email: string
        password: string
        name: string
        role?: string
    }) => {
        try {
            const { data, error: createError } = await authClient.admin.createUser({
                email: userData.email,
                password: userData.password,
                name: userData.name,
                role: userData.role ?? "user"
            })

            if (createError) {
                return { success: false, error: createError.message ?? "Failed to create user" }
            }

            // Refresh the user list
            await fetchUsers()
            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        }
    }

    const banUser = async (userId: string, banReason?: string) => {
        try {
            const { error: banError } = await authClient.admin.banUser({
                userId,
                banReason: banReason ?? "No reason provided"
            })

            if (banError) {
                return { success: false, error: banError.message ?? "Failed to ban user" }
            }

            // Refresh the user list
            await fetchUsers()
            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        }
    }

    const unbanUser = async (userId: string) => {
        try {
            const { error: unbanError } = await authClient.admin.unbanUser({
                userId
            })

            if (unbanError) {
                return { success: false, error: unbanError.message ?? "Failed to unban user" }
            }

            // Refresh the user list
            await fetchUsers()
            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        }
    }

    const deleteUser = async (userId: string) => {
        try {
            const { error: deleteError } = await authClient.admin.removeUser({
                userId
            })

            if (deleteError) {
                return { success: false, error: deleteError.message ?? "Failed to delete user" }
            }

            // Refresh the user list
            await fetchUsers()
            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        }
    }

    const setUserRole = async (userId: string, role: string) => {
        try {
            const { error: roleError } = await authClient.admin.setRole({
                userId,
                role
            })

            if (roleError) {
                return { success: false, error: roleError.message ?? "Failed to update user role" }
            }

            // Refresh the user list
            await fetchUsers()
            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        }
    }

    const setUserPassword = async (userId: string, newPassword: string) => {
        try {
            const { error: passwordError } = await authClient.admin.setUserPassword({
                userId,
                newPassword
            })

            if (passwordError) {
                return { success: false, error: passwordError.message ?? "Failed to update user password" }
            }

            return { success: true }
        } catch (err) {
            return {
                success: false,
                error: err instanceof Error ? err.message : "An unexpected error occurred"
            }
        }
    }

    useEffect(() => {
        void fetchUsers()
    }, [limit, offset, searchValue, searchField, searchOperator, sortBy, sortDirection])

    return {
        users,
        total,
        isLoading,
        error,
        refetch: fetchUsers,
        createUser,
        banUser,
        unbanUser,
        deleteUser,
        setUserRole,
        setUserPassword
    }
}
