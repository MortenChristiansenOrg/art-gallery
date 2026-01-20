import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Admin } from '../Admin'

// Mock auth hook
vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}))

// Mock data
let mockArtworks: any[] = []

// Track useQuery call index to return different data for different queries
let queryCallIndex = 0

vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => {
    // Queries are called in order: artworks, series, messages, unreadCount, siteContent
    const index = queryCallIndex++
    if (index % 5 === 0) return mockArtworks // artworks
    if (index % 5 === 1) return []            // series
    if (index % 5 === 2) return []            // messages
    if (index % 5 === 3) return 0             // unreadCount
    return ''                                  // siteContent
  }),
  useMutation: vi.fn(() => vi.fn()),
}))

function createMockArtwork(overrides: Partial<{
  _id: string
  title: string
  published: boolean
  thumbnailId: string | null
  dziStatus: 'pending' | 'generating' | 'complete' | 'failed' | null
  imageUrl: string
}> = {}) {
  return {
    _id: 'artwork-1',
    title: 'Test Artwork',
    published: false,
    thumbnailId: 'thumb-123',
    dziStatus: 'complete' as const,
    imageUrl: 'https://example.com/image.jpg',
    ...overrides,
  }
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockArtworks = []
    queryCallIndex = 0
  })

  describe('Processing Status Badge', () => {
    it('shows no badge when processing is complete', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: 'thumb-123',
        dziStatus: 'complete',
      })]

      render(<Admin />)

      expect(screen.queryByText('Processing...')).not.toBeInTheDocument()
      expect(screen.queryByText('Generating tiles...')).not.toBeInTheDocument()
      expect(screen.queryByText('Processing failed')).not.toBeInTheDocument()
    })

    it('shows "Processing..." when thumbnailId is missing', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: null,
        dziStatus: 'pending',
      })]

      render(<Admin />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('shows "Processing..." when dziStatus is pending', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: 'thumb-123',
        dziStatus: 'pending',
      })]

      render(<Admin />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('shows "Generating tiles..." when dziStatus is generating', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: 'thumb-123',
        dziStatus: 'generating',
      })]

      render(<Admin />)

      expect(screen.getByText('Generating tiles...')).toBeInTheDocument()
    })

    it('shows "Processing failed" when dziStatus is failed', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: 'thumb-123',
        dziStatus: 'failed',
      })]

      render(<Admin />)

      expect(screen.getByText('Processing failed')).toBeInTheDocument()
    })

    it('shows "Processing..." when dziStatus is null/undefined', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: 'thumb-123',
        dziStatus: null,
      })]

      render(<Admin />)

      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('shows status alongside publish status', () => {
      mockArtworks = [createMockArtwork({
        published: true,
        thumbnailId: null,
        dziStatus: 'pending',
      })]

      render(<Admin />)

      expect(screen.getByText('Published')).toBeInTheDocument()
      expect(screen.getByText('Processing...')).toBeInTheDocument()
    })

    it('shows Draft status for unpublished artwork', () => {
      mockArtworks = [createMockArtwork({
        published: false,
        thumbnailId: 'thumb-123',
        dziStatus: 'complete',
      })]

      render(<Admin />)

      expect(screen.getByText('Draft')).toBeInTheDocument()
    })

    it('applies yellow styling for processing states', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: null,
        dziStatus: 'pending',
      })]

      render(<Admin />)

      const badge = screen.getByText('Processing...')
      expect(badge).toHaveClass('bg-yellow-100', 'text-yellow-700')
    })

    it('applies red styling for failed state', () => {
      mockArtworks = [createMockArtwork({
        thumbnailId: 'thumb-123',
        dziStatus: 'failed',
      })]

      render(<Admin />)

      const badge = screen.getByText('Processing failed')
      expect(badge).toHaveClass('bg-red-100', 'text-red-700')
    })

    it('handles multiple artworks with different statuses', () => {
      mockArtworks = [
        createMockArtwork({
          _id: 'art-1',
          title: 'Complete Art',
          thumbnailId: 'thumb-1',
          dziStatus: 'complete',
        }),
        createMockArtwork({
          _id: 'art-2',
          title: 'Processing Art',
          thumbnailId: null,
          dziStatus: 'pending',
        }),
        createMockArtwork({
          _id: 'art-3',
          title: 'Failed Art',
          thumbnailId: 'thumb-3',
          dziStatus: 'failed',
        }),
      ]

      render(<Admin />)

      expect(screen.getByText('Complete Art')).toBeInTheDocument()
      expect(screen.getByText('Processing Art')).toBeInTheDocument()
      expect(screen.getByText('Failed Art')).toBeInTheDocument()
      expect(screen.getByText('Processing...')).toBeInTheDocument()
      expect(screen.getByText('Processing failed')).toBeInTheDocument()
    })
  })
})
