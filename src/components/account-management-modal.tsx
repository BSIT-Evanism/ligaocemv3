'use client'

import { useState } from "react"
import { Button } from "./ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog"
import { Input } from "./ui/input"
import { Label } from "./ui/label"
import { authClient } from "@/lib/auth-client"
import { toast } from "sonner"

interface AccountManagementModalProps {
    user: {
        id: string
        name: string
        email: string
    }
}

export default function AccountManagementModal({ user }: AccountManagementModalProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [formData, setFormData] = useState({
        name: user.name || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    })

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target
        setFormData(prev => ({
            ...prev,
            [name]: value
        }))
    }

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            // Update user profile
            await authClient.updateUser({
                name: formData.name,
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Profile updated successfully")
                        setIsOpen(false)
                    },
                    onError: (error) => {
                        toast.error("Failed to update profile")
                        console.error(error)
                    }
                }
            })
        } catch (error) {
            toast.error("Failed to update profile")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault()

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error("New passwords don't match")
            return
        }

        if (formData.newPassword.length < 6) {
            toast.error("Password must be at least 6 characters")
            return
        }

        setIsLoading(true)

        try {
            await authClient.changePassword({
                currentPassword: formData.currentPassword,
                newPassword: formData.newPassword,
                fetchOptions: {
                    onSuccess: () => {
                        toast.success("Password changed successfully")
                        setFormData(prev => ({
                            ...prev,
                            currentPassword: '',
                            newPassword: '',
                            confirmPassword: ''
                        }))
                    },
                    onError: (error) => {
                        toast.error("Failed to change password")
                        console.error(error)
                    }
                }
            })
        } catch (error) {
            toast.error("Failed to change password")
            console.error(error)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start">
                    Manage Account
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[725px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Account Management</DialogTitle>
                    <DialogDescription>
                        Update your account information and change your password.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Profile Update Form */}
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <h3 className="text-lg font-medium">Profile Information</h3>
                        <div className="space-y-2">
                            <Label htmlFor="name">Name</Label>
                            <Input
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleInputChange}
                                placeholder="Your name"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? "Updating..." : "Update Profile"}
                        </Button>
                    </form>

                    {/* Password Change Form */}
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <h3 className="text-lg font-medium">Change Password</h3>
                        <div className="space-y-2">
                            <Label htmlFor="currentPassword">Current Password</Label>
                            <Input
                                id="currentPassword"
                                name="currentPassword"
                                type="password"
                                value={formData.currentPassword}
                                onChange={handleInputChange}
                                placeholder="Enter current password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="newPassword">New Password</Label>
                            <Input
                                id="newPassword"
                                name="newPassword"
                                type="password"
                                value={formData.newPassword}
                                onChange={handleInputChange}
                                placeholder="Enter new password"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirm New Password</Label>
                            <Input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                value={formData.confirmPassword}
                                onChange={handleInputChange}
                                placeholder="Confirm new password"
                                required
                            />
                        </div>
                        <Button type="submit" disabled={isLoading} className="w-full">
                            {isLoading ? "Changing..." : "Change Password"}
                        </Button>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    )
}
