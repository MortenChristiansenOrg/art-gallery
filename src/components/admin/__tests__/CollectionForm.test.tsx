import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CollectionForm } from '../CollectionForm'

// Mock convex hooks
const mockCreateCollection = vi.fn()
const mockUpdateCollection = vi.fn()
const mockGenerateUploadUrl = vi.fn()
let mockArtworks: any[] | undefined = undefined
let mutationCallIndex = 0

vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => mockArtworks),
  useMutation: vi.fn(() => {
    // Mutations called in order: createCollection, updateCollection, generateUploadUrl
    const index = mutationCallIndex++
    if (index % 3 === 0) return mockCreateCollection
    if (index % 3 === 1) return mockUpdateCollection
    return mockGenerateUploadUrl
  }),
}))

vi.mock('../../../lib/auth', () => ({
  useAuth: vi.fn(() => ({
    token: 'mock-token',
    isAuthenticated: true,
  })),
}))

// Mock fetch
const mockFetch = vi.fn()
global.fetch = mockFetch

// Mock URL.createObjectURL and revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock-url')
global.URL.revokeObjectURL = vi.fn()

describe('CollectionForm', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mockArtworks = undefined
    mutationCallIndex = 0
    mockCreateCollection.mockResolvedValue('collection-id')
    mockUpdateCollection.mockResolvedValue(undefined)
    mockGenerateUploadUrl.mockResolvedValue('https://upload.example.com')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ storageId: 'storage-123' }),
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  // Helper to get form inputs by their label text
  const getNameInput = () => {
    const labels = screen.getAllByText(/name/i)
    const nameLabel = labels.find(l => l.textContent?.includes('*'))
    return nameLabel?.parentElement?.querySelector('input') as HTMLInputElement
  }

  const getSlugInput = () => {
    const label = screen.getByText(/slug/i)
    return label.parentElement?.querySelector('input') as HTMLInputElement
  }

  const getDescriptionTextarea = () => {
    const label = screen.getByText('Description')
    return label.parentElement?.querySelector('textarea') as HTMLTextAreaElement
  }

  describe('Create Mode', () => {
    it('renders create form with correct title', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      expect(screen.getByRole('heading')).toHaveTextContent('Add Collection')
    })

    it('shows name input field', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      expect(screen.getByText(/name.*\*/i)).toBeInTheDocument()
      expect(getNameInput()).toBeInTheDocument()
    })

    it('shows slug input field', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      expect(screen.getByText(/slug.*\*/i)).toBeInTheDocument()
      expect(getSlugInput()).toBeInTheDocument()
    })

    it('shows description textarea', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      expect(screen.getByText('Description')).toBeInTheDocument()
      expect(getDescriptionTextarea()).toBeInTheDocument()
    })

    it('auto-generates slug from name', async () => {
      const user = userEvent.setup()
      render(<CollectionForm onClose={mockOnClose} />)

      const nameInput = getNameInput()
      await user.type(nameInput, 'Test Collection Name')

      const slugInput = getSlugInput()
      expect(slugInput).toHaveValue('test-collection-name')
    })

    it('removes special characters from slug', async () => {
      const user = userEvent.setup()
      render(<CollectionForm onClose={mockOnClose} />)

      const nameInput = getNameInput()
      await user.type(nameInput, 'Test & Collection!')

      const slugInput = getSlugInput()
      expect(slugInput).toHaveValue('test--collection')
    })

    it('calls createCollection on submit', async () => {
      const user = userEvent.setup()
      render(<CollectionForm onClose={mockOnClose} />)

      await user.type(getNameInput(), 'New Collection')
      await user.type(getDescriptionTextarea(), 'A description')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockCreateCollection).toHaveBeenCalledWith(
          expect.objectContaining({
            token: 'mock-token',
            name: 'New Collection',
            slug: 'new-collection',
            description: 'A description',
          })
        )
      })
    })

    it('closes form on successful submit', async () => {
      const user = userEvent.setup()
      render(<CollectionForm onClose={mockOnClose} />)

      await user.type(getNameInput(), 'New Collection')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled()
      })
    })

    it('shows upload drop zone', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      expect(screen.getByText(/Click or drag image here/)).toBeInTheDocument()
    })
  })

  describe('Edit Mode', () => {
    const mockCollection = {
      _id: 'col-123' as const,
      name: 'Existing Collection',
      description: 'Existing description',
      slug: 'existing-collection',
      coverImageUrl: null,
    }

    it('renders edit form with correct title', () => {
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)
      expect(screen.getByRole('heading')).toHaveTextContent('Edit Collection')
    })

    it('shows existing name in input', () => {
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)
      expect(getNameInput()).toHaveValue('Existing Collection')
    })

    it('shows existing slug in input', () => {
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)
      expect(getSlugInput()).toHaveValue('existing-collection')
    })

    it('shows existing description', () => {
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)
      expect(getDescriptionTextarea()).toHaveValue('Existing description')
    })

    it('does not auto-update slug on name change', async () => {
      const user = userEvent.setup()
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)

      const nameInput = getNameInput()
      await user.clear(nameInput)
      await user.type(nameInput, 'Changed Name')

      expect(getSlugInput()).toHaveValue('existing-collection')
    })

    it('calls updateCollection on submit', async () => {
      const user = userEvent.setup()
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)

      const nameInput = getNameInput()
      await user.clear(nameInput)
      await user.type(nameInput, 'Updated Name')

      await user.click(screen.getByRole('button', { name: /save/i }))

      await waitFor(() => {
        expect(mockUpdateCollection).toHaveBeenCalledWith(
          expect.objectContaining({
            token: 'mock-token',
            id: 'col-123',
            name: 'Updated Name',
          })
        )
      })
    })

    it('shows artwork select when artworks exist', () => {
      mockArtworks = [
        { _id: 'art1', title: 'Artwork 1', thumbnailUrl: 'http://example.com/1.jpg' },
        { _id: 'art2', title: 'Artwork 2', thumbnailUrl: 'http://example.com/2.jpg' },
      ]
      render(<CollectionForm collection={mockCollection as any} onClose={mockOnClose} />)

      expect(screen.getByText('Select from collection artworks')).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Artwork 1' })).toBeInTheDocument()
      expect(screen.getByRole('option', { name: 'Artwork 2' })).toBeInTheDocument()
    })

    it('shows cover image preview when exists', () => {
      const collectionWithCover = {
        ...mockCollection,
        coverImageUrl: 'http://example.com/cover.jpg',
      }
      render(<CollectionForm collection={collectionWithCover as any} onClose={mockOnClose} />)

      const coverImg = screen.getByAltText('Cover preview')
      expect(coverImg).toHaveAttribute('src', 'http://example.com/cover.jpg')
    })
  })

  describe('Drag and Drop', () => {
    it('shows visual feedback when dragging over drop zone', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      const dropZone = screen.getByText(/Click or drag image here/)

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })

      expect(screen.getByText('Drop image here')).toBeInTheDocument()
    })

    it('hides visual feedback when drag leaves', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      const dropZone = screen.getByText(/Click or drag image here/)

      fireEvent.dragOver(dropZone, { dataTransfer: { files: [] } })
      expect(screen.getByText('Drop image here')).toBeInTheDocument()

      fireEvent.dragLeave(screen.getByText('Drop image here'), { relatedTarget: null })
      expect(screen.getByText(/Click or drag image here/)).toBeInTheDocument()
    })

    it('accepts dropped image file', async () => {
      render(<CollectionForm onClose={mockOnClose} />)
      const dropZone = screen.getByText(/Click or drag image here/)

      const file = new File(['mock-content'], 'cover.jpg', { type: 'image/jpeg' })
      const dataTransfer = { files: [file] }

      fireEvent.drop(dropZone, { dataTransfer })

      // Should show cropper (image cropper modal appears)
      await waitFor(() => {
        expect(screen.getByText('Crop Cover Image')).toBeInTheDocument()
      })
    })

    it('ignores non-image files on drop', () => {
      render(<CollectionForm onClose={mockOnClose} />)
      const dropZone = screen.getByText(/Click or drag image here/)

      const file = new File(['mock-content'], 'document.pdf', { type: 'application/pdf' })
      const dataTransfer = { files: [file] }

      fireEvent.drop(dropZone, { dataTransfer })

      // Cropper should NOT appear
      expect(screen.queryByText('Crop Cover Image')).not.toBeInTheDocument()
    })
  })

  describe('Cancel', () => {
    it('calls onClose when cancel clicked', async () => {
      const user = userEvent.setup()
      render(<CollectionForm onClose={mockOnClose} />)

      await user.click(screen.getByRole('button', { name: /cancel/i }))

      expect(mockOnClose).toHaveBeenCalled()
    })
  })

  describe('Loading state', () => {
    it('shows "Saving..." when submitting', async () => {
      const user = userEvent.setup()
      mockCreateCollection.mockImplementation(() => new Promise(r => setTimeout(r, 100)))
      render(<CollectionForm onClose={mockOnClose} />)

      await user.type(getNameInput(), 'Test')

      await user.click(screen.getByRole('button', { name: /save/i }))

      expect(screen.getByText('Saving...')).toBeInTheDocument()
    })

    it('disables submit button while saving', async () => {
      const user = userEvent.setup()
      mockCreateCollection.mockImplementation(() => new Promise(r => setTimeout(r, 100)))
      render(<CollectionForm onClose={mockOnClose} />)

      await user.type(getNameInput(), 'Test')

      const saveButton = screen.getByRole('button', { name: /save/i })
      await user.click(saveButton)

      expect(screen.getByText('Saving...')).toBeDisabled()
    })
  })
})
