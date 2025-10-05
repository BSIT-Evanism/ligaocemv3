

'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Search, MapPin, User, Calendar } from 'lucide-react'
import { api } from '@/trpc/react'
import { useDebounce } from '@/hooks/use-debounce'
import { Skeleton } from '@/components/ui/skeleton'
import { HighlightText } from '@/lib/search-highlight'

export default function SearchPage() {
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms debounce

    // Initialize search query from URL parameter
    useEffect(() => {
        const query = searchParams.get('q')
        if (query) {
            setSearchQuery(query)
        }
    }, [searchParams])

    const { data: searchResults, isLoading, error } = api.search.all.useQuery(
        {
            query: debouncedSearchQuery,
            limit: 50,
            offset: 0,
        },
        {
            enabled: debouncedSearchQuery.length > 0,
            retry: false,
        }
    )

    const formatDate = (date: Date | string | null): string => {
        if (!date) return 'N/A'
        try {
            const dateObj = new Date(date)
            if (isNaN(dateObj.getTime())) return 'Invalid Date'
            return dateObj.toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
            })
        } catch {
            return 'Invalid Date'
        }
    }

    return (
        <div className="container mx-auto p-6 space-y-6">
            <div className="space-y-2">
                <h1 className="text-3xl font-bold">Search</h1>
                <p className="text-muted-foreground">
                    Search through graves and requests
                </p>
            </div>

            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                    placeholder="Search graves and requests..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                />
            </div>

            {isLoading && searchQuery && (
                <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-32 w-full" />
                </div>
            )}

            {error && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="text-destructive">
                            Error: {error?.message ?? 'An error occurred'}
                        </div>
                    </CardContent>
                </Card>
            )}

            {searchResults && !isLoading && (
                <div className="space-y-6">
                    {/* Graves Results */}
                    {searchResults?.graves?.results && searchResults.graves.results.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <MapPin className="h-6 w-6" />
                                Graves ({searchResults.graves.total})
                            </h2>
                            <div className="grid gap-4">
                                {searchResults.graves.results.map((grave) => {
                                    const graveData = grave.graveJson as Record<string, unknown>
                                    return (
                                        <Card key={grave.id}>
                                            <CardHeader>
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <CardTitle className="text-lg">
                                                            <HighlightText
                                                                text={typeof graveData.deceasedName === 'string' ? graveData.deceasedName : 'Unknown'}
                                                                searchTerm={debouncedSearchQuery}
                                                                highlightClassName="bg-yellow-200 font-semibold"
                                                            />
                                                        </CardTitle>
                                                        <p className="text-sm text-muted-foreground">
                                                            Plot: <HighlightText
                                                                text={typeof graveData.plotNumber === 'string' ? graveData.plotNumber : 'N/A'}
                                                                searchTerm={debouncedSearchQuery}
                                                                highlightClassName="bg-yellow-200 font-semibold"
                                                            />
                                                        </p>
                                                    </div>
                                                    <Badge variant="secondary">
                                                        <HighlightText
                                                            text={typeof graveData.graveType === 'string' ? graveData.graveType : 'Unknown'}
                                                            searchTerm={debouncedSearchQuery}
                                                            highlightClassName="bg-yellow-100 font-semibold"
                                                        />
                                                    </Badge>
                                                </div>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="space-y-2 text-sm">
                                                    {typeof graveData.birthDate === 'string' && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span>
                                                                Born: {formatDate(graveData.birthDate)}
                                                            </span>
                                                        </div>
                                                    )}
                                                    {typeof graveData.deathDate === 'string' && (
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                                            <span>
                                                                Died: {formatDate(graveData.deathDate)}
                                                            </span>
                                                            <p className="text-muted-foreground">
                                                                <HighlightText
                                                                    text={typeof graveData.notes === 'string' ? graveData.notes : ''}
                                                                    searchTerm={debouncedSearchQuery}
                                                                    highlightClassName="bg-yellow-200 font-semibold"
                                                                />
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            </CardContent>
                                        </Card>
                                    )
                                })}
                            </div>
                        </div>
                    )}

                    {/* Requests Results */}
                    {searchResults?.requests?.results && searchResults.requests.results.length > 0 && (
                        <div className="space-y-4">
                            <h2 className="text-2xl font-semibold flex items-center gap-2">
                                <User className="h-6 w-6" />
                                Requests ({searchResults.requests.total})
                            </h2>
                            <div className="grid gap-4">
                                {searchResults.requests.results.map((request) => (
                                    <Card key={request.requestId}>
                                        <CardHeader>
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-lg">
                                                        <HighlightText
                                                            text={request.userName ?? 'Unknown User'}
                                                            searchTerm={debouncedSearchQuery}
                                                            highlightClassName="bg-yellow-200 font-semibold"
                                                        />
                                                    </CardTitle>
                                                    <p className="text-sm text-muted-foreground">
                                                        <HighlightText
                                                            text={request.userEmail ?? ''}
                                                            searchTerm={debouncedSearchQuery}
                                                            highlightClassName="bg-yellow-200 font-semibold"
                                                        />
                                                    </p>
                                                </div>
                                                <Badge variant="outline">
                                                    <HighlightText
                                                        text={request.userRole ?? 'User'}
                                                        searchTerm={debouncedSearchQuery}
                                                        highlightClassName="bg-yellow-100 font-semibold"
                                                    />
                                                </Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2">
                                                <p className="text-sm">
                                                    <HighlightText
                                                        text={request.requestDetails ?? ''}
                                                        searchTerm={debouncedSearchQuery}
                                                        highlightClassName="bg-yellow-200 font-semibold"
                                                    />
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <Calendar className="h-4 w-4" />
                                                    <span>
                                                        {formatDate(request.createdAt as unknown as string | null)}
                                                    </span>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* No Results */}
                    {searchResults?.graves?.results && searchResults.graves.results.length === 0 &&
                        searchResults?.requests?.results && searchResults.requests.results.length === 0 &&
                        debouncedSearchQuery && (
                            <Card>
                                <CardContent className="pt-6 text-center">
                                    <p className="text-muted-foreground">
                                        No results found for &quot;{debouncedSearchQuery}&quot;
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                </div>
            )}

            {!searchQuery && (
                <Card>
                    <CardContent className="pt-6 text-center">
                        <p className="text-muted-foreground">
                            Enter a search term to find graves and requests
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}