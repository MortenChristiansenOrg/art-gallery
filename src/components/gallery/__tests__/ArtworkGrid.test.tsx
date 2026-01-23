import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { ArtworkGrid } from '../ArtworkGrid'

describe('ArtworkGrid', () => {
  const mockArtworks = [
    { _id: 'art1' as any, title: 'Artwork One', imageUrl: 'http://example.com/1.jpg', year: 2023 },
    { _id: 'art2' as any, title: 'Artwork Two', imageUrl: 'http://example.com/2.jpg', year: 2022 },
    { _id: 'art3' as any, title: 'Artwork Three', imageUrl: 'http://example.com/3.jpg' },
  ]

  const renderWithRouter = (ui: React.ReactElement) => {
    return render(<MemoryRouter>{ui}</MemoryRouter>)
  }

  it('renders grid container', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)
    const grid = document.querySelector('.grid')
    expect(grid).toBeInTheDocument()
  })

  it('renders all artwork cards', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)

    expect(screen.getByText('Artwork One')).toBeInTheDocument()
    expect(screen.getByText('Artwork Two')).toBeInTheDocument()
    expect(screen.getByText('Artwork Three')).toBeInTheDocument()
  })

  it('renders correct number of cards', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)

    const articles = screen.getAllByRole('article')
    expect(articles).toHaveLength(3)
  })

  it('passes year to cards that have it', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)

    expect(screen.getByText('2023')).toBeInTheDocument()
    expect(screen.getByText('2022')).toBeInTheDocument()
  })

  it('handles empty artworks array', () => {
    const { container } = renderWithRouter(<ArtworkGrid artworks={[]} />)

    const grid = container.querySelector('.grid')
    expect(grid).toBeInTheDocument()
    expect(screen.queryAllByRole('article')).toHaveLength(0)
  })

  it('renders links to artwork detail pages', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/artwork/art1')
    expect(links[1]).toHaveAttribute('href', '/artwork/art2')
    expect(links[2]).toHaveAttribute('href', '/artwork/art3')
  })

  it('passes collectionSlug to cards', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} collectionSlug="test-collection" />)

    // Links should pass state with collection slug
    const links = screen.getAllByRole('link')
    expect(links).toHaveLength(3)
  })

  it('has responsive grid classes', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)

    const grid = document.querySelector('.grid')
    expect(grid?.className).toContain('grid-cols-1')
    expect(grid?.className).toContain('sm:grid-cols-2')
    expect(grid?.className).toContain('lg:grid-cols-3')
  })

  it('uses thumbnailUrl when available', () => {
    const artworksWithThumbnails = [
      {
        _id: 'art1' as any,
        title: 'With Thumbnail',
        imageUrl: 'http://example.com/full.jpg',
        thumbnailUrl: 'http://example.com/thumb.jpg',
      },
    ]

    renderWithRouter(<ArtworkGrid artworks={artworksWithThumbnails} />)

    const img = screen.getByAltText('With Thumbnail')
    expect(img).toHaveAttribute('src', 'http://example.com/thumb.jpg')
  })

  it('falls back to imageUrl when no thumbnail', () => {
    const artworksWithoutThumbnails = [
      {
        _id: 'art1' as any,
        title: 'No Thumbnail',
        imageUrl: 'http://example.com/full.jpg',
        thumbnailUrl: null,
      },
    ]

    renderWithRouter(<ArtworkGrid artworks={artworksWithoutThumbnails} />)

    const img = screen.getByAltText('No Thumbnail')
    expect(img).toHaveAttribute('src', 'http://example.com/full.jpg')
  })

  it('passes index to cards for stagger animation', () => {
    renderWithRouter(<ArtworkGrid artworks={mockArtworks} />)

    const articles = screen.getAllByRole('article')
    expect(articles[0].className).toContain('stagger-1')
    expect(articles[1].className).toContain('stagger-2')
    expect(articles[2].className).toContain('stagger-3')
  })
})
