

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
import { useSession } from '@/lib/auth-client'

export default function SearchPage() {
    const searchParams = useSearchParams()
    const [searchQuery, setSearchQuery] = useState('')
    const debouncedSearchQuery = useDebounce(searchQuery, 300) // 300ms debounce
    const { data: session } = useSession()

    // Initialize search query from URL parameter
    useEffect(() => {
        const query = searchParams.get('q')
        if (query) {
            setSearchQuery(query)
        }
    }, [searchParams])

    // Use authenticated search if user is logged in, public search otherwise
    const { data: authenticatedSearchResults, isLoading: isAuthenticatedLoading, error: authenticatedError } = api.search.all.useQuery(
        {
            query: debouncedSearchQuery,
            limit: 50,
            offset: 0,
        },
        {
            enabled: debouncedSearchQuery.length > 0 && !!session,
            retry: false,
        }
    )

    const { data: publicSearchResults, isLoading: isPublicLoading, error: publicError } = api.public.search.useQuery(
        {
            query: debouncedSearchQuery,
            limit: 50,
            offset: 0,
        },
        {
            enabled: debouncedSearchQuery.length > 0 && !session,
            retry: false,
        }
    )

    // Use the appropriate search results based on authentication state
    const searchResults = session ? authenticatedSearchResults : publicSearchResults
    const isLoading = session ? isAuthenticatedLoading : isPublicLoading
    const error = session ? authenticatedError : publicError

    // Type guards to help TypeScript understand the different result structures
    const isAuthenticatedResults = (results: unknown): results is { graves: { results: unknown[]; total: number }; requests: { results: unknown[]; total: number } } => {
        return results !== null && typeof results === 'object' && 'graves' in results && 'requests' in results
    }

    const isPublicResults = (results: unknown): results is { results: unknown[]; total: number; hasMore: boolean } => {
        return results !== null && typeof results === 'object' && 'results' in results && !('graves' in results)
    }

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
            <div className="container mx-auto p-6 space-y-8">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium">
                        <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
                        Search
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-slate-900">
                        Find What You&apos;re{" "}
                        <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                            Looking For
                        </span>
                    </h1>
                    <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                        {session ? 'Search through graves and requests with our intelligent search system' : 'Search through graves to find information quickly'}
                    </p>
                </div>

                {/* Search Input */}
                <div className="max-w-2xl mx-auto">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                            placeholder={session ? "Search graves and requests..." : "Search graves..."}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-12 h-14 text-lg rounded-2xl border-2 border-slate-200 focus:border-emerald-500 focus:ring-0 shadow-lg bg-white/80 backdrop-blur-sm"
                        />
                    </div>
                </div>

                {/* Loading State */}
                {isLoading && searchQuery && (
                    <div className="space-y-6 max-w-4xl mx-auto">
                        <div className="text-center py-8">
                            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Search className="h-6 w-6 text-emerald-600 animate-pulse" />
                            </div>
                            <p className="text-slate-600">Searching...</p>
                        </div>
                        <div className="space-y-4">
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                            <Skeleton className="h-32 w-full rounded-2xl" />
                        </div>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="max-w-4xl mx-auto">
                        <Card className="bg-red-50 border-red-200 shadow-lg">
                            <CardContent className="pt-6">
                                <div className="text-red-700 text-center">
                                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-6 w-6 text-red-600" />
                                    </div>
                                    <p className="font-semibold">Search Error</p>
                                    <p className="text-sm mt-1">{error?.message ?? 'An error occurred while searching'}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Results */}
                {searchResults && !isLoading && (
                    <div className="space-y-8 max-w-4xl mx-auto">
                        {/* Graves Results - Handle both authenticated and public search results */}
                        {((isAuthenticatedResults(searchResults) && searchResults.graves.results.length > 0) ||
                            (isPublicResults(searchResults) && searchResults.results.length > 0)) && (
                                <div className="space-y-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
                                            <MapPin className="h-5 w-5 text-emerald-600" />
                                        </div>
                                        <div>
                                            <h2 className="text-2xl font-bold text-slate-900">Graves</h2>
                                            <p className="text-slate-600">
                                                {isAuthenticatedResults(searchResults) ? searchResults.graves.total : searchResults.total} result{(isAuthenticatedResults(searchResults) ? searchResults.graves.total : searchResults.total) !== 1 ? 's' : ''} found
                                            </p>
                                        </div>
                                    </div>
                                    <div className="grid gap-6">
                                        {(isAuthenticatedResults(searchResults) ? searchResults.graves.results : searchResults.results)?.map((grave: unknown) => {
                                            const graveObj = grave as { id: string; graveJson: unknown }
                                            const graveData = graveObj.graveJson as Record<string, unknown>
                                            return (
                                                <Card key={graveObj.id} className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                                                    <CardHeader className="pb-4">
                                                        <div className="flex items-start justify-between">
                                                            <div className="flex-1">
                                                                <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                                                                    <HighlightText
                                                                        text={typeof graveData.deceasedName === 'string' ? graveData.deceasedName : 'Unknown'}
                                                                        searchTerm={debouncedSearchQuery}
                                                                        highlightClassName="bg-yellow-200 font-semibold px-1 rounded"
                                                                    />
                                                                </CardTitle>
                                                                <div className="flex items-center gap-4 text-sm text-slate-600">
                                                                    <div className="flex items-center gap-1">
                                                                        <MapPin className="h-4 w-4" />
                                                                        <span>Plot: <HighlightText
                                                                            text={typeof graveData.plotNumber === 'string' ? graveData.plotNumber : 'N/A'}
                                                                            searchTerm={debouncedSearchQuery}
                                                                            highlightClassName="bg-yellow-200 font-semibold"
                                                                        /></span>
                                                                    </div>
                                                                </div>
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
                                                                </div>
                                                            )}
                                                            {typeof graveData.notes === 'string' && graveData.notes && (
                                                                <p className="text-muted-foreground">
                                                                    <HighlightText
                                                                        text={graveData.notes}
                                                                        searchTerm={debouncedSearchQuery}
                                                                        highlightClassName="bg-yellow-200 font-semibold"
                                                                    />
                                                                </p>
                                                            )}
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )
                                        })}
                                    </div>
                                </div>
                            )}

                        {/* Requests Results - Only show for authenticated users */}
                        {isAuthenticatedResults(searchResults) && searchResults.requests.results.length > 0 && (
                            <div className="space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                                        <User className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-bold text-slate-900">Requests</h2>
                                        <p className="text-slate-600">
                                            {searchResults.requests.total} result{searchResults.requests.total !== 1 ? 's' : ''} found
                                        </p>
                                    </div>
                                </div>
                                <div className="grid gap-6">
                                    {searchResults.requests.results.map((request: unknown) => {
                                        const requestObj = request as { requestId: string; userName: string | null; userEmail: string | null; userRole: string | null; requestDetails: string | null; createdAt: unknown }
                                        return (
                                            <Card key={requestObj.requestId} className="bg-white/70 backdrop-blur-sm border-white/20 shadow-lg hover:shadow-xl transition-all duration-300">
                                                <CardHeader className="pb-4">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex-1">
                                                            <CardTitle className="text-xl font-bold text-slate-900 mb-2">
                                                                <HighlightText
                                                                    text={requestObj.userName ?? 'Unknown User'}
                                                                    searchTerm={debouncedSearchQuery}
                                                                    highlightClassName="bg-yellow-200 font-semibold px-1 rounded"
                                                                />
                                                            </CardTitle>
                                                            <p className="text-sm text-slate-600 mb-3">
                                                                <HighlightText
                                                                    text={requestObj.userEmail ?? ''}
                                                                    searchTerm={debouncedSearchQuery}
                                                                    highlightClassName="bg-yellow-200 font-semibold px-1 rounded"
                                                                />
                                                            </p>
                                                            <div className="flex items-center gap-2 text-xs text-slate-500">
                                                                <Calendar className="h-4 w-4" />
                                                                <span>
                                                                    {formatDate(requestObj.createdAt as unknown as string | null)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                                            <HighlightText
                                                                text={requestObj.userRole ?? 'User'}
                                                                searchTerm={debouncedSearchQuery}
                                                                highlightClassName="bg-yellow-100 font-semibold"
                                                            />
                                                        </Badge>
                                                    </div>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-3">
                                                        <p className="text-sm text-slate-700 leading-relaxed">
                                                            <HighlightText
                                                                text={requestObj.requestDetails ?? ''}
                                                                searchTerm={debouncedSearchQuery}
                                                                highlightClassName="bg-yellow-200 font-semibold px-1 rounded"
                                                            />
                                                        </p>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                        {/* No Results */}
                        {((isAuthenticatedResults(searchResults) && searchResults.graves.results.length === 0 && searchResults.requests.results.length === 0) ||
                            (isPublicResults(searchResults) && searchResults.results.length === 0)) &&
                            debouncedSearchQuery && (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Search className="h-8 w-8 text-slate-400" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900 mb-2">No results found</h3>
                                    <p className="text-slate-600 mb-4">
                                        No results found for &quot;{debouncedSearchQuery}&quot;
                                    </p>
                                    <p className="text-sm text-slate-500">
                                        Try different keywords or check your spelling
                                    </p>
                                </div>
                            )}
                    </div>
                )}

                {/* Empty State */}
                {!searchQuery && (
                    <div className="text-center py-16">
                        <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search className="h-10 w-10 text-emerald-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4">Start Your Search</h3>
                        <p className="text-lg text-slate-600 mb-6 max-w-md mx-auto">
                            {session ? 'Enter a search term to find graves and requests' : 'Enter a search term to find graves'}
                        </p>
                        <div className="text-sm text-slate-500">
                            <p>Try searching for:</p>
                            <div className="flex flex-wrap justify-center gap-2 mt-2">
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs">Deceased name</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs">Plot number</span>
                                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs">Grave type</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}