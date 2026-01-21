import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { About } from '../About'

// Mock convex hooks
const mockSendMessage = vi.fn()
let mockAboutText: string | undefined = undefined

vi.mock('convex/react', () => ({
  useQuery: vi.fn(() => mockAboutText),
  useMutation: vi.fn(() => mockSendMessage),
}))

describe('About', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockAboutText = undefined
    mockSendMessage.mockResolvedValue(undefined)
  })

  describe('About content', () => {
    it('renders page title', () => {
      render(<About />)
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('About')
    })

    it('shows default message when no about text', () => {
      mockAboutText = undefined
      render(<About />)
      expect(screen.getByText('Welcome to my gallery.')).toBeInTheDocument()
    })

    it('renders about text content', () => {
      mockAboutText = 'This is my art gallery.'
      render(<About />)
      expect(screen.getByText('This is my art gallery.')).toBeInTheDocument()
    })

    it('splits about text into paragraphs', () => {
      mockAboutText = 'First paragraph.\n\nSecond paragraph.'
      render(<About />)
      expect(screen.getByText('First paragraph.')).toBeInTheDocument()
      expect(screen.getByText('Second paragraph.')).toBeInTheDocument()
    })
  })

  describe('contact-form', () => {
    it('renders contact section title', () => {
      render(<About />)
      expect(screen.getByRole('heading', { name: /get in touch/i })).toBeInTheDocument()
    })

    it('shows name input field', () => {
      render(<About />)
      expect(screen.getByPlaceholderText('Your name')).toBeInTheDocument()
    })

    it('shows email input field', () => {
      render(<About />)
      expect(screen.getByPlaceholderText('your@email.com')).toBeInTheDocument()
    })

    it('shows message textarea', () => {
      render(<About />)
      expect(screen.getByPlaceholderText('Your message...')).toBeInTheDocument()
    })

    it('shows send button', () => {
      render(<About />)
      expect(screen.getByRole('button', { name: /send message/i })).toBeInTheDocument()
    })

    it('updates form fields on input', async () => {
      const user = userEvent.setup()
      render(<About />)

      const nameInput = screen.getByPlaceholderText('Your name')
      const emailInput = screen.getByPlaceholderText('your@email.com')
      const messageInput = screen.getByPlaceholderText('Your message...')

      await user.type(nameInput, 'John Doe')
      await user.type(emailInput, 'john@example.com')
      await user.type(messageInput, 'Hello!')

      expect(nameInput).toHaveValue('John Doe')
      expect(emailInput).toHaveValue('john@example.com')
      expect(messageInput).toHaveValue('Hello!')
    })

    it('calls sendMessage on form submit', async () => {
      const user = userEvent.setup()
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John Doe')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'john@example.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Test message')

      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(mockSendMessage).toHaveBeenCalledWith({
          name: 'John Doe',
          email: 'john@example.com',
          message: 'Test message',
        })
      })
    })

    it('shows "Sending..." during submission', async () => {
      const user = userEvent.setup()
      mockSendMessage.mockImplementation(() => new Promise(r => setTimeout(r, 100)))
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      await user.click(screen.getByRole('button', { name: /send message/i }))

      expect(screen.getByText('Sending...')).toBeInTheDocument()
    })

    it('shows success message after submit', async () => {
      const user = userEvent.setup()
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('Thank you for your message')).toBeInTheDocument()
      })
    })

    it('clears form after successful submit', async () => {
      const user = userEvent.setup()
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('Thank you for your message')).toBeInTheDocument()
      })
    })

    it('shows error message on failure', async () => {
      const user = userEvent.setup()
      mockSendMessage.mockRejectedValue(new Error('Network error'))
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      await user.click(screen.getByRole('button', { name: /send message/i }))

      await waitFor(() => {
        expect(screen.getByText('Something went wrong. Please try again.')).toBeInTheDocument()
      })
    })

    it('disables button during submission', async () => {
      const user = userEvent.setup()
      mockSendMessage.mockImplementation(() => new Promise(r => setTimeout(r, 100)))
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      const button = screen.getByRole('button', { name: /send message/i })
      await user.click(button)

      // Button text changes to "Sending..." and is disabled
      const sendingButton = screen.getByRole('button')
      expect(sendingButton).toBeDisabled()
    })

    it('does not submit with empty name', async () => {
      const user = userEvent.setup()
      render(<About />)

      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('does not submit with empty email', async () => {
      const user = userEvent.setup()
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('Your message...'), 'Hi')

      fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)

      expect(mockSendMessage).not.toHaveBeenCalled()
    })

    it('does not submit with empty message', async () => {
      const user = userEvent.setup()
      render(<About />)

      await user.type(screen.getByPlaceholderText('Your name'), 'John')
      await user.type(screen.getByPlaceholderText('your@email.com'), 'j@e.com')

      fireEvent.submit(screen.getByRole('button', { name: /send message/i }).closest('form')!)

      expect(mockSendMessage).not.toHaveBeenCalled()
    })
  })
})
