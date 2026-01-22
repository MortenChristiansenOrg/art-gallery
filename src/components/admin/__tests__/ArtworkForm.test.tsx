import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ArtworkForm } from '../ArtworkForm'

// Mock convex hooks
const mockGenerateUploadUrl = vi.fn()
const mockCreateArtwork = vi.fn()
const mockUpdateArtwork = vi.fn()
const mockGenerateImageVariants = vi.fn()

let mutationCallIndex = 0

vi.mock('convex/react', () => ({
  useMutation: vi.fn(() => {
    // The component calls useMutation in this order:
    // 1. generateUploadUrl
    // 2. createArtwork
    // 3. updateArtwork
    const index = mutationCallIndex++
    if (index % 3 === 0) return mockGenerateUploadUrl
    if (index % 3 === 1) return mockCreateArtwork
    return mockUpdateArtwork
  }),
  useAction: vi.fn(() => mockGenerateImageVariants),
}))

const mockCollectionId = 'collection-123' as any

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
const mockCreateObjectURL = vi.fn(() => 'blob:mock-url')
const mockRevokeObjectURL = vi.fn()
global.URL.createObjectURL = mockCreateObjectURL
global.URL.revokeObjectURL = mockRevokeObjectURL

// Mock canvas for thumbnail generation
const mockGetContext = vi.fn(() => ({
  drawImage: vi.fn(),
}))
const mockToDataURL = vi.fn(() => 'data:image/jpeg;base64,mock')
HTMLCanvasElement.prototype.getContext = mockGetContext as unknown as typeof HTMLCanvasElement.prototype.getContext
HTMLCanvasElement.prototype.toDataURL = mockToDataURL

// Mock Image class to trigger onload immediately
class MockImage {
  width = 100
  height = 100
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  private _src = ''

  get src() { return this._src }
  set src(value: string) {
    this._src = value
    // Simulate async image loading
    setTimeout(() => {
      if (this.onload) this.onload()
    }, 0)
  }
}

global.Image = MockImage as unknown as typeof Image

function createMockFile(name: string, type = 'image/jpeg'): File {
  const file = new File(['mock-content'], name, { type })
  return file
}

describe('ArtworkForm', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    mutationCallIndex = 0
    mockGenerateUploadUrl.mockResolvedValue('https://upload.example.com')
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ storageId: 'storage-123' }),
    })
    mockCreateArtwork.mockResolvedValue('artwork-id')
    mockUpdateArtwork.mockResolvedValue(undefined)
    mockGenerateImageVariants.mockResolvedValue({ thumbnailId: 'thumb-123', viewerImageId: 'viewer-123' })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Create Mode', () => {
    it('renders create form with correct title', () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.getByText('Add Artwork')).toBeInTheDocument()
    })

    it('shows drop zone with multi-select hint', () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.getByText(/Click or drag images here/)).toBeInTheDocument()
      expect(screen.getByText(/max 50/)).toBeInTheDocument()
    })

    it('does not show collection dropdown', () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.queryByLabelText(/Collection/i)).not.toBeInTheDocument()
    })

    it('disables submit when no images selected', () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.getByTestId('submit-button')).toBeDisabled()
    })

    it('accepts file input with multiple attribute', () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')
      expect(input).toHaveAttribute('multiple')
    })

    it('displays selected images with editable titles', async () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      const file = createMockFile('test-artwork.jpg')

      // Trigger file selection
      await waitFor(() => {
        fireEvent.change(input, { target: { files: [file] } })
      })

      // Image should load asynchronously, wait for it
      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('removes image when remove button clicked', async () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      const file = createMockFile('test-artwork.jpg')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
      }, { timeout: 2000 })

      const removeButton = screen.getByTestId('remove-image-0')
      fireEvent.click(removeButton)

      await waitFor(() => {
        expect(screen.queryByTestId('image-row-0')).not.toBeInTheDocument()
      })
    })

    it('shows upload progress during bulk upload', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      // Slow down the mutation to see progress
      mockGenerateUploadUrl.mockImplementation(() => new Promise(r => setTimeout(() => r('https://upload.example.com'), 100)))

      const files = [createMockFile('art1.jpg'), createMockFile('art2.jpg')]
      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('image-row-1')).toBeInTheDocument()
      }, { timeout: 2000 })

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      // Should show progress
      await waitFor(() => {
        expect(screen.getByTestId('upload-progress')).toBeInTheDocument()
      }, { timeout: 2000 })
    })

    it('calls createArtwork for each image with collectionId', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      const files = [createMockFile('art1.jpg'), createMockFile('art2.jpg')]
      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
        expect(screen.getByTestId('image-row-1')).toBeInTheDocument()
      }, { timeout: 2000 })

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateArtwork).toHaveBeenCalledTimes(2)
        expect(mockCreateArtwork).toHaveBeenCalledWith(
          expect.objectContaining({
            collectionId: mockCollectionId,
          })
        )
      })
    })

    it('sets title from filename without extension', async () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      const file = createMockFile('my-artwork.jpg')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        const titleInput = screen.getByTestId('title-input-0')
        expect(titleInput).toHaveValue('my-artwork')
      }, { timeout: 2000 })
    })

    it('allows editing individual image titles', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      const file = createMockFile('original.jpg')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('title-input-0')).toBeInTheDocument()
      }, { timeout: 2000 })

      const titleInput = screen.getByTestId('title-input-0')
      await user.clear(titleInput)
      await user.type(titleInput, 'New Title')

      expect(titleInput).toHaveValue('New Title')
    })

    it('applies shared metadata to all images', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      const files = [createMockFile('art1.jpg'), createMockFile('art2.jpg')]
      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
      }, { timeout: 2000 })

      // Fill shared metadata
      const yearInput = screen.getByRole('spinbutton')
      await user.type(yearInput, '2024')

      const mediumInput = screen.getByPlaceholderText(/Oil on canvas/)
      await user.type(mediumInput, 'Acrylic')

      const publishedToggle = screen.getByTestId('published-toggle')
      await user.click(publishedToggle)

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockCreateArtwork).toHaveBeenCalledWith(
          expect.objectContaining({
            year: 2024,
            medium: 'Acrylic',
            published: true,
            collectionId: mockCollectionId,
          })
        )
      })
    })

    it('continues uploading after single failure', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')

      // First upload succeeds, second fails, third succeeds
      mockFetch
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ storageId: 'storage-1' }) })
        .mockResolvedValueOnce({ ok: false, statusText: 'Server Error' })
        .mockResolvedValueOnce({ ok: true, json: () => Promise.resolve({ storageId: 'storage-3' }) })

      const files = [
        createMockFile('art1.jpg'),
        createMockFile('art2.jpg'),
        createMockFile('art3.jpg'),
      ]
      fireEvent.change(input, { target: { files } })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-2')).toBeInTheDocument()
      }, { timeout: 2000 })

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        // Should have tried all 3
        expect(mockGenerateUploadUrl).toHaveBeenCalledTimes(3)
        // Should show error for the failed one
        expect(screen.getByTestId('upload-errors')).toBeInTheDocument()
      })
    })

    it('handles drag and drop', async () => {
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)
      const dropZone = screen.getByText(/Click or drag images here/).parentElement!

      const file = createMockFile('dropped.jpg')
      const dataTransfer = { files: [file] }

      fireEvent.dragOver(dropZone, { dataTransfer })
      expect(screen.getByText('Drop images here')).toBeInTheDocument()

      fireEvent.drop(dropZone, { dataTransfer })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
      }, { timeout: 2000 })
    })
  })

  describe('Edit Mode', () => {
    const mockArtwork = {
      _id: 'artwork-123' as const,
      title: 'Existing Artwork',
      description: 'A description',
      published: true,
      year: 2023,
    }

    it('renders edit form with correct title', () => {
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.getByText('Edit Artwork')).toBeInTheDocument()
    })

    it('shows title input with existing value', () => {
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)
      const titleInput = screen.getByDisplayValue('Existing Artwork')
      expect(titleInput).toBeInTheDocument()
    })

    it('does not show collection dropdown in edit mode', () => {
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.queryByLabelText(/Collection/i)).not.toBeInTheDocument()
    })

    it('does not show multiple attribute on file input', () => {
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)
      const input = screen.getByTestId('file-input')
      expect(input).not.toHaveAttribute('multiple')
    })

    it('enables submit without new image', () => {
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)
      expect(screen.getByTestId('submit-button')).not.toBeDisabled()
    })

    it('calls updateArtwork with collectionId on submit', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateArtwork).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'artwork-123',
            title: 'Existing Artwork',
            collectionId: mockCollectionId,
          })
        )
      })
    })

    it('can replace image in edit mode', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)

      const input = screen.getByTestId('file-input')
      const file = createMockFile('new-image.jpg')
      fireEvent.change(input, { target: { files: [file] } })

      await waitFor(() => {
        expect(screen.getByTestId('image-row-0')).toBeInTheDocument()
      }, { timeout: 2000 })

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockGenerateUploadUrl).toHaveBeenCalled()
        expect(mockUpdateArtwork).toHaveBeenCalledWith(
          expect.objectContaining({
            imageId: 'storage-123',
          })
        )
      })
    })

    it('can clear description field', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm artwork={mockArtwork as any} collectionId={mockCollectionId} onClose={mockOnClose} />)

      // Find and clear the description textarea
      const descriptionField = screen.getByDisplayValue('A description')
      await user.clear(descriptionField)

      const submitButton = screen.getByTestId('submit-button')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockUpdateArtwork).toHaveBeenCalledWith(
          expect.objectContaining({
            id: 'artwork-123',
            description: '',
          })
        )
      })
    })
  })

  describe('Cancel', () => {
    it('calls onClose when cancel clicked', async () => {
      const user = userEvent.setup()
      render(<ArtworkForm collectionId={mockCollectionId} onClose={mockOnClose} />)

      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)

      expect(mockOnClose).toHaveBeenCalled()
    })
  })
})
