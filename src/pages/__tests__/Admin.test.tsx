import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Admin } from '../Admin'

// Mock auth hook
const mockToken = 'mock-token'
vi.mock('../../lib/auth', () => ({
  useAuth: vi.fn(() => ({
    isAuthenticated: true,
    token: mockToken,
    login: vi.fn(),
    logout: vi.fn(),
  })),
}))

// Mock data
let mockArtworks: any[] = []
let mockCollections: any[] = []
let mockMessages: any[] = []
let mockUnreadCount = 0
let mockAboutContent = ''

// Mock mutations
const mockDeleteMessage = vi.fn()
const mockMarkMessageRead = vi.fn()
const mockSetContent = vi.fn()

// Track useQuery call index to return different data for different queries
let queryCallIndex = 0

vi.mock('convex/react', () => ({
  useQuery: vi.fn((query, args) => {
    // Queries are called in order: collections, artworks/listUncategorized, messages, unreadCount, siteContent
    const index = queryCallIndex++
    // Skip returns undefined
    if (args === "skip") return undefined
    if (index % 5 === 0) return mockCollections // collections
    if (index % 5 === 1) return mockArtworks    // artworks (list or listUncategorized)
    if (index % 5 === 2) return mockMessages    // messages
    if (index % 5 === 3) return mockUnreadCount // unreadCount
    return mockAboutContent                     // siteContent
  }),
  useMutation: vi.fn((mutation) => {
    if (mutation?.name === 'messages:remove') return mockDeleteMessage
    if (mutation?.name === 'messages:markRead') return mockMarkMessageRead
    if (mutation?.name === 'siteContent:set') return mockSetContent
    return vi.fn()
  }),
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

function createMockMessage(overrides: Partial<{
  _id: string
  name: string
  email: string
  message: string
  read: boolean
  createdAt: number
}> = {}) {
  return {
    _id: 'msg-1',
    name: 'John Doe',
    email: 'john@example.com',
    message: 'Hello, I love your art!',
    read: false,
    createdAt: Date.now(),
    ...overrides,
  }
}

describe('Admin', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockArtworks = []
    // Default collection needed for artworks tab to show artworks
    mockCollections = [{ _id: 'col-1', name: 'Default Collection', slug: 'default' }]
    mockMessages = []
    mockUnreadCount = 0
    mockAboutContent = ''
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

  describe('messages', () => {
    it('shows messages tab', () => {
      render(<Admin />)
      expect(screen.getByRole('button', { name: /messages/i })).toBeInTheDocument()
    })

    it('shows unread count in tab', () => {
      mockUnreadCount = 3
      render(<Admin />)
      expect(screen.getByText(/messages \(3\)/i)).toBeInTheDocument()
    })

    it('shows empty state when no messages', async () => {
      const user = userEvent.setup()
      mockMessages = []
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      expect(screen.getByText('No messages yet')).toBeInTheDocument()
    })

    it('displays message list', async () => {
      const user = userEvent.setup()
      mockMessages = [
        createMockMessage({ _id: 'msg-1', name: 'John', email: 'john@test.com', message: 'Hello' }),
        createMockMessage({ _id: 'msg-2', name: 'Jane', email: 'jane@test.com', message: 'Hi there' }),
      ]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      expect(screen.getByText('John')).toBeInTheDocument()
      expect(screen.getByText('john@test.com')).toBeInTheDocument()
      expect(screen.getByText('Jane')).toBeInTheDocument()
      expect(screen.getByText('jane@test.com')).toBeInTheDocument()
    })

    it('shows message content', async () => {
      const user = userEvent.setup()
      mockMessages = [createMockMessage({ message: 'I want to buy a painting' })]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      expect(screen.getByText('I want to buy a painting')).toBeInTheDocument()
    })

    it('highlights unread messages with blue background', async () => {
      const user = userEvent.setup()
      mockMessages = [createMockMessage({ read: false })]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      const messageContainer = screen.getByText('John Doe').closest('div[class*="border"]')
      expect(messageContainer).toHaveClass('bg-blue-50')
    })

    it('shows mark read button for unread messages', async () => {
      const user = userEvent.setup()
      mockMessages = [createMockMessage({ read: false })]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      expect(screen.getByRole('button', { name: /mark read/i })).toBeInTheDocument()
    })

    it('does not show mark read button for read messages', async () => {
      const user = userEvent.setup()
      mockMessages = [createMockMessage({ read: true })]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      expect(screen.queryByRole('button', { name: /mark read/i })).not.toBeInTheDocument()
    })

    it('shows delete button for each message', async () => {
      const user = userEvent.setup()
      mockMessages = [createMockMessage()]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      expect(screen.getByRole('button', { name: /delete/i })).toBeInTheDocument()
    })

    it('displays message timestamp', async () => {
      const user = userEvent.setup()
      const timestamp = new Date('2024-01-15T10:30:00').getTime()
      mockMessages = [createMockMessage({ createdAt: timestamp })]
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /messages/i }))

      // Should show formatted date
      expect(screen.getByText(/1\/15\/2024/)).toBeInTheDocument()
    })
  })

  describe('content', () => {
    it('shows content tab', () => {
      render(<Admin />)
      expect(screen.getByRole('button', { name: /content/i })).toBeInTheDocument()
    })

    it('shows About Page heading in content tab', async () => {
      const user = userEvent.setup()
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /content/i }))

      expect(screen.getByText('About Page')).toBeInTheDocument()
    })

    it('shows textarea for about content', async () => {
      const user = userEvent.setup()
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /content/i }))

      expect(screen.getByPlaceholderText(/enter about page content/i)).toBeInTheDocument()
    })

    it('shows existing about content in textarea', async () => {
      const user = userEvent.setup()
      mockAboutContent = 'Existing about text'
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /content/i }))

      const textarea = screen.getByPlaceholderText(/enter about page content/i)
      expect(textarea).toHaveValue('Existing about text')
    })

    it('shows save button', async () => {
      const user = userEvent.setup()
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /content/i }))

      expect(screen.getByRole('button', { name: /save/i })).toBeInTheDocument()
    })

    it('can edit about content', async () => {
      const user = userEvent.setup()
      render(<Admin />)

      await user.click(screen.getByRole('button', { name: /content/i }))

      const textarea = screen.getByPlaceholderText(/enter about page content/i)
      await user.clear(textarea)
      await user.type(textarea, 'New about content')

      expect(textarea).toHaveValue('New about content')
    })
  })

  describe('collection filter', () => {
    it('shows Cabinet of Curiosities option', () => {
      render(<Admin />)

      const select = screen.getByTestId('collection-filter')
      expect(select).toBeInTheDocument()
      expect(screen.getByText('Cabinet of Curiosities')).toBeInTheDocument()
    })

    it('defaults to Cabinet of Curiosities', () => {
      render(<Admin />)

      const select = screen.getByTestId('collection-filter') as HTMLSelectElement
      expect(select.value).toBe('cabinet')
    })

    it('shows uncategorized artworks by default', () => {
      mockArtworks = [createMockArtwork({
        _id: 'uncategorized-art',
        title: 'Uncategorized Artwork',
      })]

      render(<Admin />)

      expect(screen.getByText('Uncategorized Artwork')).toBeInTheDocument()
    })

    it('shows other collections in dropdown', () => {
      mockCollections = [
        { _id: 'col-1', name: 'Landscapes', slug: 'landscapes' },
        { _id: 'col-2', name: 'Portraits', slug: 'portraits' },
      ]

      render(<Admin />)

      expect(screen.getByText('Cabinet of Curiosities')).toBeInTheDocument()
      expect(screen.getByText('Landscapes')).toBeInTheDocument()
      expect(screen.getByText('Portraits')).toBeInTheDocument()
    })
  })
})
