"use client"

import { useState, useMemo } from "react"
import { api } from "@/trpc/react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Skeleton } from "@/components/ui/skeleton"
import {
    Search,
    Plus,
    Trash2,
    User,
    MapPin,
    Calendar,
    ChevronsUpDown,
    Check,
    AlertCircle,
    Users,
    Map
} from "lucide-react"
import { toast } from "sonner"
import { cn } from "@/lib/utils"


export default function GraveRelationsPage() {
    const [searchTerm, setSearchTerm] = useState("")
    const [selectedUser, setSelectedUser] = useState<string>("")
    const [selectedGrave, setSelectedGrave] = useState<string>("")
    const [userComboOpen, setUserComboOpen] = useState(false)
    const [graveComboOpen, setGraveComboOpen] = useState(false)
    const [createDialogOpen, setCreateDialogOpen] = useState(false)

    // Fetch data
    const { data: relations = [], isLoading: relationsLoading, error: relationsError, refetch } = api.graveRelations.listAll.useQuery()
    const { data: availableGraves = [] } = api.graveRelations.getAvailableGraves.useQuery()
    const { data: availableUsers = [] } = api.graveRelations.getAvailableUsers.useQuery()

    // Mutations
    const createRelation = api.graveRelations.create.useMutation({
        onSuccess: () => {
            toast.success("Grave-user relationship created successfully")
            void refetch()
            setCreateDialogOpen(false)
            setSelectedUser("")
            setSelectedGrave("")
        },
        onError: (error) => {
            toast.error(`Failed to create relationship: ${error.message}`)
        }
    })

    const deleteRelation = api.graveRelations.delete.useMutation({
        onSuccess: () => {
            toast.success("Grave-user relationship deleted successfully")
            void refetch()
        },
        onError: (error) => {
            toast.error(`Failed to delete relationship: ${error.message}`)
        }
    })

    // Filter relations based on search
    const filteredRelations = useMemo(() => {
        if (!searchTerm) return relations
        const searchLower = searchTerm.toLowerCase()
        return relations.filter(relation =>
            (relation.userName?.toLowerCase().includes(searchLower) ?? false) ||
            (relation.userEmail?.toLowerCase().includes(searchLower) ?? false) ||
            (relation.clusterName?.toLowerCase().includes(searchLower) ?? false) ||
            ((relation.graveJson as Record<string, unknown>)?.deceasedName?.toString().toLowerCase().includes(searchLower) ?? false)
        )
    }, [relations, searchTerm])

    const handleCreateRelation = () => {
        if (!selectedUser || !selectedGrave) {
            toast.error("Please select both a user and a grave")
            return
        }
        createRelation.mutate({
            userId: selectedUser,
            graveDetailsId: selectedGrave
        })
    }

    const handleDeleteRelation = (relationId: string) => {
        if (confirm("Are you sure you want to delete this relationship?")) {
            deleteRelation.mutate({ id: relationId })
        }
    }

    const getGraveTypeColor = (graveType: string) => {
        const colors = {
            traditional: "bg-blue-100 text-blue-800",
            cremation: "bg-green-100 text-green-800",
            mausoleum: "bg-purple-100 text-purple-800",
            columbarium: "bg-orange-100 text-orange-800",
            memorial: "bg-gray-100 text-gray-800"
        }
        return colors[graveType as keyof typeof colors] ?? "bg-gray-100 text-gray-800"
    }

    const getRoleColor = (role: string | null) => {
        const colors = {
            admin: "bg-red-100 text-red-800",
            user: "bg-blue-100 text-blue-800",
            moderator: "bg-yellow-100 text-yellow-800"
        }
        return colors[role as keyof typeof colors] ?? "bg-gray-100 text-gray-800"
    }

    if (relationsError) {
        return (
            <div className="space-y-4">
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                        Error loading grave-user relationships: {relationsError.message}
                    </AlertDescription>
                </Alert>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Grave-User Relationships</h1>
                    <p className="text-muted-foreground">
                        Manage relationships between users and graves
                    </p>
                </div>
                <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <Plus className="mr-2 h-4 w-4" />
                            Create Relationship
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>Create Grave-User Relationship</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                            {/* User Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select User</label>
                                <Popover open={userComboOpen} onOpenChange={setUserComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={userComboOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedUser
                                                ? (availableUsers.find(u => u.id === selectedUser)?.name ?? "Select user...")
                                                : "Select user..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search users..." />
                                            <CommandList>
                                                <CommandEmpty>No users found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableUsers.map((user) => (
                                                        <CommandItem
                                                            key={user.id}
                                                            value={user.name ?? user.email ?? ""}
                                                            onSelect={(currentValue) => {
                                                                const selectedUser = availableUsers.find(u => u.name === currentValue || u.email === currentValue)
                                                                if (selectedUser) {
                                                                    setSelectedUser(selectedUser.id)
                                                                }
                                                                setUserComboOpen(false)
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedUser === user.id ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{user.name ?? "Unknown"}</span>
                                                                <span className="text-sm text-muted-foreground">{user.email ?? "No email"}</span>
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            {/* Grave Selection */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Select Grave</label>
                                <Popover open={graveComboOpen} onOpenChange={setGraveComboOpen}>
                                    <PopoverTrigger asChild>
                                        <Button
                                            variant="outline"
                                            role="combobox"
                                            aria-expanded={graveComboOpen}
                                            className="w-full justify-between"
                                        >
                                            {selectedGrave
                                                ? (() => {
                                                    const grave = availableGraves.find(g => g.id === selectedGrave)
                                                    const graveData = grave?.graveJson as Record<string, unknown>
                                                    return (graveData?.deceasedName as string) ?? "Select grave..."
                                                })()
                                                : "Select grave..."}
                                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                        </Button>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-full p-0">
                                        <Command>
                                            <CommandInput placeholder="Search graves..." />
                                            <CommandList>
                                                <CommandEmpty>No graves found.</CommandEmpty>
                                                <CommandGroup>
                                                    {availableGraves.map((grave) => {
                                                        const graveData = grave.graveJson as Record<string, unknown>
                                                        return (
                                                            <CommandItem
                                                                key={grave.id}
                                                                value={(graveData?.deceasedName as string) ?? ""}
                                                                onSelect={(currentValue) => {
                                                                    const selectedGrave = availableGraves.find(g => {
                                                                        const graveData = g.graveJson as Record<string, unknown>
                                                                        return (graveData?.deceasedName as string) === currentValue
                                                                    })
                                                                    if (selectedGrave) {
                                                                        setSelectedGrave(selectedGrave.id)
                                                                    }
                                                                    setGraveComboOpen(false)
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedGrave === grave.id ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                <div className="flex flex-col">
                                                                    <span className="font-medium">{graveData?.deceasedName as string}</span>
                                                                    <span className="text-sm text-muted-foreground">
                                                                        {grave.clusterName} - Plot {graveData?.plotNumber as string}
                                                                    </span>
                                                                </div>
                                                            </CommandItem>
                                                        )
                                                    })}
                                                </CommandGroup>
                                            </CommandList>
                                        </Command>
                                    </PopoverContent>
                                </Popover>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <Button
                                    variant="outline"
                                    onClick={() => setCreateDialogOpen(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleCreateRelation}
                                    disabled={!selectedUser || !selectedGrave || createRelation.isPending}
                                >
                                    {createRelation.isPending ? "Creating..." : "Create Relationship"}
                                </Button>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>

            {/* Search */}
            <Card>
                <CardHeader>
                    <CardTitle>Search Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                            placeholder="Search by user name, email, cluster, or deceased name..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Statistics */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Relationships</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{relations.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Graves</CardTitle>
                        <Map className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{availableGraves.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Available Users</CardTitle>
                        <User className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{availableUsers.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Relationships List */}
            <Card>
                <CardHeader>
                    <CardTitle>Grave-User Relationships</CardTitle>
                </CardHeader>
                <CardContent>
                    {relationsLoading ? (
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center space-x-4">
                                    <Skeleton className="h-12 w-12 rounded-full" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-[250px]" />
                                        <Skeleton className="h-4 w-[200px]" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : filteredRelations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                            <p>No relationships found</p>
                            <p className="text-sm">Create a relationship to get started</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredRelations.map((relation) => {
                                const graveData = relation.graveJson as Record<string, unknown>
                                return (
                                    <div
                                        key={relation.id}
                                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0">
                                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center">
                                                    <User className="h-6 w-6 text-muted-foreground" />
                                                </div>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center space-x-2 mb-1">
                                                    <h3 className="font-medium truncate">
                                                        {relation.userName ?? "Unknown User"}
                                                    </h3>
                                                    <Badge className={getRoleColor(relation.userRole ?? null)}>
                                                        {relation.userRole ?? "Unknown"}
                                                    </Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground truncate">
                                                    {relation.userEmail ?? "No email"}
                                                </p>
                                                <div className="flex items-center space-x-4 mt-2 text-xs text-muted-foreground">
                                                    <div className="flex items-center space-x-1">
                                                        <MapPin className="h-3 w-3" />
                                                        <span>{relation.clusterName} - Plot {String(graveData?.plotNumber ?? "")}</span>
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{String(graveData?.deceasedName ?? "")}</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Badge className={getGraveTypeColor(typeof graveData?.graveType === 'string' ? graveData.graveType : "")}>
                                                {typeof graveData?.graveType === 'string' ? graveData.graveType : "Unknown"}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDeleteRelation(relation.id)}
                                                disabled={deleteRelation.isPending}
                                                className="text-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
